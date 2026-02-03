from pydantic import BaseModel, ConfigDict


class CategoryAttributeCreate(BaseModel):
    attribute_name: str
    sort_order: int = 0


class CategoryAttributeUpdate(BaseModel):
    attribute_name: str | None = None
    sort_order: int | None = None


class CategoryAttributeResponse(BaseModel):
    attribute_id: int
    attribute_name: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class ProductAttributeValueCreate(BaseModel):
    attribute_id: int
    value: str


class ProductAttributeValueResponse(BaseModel):
    attribute_id: int
    attribute_name: str
    value: str

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_value(cls, obj):
        return cls(
            attribute_id=obj.attribute_id,
            attribute_name=obj.attribute.attribute_name,
            value=obj.value,
        )
