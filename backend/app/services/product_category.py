from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category_attribute import CategoryAttribute
from app.models.product_category import ProductCategory
from app.schemas.category_attribute import CategoryAttributeCreate, CategoryAttributeUpdate
from app.schemas.product_category import ProductCategoryCreate, ProductCategoryUpdate


async def get_categories(
    db: AsyncSession, *, page: int = 1, page_size: int = 20,
) -> tuple[list[ProductCategory], int]:
    total_result = await db.execute(select(func.count(ProductCategory.category_id)))
    total = total_result.scalar_one()

    result = await db.execute(
        select(ProductCategory)
        .options(selectinload(ProductCategory.attributes))
        .order_by(ProductCategory.category_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_category(db: AsyncSession, category_id: int) -> ProductCategory | None:
    result = await db.execute(
        select(ProductCategory)
        .options(selectinload(ProductCategory.attributes))
        .where(ProductCategory.category_id == category_id)
    )
    return result.scalar_one_or_none()


async def create_category(db: AsyncSession, data: ProductCategoryCreate) -> ProductCategory:
    category = ProductCategory(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category, attribute_names=["attributes"])
    return category


async def update_category(db: AsyncSession, category_id: int, data: ProductCategoryUpdate) -> ProductCategory | None:
    category = await get_category(db, category_id)
    if not category:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await db.commit()
    await db.refresh(category, attribute_names=["attributes"])
    return category


async def delete_category(db: AsyncSession, category_id: int) -> bool:
    category = await db.get(ProductCategory, category_id)
    if not category:
        return False
    await db.delete(category)
    await db.commit()
    return True


async def add_attribute(db: AsyncSession, category_id: int, data: CategoryAttributeCreate) -> CategoryAttribute | None:
    category = await db.get(ProductCategory, category_id)
    if not category:
        return None
    attr = CategoryAttribute(category_id=category_id, **data.model_dump())
    db.add(attr)
    await db.commit()
    await db.refresh(attr)
    return attr


async def update_attribute(
    db: AsyncSession, category_id: int, attribute_id: int, data: CategoryAttributeUpdate,
) -> CategoryAttribute | None:
    attr = await db.get(CategoryAttribute, attribute_id)
    if not attr or attr.category_id != category_id:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(attr, key, value)
    await db.commit()
    await db.refresh(attr)
    return attr


async def delete_attribute(db: AsyncSession, category_id: int, attribute_id: int) -> bool:
    attr = await db.get(CategoryAttribute, attribute_id)
    if not attr or attr.category_id != category_id:
        return False
    await db.delete(attr)
    await db.commit()
    return True
