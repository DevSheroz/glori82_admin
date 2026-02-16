from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_attribute_value import ProductAttributeValue
from app.models.product_category import ProductCategory
from app.schemas.order import OrderCreate, OrderUpdate
from app.services.currency import calculate_prices


SORTABLE_COLUMNS = {
    "customer_name": Customer.customer_name,
    "status": Order.status,
    "shipping_number": Order.shipping_number,
    "order_date": Order.order_date,
    "category_name": ProductCategory.category_name,
    "brand": Product.brand,
}

SORT_JOINS = {
    "customer_name": lambda q: q.outerjoin(Customer, Order.customer_id == Customer.customer_id),
    "category_name": lambda q: q.outerjoin(OrderItem, Order.order_id == OrderItem.order_id)
        .outerjoin(Product, OrderItem.product_id == Product.product_id)
        .outerjoin(ProductCategory, Product.category_id == ProductCategory.category_id),
    "brand": lambda q: q.outerjoin(OrderItem, Order.order_id == OrderItem.order_id)
        .outerjoin(Product, OrderItem.product_id == Product.product_id),
}


async def get_orders(
    db: AsyncSession,
    status: str | None = None,
    payment_status: str | None = None,
    customer_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str | None = None,
    sort_dir: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Order], int]:
    base = select(Order)
    if status is not None:
        base = base.where(Order.status == status)
    if payment_status is not None:
        base = base.where(Order.payment_status == payment_status)
    if customer_id is not None:
        base = base.where(Order.customer_id == customer_id)
    if date_from is not None:
        base = base.where(Order.order_date >= date_from)
    if date_to is not None:
        base = base.where(Order.order_date <= date_to)

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Apply joins needed for sorting
    if sort_by in SORT_JOINS:
        base = SORT_JOINS[sort_by](base).group_by(Order.order_id)

    col = SORTABLE_COLUMNS.get(sort_by, Order.order_date)
    sort_expr = func.min(col) if sort_by in ("category_name", "brand") else col
    order = sort_expr.desc() if sort_dir == "desc" else sort_expr.asc()

    offset = (page - 1) * page_size
    query = (
        base.options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute),
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category),
            selectinload(Order.customer),
        )
        .order_by(order)
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    return list(result.scalars().unique().all()), total


async def get_order(db: AsyncSession, order_id: int) -> Order | None:
    query = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute),
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category),
            selectinload(Order.customer),
        )
        .where(Order.order_id == order_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def _next_order_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.max(Order.order_id)))
    max_id = result.scalar() or 0
    return f"ORD-{max_id + 1:04d}"


async def _resolve_customer(db: AsyncSession, data) -> int | None:
    """If customer_id is set, return it. Otherwise create a new customer from the inline fields."""
    if data.customer_id:
        return data.customer_id
    if not data.customer_name:
        return None
    customer = Customer(
        customer_name=data.customer_name,
        city=data.customer_city,
        address=data.customer_address,
        contact_phone=data.customer_phone,
    )
    db.add(customer)
    await db.flush()
    return customer.customer_id


ITEM_EXTRA_FIELDS = {"product_name", "brand", "category_id", "category_name", "packaged_weight_grams", "attribute_values"}


async def _resolve_product(db: AsyncSession, item_fields: dict) -> int | None:
    """Return an existing product_id or create a new product from inline fields."""
    if item_fields.get("product_id"):
        return item_fields["product_id"]
    if not item_fields.get("product_name"):
        return None

    category_id = item_fields.get("category_id")
    if not category_id and item_fields.get("category_name"):
        cat = ProductCategory(category_name=item_fields["category_name"])
        db.add(cat)
        await db.flush()
        category_id = cat.category_id

    cost_price = item_fields.get("cost_price") or 0
    selling_price = item_fields.get("selling_price")
    selling_price_uzs = item_fields.get("selling_price_uzs")

    if cost_price and (selling_price is None or selling_price_uzs is None):
        try:
            prices = await calculate_prices(cost_price)
            if selling_price is None:
                selling_price = prices["selling_price"]
            if selling_price_uzs is None:
                selling_price_uzs = prices["selling_price_uzs"]
        except Exception:
            pass

    product = Product(
        product_name=item_fields["product_name"],
        brand=item_fields.get("brand") or None,
        category_id=category_id,
        cost_price=cost_price,
        selling_price=selling_price,
        selling_price_uzs=selling_price_uzs,
        packaged_weight_grams=item_fields.get("packaged_weight_grams"),
        stock_status="pre_order",
    )
    db.add(product)
    await db.flush()

    attr_values = item_fields.get("attribute_values")
    if attr_values:
        for av in attr_values:
            av_data = av if isinstance(av, dict) else av.model_dump()
            if av_data.get("attribute_id") and av_data.get("value"):
                db.add(ProductAttributeValue(
                    product_id=product.product_id,
                    attribute_id=av_data["attribute_id"],
                    value=av_data["value"],
                ))
        await db.flush()

    return product.product_id


async def _build_order_items(db: AsyncSession, items_data) -> list[OrderItem]:
    result = []
    for item_data in items_data:
        item_fields = item_data.model_dump()
        product_id = await _resolve_product(db, item_fields)
        if not product_id:
            continue
        item_fields["product_id"] = product_id

        product = await db.get(Product, product_id, options=[selectinload(Product.attribute_values)])
        if product:
            if item_fields.get("cost_price") is None:
                item_fields["cost_price"] = product.cost_price
            if item_fields.get("selling_price") is None:
                item_fields["selling_price"] = product.selling_price
            if item_fields.get("selling_price_uzs") is None:
                item_fields["selling_price_uzs"] = product.selling_price_uzs
            if item_fields.get("packaged_weight_grams") is not None:
                product.packaged_weight_grams = item_fields["packaged_weight_grams"]

            # Sync attribute values for existing products
            attr_values = item_fields.get("attribute_values")
            if attr_values is not None:
                # Build a map of incoming attribute values
                incoming = {}
                for av in attr_values:
                    av_data = av if isinstance(av, dict) else av.model_dump()
                    if av_data.get("attribute_id") and av_data.get("value"):
                        incoming[av_data["attribute_id"]] = av_data["value"]

                # Update existing, remove missing, add new
                existing_map = {pav.attribute_id: pav for pav in product.attribute_values}
                for attr_id, value in incoming.items():
                    if attr_id in existing_map:
                        existing_map[attr_id].value = value
                    else:
                        db.add(ProductAttributeValue(
                            product_id=product.product_id,
                            attribute_id=attr_id,
                            value=value,
                        ))
                for attr_id, pav in existing_map.items():
                    if attr_id not in incoming:
                        await db.delete(pav)

        for key in ITEM_EXTRA_FIELDS:
            item_fields.pop(key, None)
        result.append(OrderItem(**item_fields))
    return result


async def create_order(db: AsyncSession, data: OrderCreate) -> Order:
    customer_id = await _resolve_customer(db, data)

    order_dict = data.model_dump(
        exclude={"items", "customer_name", "customer_city", "customer_address", "customer_phone"},
        exclude_none=True,
    )
    order_dict["customer_id"] = customer_id
    if not order_dict.get("order_number"):
        order_dict["order_number"] = await _next_order_number(db)
    order = Order(**order_dict)
    order.items.extend(await _build_order_items(db, data.items))
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

    customer_id = await _resolve_customer(db, data)
    if customer_id is not None:
        order.customer_id = customer_id

    fields = data.model_dump(
        exclude_unset=True,
        exclude={"items", "customer_id", "customer_name", "customer_city", "customer_address", "customer_phone"},
    )
    for key, value in fields.items():
        setattr(order, key, value)

    if data.items is not None:
        new_items = await _build_order_items(db, data.items)
        if new_items or not order.items:
            order.items.clear()
            order.items.extend(new_items)

    await db.commit()
    return await get_order(db, order_id)


async def delete_order(db: AsyncSession, order_id: int) -> bool:
    order = await db.get(Order, order_id)
    if not order:
        return False
    await db.delete(order)
    await db.commit()
    return True
