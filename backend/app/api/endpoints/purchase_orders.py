from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.po_service import po_service
from app.schemas.po_matching import PurchaseOrderCreate, PurchaseOrderResponse

router = APIRouter()


@router.get("", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return po_service.list_all(db, limit=limit)


@router.post("", response_model=PurchaseOrderResponse)
def create_purchase_order(po_in: PurchaseOrderCreate, db: Session = Depends(get_db)):
    existing = po_service.get_by_po_number(db, po_in.po_number)
    if existing:
        raise HTTPException(status_code=400, detail=f"Purchase order '{po_in.po_number}' already exists")
    return po_service.create_po(db, po_in)


@router.get("/{po_number}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_number: str, db: Session = Depends(get_db)):
    po = po_service.get_by_po_number(db, po_number)
    if not po:
        raise HTTPException(status_code=404, detail=f"Purchase order '{po_number}' not found")
    return po
