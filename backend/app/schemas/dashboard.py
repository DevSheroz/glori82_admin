from datetime import date
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
