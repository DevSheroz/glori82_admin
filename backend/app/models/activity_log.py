from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    user_name: Mapped[str] = mapped_column(String, nullable=False)
    user_role: Mapped[str] = mapped_column(String, nullable=False)
    order_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("orders.order_id", ondelete="SET NULL"), nullable=True
    )
    order_number: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    field: Mapped[str] = mapped_column(String, nullable=False)
    old_value: Mapped[str | None] = mapped_column(String, nullable=True)
    new_value: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
