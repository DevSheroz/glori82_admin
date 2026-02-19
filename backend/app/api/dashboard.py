from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import (
    DashboardMetrics,
    MonthlyRevenue,
    OrderStatusCount,
    ProfitSummary,
    SalesOverTime,
    ShipmentCost,
    ShipmentRevenue,
    TopProduct,
    UnpaidOrder,
)
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_metrics(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_metrics(db)


@router.get("/sales-over-time", response_model=list[SalesOverTime])
async def sales_over_time(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_service.get_sales_over_time(db, date_from=date_from, date_to=date_to)


@router.get("/top-products", response_model=list[TopProduct])
async def top_products(limit: int = 10, db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_top_products(db, limit=limit)


@router.get("/unpaid-orders", response_model=list[UnpaidOrder])
async def unpaid_orders(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_unpaid_orders(db)


@router.get("/shipment-costs", response_model=list[ShipmentCost])
async def shipment_costs(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_shipment_costs(db)


@router.get("/order-status-summary", response_model=list[OrderStatusCount])
async def order_status_summary(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_order_status_summary(db)


@router.get("/profit-summary", response_model=ProfitSummary)
async def profit_summary(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_profit_summary(db)


@router.get("/shipment-revenue", response_model=list[ShipmentRevenue])
async def shipment_revenue(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_shipment_revenue(db)


@router.get("/monthly-revenue", response_model=list[MonthlyRevenue])
async def monthly_revenue(db: AsyncSession = Depends(get_db)):
    return await dashboard_service.get_monthly_revenue(db)
