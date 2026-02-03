from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import currency, customers, dashboard, orders, product_categories, products, shipments
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Add any missing columns on startup so we don't need to re-seed
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price_uzs NUMERIC(12,2)"
        ))
        await conn.execute(text(
            "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selling_price_uzs NUMERIC(12,2)"
        ))
        await conn.execute(text(
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee NUMERIC(12,2) DEFAULT 3.00"
        ))
        # Merge weight_grams into packaged_weight_grams and drop the old column
        col_exists = await conn.execute(text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name='products' AND column_name='weight_grams'"
        ))
        if col_exists.scalar():
            await conn.execute(text(
                "UPDATE products SET packaged_weight_grams = weight_grams "
                "WHERE packaged_weight_grams IS NULL AND weight_grams IS NOT NULL"
            ))
            await conn.execute(text("ALTER TABLE products DROP COLUMN weight_grams"))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS category_attributes (
                attribute_id SERIAL PRIMARY KEY,
                category_id INTEGER NOT NULL REFERENCES product_categories(category_id) ON DELETE CASCADE,
                attribute_name VARCHAR(100) NOT NULL,
                sort_order INTEGER DEFAULT 0
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_attribute_values (
                value_id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
                attribute_id INTEGER NOT NULL REFERENCES category_attributes(attribute_id) ON DELETE CASCADE,
                value VARCHAR(255) NOT NULL,
                UNIQUE(product_id, attribute_id)
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS shipments (
                shipment_id SERIAL PRIMARY KEY,
                shipment_number VARCHAR(50) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS shipment_orders (
                id SERIAL PRIMARY KEY,
                shipment_id INTEGER NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
                order_id INTEGER NOT NULL REFERENCES orders(order_id)
            )
        """))
    yield


app = FastAPI(title="Glori82 Admin Inventory API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router, prefix="/api")
app.include_router(product_categories.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(currency.router, prefix="/api")
app.include_router(shipments.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
