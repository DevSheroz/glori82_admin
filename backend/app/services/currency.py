import time
from decimal import Decimal, ROUND_HALF_UP

import httpx

_cache: dict = {}
_cache_ttl = 3600  # 1 hour

MARKUP = Decimal("1.5")
EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/USD"


async def _fetch_rates() -> dict[str, float]:
    now = time.time()
    if _cache and now - _cache.get("ts", 0) < _cache_ttl:
        return _cache["rates"]

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(EXCHANGE_RATE_URL)
        resp.raise_for_status()
        data = resp.json()

    rates = data["rates"]
    _cache["rates"] = rates
    _cache["ts"] = now
    return rates


async def get_rates() -> dict:
    rates = await _fetch_rates()
    krw_per_usd = rates.get("KRW", 1)
    uzs_per_usd = rates.get("UZS", 1)
    return {
        "krw_to_usd": 1 / krw_per_usd,
        "usd_to_uzs": uzs_per_usd,
    }


async def calculate_prices(cost_price_krw: Decimal) -> dict:
    r = await get_rates()
    krw_to_usd = Decimal(str(r["krw_to_usd"]))
    usd_to_uzs = Decimal(str(r["usd_to_uzs"]))

    cost_in_usd = cost_price_krw * krw_to_usd
    selling_price = (cost_in_usd * MARKUP).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    selling_price_uzs = (selling_price * usd_to_uzs).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "selling_price": selling_price,
        "selling_price_uzs": selling_price_uzs,
    }
