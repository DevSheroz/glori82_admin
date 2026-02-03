from datetime import datetime
from decimal import Decimal

from sqlalchemy import cast, Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.dashboard import DashboardMetrics, SalesOverTime, TopProduct


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
    query = (
        select(
            date_col.label("date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_sales"),
            func.count().label("count"),
        )
        .where(Order.status == "completed")
        .group_by(date_col)
        .order_by(date_col)
    )
    if date_from:
        query = query.where(Order.order_date >= date_from)
    if date_to:
        query = query.where(Order.order_date <= date_to)

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
