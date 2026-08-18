import logging
import uuid
from app.db.session import engine, Base, SessionLocal
from app.models import Vendor, PurchaseOrder, PurchaseOrderItem, PolicyRule, Invoice, AuditEvent
from app.services.policy_service import policy_service

logger = logging.getLogger("init_db")


def init_db():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed Policies
        policy_service.seed_default_rules(db)

        # Seed Baseline Vendors
        vendors_data = [
            {"name": "ABC Technologies", "tax_id": "06AAACT0092N1ZG", "category": "Hardware & IT", "invoice_count": 37, "avg_invoice_amount": 28500.0, "median_invoice_amount": 26000.0, "trust_score": 98.0},
            {"name": "Apex Cloud Systems Ltd", "tax_id": "29AABCU9603R1ZM", "category": "Cloud Infrastructure", "invoice_count": 14, "avg_invoice_amount": 72000.0, "median_invoice_amount": 70000.0, "trust_score": 92.0},
            {"name": "Infoserve Consulting", "tax_id": "33AABCI4821P1ZT", "category": "Professional Services", "invoice_count": 22, "avg_invoice_amount": 45000.0, "median_invoice_amount": 42000.0, "trust_score": 95.0},
            {"name": "Global Office Supplies", "tax_id": "27AABCG1234F1ZQ", "category": "Office Supplies", "invoice_count": 8, "avg_invoice_amount": 8500.0, "median_invoice_amount": 7900.0, "trust_score": 90.0},
            {"name": "Quantum Software Solutions", "tax_id": "19AABCQ5678M1ZU", "category": "Software Subscriptions", "invoice_count": 19, "avg_invoice_amount": 34000.0, "median_invoice_amount": 32000.0, "trust_score": 96.0}
        ]

        for vd in vendors_data:
            existing = db.query(Vendor).filter(Vendor.name == vd["name"]).first()
            if not existing:
                vendor = Vendor(
                    id=f"ven_{uuid.uuid4().hex[:8]}",
                    name=vd["name"],
                    tax_id=vd["tax_id"],
                    category=vd["category"],
                    invoice_count=vd["invoice_count"],
                    avg_invoice_amount=vd["avg_invoice_amount"],
                    median_invoice_amount=vd["median_invoice_amount"],
                    min_invoice_amount=vd["avg_invoice_amount"] * 0.4,
                    max_invoice_amount=vd["avg_invoice_amount"] * 2.1,
                    trust_score=vd["trust_score"],
                    is_verified=True
                )
                db.add(vendor)

        # Seed Baseline Purchase Orders
        po_data = [
            {
                "po_number": "PO-10293",
                "vendor_name": "ABC Technologies",
                "total_amount": 49560.0,
                "subtotal": 42000.0,
                "tax": 7560.0,
                "currency": "INR",
                "department": "Engineering",
                "items": [
                    {"description": "Developer Laptop Workstation 16GB", "quantity": 2.0, "unit_price": 21000.0, "total_price": 42000.0}
                ]
            },
            {
                "po_number": "PO-99410",
                "vendor_name": "Apex Cloud Systems Ltd",
                "total_amount": 76100.0,
                "subtotal": 65000.0,
                "tax": 11100.0,
                "currency": "INR",
                "department": "Infrastructure",
                "items": [
                    {"description": "Enterprise Cloud Server Node - 64 Core", "quantity": 1.0, "unit_price": 65000.0, "total_price": 65000.0}
                ]
            },
            {
                "po_number": "PO-44021",
                "vendor_name": "Infoserve Consulting",
                "total_amount": 53100.0,
                "subtotal": 45000.0,
                "tax": 8100.0,
                "currency": "INR",
                "department": "Finance",
                "items": [
                    {"description": "Quarterly Financial Audit and Compliance Review", "quantity": 1.0, "unit_price": 45000.0, "total_price": 45000.0}
                ]
            }
        ]

        for pod in po_data:
            existing_po = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == pod["po_number"]).first()
            if not existing_po:
                po_id = f"po_{uuid.uuid4().hex[:8]}"
                po = PurchaseOrder(
                    id=po_id,
                    po_number=pod["po_number"],
                    vendor_name=pod["vendor_name"],
                    total_amount=pod["total_amount"],
                    subtotal=pod["subtotal"],
                    tax=pod["tax"],
                    currency=pod["currency"],
                    department=pod["department"],
                    status="OPEN"
                )
                db.add(po)
                db.flush()

                for idx, itm in enumerate(pod["items"], start=1):
                    item_id = f"poi_{uuid.uuid4().hex[:8]}"
                    po_item = PurchaseOrderItem(
                        id=item_id,
                        po_id=po.id,
                        line_number=idx,
                        description=itm["description"],
                        quantity=itm["quantity"],
                        unit_price=itm["unit_price"],
                        total_price=itm["total_price"]
                    )
                    db.add(po_item)

        db.commit()
        logger.info("Database initialized and seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
