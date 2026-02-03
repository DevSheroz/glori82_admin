from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_values"
    __table_args__ = (
        UniqueConstraint("product_id", "attribute_id", name="uq_product_attribute"),
    )

    value_id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id", ondelete="CASCADE"))
    attribute_id: Mapped[int] = mapped_column(ForeignKey("category_attributes.attribute_id", ondelete="CASCADE"))
    value: Mapped[str] = mapped_column(String(255))

    product: Mapped["Product"] = relationship(back_populates="attribute_values")
    attribute: Mapped["CategoryAttribute"] = relationship(back_populates="product_values")
