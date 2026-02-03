from pydantic import BaseModel, ConfigDict


class CustomerBase(BaseModel):
    customer_name: str
    contact_phone: str | None = None
    telegram_id: str | None = None
    location: str | None = None
    is_active: bool = True


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    customer_name: str | None = None
    contact_phone: str | None = None
    telegram_id: str | None = None
    location: str | None = None
    is_active: bool | None = None


class CustomerResponse(CustomerBase):
    customer_id: int

    model_config = ConfigDict(from_attributes=True)
