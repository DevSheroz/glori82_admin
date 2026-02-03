from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.product_attribute_value import ProductAttributeValue
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.currency import calculate_prices


SORTABLE_COLUMNS = {
    "product_name": Product.product_name,
    "stock_quantity": Product.stock_quantity,
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

    col = SORTABLE_COLUMNS.get(sort_by, Product.product_name)
    order = col.desc() if sort_dir == "desc" else col.asc()

    offset = (page - 1) * page_size
    result = await db.execute(
        query.options(
            selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute)
        ).order_by(order).offset(offset).limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_product(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute))
        .where(Product.product_id == product_id)
    )
    return result.scalar_one_or_none()


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
