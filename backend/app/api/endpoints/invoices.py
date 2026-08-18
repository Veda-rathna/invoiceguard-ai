import os
import shutil
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.core.security import sanitize_filename, validate_file_extension
from app.services.invoice_service import invoice_service
from app.schemas.invoice import InvoiceResponse, InvoiceDetailResponse, InvoiceListResponse

router = APIRouter()


@router.post("/upload", response_model=InvoiceDetailResponse)
async def upload_invoice(
    file: UploadFile = File(...),
    custom_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Uploads an invoice or receipt image/PDF and runs the full multi-agent LangGraph workflow.
    """
    if not validate_file_extension(file.filename, settings.ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    clean_filename = sanitize_filename(file.filename)
    saved_path = os.path.join(settings.UPLOAD_DIR, clean_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    mime_type = file.content_type or "application/octet-stream"

    processed_invoice = await invoice_service.process_new_invoice(
        db=db,
        file_path=saved_path,
        original_filename=file.filename,
        mime_type=mime_type,
        custom_id=custom_id
    )

    return processed_invoice


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    decision: Optional[str] = None,
    risk_level: Optional[str] = None,
    vendor_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * size
    items, total = invoice_service.list_invoices(
        db=db,
        skip=skip,
        limit=size,
        status=status,
        decision=decision,
        risk_level=risk_level,
        vendor_name=vendor_name
    )
    total_pages = math.ceil(total / size) if total > 0 else 1

    return InvoiceListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )


@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = invoice_service.get_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.get("/{invoice_id}/file")
def get_invoice_file(invoice_id: str, db: Session = Depends(get_db)):
    invoice = invoice_service.get_by_id(db, invoice_id)
    if not invoice or not os.path.exists(invoice.document_path):
        raise HTTPException(status_code=404, detail="Document file not found")
    return FileResponse(invoice.document_path, media_type=invoice.mime_type)
