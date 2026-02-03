from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CategoryAttribute(Base):
    __tablename__ = "category_attributes"

    attribute_id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.category_id", ondelete="CASCADE"))
    attribute_name: Mapped[str] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(Integer, server_default="0")

    category: Mapped["ProductCategory"] = relationship(back_populates="attributes")
    product_values: Mapped[list["ProductAttributeValue"]] = relationship(back_populates="attribute", cascade="all, delete-orphan")
