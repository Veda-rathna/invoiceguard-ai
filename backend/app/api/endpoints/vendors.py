from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.vendor import Vendor
from app.models.invoice import Invoice

router = APIRouter()


@router.get("")
def list_vendors(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    vendors = db.query(Vendor).order_by(desc(Vendor.invoice_count)).limit(limit).all()
    return [
        {
            "id": v.id,
            "name": v.name,
            "tax_id": v.tax_id,
            "category": v.category,
            "is_verified": v.is_verified,
            "invoice_count": v.invoice_count,
            "avg_invoice_amount": v.avg_invoice_amount,
            "median_invoice_amount": v.median_invoice_amount,
            "max_invoice_amount": v.max_invoice_amount,
            "trust_score": v.trust_score,
            "created_at": v.created_at
        }
        for v in vendors
    ]


@router.get("/{vendor_id}")
def get_vendor_details(vendor_id: str, db: Session = Depends(get_db)):
    v = db.query(Vendor).filter((Vendor.id == vendor_id) | (Vendor.name == vendor_id)).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    recent_invoices = db.query(Invoice).filter(Invoice.vendor_name == v.name).order_by(desc(Invoice.created_at)).limit(10).all()

    return {
        "id": v.id,
        "name": v.name,
        "tax_id": v.tax_id,
        "category": v.category,
        "is_verified": v.is_verified,
        "invoice_count": v.invoice_count,
        "avg_invoice_amount": v.avg_invoice_amount,
        "median_invoice_amount": v.median_invoice_amount,
        "min_invoice_amount": v.min_invoice_amount,
        "max_invoice_amount": v.max_invoice_amount,
        "trust_score": v.trust_score,
        "created_at": v.created_at,
        "recent_invoices": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "total_amount": inv.total_amount,
                "decision": inv.decision,
                "risk_score": inv.risk_score,
                "created_at": inv.created_at
            }
            for inv in recent_invoices
        ]
    }
