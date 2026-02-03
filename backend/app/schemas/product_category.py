from pydantic import BaseModel, ConfigDict

from app.schemas.category_attribute import CategoryAttributeResponse


class ProductCategoryBase(BaseModel):
    category_name: str
    description: str | None = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(BaseModel):
    category_name: str | None = None
    description: str | None = None


class ProductCategoryResponse(ProductCategoryBase):
    category_id: int
    attributes: list[CategoryAttributeResponse] = []

    model_config = ConfigDict(from_attributes=True)
