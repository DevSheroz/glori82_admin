from decimal import Decimal

from fastapi import APIRouter, Query

from app.services.currency import calculate_prices, get_rates

router = APIRouter(prefix="/currency", tags=["Currency"])


@router.get("/rates")
async def rates(preview_cost_krw: Decimal | None = Query(None)):
    r = await get_rates()
    result = {
        "krw_to_usd": r["krw_to_usd"],
        "usd_to_uzs": r["usd_to_uzs"],
    }
    if preview_cost_krw is not None:
        prices = await calculate_prices(preview_cost_krw)
        result["preview"] = {
            "cost_price_krw": float(preview_cost_krw),
            "selling_price_usd": float(prices["selling_price"]),
            "selling_price_uzs": float(prices["selling_price_uzs"]),
        }
    return result
