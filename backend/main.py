from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import auth, currency, customers, dashboard, orders, product_categories, products, shipments
from app.core.database import Base, engine
import app.models


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS budget NUMERIC(15,2) NOT NULL DEFAULT 0"
        ))
        await conn.execute(text(
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS budget_applied_uzs NUMERIC(15,2) NOT NULL DEFAULT 0"
        ))
    yield


app = FastAPI(title="Glori82 Admin Inventory API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
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
