from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.category_attribute import CategoryAttributeCreate, CategoryAttributeResponse, CategoryAttributeUpdate
from app.schemas.pagination import PaginatedResponse
from app.schemas.product_category import ProductCategoryCreate, ProductCategoryResponse, ProductCategoryUpdate
from app.services import product_category as category_service

router = APIRouter(prefix="/categories", tags=["Product Categories"])


@router.get("", response_model=PaginatedResponse[ProductCategoryResponse])
async def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await category_service.get_categories(db, page=page, page_size=page_size)
    return PaginatedResponse(data=items, total=total, page=page, page_size=page_size)


@router.get("/{category_id}", response_model=ProductCategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    category = await category_service.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("", response_model=ProductCategoryResponse, status_code=201)
async def create_category(data: ProductCategoryCreate, db: AsyncSession = Depends(get_db)):
    return await category_service.create_category(db, data)


@router.put("/{category_id}", response_model=ProductCategoryResponse)
async def update_category(category_id: int, data: ProductCategoryUpdate, db: AsyncSession = Depends(get_db)):
    category = await category_service.update_category(db, category_id, data)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await category_service.delete_category(db, category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")


@router.post("/{category_id}/attributes", response_model=CategoryAttributeResponse, status_code=201)
async def add_attribute(category_id: int, data: CategoryAttributeCreate, db: AsyncSession = Depends(get_db)):
    attr = await category_service.add_attribute(db, category_id, data)
    if not attr:
        raise HTTPException(status_code=404, detail="Category not found")
    return attr


@router.put("/{category_id}/attributes/{attribute_id}", response_model=CategoryAttributeResponse)
async def update_attribute(
    category_id: int, attribute_id: int, data: CategoryAttributeUpdate, db: AsyncSession = Depends(get_db),
):
    attr = await category_service.update_attribute(db, category_id, attribute_id, data)
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    return attr


@router.delete("/{category_id}/attributes/{attribute_id}", status_code=204)
async def delete_attribute(category_id: int, attribute_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await category_service.delete_attribute(db, category_id, attribute_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Attribute not found")
