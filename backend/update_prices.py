"""One-time script to recalculate selling prices for all products based on cost_price."""

import asyncio

from sqlalchemy import select

from app.core.database import async_session
from app.models.product import Product
from app.services.currency import calculate_prices


async def main():
    async with async_session() as db:
        result = await db.execute(select(Product).where(Product.cost_price.is_not(None)))
        products = list(result.scalars().all())

        print(f"Found {len(products)} products with cost_price set.")

        for p in products:
            prices = await calculate_prices(p.cost_price)
            old_sp = p.selling_price
            old_uzs = p.selling_price_uzs
            p.selling_price = prices["selling_price"]
            p.selling_price_uzs = prices["selling_price_uzs"]
            print(
                f"  {p.product_name}: "
                f"selling_price {old_sp} -> {p.selling_price}, "
                f"selling_price_uzs {old_uzs} -> {p.selling_price_uzs}"
            )

        await db.commit()
        print("Done. All prices updated.")


if __name__ == "__main__":
    asyncio.run(main())
