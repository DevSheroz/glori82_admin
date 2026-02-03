from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import DashboardMetrics, SalesOverTime, TopProduct
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
