from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_products: int
    total_revenue: Decimal
    sales_count: int
    low_stock_count: int


class SalesOverTime(BaseModel):
    date: date
    total_sales: Decimal
    count: int


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_quantity: int
    total_revenue: Decimal


class UnpaidOrder(BaseModel):
    order_id: int
    order_number: str
    customer_name: str | None
    total_price_uzs: Decimal | None
    paid_card: Decimal
    paid_cash: Decimal
    unpaid_uzs: Decimal
    payment_status: str
    order_date: datetime


class ShipmentCost(BaseModel):
    shipment_id: int
    shipment_number: str
    status: str
    product_cost_krw: Decimal
    cargo_cost_usd: Decimal
    total_weight_kg: Decimal
    order_count: int


class OrderStatusCount(BaseModel):
    status: str
    count: int


class ProfitSummary(BaseModel):
    total_selling_usd: Decimal
    total_service_fee_usd: Decimal
    total_customer_cargo_usd: Decimal
    total_revenue_usd: Decimal
    total_product_cost_krw: Decimal
    total_business_cargo_usd: Decimal
    gross_profit_usd: Decimal
    krw_to_usd: Decimal
    usd_to_uzs: Decimal
    total_unpaid_uzs: Decimal
    total_orders: int
