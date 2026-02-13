from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    shipment_id: Mapped[int] = mapped_column(primary_key=True)
    shipment_number: Mapped[str] = mapped_column(String(50), unique=True)
    status: Mapped[str] = mapped_column(String(20), server_default="pending")
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    shipment_orders: Mapped[list["ShipmentOrder"]] = relationship(
        back_populates="shipment", cascade="all, delete-orphan"
    )
    history: Mapped[list["ShipmentHistory"]] = relationship(
        back_populates="shipment", cascade="all, delete-orphan",
        order_by="ShipmentHistory.created_at.desc()",
    )


class ShipmentOrder(Base):
    __tablename__ = "shipment_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    shipment_id: Mapped[int] = mapped_column(
        ForeignKey("shipments.shipment_id", ondelete="CASCADE")
    )
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.order_id", ondelete="CASCADE"))

    shipment: Mapped["Shipment"] = relationship(back_populates="shipment_orders")
    order: Mapped["Order"] = relationship()


class ShipmentHistory(Base):
    __tablename__ = "shipment_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    shipment_id: Mapped[int] = mapped_column(
        ForeignKey("shipments.shipment_id", ondelete="CASCADE")
    )
    action: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    shipment: Mapped["Shipment"] = relationship(back_populates="history")
