from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import currency, customers, dashboard, orders, product_categories, products, shipments

app = FastAPI(title="Glori82 Admin Inventory API")

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
