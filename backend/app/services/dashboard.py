from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import cast, Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.shipment import Shipment, ShipmentOrder
from app.schemas.dashboard import (
    DashboardMetrics,
    OrderStatusCount,
    ProfitSummary,
    SalesOverTime,
    ShipmentCost,
    TopProduct,
    UnpaidOrder,
)
from app.services.currency import get_rates


async def get_metrics(db: AsyncSession) -> DashboardMetrics:
    total_products_q = select(func.count()).select_from(Product).where(Product.is_active == True)
    total_products = (await db.execute(total_products_q)).scalar() or 0

    revenue_q = select(func.coalesce(func.sum(Order.total_amount), 0)).where(
        Order.status == "completed"
    )
    total_revenue = (await db.execute(revenue_q)).scalar() or Decimal("0")

    sales_count_q = select(func.count()).select_from(Order).where(
        Order.status == "completed"
    )
    sales_count = (await db.execute(sales_count_q)).scalar() or 0

    low_stock_q = select(func.count()).select_from(Product).where(
        Product.stock_quantity <= Product.reorder_level,
        Product.is_active == True,
    )
    low_stock_count = (await db.execute(low_stock_q)).scalar() or 0

    return DashboardMetrics(
        total_products=total_products,
        total_revenue=total_revenue,
        sales_count=sales_count,
        low_stock_count=low_stock_count,
    )


async def get_sales_over_time(
    db: AsyncSession,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[SalesOverTime]:
    date_col = cast(Order.order_date, Date)

    # Step 1: per-order total = sum(selling_price × qty) + service_fee, grouped per order
    per_order = (
        select(
            Order.order_id,
            date_col.label("date"),
            (
                func.coalesce(func.sum(OrderItem.selling_price * OrderItem.quantity), 0) + Order.service_fee
            ).label("order_total"),
        )
        .select_from(Order)
        .join(OrderItem, OrderItem.order_id == Order.order_id)
        .where(Order.status == "completed")
        .group_by(Order.order_id, date_col, Order.service_fee)
    )
    if date_from:
        per_order = per_order.where(Order.order_date >= date_from)
    if date_to:
        per_order = per_order.where(Order.order_date <= date_to)

    sub = per_order.subquery()

    # Step 2: aggregate per-order totals by date
    query = (
        select(
            sub.c.date,
            func.sum(sub.c.order_total).label("total_sales"),
            func.count(sub.c.order_id).label("count"),
        )
        .group_by(sub.c.date)
        .order_by(sub.c.date)
    )

    result = await db.execute(query)
    return [SalesOverTime(date=row.date, total_sales=row.total_sales, count=row.count) for row in result.all()]


async def get_top_products(db: AsyncSession, limit: int = 10) -> list[TopProduct]:
    query = (
        select(
            OrderItem.product_id,
            Product.product_name,
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.coalesce(func.sum(OrderItem.selling_price * OrderItem.quantity), 0).label("total_revenue"),
        )
        .join(Product, OrderItem.product_id == Product.product_id)
        .join(Order, OrderItem.order_id == Order.order_id)
        .where(Order.status == "completed")
        .group_by(OrderItem.product_id, Product.product_name)
        .order_by(func.sum(OrderItem.selling_price * OrderItem.quantity).desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return [
        TopProduct(
            product_id=row.product_id,
            product_name=row.product_name,
            total_quantity=row.total_quantity,
            total_revenue=row.total_revenue,
        )
        for row in result.all()
    ]


async def _get_usd_to_uzs() -> Decimal:
    try:
        r = await get_rates()
        return Decimal(str(r["usd_to_uzs"]))
    except Exception:
        return Decimal(0)


async def get_unpaid_orders(db: AsyncSession) -> list[UnpaidOrder]:
    """Return all orders that still have an outstanding balance (unpaid > 0)."""
    query = (
        select(Order)
        .where(Order.payment_status.not_in(["paid_card", "paid_cash"]))
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer),
        )
        .order_by(Order.order_date.desc())
    )
    result = await db.execute(query)
    orders = list(result.scalars().all())

    usd_to_uzs = await _get_usd_to_uzs()

    unpaid_list: list[UnpaidOrder] = []
    for order in orders:
        selling_usd = Decimal(0)
        total_weight_grams = 0
        for item in order.items:
            if item.selling_price:
                selling_usd += item.selling_price * item.quantity
            if item.product and item.product.packaged_weight_grams:
                total_weight_grams += item.product.packaged_weight_grams * item.quantity

        service_fee = order.service_fee if order.service_fee is not None else Decimal("3.00")
        total_weight_kg = Decimal(total_weight_grams) / Decimal(1000)
        customer_cargo_usd = total_weight_kg * Decimal(13)

        # Use the locked final amount if available, otherwise compute live
        if order.final_amount_uzs is not None:
            total_price_uzs = order.final_amount_uzs
        elif selling_usd and customer_cargo_usd and usd_to_uzs:
            total_price_usd = selling_usd + service_fee + customer_cargo_usd
            total_price_uzs = (total_price_usd * usd_to_uzs).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            total_price_uzs = None

        paid_card = order.paid_card or Decimal(0)
        paid_cash = order.paid_cash or Decimal(0)
        unpaid_uzs = max(Decimal(0), (total_price_uzs or Decimal(0)) - paid_card - paid_cash).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if unpaid_uzs > 0:
            unpaid_list.append(UnpaidOrder(
                order_id=order.order_id,
                order_number=order.order_number,
                customer_name=order.customer.customer_name if order.customer else None,
                total_price_uzs=total_price_uzs,
                paid_card=paid_card,
                paid_cash=paid_cash,
                unpaid_uzs=unpaid_uzs,
                payment_status=order.payment_status or "unpaid",
                order_date=order.order_date,
            ))

    unpaid_list.sort(key=lambda o: o.unpaid_uzs, reverse=True)
    return unpaid_list


async def get_shipment_costs(db: AsyncSession) -> list[ShipmentCost]:
    """Return per-shipment breakdown: product cost in KRW and cargo cost in USD."""
    query = (
        select(Shipment)
        .options(
            selectinload(Shipment.shipment_orders)
            .selectinload(ShipmentOrder.order)
            .selectinload(Order.items)
            .selectinload(OrderItem.product),
        )
        .order_by(Shipment.created_at.asc())
    )
    result = await db.execute(query)
    shipments = list(result.scalars().all())

    costs: list[ShipmentCost] = []
    for shipment in shipments:
        product_cost_krw = Decimal(0)
        total_weight_grams = 0
        order_ids: set[int] = set()

        for so in shipment.shipment_orders:
            order = so.order
            order_ids.add(order.order_id)
            for item in order.items:
                if item.cost_price:
                    product_cost_krw += item.cost_price * item.quantity
                if item.product and item.product.packaged_weight_grams:
                    total_weight_grams += item.product.packaged_weight_grams * item.quantity

        total_weight_kg = (Decimal(total_weight_grams) / Decimal(1000)).quantize(
            Decimal("0.001"), rounding=ROUND_HALF_UP
        )
        cargo_cost_usd = (total_weight_kg * Decimal(12)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        costs.append(ShipmentCost(
            shipment_id=shipment.shipment_id,
            shipment_number=shipment.shipment_number,
            status=shipment.status,
            product_cost_krw=product_cost_krw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            cargo_cost_usd=cargo_cost_usd,
            total_weight_kg=total_weight_kg,
            order_count=len(order_ids),
        ))

    return costs


async def get_order_status_summary(db: AsyncSession) -> list[OrderStatusCount]:
    """Return order counts grouped by status."""
    query = (
        select(Order.status, func.count().label("count"))
        .group_by(Order.status)
        .order_by(func.count().desc())
    )
    result = await db.execute(query)
    return [OrderStatusCount(status=row.status, count=row.count) for row in result.all()]


async def get_profit_summary(db: AsyncSession) -> ProfitSummary:
    """Return overall revenue, cost, and gross profit figures."""
    # Total selling revenue from order items (all orders)
    selling_q = select(func.coalesce(func.sum(OrderItem.selling_price * OrderItem.quantity), 0))
    total_selling_usd = (await db.execute(selling_q)).scalar() or Decimal("0")

    # Total service fees from all orders
    service_fee_q = select(func.coalesce(func.sum(Order.service_fee), 0))
    total_service_fee = (await db.execute(service_fee_q)).scalar() or Decimal("0")

    # Total product cost in KRW from all order items
    cost_q = select(func.coalesce(func.sum(OrderItem.cost_price * OrderItem.quantity), 0))
    total_product_cost_krw = (await db.execute(cost_q)).scalar() or Decimal("0")

    # Total packaged weight across all order items (grams)
    weight_q = (
        select(func.coalesce(func.sum(Product.packaged_weight_grams * OrderItem.quantity), 0))
        .select_from(OrderItem)
        .join(Product, OrderItem.product_id == Product.product_id)
    )
    total_weight_grams = (await db.execute(weight_q)).scalar() or Decimal("0")
    total_weight_kg = Decimal(str(total_weight_grams)) / Decimal(1000)

    # Total orders count
    orders_count_q = select(func.count()).select_from(Order)
    total_orders = (await db.execute(orders_count_q)).scalar() or 0

    # Live currency rates
    krw_to_usd = Decimal(0)
    usd_to_uzs = Decimal(0)
    try:
        rates = await get_rates()
        krw_to_usd = Decimal(str(rates["krw_to_usd"]))
        usd_to_uzs = Decimal(str(rates["usd_to_uzs"]))
    except Exception:
        pass

    total_customer_cargo_usd = (total_weight_kg * Decimal(13)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total_business_cargo_usd = (total_weight_kg * Decimal(12)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total_revenue_usd = (
        Decimal(str(total_selling_usd)) + Decimal(str(total_service_fee)) + total_customer_cargo_usd
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if krw_to_usd:
        total_cost_usd = (Decimal(str(total_product_cost_krw)) * krw_to_usd).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        gross_profit_usd = (total_revenue_usd - total_cost_usd - total_business_cargo_usd).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:
        gross_profit_usd = Decimal("0")

    # Sum unpaid amounts across all orders with outstanding balance
    unpaid_orders = await get_unpaid_orders(db)
    total_unpaid_uzs = sum(o.unpaid_uzs for o in unpaid_orders)

    return ProfitSummary(
        total_selling_usd=Decimal(str(total_selling_usd)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        total_service_fee_usd=Decimal(str(total_service_fee)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        total_customer_cargo_usd=total_customer_cargo_usd,
        total_revenue_usd=total_revenue_usd,
        total_product_cost_krw=Decimal(str(total_product_cost_krw)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        total_business_cargo_usd=total_business_cargo_usd,
        gross_profit_usd=gross_profit_usd,
        krw_to_usd=krw_to_usd,
        usd_to_uzs=usd_to_uzs,
        total_unpaid_uzs=Decimal(str(total_unpaid_uzs)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        total_orders=total_orders,
    )
