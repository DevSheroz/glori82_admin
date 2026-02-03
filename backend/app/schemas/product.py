from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.category_attribute import ProductAttributeValueCreate, ProductAttributeValueResponse


class ProductBase(BaseModel):
    product_name: str
    brand: str | None = None
    category_id: int | None = None
    description: str | None = None
    cost_price: Decimal = Decimal("0")
    selling_price: Decimal | None = None
    selling_price_uzs: Decimal | None = None
    packaged_weight_grams: int | None = None
    volume_ml: int | None = None
    stock_quantity: int = 0
    reorder_level: int = 0
    is_active: bool = True


class ProductCreate(ProductBase):
    attribute_values: list[ProductAttributeValueCreate] | None = None


class ProductUpdate(BaseModel):
    product_name: str | None = None
    brand: str | None = None
    category_id: int | None = None
    description: str | None = None
    cost_price: Decimal | None = None
    selling_price: Decimal | None = None
    selling_price_uzs: Decimal | None = None
    packaged_weight_grams: int | None = None
    volume_ml: int | None = None
    stock_quantity: int | None = None
    reorder_level: int | None = None
    is_active: bool | None = None
    attribute_values: list[ProductAttributeValueCreate] | None = None


class ProductResponse(ProductBase):
    product_id: int
    attribute_values: list[ProductAttributeValueResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator("attribute_values", mode="before")
    @classmethod
    def resolve_attribute_values(cls, v):
        if not v:
            return []
        result = []
        for item in v:
            if isinstance(item, dict):
                result.append(item)
            elif hasattr(item, "attribute"):
                result.append(ProductAttributeValueResponse.from_orm_value(item))
            else:
                result.append(item)
        return result
