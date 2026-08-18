import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.invoice_service import invoice_service
from app.schemas.invoice import InvoiceResponse, InvoiceListResponse, InvoiceDetailResponse
from app.schemas.reviewer import ReviewerActionRequest, ReviewerActionResponse

router = APIRouter()


@router.get("/queue", response_model=InvoiceListResponse)
def get_review_queue(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns prioritized Human-in-the-Loop review queue sorted by highest risk first.
    """
    skip = (page - 1) * size
    items, total = invoice_service.list_review_queue(db=db, skip=skip, limit=size)
    total_pages = math.ceil(total / size) if total > 0 else 1

    return InvoiceListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )


@router.post("/{invoice_id}/action", response_model=InvoiceDetailResponse)
def submit_review_action(
    invoice_id: str,
    action_in: ReviewerActionRequest,
    db: Session = Depends(get_db)
):
    """
    Applies human reviewer decision (APPROVE, REJECT, REQUEST_INFO) and creates audit trail.
    """
    valid_actions = ["APPROVE", "REJECT", "REQUEST_INFO"]
    act = action_in.action.upper()
    if act not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{action_in.action}'. Must be one of: {', '.join(valid_actions)}"
        )

    updated_invoice = invoice_service.apply_reviewer_action(
        db=db,
        invoice_id=invoice_id,
        action=act,
        reviewer_user=action_in.reviewer_user,
        comment=action_in.comment
    )

    if not updated_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return updated_invoice
