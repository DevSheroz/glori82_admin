from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

SHIPMENT_STATUSES = Literal["pending", "shipped", "delivered"]


class ShipmentCreate(BaseModel):
    order_ids: list[int]
    notes: str | None = None


class ShipmentUpdate(BaseModel):
    order_ids: list[int] | None = None
    status: SHIPMENT_STATUSES | None = None
    notes: str | None = None


class ShipmentOrderSummary(BaseModel):
    order_id: int
    order_number: str
    customer_name: str | None = None
    total_amount: Decimal | None = None
    total_amount_uzs: Decimal | None = None
    weight_kg: Decimal
    shipping_fee_uzs: Decimal
    order_total_uzs: Decimal
    status: str | None = None
    items_summary: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ShipmentResponse(BaseModel):
    shipment_id: int
    shipment_number: str
    status: str
    notes: str | None = None
    created_at: datetime
    order_count: int
    customer_count: int
    total_weight_kg: Decimal
    shipment_fee: Decimal
    shipment_fee_uzs: Decimal
    total_orders_uzs: Decimal
    grand_total_uzs: Decimal
    orders: list[ShipmentOrderSummary] = []

    model_config = ConfigDict(from_attributes=True)
