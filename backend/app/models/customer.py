from decimal import Decimal

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    customer_id: Mapped[int] = mapped_column(primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(50))
    telegram_id: Mapped[str | None] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    budget: Mapped[Decimal] = mapped_column(Numeric(15, 2), server_default="0")

    orders: Mapped[list["Order"]] = relationship(back_populates="customer")
