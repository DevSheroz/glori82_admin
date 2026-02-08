from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.shipment import Shipment, ShipmentOrder
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate
from app.services.currency import get_rates


def _compute_order_weight(order: Order) -> Decimal:
    total_grams = 0
    for item in order.items:
        if item.product and item.product.packaged_weight_grams:
            total_grams += item.product.packaged_weight_grams * item.quantity
    return Decimal(total_grams) / Decimal(1000)


def _items_summary(order: Order) -> str | None:
    if not order.items:
        return None
    names = [item.product.product_name for item in order.items if item.product]
    if len(names) <= 2:
        return ", ".join(names)
    return f"{names[0]} +{len(names) - 1} more"


def _compute_order_total_uzs(order: Order) -> Decimal:
    total = Decimal(0)
    for item in order.items:
        if item.selling_price_uzs:
            total += item.selling_price_uzs * item.quantity
    return total


def _build_response(shipment: Shipment, usd_to_uzs: Decimal = Decimal(0)) -> dict:
    orders_data = []
    total_weight = Decimal(0)
    total_orders_uzs = Decimal(0)
    customer_ids = set()

    for so in shipment.shipment_orders:
        order = so.order
        weight = _compute_order_weight(order)
        total_weight += weight
        order_uzs = _compute_order_total_uzs(order)
        total_orders_uzs += order_uzs
        if order.customer_id:
            customer_ids.add(order.customer_id)

        order_shipping_fee_usd = weight * Decimal(12)
        order_shipping_fee_uzs = (order_shipping_fee_usd * usd_to_uzs).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        ) if usd_to_uzs else Decimal(0)

        orders_data.append({
            "order_id": order.order_id,
            "order_number": order.order_number,
            "customer_name": order.customer.customer_name if order.customer else None,
            "total_amount": order.total_amount,
            "total_amount_uzs": order_uzs,
            "weight_kg": weight,
            "shipping_fee_uzs": order_shipping_fee_uzs,
            "order_total_uzs": order_uzs + order_shipping_fee_uzs,
            "status": order.status,
            "items_summary": _items_summary(order),
        })

    shipment_fee = total_weight * Decimal(12)
    shipment_fee_uzs = (shipment_fee * usd_to_uzs).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if usd_to_uzs else Decimal(0)
    grand_total_uzs = total_orders_uzs + shipment_fee_uzs

    return {
        "shipment_id": shipment.shipment_id,
        "shipment_number": shipment.shipment_number,
        "status": shipment.status,
        "notes": shipment.notes,
        "created_at": shipment.created_at,
        "order_count": len(orders_data),
        "customer_count": len(customer_ids),
        "total_weight_kg": total_weight,
        "shipment_fee": shipment_fee,
        "shipment_fee_uzs": shipment_fee_uzs,
        "total_orders_uzs": total_orders_uzs,
        "grand_total_uzs": grand_total_uzs,
        "orders": orders_data,
    }


_shipment_load_options = [
    selectinload(Shipment.shipment_orders)
    .selectinload(ShipmentOrder.order)
    .selectinload(Order.items)
    .selectinload(OrderItem.product),
    selectinload(Shipment.shipment_orders)
    .selectinload(ShipmentOrder.order)
    .selectinload(Order.customer),
]


async def _usd_to_uzs_rate() -> Decimal:
    try:
        r = await get_rates()
        return Decimal(str(r["usd_to_uzs"]))
    except Exception:
        return Decimal(0)


async def get_shipments(
    db: AsyncSession,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    base = select(Shipment)
    if status is not None:
        base = base.where(Shipment.status == status)

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    offset = (page - 1) * page_size
    query = (
        base.options(*_shipment_load_options)
        .order_by(Shipment.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    shipments = list(result.scalars().all())
    rate = await _usd_to_uzs_rate()
    return [_build_response(s, rate) for s in shipments], total


async def get_shipment(db: AsyncSession, shipment_id: int) -> dict | None:
    query = (
        select(Shipment)
        .options(*_shipment_load_options)
        .where(Shipment.shipment_id == shipment_id)
    )
    result = await db.execute(query)
    shipment = result.scalar_one_or_none()
    if not shipment:
        return None
    rate = await _usd_to_uzs_rate()
    return _build_response(shipment, rate)


async def _next_shipment_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Shipment))
    count = (result.scalar() or 0) + 1
    return f"SH-{count:04d}"


async def create_shipment(db: AsyncSession, data: ShipmentCreate) -> dict:
    shipment = Shipment(
        shipment_number=await _next_shipment_number(db),
        notes=data.notes,
    )
    for order_id in data.order_ids:
        shipment.shipment_orders.append(ShipmentOrder(order_id=order_id))
    db.add(shipment)
    await db.flush()

    # Stamp shipping_number on all orders in this shipment
    if data.order_ids:
        orders_result = await db.execute(
            select(Order).where(Order.order_id.in_(data.order_ids))
        )
        for order in orders_result.scalars().all():
            order.shipping_number = shipment.shipment_number

    await db.commit()
    return await get_shipment(db, shipment.shipment_id)


async def update_shipment(
    db: AsyncSession, shipment_id: int, data: ShipmentUpdate
) -> dict | None:
    query = (
        select(Shipment)
        .options(selectinload(Shipment.shipment_orders))
        .where(Shipment.shipment_id == shipment_id)
    )
    result = await db.execute(query)
    shipment = result.scalar_one_or_none()
    if not shipment:
        return None

    fields = data.model_dump(exclude_unset=True, exclude={"order_ids"})
    for key, value in fields.items():
        setattr(shipment, key, value)

    # Cascade status to all orders in this shipment
    if "status" in fields:
        order_ids = [so.order_id for so in shipment.shipment_orders]
        if order_ids:
            orders_result = await db.execute(
                select(Order).where(Order.order_id.in_(order_ids))
            )
            for order in orders_result.scalars().all():
                order.status = fields["status"]

    if data.order_ids is not None:
        # Clear shipping_number from removed orders
        old_order_ids = {so.order_id for so in shipment.shipment_orders}
        new_order_ids = set(data.order_ids)
        removed_ids = old_order_ids - new_order_ids
        if removed_ids:
            removed_result = await db.execute(
                select(Order).where(Order.order_id.in_(removed_ids))
            )
            for order in removed_result.scalars().all():
                order.shipping_number = None

        shipment.shipment_orders.clear()
        for order_id in data.order_ids:
            shipment.shipment_orders.append(ShipmentOrder(order_id=order_id))

        # Stamp shipping_number on new set of orders
        if new_order_ids:
            added_result = await db.execute(
                select(Order).where(Order.order_id.in_(new_order_ids))
            )
            for order in added_result.scalars().all():
                order.shipping_number = shipment.shipment_number

    await db.commit()
    return await get_shipment(db, shipment_id)


async def delete_shipment(db: AsyncSession, shipment_id: int) -> bool:
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        return False
    await db.delete(shipment)
    await db.commit()
    return True
