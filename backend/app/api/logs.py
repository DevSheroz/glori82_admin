from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.activity_log import ActivityLog
from app.models.app_settings import AppSettings
from app.models.user import User

router = APIRouter(prefix="/logs", tags=["logs"])


async def _get_or_create_settings(db: AsyncSession) -> AppSettings:
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = AppSettings(id=1, logs_last_seen_at=None)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("")
async def get_logs(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(30)
    )
    logs = result.scalars().all()
    return [
        {
            "log_id": log.log_id,
            "user_name": log.user_name,
            "user_role": log.user_role,
            "order_id": log.order_id,
            "order_number": log.order_number,
            "action": log.action,
            "field": log.field,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(db)
    if settings.logs_last_seen_at is None:
        result = await db.execute(select(func.count()).select_from(ActivityLog))
    else:
        result = await db.execute(
            select(func.count())
            .select_from(ActivityLog)
            .where(ActivityLog.created_at > settings.logs_last_seen_at)
        )
    count = result.scalar_one()
    return {"count": count}


@router.post("/mark-seen")
async def mark_seen(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(db)
    settings.logs_last_seen_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}
