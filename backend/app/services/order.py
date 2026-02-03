from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_attribute_value import ProductAttributeValue
from app.schemas.order import OrderCreate, OrderUpdate


async def get_orders(
    db: AsyncSession,
    status: str | None = None,
    customer_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Order], int]:
    base = select(Order)
    if status is not None:
        base = base.where(Order.status == status)
    if customer_id is not None:
        base = base.where(Order.customer_id == customer_id)
    if date_from is not None:
        base = base.where(Order.order_date >= date_from)
    if date_to is not None:
        base = base.where(Order.order_date <= date_to)

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    offset = (page - 1) * page_size
    query = (
        base.options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute),
            selectinload(Order.customer),
        )
        .order_by(Order.order_date.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_order(db: AsyncSession, order_id: int) -> Order | None:
    query = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute), selectinload(Order.customer))
        .where(Order.order_id == order_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def _next_order_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Order))
    count = (result.scalar() or 0) + 1
    return f"ORD-{count:04d}"


async def create_order(db: AsyncSession, data: OrderCreate) -> Order:
    items_data = data.items
    order_dict = data.model_dump(exclude={"items"}, exclude_none=True)
    if not order_dict.get("order_number"):
        order_dict["order_number"] = await _next_order_number(db)
    order = Order(**order_dict)
    for item_data in items_data:
        item_fields = item_data.model_dump()
        if item_fields.get("product_id"):
            product = await db.get(Product, item_fields["product_id"])
            if product:
                if item_fields.get("cost_price") is None:
                    item_fields["cost_price"] = product.cost_price
                if item_fields.get("selling_price") is None:
                    item_fields["selling_price"] = product.selling_price
                if item_fields.get("selling_price_uzs") is None:
                    item_fields["selling_price_uzs"] = product.selling_price_uzs
        order.items.append(OrderItem(**item_fields))
    db.add(order)
    await db.commit()
    return await get_order(db, order.order_id)


async def update_order(db: AsyncSession, order_id: int, data: OrderUpdate) -> Order | None:
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_id == order_id)
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        return None

    fields = data.model_dump(exclude_unset=True, exclude={"items"})
    for key, value in fields.items():
        setattr(order, key, value)

    if data.items is not None:
        order.items.clear()
        for item_data in data.items:
            item_fields = item_data.model_dump()
            if item_fields.get("product_id"):
                product = await db.get(Product, item_fields["product_id"])
                if product:
                    if item_fields.get("cost_price") is None:
                        item_fields["cost_price"] = product.cost_price
                    if item_fields.get("selling_price") is None:
                        item_fields["selling_price"] = product.selling_price
                    if item_fields.get("selling_price_uzs") is None:
                        item_fields["selling_price_uzs"] = product.selling_price_uzs
            order.items.append(OrderItem(**item_fields))

    await db.commit()
    return await get_order(db, order_id)


async def delete_order(db: AsyncSession, order_id: int) -> bool:
    order = await db.get(Order, order_id)
    if not order:
        return False
    await db.delete(order)
    await db.commit()
    return True
