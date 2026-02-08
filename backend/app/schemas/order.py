from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

ORDER_STATUSES = Literal["pending", "shipped", "received", "completed"]


class OrderItemBase(BaseModel):
    product_id: int | None = None
    quantity: int = 1
    selling_price: Decimal | None = None
    selling_price_uzs: Decimal | None = None
    cost_price: Decimal | None = None


class OrderItemCreate(OrderItemBase):
    product_name: str | None = None
    brand: str | None = None
    category_id: int | None = None
    category_name: str | None = None
    packaged_weight_grams: int | None = None


class OrderItemResponse(OrderItemBase):
    item_id: int
    product_name: str | None = None
    product_attributes: str | None = None
    packaged_weight_grams: int | None = None
    brand: str | None = None
    category_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    order_number: str
    customer_id: int | None = None
    order_date: datetime | None = None
    total_amount: Decimal | None = None
    status: ORDER_STATUSES = "pending"
    notes: str | None = None
    service_fee: Decimal = Decimal("3.00")
    shipping_number: str | None = None


class OrderCreate(BaseModel):
    order_number: str | None = None
    customer_id: int | None = None
    customer_name: str | None = None
    customer_city: str | None = None
    customer_address: str | None = None
    customer_phone: str | None = None
    order_date: datetime | None = None
    total_amount: Decimal | None = None
    status: ORDER_STATUSES = "pending"
    notes: str | None = None
    service_fee: Decimal = Decimal("3.00")
    shipping_number: str | None = None
    items: list[OrderItemCreate] = []


class OrderUpdate(BaseModel):
    customer_id: int | None = None
    customer_name: str | None = None
    customer_city: str | None = None
    customer_address: str | None = None
    customer_phone: str | None = None
    order_date: datetime | None = None
    total_amount: Decimal | None = None
    status: ORDER_STATUSES | None = None
    notes: str | None = None
    service_fee: Decimal | None = None
    shipping_number: str | None = None
    items: list[OrderItemCreate] | None = None


class OrderResponse(OrderBase):
    order_id: int
    customer_name: str | None = None
    total_cost: Decimal | None = None
    total_selling_usd: Decimal | None = None
    total_amount_uzs: Decimal | None = None
    total_weight_kg: Decimal | None = None
    shipping_fee_usd: Decimal | None = None
    customer_cargo_usd: Decimal | None = None
    shipping_fee_uzs: Decimal | None = None
    grand_total_uzs: Decimal | None = None
    total_price_usd: Decimal | None = None
    total_price_uzs: Decimal | None = None
    items: list[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
