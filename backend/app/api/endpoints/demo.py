import os
import io
import time
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw, ImageFont

from app.db.session import get_db
from app.core.config import settings
from app.services.invoice_service import invoice_service
from app.services.po_service import po_service
from app.schemas.po_matching import PurchaseOrderCreate, PurchaseOrderItemSchema
from app.models.vendor import Vendor
from app.models.purchase_order import PurchaseOrder

router = APIRouter()


def _create_sample_invoice_image(
    filename: str,
    vendor_name: str,
    invoice_number: str,
    po_number: str,
    total_amount: float,
    line_item_desc: str,
    subtotal: float,
    tax: float
) -> str:
    """
    Generates a clean visual invoice image file for Bedrock/multimodal testing and file preview.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    img_path = os.path.join(settings.UPLOAD_DIR, filename)

    img = Image.new("RGB", (800, 1050), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Header Banner
    draw.rectangle([(0, 0), (800, 100)], fill=(30, 41, 59))
    draw.text((40, 35), "TAX INVOICE", fill=(255, 255, 255))

    # Vendor Details
    draw.text((40, 120), vendor_name, fill=(15, 23, 42))
    draw.text((40, 150), "Corporate Tech Park, Cyber City, Phase 2", fill=(100, 116, 139))
    draw.text((40, 170), "GSTIN/Tax ID: 29AABCU9603R1ZM", fill=(100, 116, 139))

    # Invoice & PO Metadata
    draw.text((500, 120), f"Invoice #: {invoice_number}", fill=(15, 23, 42))
    draw.text((500, 150), f"Invoice Date: {datetime.date.today().isoformat()}", fill=(100, 116, 139))
    draw.text((500, 170), f"PO Number: {po_number}", fill=(15, 23, 42))
    draw.text((500, 190), "Payment Terms: Net 30", fill=(100, 116, 139))

    # Table Header
    draw.rectangle([(40, 240), (760, 270)], fill=(241, 245, 249))
    draw.text((50, 248), "Item Description", fill=(51, 65, 85))
    draw.text((450, 248), "Qty", fill=(51, 65, 85))
    draw.text((550, 248), "Unit Price", fill=(51, 65, 85))
    draw.text((670, 248), "Total", fill=(51, 65, 85))

    # Table Row
    draw.text((50, 290), line_item_desc[:45], fill=(30, 41, 59))
    draw.text((460, 290), "1", fill=(30, 41, 59))
    draw.text((550, 290), f"₹{subtotal:,.2f}", fill=(30, 41, 59))
    draw.text((670, 290), f"₹{subtotal:,.2f}", fill=(30, 41, 59))

    draw.line([(40, 330), (760, 330)], fill=(226, 232, 240), width=1)

    # Totals Block
    draw.text((500, 380), "Subtotal:", fill=(100, 116, 139))
    draw.text((660, 380), f"₹{subtotal:,.2f}", fill=(15, 23, 42))
    
    draw.text((500, 410), "GST / Tax (18%):", fill=(100, 116, 139))
    draw.text((660, 410), f"₹{tax:,.2f}", fill=(15, 23, 42))

    draw.rectangle([(480, 440), (760, 480)], fill=(248, 250, 252))
    draw.text((500, 452), "Grand Total:", fill=(15, 23, 42))
    draw.text((640, 452), f"₹{total_amount:,.2f}", fill=(16, 185, 129))

    # Footer
    draw.text((40, 950), "Authorized Signatory & Stamp", fill=(148, 163, 184))
    draw.text((40, 980), "Thank you for your business!", fill=(148, 163, 184))

    img.save(img_path, format="JPEG", quality=95)
    return img_path


@router.post("/trigger-case/{case_id}")
async def trigger_demo_case(case_id: int, db: Session = Depends(get_db)):
    """
    Executes one of the three judge evaluation cases:
    1: Safe (AUTO_APPROVE)
    2: Exception / PO Variance (HUMAN_REVIEW)
    3: Duplicate (BLOCK)
    """
    if case_id == 1:
        # Case 1: Clean Invoice & PO Match -> AUTO_APPROVE
        po_num = "PO-10293"
        vendor = "ABC Technologies"
        
        # Ensure PO exists
        existing_po = po_service.get_by_po_number(db, po_num)
        if not existing_po:
            po_service.create_po(db, PurchaseOrderCreate(
                po_number=po_num,
                vendor_name=vendor,
                total_amount=49560.0,
                subtotal=42000.0,
                tax=7560.0,
                items=[PurchaseOrderItemSchema(description="Developer Laptop Workstation 16GB", quantity=2.0, unit_price=21000.0, total_price=42000.0)]
            ))

        file_name = f"demo_case_1_safe_{uuid.uuid4().hex[:6]}.jpg"
        img_path = _create_sample_invoice_image(
            filename=file_name,
            vendor_name=vendor,
            invoice_number=f"INV-SAFE-{int(time.time()) % 10000}",
            po_number=po_num,
            total_amount=49560.0,
            line_item_desc="Developer Laptop Workstation 16GB",
            subtotal=42000.0,
            tax=7560.0
        )

        invoice = await invoice_service.process_new_invoice(
            db=db,
            file_path=img_path,
            original_filename=file_name,
            mime_type="image/jpeg"
        )
        return invoice

    elif case_id == 2:
        # Case 2: PO Variance Exception -> HUMAN_REVIEW (Invoice ₹82,500 vs PO ₹76,100 -> 8.4% variance > 5%)
        po_num = "PO-99410"
        vendor = "Apex Cloud Systems Ltd"

        existing_po = po_service.get_by_po_number(db, po_num)
        if not existing_po:
            po_service.create_po(db, PurchaseOrderCreate(
                po_number=po_num,
                vendor_name=vendor,
                total_amount=76100.0,
                subtotal=65000.0,
                tax=11100.0,
                items=[PurchaseOrderItemSchema(description="Enterprise Cloud Server Node - 64 Core", quantity=1.0, unit_price=65000.0, total_price=65000.0)]
            ))

        file_name = f"demo_case_2_variance_{uuid.uuid4().hex[:6]}.jpg"
        img_path = _create_sample_invoice_image(
            filename=file_name,
            vendor_name=vendor,
            invoice_number=f"INV-VAR-{int(time.time()) % 10000}",
            po_number=po_num,
            total_amount=82500.0,  # 8.4% higher than 76,100
            line_item_desc="Enterprise Cloud Server Node - 64 Core 256GB RAM",
            subtotal=70000.0,
            tax=12500.0
        )

        invoice = await invoice_service.process_new_invoice(
            db=db,
            file_path=img_path,
            original_filename=file_name,
            mime_type="image/jpeg"
        )
        return invoice

    elif case_id == 3:
        # Case 3: Duplicate Invoice -> BLOCK
        vendor = "ABC Technologies"
        dup_inv_num = "INV-20391"

        # Ensure an original invoice with this number exists in DB
        from app.models.invoice import Invoice as InvoiceModel
        existing_orig = db.query(InvoiceModel).filter(
            InvoiceModel.invoice_number == dup_inv_num,
            InvoiceModel.vendor_name == vendor
        ).first()

        if not existing_orig:
            orig_inv = InvoiceModel(
                id=f"inv_orig_{uuid.uuid4().hex[:6]}",
                invoice_number=dup_inv_num,
                vendor_name=vendor,
                po_number="PO-10293",
                total_amount=49560.0,
                subtotal=42000.0,
                tax_amount=7560.0,
                document_path="uploads/demo_case_1_safe.jpg",
                original_filename="invoice_archive_original.jpg",
                mime_type="image/jpeg",
                decision="AUTO_APPROVE",
                reviewer_status="APPROVED",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
            )
            db.add(orig_inv)
            db.commit()

        # Upload duplicate invoice attempting re-submission
        dup_file_name = f"demo_case_3_duplicate_{uuid.uuid4().hex[:6]}.jpg"
        dup_img_path = _create_sample_invoice_image(
            filename=dup_file_name,
            vendor_name=vendor,
            invoice_number=dup_inv_num,
            po_number="PO-10293",
            total_amount=49560.0,
            line_item_desc="Developer Laptop Workstation 16GB",
            subtotal=42000.0,
            tax=7560.0
        )

        invoice = await invoice_service.process_new_invoice(
            db=db,
            file_path=dup_img_path,
            original_filename=dup_file_name,
            mime_type="image/jpeg"
        )
        return invoice

    else:
        raise HTTPException(status_code=400, detail="Invalid case ID. Choose 1 (Safe), 2 (PO Variance), or 3 (Duplicate).")
