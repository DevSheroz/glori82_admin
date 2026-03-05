from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ShoppingListOverride(Base):
    __tablename__ = "shopping_list_overrides"

    item_id: Mapped[int] = mapped_column(
        ForeignKey("order_items.item_id", ondelete="CASCADE"), primary_key=True
    )
    quantity_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_removed: Mapped[bool] = mapped_column(Boolean, server_default="false")
