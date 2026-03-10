from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.activity_log import ActivityLog
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate, ShoppingOverride
from app.schemas.pagination import PaginatedResponse
from app.services import order as order_service
from app.services.currency import get_rates

router = APIRouter(prefix="/orders", tags=["Orders"])


def _format_item_attributes(item) -> str | None:
    if not item.attribute_values:
        return None
    parts = [
        f"{av.attribute.attribute_name}: {av.value}"
        for av in item.attribute_values
        if av.attribute
    ]
    return ", ".join(parts) if parts else None


def _order_to_response(order, usd_to_uzs: Decimal = Decimal(0)) -> dict:
    items = [
        {
            "item_id": item.item_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "selling_price": item.selling_price,
            "selling_price_uzs": item.selling_price_uzs,
            "cost_price": item.cost_price,
            "product_name": item.product.product_name if item.product else None,
            "product_attributes": _format_item_attributes(item),
            "attribute_values": [
                {"attribute_id": av.attribute_id, "attribute_name": av.attribute.attribute_name if av.attribute else None, "value": av.value}
                for av in item.attribute_values
            ],
            "packaged_weight_grams": item.product.packaged_weight_grams if item.product else None,
            "brand": item.product.brand if item.product else None,
            "category_name": item.product.category.category_name if item.product and item.product.category else None,
            "stock_status": item.product.stock_status if item.product else None,
            "from_stock": item.from_stock,
        }
        for item in order.items
    ]
    is_archived = order.is_archived
    total_cost = sum(
        (it["cost_price"] or 0) * it["quantity"]
        for it in items
    ) or None
    total_amount_uzs = sum(
        (it["selling_price_uzs"] or 0) * it["quantity"]
        for it in items
    ) or None
    service_fee = order.service_fee if order.service_fee is not None else Decimal("3.00")

    selling_sum = sum(
        (it["selling_price"] or 0) * it["quantity"]
        for it in items
    )
    selling_usd = Decimal(str(selling_sum)) if selling_sum else Decimal(0)
    total_selling_usd = (selling_usd + service_fee).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if selling_usd else None

    total_weight_grams = sum(
        (it["packaged_weight_grams"] or 0) * it["quantity"]
        for it in items
    )
    total_weight_kg = (Decimal(total_weight_grams) / Decimal(1000)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_weight_grams else None
    shipping_fee_usd = (total_weight_kg * Decimal(12)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_weight_kg else None
    customer_cargo_usd = (total_weight_kg * Decimal(13)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_weight_kg else None
    shipping_fee_uzs = (shipping_fee_usd * usd_to_uzs).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if shipping_fee_usd and usd_to_uzs else None

    # Compute total in one step to match shipment calculation exactly
    total_price_usd = None
    total_price_uzs = None
    if selling_usd and customer_cargo_usd:
        total_price_usd = (selling_usd + service_fee + customer_cargo_usd).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        if usd_to_uzs:
            total_price_uzs = (total_price_usd * usd_to_uzs).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

    # Use the locked final amount if available (set when order is completed + paid)
    if order.final_amount_uzs is not None:
        total_price_uzs = order.final_amount_uzs

    paid_card = order.paid_card or Decimal(0)
    paid_cash = order.paid_cash or Decimal(0)
    budget_applied = order.budget_applied_uzs or Decimal(0)
    total_paid = paid_card + paid_cash + budget_applied
    unpaid = max(Decimal(0), total_price_uzs - total_paid).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_price_uzs else None

    return {
        "order_id": order.order_id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "order_date": order.order_date,
        "total_amount": order.total_amount,
        "total_cost": total_cost,
        "total_selling_usd": total_selling_usd,
        "total_amount_uzs": total_amount_uzs,
        "total_weight_kg": total_weight_kg,
        "shipping_fee_usd": shipping_fee_usd,
        "customer_cargo_usd": customer_cargo_usd,
        "shipping_fee_uzs": shipping_fee_uzs,
        "grand_total_uzs": (total_amount_uzs or 0) + (shipping_fee_uzs or 0) or None,
        "total_price_usd": total_price_usd,
        "total_price_uzs": total_price_uzs,
        "status": order.status,
        "notes": order.notes,
        "service_fee": service_fee,
        "shipping_number": order.shipping_number,
        "payment_status": order.payment_status or "unpaid",
        "paid_card": paid_card,
        "paid_cash": paid_cash,
        "budget_applied_uzs": budget_applied,
        "unpaid": unpaid,
        "final_amount_uzs": order.final_amount_uzs,
        "customer_name": order.customer.customer_name if order.customer else None,
        "customer_phone": order.customer.contact_phone if order.customer else None,
        "customer_city": order.customer.city if order.customer else None,
        "is_archived": is_archived,
        "items": items,
    }


async def _write_order_logs(
    db: AsyncSession,
    user: User,
    order: Order,
    old_status: str,
    old_payment_status: str,
    old_paid_card: Decimal,
    old_paid_cash: Decimal,
) -> None:
    logs = []

    def _log(action: str, field: str, old_val: str, new_val: str):
        logs.append(ActivityLog(
            user_id=user.user_id,
            user_name=user.name,
            user_role=user.role,
            order_id=order.order_id,
            order_number=order.order_number,
            action=action,
            field=field,
            old_value=old_val,
            new_value=new_val,
        ))

    if order.status != old_status:
        _log("status_changed", "status", old_status, order.status)

    if order.payment_status != old_payment_status:
        _log("payment_status_changed", "payment_status", old_payment_status, order.payment_status)

    new_paid_card = order.paid_card or Decimal(0)
    new_paid_cash = order.paid_cash or Decimal(0)
    norm_old_card = old_paid_card or Decimal(0)
    norm_old_cash = old_paid_cash or Decimal(0)

    if new_paid_card != norm_old_card:
        _log("payment_amount_changed", "paid_card", str(norm_old_card), str(new_paid_card))

    if new_paid_cash != norm_old_cash:
        _log("payment_amount_changed", "paid_cash", str(norm_old_cash), str(new_paid_cash))

    if logs:
        db.add_all(logs)
        await db.commit()


async def _usd_to_uzs_rate() -> Decimal:
    try:
        r = await get_rates()
        return Decimal(str(r["usd_to_uzs"]))
    except Exception:
        return Decimal(0)


@router.get("", response_model=PaginatedResponse[OrderResponse])
async def list_orders(
    status: str | None = None,
    payment_status: str | None = None,
    customer_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str | None = None,
    sort_dir: str = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_archived: bool = False,
    db: AsyncSession = Depends(get_db),
):
    orders, total = await order_service.get_orders(
        db,
        status=status,
        payment_status=payment_status,
        customer_id=customer_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
        is_archived=is_archived,
    )
    rate = await _usd_to_uzs_rate()
    return PaginatedResponse(
        data=[_order_to_response(o, rate) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/shopping-list")
async def get_shopping_list(db: AsyncSession = Depends(get_db)):
    return await order_service.get_shopping_list(db)


@router.delete("/shopping-list/overrides", status_code=204)
async def reset_shopping_overrides(db: AsyncSession = Depends(get_db)):
    await order_service.reset_shopping_overrides(db)


@router.patch("/shopping-list/override")
async def save_shopping_override(data: ShoppingOverride, db: AsyncSession = Depends(get_db)):
    await order_service.upsert_shopping_override(db, data.item_id, data.quantity_override, data.is_removed)
    return {"ok": True}


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await order_service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    rate = await _usd_to_uzs_rate()
    return _order_to_response(order, rate)


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    order = await order_service.create_order(db, data)
    rate = await _usd_to_uzs_rate()
    return _order_to_response(order, rate)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    data: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(Order, order_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")

    if data.is_archived is True:
        if existing.status != "completed" or existing.payment_status not in ("paid_card", "paid_cash"):
            raise HTTPException(status_code=400, detail="Only completed and fully paid orders can be archived")

    old_status = existing.status
    old_payment_status = existing.payment_status
    old_paid_card = existing.paid_card or Decimal(0)
    old_paid_cash = existing.paid_cash or Decimal(0)

    order = await order_service.update_order(db, order_id, data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await _write_order_logs(db, current_user, order, old_status, old_payment_status, old_paid_card, old_paid_cash)

    rate = await _usd_to_uzs_rate()
    return _order_to_response(order, rate)


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await order_service.delete_order(db, order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
