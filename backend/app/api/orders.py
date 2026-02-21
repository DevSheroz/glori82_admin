from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.schemas.pagination import PaginatedResponse
from app.services import order as order_service
from app.services.currency import get_rates

router = APIRouter(prefix="/orders", tags=["Orders"])


def _format_product_attributes(product) -> str | None:
    if not product or not product.attribute_values:
        return None
    parts = [
        f"{av.attribute.attribute_name}: {av.value}"
        for av in product.attribute_values
    ]
    return ", ".join(parts) if parts else None


def _order_to_response(order, usd_to_uzs: Decimal = Decimal(0)) -> dict:
    items = [
        {
            "item_id": item.item_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "selling_price": item.selling_price,
            "selling_price_uzs": item.selling_price_uzs,
            "cost_price": item.cost_price,
            "product_name": item.product.product_name if item.product else None,
            "product_attributes": _format_product_attributes(item.product),
            "packaged_weight_grams": item.product.packaged_weight_grams if item.product else None,
            "brand": item.product.brand if item.product else None,
            "category_name": item.product.category.category_name if item.product and item.product.category else None,
            "stock_status": item.product.stock_status if item.product else None,
        }
        for item in order.items
    ]
    total_cost = sum(
        (it["cost_price"] or 0) * it["quantity"]
        for it in items
    ) or None
    total_amount_uzs = sum(
        (it["selling_price_uzs"] or 0) * it["quantity"]
        for it in items
    ) or None
    service_fee = order.service_fee if order.service_fee is not None else Decimal("3.00")

    selling_sum = sum(
        (it["selling_price"] or 0) * it["quantity"]
        for it in items
    )
    selling_usd = Decimal(str(selling_sum)) if selling_sum else Decimal(0)
    total_selling_usd = (selling_usd + service_fee).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if selling_usd else None

    total_weight_grams = sum(
        (it["packaged_weight_grams"] or 0) * it["quantity"]
        for it in items
    )
    total_weight_kg = (Decimal(total_weight_grams) / Decimal(1000)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_weight_grams else None
    shipping_fee_usd = (total_weight_kg * Decimal(12)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_weight_kg else None
    customer_cargo_usd = (total_weight_kg * Decimal(13)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_weight_kg else None
    shipping_fee_uzs = (shipping_fee_usd * usd_to_uzs).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if shipping_fee_usd and usd_to_uzs else None

    # Compute total in one step to match shipment calculation exactly
    total_price_usd = None
    total_price_uzs = None
    if selling_usd and customer_cargo_usd:
        total_price_usd = (selling_usd + service_fee + customer_cargo_usd).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        if usd_to_uzs:
            total_price_uzs = (total_price_usd * usd_to_uzs).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

    # Use the locked final amount if available (set when order is completed + paid)
    if order.final_amount_uzs is not None:
        total_price_uzs = order.final_amount_uzs

    paid_card = order.paid_card or Decimal(0)
    paid_cash = order.paid_cash or Decimal(0)
    total_paid = paid_card + paid_cash
    unpaid = max(Decimal(0), total_price_uzs - total_paid).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    ) if total_price_uzs else None

    return {
        "order_id": order.order_id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "order_date": order.order_date,
        "total_amount": order.total_amount,
        "total_cost": total_cost,
        "total_selling_usd": total_selling_usd,
        "total_amount_uzs": total_amount_uzs,
        "total_weight_kg": total_weight_kg,
        "shipping_fee_usd": shipping_fee_usd,
        "customer_cargo_usd": customer_cargo_usd,
        "shipping_fee_uzs": shipping_fee_uzs,
        "grand_total_uzs": (total_amount_uzs or 0) + (shipping_fee_uzs or 0) or None,
        "total_price_usd": total_price_usd,
        "total_price_uzs": total_price_uzs,
        "status": order.status,
        "notes": order.notes,
        "service_fee": service_fee,
        "shipping_number": order.shipping_number,
        "payment_status": order.payment_status or "unpaid",
        "paid_card": paid_card,
        "paid_cash": paid_cash,
        "unpaid": unpaid,
        "final_amount_uzs": order.final_amount_uzs,
        "customer_name": order.customer.customer_name if order.customer else None,
        "items": items,
    }


async def _usd_to_uzs_rate() -> Decimal:
    try:
        r = await get_rates()
        return Decimal(str(r["usd_to_uzs"]))
    except Exception:
        return Decimal(0)


@router.get("", response_model=PaginatedResponse[OrderResponse])
async def list_orders(
    status: str | None = None,
    payment_status: str | None = None,
    customer_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str | None = None,
    sort_dir: str = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    orders, total = await order_service.get_orders(
        db,
        status=status,
        payment_status=payment_status,
        customer_id=customer_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    rate = await _usd_to_uzs_rate()
    return PaginatedResponse(
        data=[_order_to_response(o, rate) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await order_service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    rate = await _usd_to_uzs_rate()
    return _order_to_response(order, rate)


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    order = await order_service.create_order(db, data)
    rate = await _usd_to_uzs_rate()
    return _order_to_response(order, rate)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: int, data: OrderUpdate, db: AsyncSession = Depends(get_db)):
    order = await order_service.update_order(db, order_id, data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    rate = await _usd_to_uzs_rate()
    return _order_to_response(order, rate)


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await order_service.delete_order(db, order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
