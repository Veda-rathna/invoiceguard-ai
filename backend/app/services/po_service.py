import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.schemas.po_matching import PurchaseOrderCreate


class POService:
    @staticmethod
    def get_by_po_number(db: Session, po_number: str) -> Optional[PurchaseOrder]:
        if not po_number:
            return None
        clean_num = po_number.strip().upper()
        return db.query(PurchaseOrder).filter(PurchaseOrder.po_number == clean_num).first()

    @staticmethod
    def list_all(db: Session, limit: int = 100) -> List[PurchaseOrder]:
        return db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(limit).all()

    @staticmethod
    def create_po(db: Session, po_in: PurchaseOrderCreate) -> PurchaseOrder:
        po_id = f"po_{uuid.uuid4().hex[:10]}"
        po = PurchaseOrder(
            id=po_id,
            po_number=po_in.po_number.strip().upper(),
            vendor_name=po_in.vendor_name,
            total_amount=po_in.total_amount,
            subtotal=po_in.subtotal or (po_in.total_amount * 0.85),
            tax=po_in.tax or (po_in.total_amount * 0.15),
            currency=po_in.currency,
            department=po_in.department,
            status="OPEN"
        )
        db.add(po)
        db.flush()

        for idx, item in enumerate(po_in.items, start=1):
            item_id = f"poi_{uuid.uuid4().hex[:10]}"
            po_item = PurchaseOrderItem(
                id=item_id,
                po_id=po.id,
                line_number=idx,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price or (item.quantity * item.unit_price),
                category=item.category or "General"
            )
            db.add(po_item)

        db.commit()
        db.refresh(po)
        return po


po_service = POService()
