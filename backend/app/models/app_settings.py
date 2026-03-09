from datetime import datetime

from sqlalchemy import DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    logs_last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
