from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OrderItemAttributeValue(Base):
    __tablename__ = "order_item_attribute_values"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("order_items.item_id", ondelete="CASCADE"))
    attribute_id: Mapped[int] = mapped_column(ForeignKey("category_attributes.attribute_id", ondelete="CASCADE"))
    value: Mapped[str] = mapped_column(String(255))

    item: Mapped["OrderItem"] = relationship(back_populates="attribute_values")
    attribute: Mapped["CategoryAttribute"] = relationship()
