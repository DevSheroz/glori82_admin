"""Seed script: drops and recreates all tables, then populates from CSV data."""

import asyncio
from decimal import Decimal

from sqlalchemy import text

from app.core.database import engine, async_session, Base
from app.models import Customer, Order, OrderItem, Product, ProductCategory


# ── Category names ──────────────────────────────────────────────────────────
CATEGORIES = [
    "Body mist", "Hand cream", "Deodorant", "Serum", "Tint", "Moisturizer",
    "Albums", "Cleaning oil", "Toner", "Eye liner", "SPF", "Shampoo",
    "Pads", "Mask", "Eye Cream", "Essence", "Blush", "Treatment",
    "Photo Book", "Foam", "Concealer", "Coloring Book", "Sheet Mask",
    "Toner Refill", "Cleanser", "Backpack",
]

# ── Raw CSV rows (order_num, customer, brand, category, product_name,
#    total_to_pay, cost_krw, sell_usd, weight_g, pkg_weight_g, ml) ──────────
RAW_DATA = [
    # Order 1
    (1, "Fatima", "Mumchit", "Body mist", "Soft blue soap", 19, 8650, None, 134, 230, None),
    (1, "Fatima", "Mumchit", "Hand cream", "Soft blue soap", None, 3895, None, 64, None, None),
    # Order 2
    (2, "Nargiza", "No sweat", "Deodorant", "Unscented", None, 10000, None, 73, None, None),
    # Order 3
    (3, "Kris", "Innisfree", "Serum", "Retinol cica", 20, 14300, None, 178, 180, None),
    # Order 4
    (4, "Mokhitabon", "Innisfree", "Serum", "Retinol cica", 19, 14300, None, 122, 130, None),
    # Order 5
    (5, "Zarnigorbegim", "Twinkle pop", "Tint", "05 cool cherry", None, 3000, None, None, None, None),
    # Order 6
    (6, "Diyora", "Snature", "Moisturizer", "Aqua squalene", 19, 14022, None, 92, 100, None),
    # Order 7
    (7, "Gulnora", "Exo", "Albums", "Greetings", 94, 94000, None, None, 2300, None),
    # Order 8
    (8, "Diyora (Botir)", "Beplain", "Cleaning oil", "Mung bean", 115, 18609, None, 380, 890, None),
    (8, "Diyora (Botir)", "Snature", "Toner", "Aqua oasis", None, 9600, None, 352, None, None),
    (8, "Diyora (Botir)", "Snature", "Moisturizer", "Aqua squalene", None, 14022, None, 92, None, None),
    # Order 9
    (9, "Mama", "Merzy", "Eye liner", "Black", 36, 17800, None, 50, 50, None),
    # Order 10
    (10, "Munira opa", "Beplain", "SPF", "Mung bean", 30, 12500, None, 66, 180, None),
    (10, "Munira opa", "Snature", "Moisturizer", "Aqua squalene", None, 14022, None, 92, None, None),
    # Order 11
    (11, "Dilnua", "Labo-h", "Shampoo", "Scalp treatment", 21, 9400, None, 423, 450, None),
    # Order 12
    (12, "Iroda", "Beplain", "Serum", "Cicaterol", None, None, None, 141, None, None),
    (12, "Iroda", "Beplain", "Pads", "Cicaterol", None, None, None, 366, None, None),
    (12, "Iroda", "Snature", "Moisturizer", "Aqua squalene", None, None, None, 92, None, None),
    # Order 13
    (13, "Gulnora", "Stown", "Albums", "EXO", None, None, None, 2550, None, None),
    (13, "Gulnora", "avajar", "Mask", "V Lifting", None, None, None, 53, None, None),
    (13, "Gulnora", "Musinsa standard", "Backpack", "Backpack", None, None, None, 900, None, None),
    # Order 14
    (14, "Aziza", "Snature", "Eye Cream", "Aqua squalene", None, None, None, 39, None, None),
    (14, "Aziza", "VT", "Essence", "Reedle Shot 100", None, None, None, 141, None, None),
    # Order 15
    (15, "Nargiza opa", "Rare beauty", "Blush", "Worth", None, None, None, None, None, None),
    (15, "Nargiza opa", "Beplain", "Cleaning oil", "Mung bean", None, None, None, 384, None, None),
    # Order 16
    (16, "Dildora opa", "CH6", "Serum", "Scalp slang", None, None, None, 192, None, None),
    # Order 17
    (17, "Nadira", "Unove", "Treatment", "Warm petals", None, None, None, 362, None, None),
    (17, "Nadira", "Beplain", "Cleaning oil", "Mung bean", None, None, None, 384, None, None),
    (17, "Nadira", "Torriden", "Toner", "Dive in", None, None, None, 739, None, None),
    # Order 18
    (18, "Marjona", "Beplain", "Cleaning oil", "Mung bean", None, None, None, 379, None, None),
    # Order 19
    (19, "Nurchinoy", "Beplain", "Cleaning oil", "Mung bean", None, None, None, 384, None, None),
    # Order 30
    (30, "Sadoqat", "VT", "Moisturizer", "PDRN Capsule Cream", None, None, None, 169, None, None),
    (30, "Sadoqat", "VT", "Moisturizer", "PDRN Capsule Cream", None, None, None, 169, None, None),
    (30, "Sadoqat", "VT", "Moisturizer", "PDRN Capsule Cream", None, None, None, 169, None, None),
    (30, "Sadoqat", "VT", "Moisturizer", "PDRN Capsule Cream", None, None, None, 169, None, None),
    (30, "Sadoqat", "VT", "Essence", "PDRN", None, None, None, 116, None, None),
    (30, "Sadoqat", "VT", "Essence", "PDRN", None, None, None, 116, None, None),
    (30, "Sadoqat", "VT", "Essence", "PDRN", None, None, None, 116, None, None),
    # Order 31
    (31, "Zuhra opa", "Beplain", "Moisturizer", "Aqua pure", None, None, None, 93, None, None),
    (31, "Zuhra opa", "Beplain", "Serum", "Aqua pure", None, None, None, 90, None, None),
    (31, "Zuhra opa", "Beplain", "Sheet Mask", "Aqua pure", None, None, None, 65, None, None),
    # Order 32
    (32, "Ohista", "Torriden", "Moisturizer", "Dive in", None, None, None, 193, None, None),
    # Order 33
    (33, "Dildora opa", "Aestura", "Foam", "Atobarrier 365", None, 12400, None, 233, None, None),
    (33, "Dildora opa", "Snature", "Toner", "Aqua oasis", None, 9600, None, 350, None, None),
    (33, "Dildora opa", "Innisfree", "Serum", "Retinol cica", None, 14300, None, 177, None, None),
    # Order 34
    (34, "Elnura opa", "Laneige", "Toner Refill", "Cream Skin", None, 15810, None, 180, None, None),
    (34, "Elnura opa", "Round lab", "Toner", "Dokdo", None, 10200, None, 258, None, None),
    (34, "Elnura opa", "Medicube", "Serum", "PDRN pink peptide", None, None, None, 186, None, None),
    (34, "Elnura opa", "Wellage", "Serum", "Wellage serum", None, None, None, None, None, None),
    # Order 35
    (35, "Gulchehra", "BTS", "Photo Book", "V", None, None, None, 2500, None, None),
    # Order 36
    (36, "Nurjahon", "Beplain", "Foam", "Mung bean", None, 12100, None, 202, None, None),
    (36, "Nurjahon", "Tirtir", "Concealer", "Tirtir concealer", None, None, None, None, None, None),
    # Order 37
    (37, "Mokhitabon", "Johanna Bosford", "Coloring Book", "Secret Garden", None, None, None, 600, None, None),
    # Orders 38-44 (customer-only, no items)
    (38, "Viktoria", None, None, None, None, None, None, None, None, None),
    (39, "Mama", None, None, None, None, None, None, None, None, None),
    (40, "Dilnua", None, None, None, None, None, None, None, None, None),
    (41, "Zulayho", None, None, None, None, None, None, None, None, None),
    (42, "Gavhar", None, None, None, None, None, None, None, None, None),
    (43, "Fotima opa", None, None, None, None, None, None, None, None, None),
    (44, "Oyjahon", None, None, None, None, None, None, None, None, None),
    # TBA orders (second batch)
    (101, "TBA", "The lab", "Toner Refill", "Du oligo", None, 13960, None, 288, None, None),
    (102, "TBA", "Mumchit", "Hand cream", "Soft blue soap", None, 3895, None, 64, None, None),
    (103, "Feruza", "Unove", "Treatment", "Warm petals", None, None, None, None, None, None),
    (104, "TBA", "Arencia", "Cleanser", "Fresh green", None, 16900, None, 243, None, None),
    (105, "TBA", "Beplain", "Cleaning oil", "Mung bean", None, None, None, None, None, None),
    (106, "TBA", "Beplain", "Cleaning oil", "Mung bean", None, None, None, None, None, None),
    (107, "TBA", "Beplain", "Foam", "Mung bean", None, 12100, None, 202, None, 114),
    (108, "TBA", "Beplain", "SPF", "Mung bean", None, 12500, None, 66, None, None),
    (109, "TBA", "Labo-h", "Shampoo", "Scalp treatment", None, 5000, None, 137, None, None),
    (110, "Masuma", "Snature", "Moisturizer", "Aqua squalene", None, 14022, None, 92, None, None),
    (111, "TBA", "Snature", "Moisturizer", "Aqua squalene", None, 14022, None, 92, None, None),
]


async def seed():
    async with engine.begin() as conn:
        # Drop dependent views and old tables first
        await conn.execute(text("DROP VIEW IF EXISTS vw_product_sales_summary CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS sales_transactions CASCADE"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # ── 1. Categories ───────────────────────────────────────────────
        cat_map: dict[str, ProductCategory] = {}
        for name in CATEGORIES:
            cat = ProductCategory(category_name=name)
            session.add(cat)
            cat_map[name] = cat
        await session.flush()

        # ── 2. Collect unique products and customers ────────────────────
        product_key_map: dict[tuple, Product] = {}   # (brand, cat, name) -> Product
        customer_map: dict[str, Customer] = {}

        for row in RAW_DATA:
            (order_num, cust_name, brand, cat_name, prod_name,
             total_pay, cost_krw, sell_usd, weight, pkg_weight, ml) = row

            # Customer
            if cust_name and cust_name not in customer_map:
                customer = Customer(customer_name=cust_name)
                session.add(customer)
                customer_map[cust_name] = customer

            # Product
            if brand and cat_name and prod_name:
                key = (brand.strip(), cat_name.strip(), prod_name.strip())
                if key not in product_key_map:
                    category = cat_map.get(cat_name.strip())
                    product = Product(
                        product_name=prod_name.strip(),
                        brand=brand.strip(),
                        category_id=category.category_id if category else None,
                        cost_price=Decimal(str(cost_krw)) if cost_krw else Decimal("0"),
                        selling_price=Decimal(str(sell_usd)) if sell_usd else None,
                        packaged_weight_grams=pkg_weight or weight,
                        volume_ml=ml,
                        stock_quantity=0,
                    )
                    session.add(product)
                    product_key_map[key] = product
                else:
                    # Update cost/weight if this row has data the first didn't
                    existing = product_key_map[key]
                    if cost_krw and existing.cost_price == Decimal("0"):
                        existing.cost_price = Decimal(str(cost_krw))
                    if (pkg_weight or weight) and not existing.packaged_weight_grams:
                        existing.packaged_weight_grams = pkg_weight or weight
                    if ml and not existing.volume_ml:
                        existing.volume_ml = ml

        await session.flush()

        # ── 3. Orders and OrderItems ────────────────────────────────────
        # Group rows by order_num
        from collections import defaultdict
        orders_by_num: dict[int, list] = defaultdict(list)
        for row in RAW_DATA:
            orders_by_num[row[0]].append(row)

        for order_num, rows in sorted(orders_by_num.items()):
            first = rows[0]
            cust_name = first[1]
            total_pay = first[5]

            customer = customer_map.get(cust_name)

            order = Order(
                order_number=f"ORD-{order_num:04d}",
                customer_id=customer.customer_id if customer else None,
                total_amount=Decimal(str(total_pay)) if total_pay else None,
                status="pending",
            )
            session.add(order)
            await session.flush()

            for row in rows:
                (_, _, brand, cat_name, prod_name,
                 _, cost_krw, sell_usd, weight, pkg_weight, ml) = row

                if brand and cat_name and prod_name:
                    key = (brand.strip(), cat_name.strip(), prod_name.strip())
                    product = product_key_map.get(key)
                    item = OrderItem(
                        order_id=order.order_id,
                        product_id=product.product_id if product else None,
                        quantity=1,
                        cost_price=Decimal(str(cost_krw)) if cost_krw else None,
                        selling_price=Decimal(str(sell_usd)) if sell_usd else None,
                    )
                    session.add(item)

        await session.commit()

    print("Seed complete!")
    # Print summary
    async with async_session() as session:
        from sqlalchemy import func, select
        cats = (await session.execute(select(func.count()).select_from(ProductCategory))).scalar()
        prods = (await session.execute(select(func.count()).select_from(Product))).scalar()
        custs = (await session.execute(select(func.count()).select_from(Customer))).scalar()
        ords = (await session.execute(select(func.count()).select_from(Order))).scalar()
        items = (await session.execute(select(func.count()).select_from(OrderItem))).scalar()
        print(f"  Categories: {cats}")
        print(f"  Products:   {prods}")
        print(f"  Customers:  {custs}")
        print(f"  Orders:     {ords}")
        print(f"  OrderItems: {items}")


if __name__ == "__main__":
    asyncio.run(seed())
