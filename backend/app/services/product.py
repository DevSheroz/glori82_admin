from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_attribute_value import ProductAttributeValue
from app.models.product_category import ProductCategory
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.currency import calculate_prices


SORTABLE_COLUMNS = {
    "product_name": Product.product_name,
    "brand": Product.brand,
    "category_name": ProductCategory.category_name,
    "stock_quantity": Product.stock_quantity,
    "stock_status": Product.stock_status,
    "packaged_weight_grams": Product.packaged_weight_grams,
    "cost_price": Product.cost_price,
    "selling_price": Product.selling_price,
}


async def get_products(
    db: AsyncSession,
    category_id: int | None = None,
    brand: str | None = None,
    is_active: bool | None = None,
    sort_by: str | None = None,
    sort_dir: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Product], int]:
    query = select(Product)
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    if brand is not None:
        query = query.where(Product.brand == brand)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    if sort_by == "category_name":
        query = query.outerjoin(ProductCategory, Product.category_id == ProductCategory.category_id)

    col = SORTABLE_COLUMNS.get(sort_by, Product.product_name)
    order = col.desc() if sort_dir == "desc" else col.asc()

    offset = (page - 1) * page_size
    result = await db.execute(
        query.options(
            selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute)
        ).order_by(order).offset(offset).limit(page_size)
    )
    products = list(result.scalars().all())

    if products:
        product_ids = [p.product_id for p in products]
        counts_result = await db.execute(
            select(OrderItem.product_id, func.coalesce(func.sum(OrderItem.quantity), 0))
            .where(OrderItem.product_id.in_(product_ids))
            .group_by(OrderItem.product_id)
        )
        counts_map = {row[0]: row[1] for row in counts_result.all()}
        for p in products:
            p.times_ordered = counts_map.get(p.product_id, 0)

    return products, total


async def get_product(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute))
        .where(Product.product_id == product_id)
    )
    product = result.scalar_one_or_none()
    if product:
        count_result = await db.execute(
            select(func.coalesce(func.sum(OrderItem.quantity), 0))
            .where(OrderItem.product_id == product_id)
        )
        product.times_ordered = count_result.scalar()
    return product


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    fields = data.model_dump()
    attr_values_data = fields.pop("attribute_values", None)
    if fields.get("cost_price") is not None:
        prices = await calculate_prices(fields["cost_price"])
        fields["selling_price"] = prices["selling_price"]
        fields["selling_price_uzs"] = prices["selling_price_uzs"]
    product = Product(**fields)
    db.add(product)
    await db.flush()
    if attr_values_data:
        for av in attr_values_data:
            db.add(ProductAttributeValue(
                product_id=product.product_id,
                attribute_id=av["attribute_id"],
                value=av["value"],
            ))
    await db.commit()
    return await get_product(db, product.product_id)


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product | None:
    product = await get_product(db, product_id)
    if not product:
        return None
    fields = data.model_dump(exclude_unset=True)
    attr_values_data = fields.pop("attribute_values", None)
    if "cost_price" in fields and fields["cost_price"] is not None:
        prices = await calculate_prices(fields["cost_price"])
        fields["selling_price"] = prices["selling_price"]
        fields["selling_price_uzs"] = prices["selling_price_uzs"]
    for key, value in fields.items():
        setattr(product, key, value)
    if attr_values_data is not None:
        for av in product.attribute_values:
            await db.delete(av)
        await db.flush()
        for av in attr_values_data:
            db.add(ProductAttributeValue(
                product_id=product_id,
                attribute_id=av["attribute_id"],
                value=av["value"],
            ))
    await db.commit()
    return await get_product(db, product_id)


async def delete_product(db: AsyncSession, product_id: int) -> bool:
    product = await db.get(Product, product_id)
    if not product:
        return False
    await db.delete(product)
    await db.commit()
    return True


async def get_brands(
    db: AsyncSession,
    category_id: int | None = None,
) -> list[str]:
    query = select(Product.brand).where(Product.brand.is_not(None)).distinct()
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    result = await db.execute(query.order_by(Product.brand))
    return [row[0] for row in result.all()]


async def get_low_stock_products(db: AsyncSession) -> list[Product]:
    query = select(Product).where(
        Product.stock_quantity <= Product.reorder_level,
        Product.is_active == True,
    ).options(
        selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute)
    )
    result = await db.execute(query.order_by(Product.stock_quantity))
    return list(result.scalars().all())
