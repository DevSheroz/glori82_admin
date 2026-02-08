from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[int] = mapped_column(primary_key=True)
    product_name: Mapped[str] = mapped_column(String(255))
    brand: Mapped[str | None] = mapped_column(String(255))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("product_categories.category_id"))
    description: Mapped[str | None] = mapped_column(Text)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default="0")
    selling_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    selling_price_uzs: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    packaged_weight_grams: Mapped[int | None] = mapped_column(Integer)
    volume_ml: Mapped[int | None] = mapped_column(Integer)
    stock_quantity: Mapped[int] = mapped_column(Integer, server_default="0")
    reorder_level: Mapped[int] = mapped_column(Integer, server_default="0")
    stock_status: Mapped[str] = mapped_column(String(20), server_default="in_stock")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")

    category: Mapped["ProductCategory | None"] = relationship(back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
    attribute_values: Mapped[list["ProductAttributeValue"]] = relationship(back_populates="product", cascade="all, delete-orphan")
