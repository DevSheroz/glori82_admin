from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.pagination import PaginatedResponse
from app.schemas.shipment import ShipmentCreate, ShipmentResponse, ShipmentUpdate
from app.services import shipment as shipment_service

router = APIRouter(prefix="/shipments", tags=["Shipments"])


@router.get("", response_model=PaginatedResponse[ShipmentResponse])
async def list_shipments(
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    data, total = await shipment_service.get_shipments(
        db, status=status, page=page, page_size=page_size
    )
    return PaginatedResponse(data=data, total=total, page=page, page_size=page_size)


@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(shipment_id: int, db: AsyncSession = Depends(get_db)):
    shipment = await shipment_service.get_shipment(db, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.post("", response_model=ShipmentResponse, status_code=201)
async def create_shipment(data: ShipmentCreate, db: AsyncSession = Depends(get_db)):
    shipment = await shipment_service.create_shipment(db, data)
    return shipment


@router.put("/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(
    shipment_id: int, data: ShipmentUpdate, db: AsyncSession = Depends(get_db)
):
    shipment = await shipment_service.update_shipment(db, shipment_id, data)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.delete("/{shipment_id}", status_code=204)
async def delete_shipment(shipment_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await shipment_service.delete_shipment(db, shipment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Shipment not found")
