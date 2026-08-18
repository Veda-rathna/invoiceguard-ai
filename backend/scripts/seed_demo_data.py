import os
import sys
import json
import uuid
import datetime

# Ensure python path includes backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, Base, engine
from app.models import Vendor, PurchaseOrder, PurchaseOrderItem, Invoice, AuditEvent, PolicyRule
from app.services.policy_service import policy_service

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/synthetic_ground_truth.json"))


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding policies...")
    policy_service.seed_default_rules(db)

    if not os.path.exists(DATA_FILE):
        print("Ground truth file missing. Generating first...")
        from generate_synthetic_data import generate_dataset
        generate_dataset()

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    print(f"Seeding {len(data['vendors'])} vendors...")
    for v in data["vendors"]:
        if not db.query(Vendor).filter(Vendor.name == v["name"]).first():
            vendor = Vendor(
                id=v["id"],
                name=v["name"],
                tax_id=v["tax_id"],
                category=v["category"],
                invoice_count=v["invoice_count"],
                avg_invoice_amount=v["avg_invoice_amount"],
                median_invoice_amount=v["median_invoice_amount"],
                trust_score=v["trust_score"],
                is_verified=v["is_verified"]
            )
            db.add(vendor)
    db.commit()

    print(f"Seeding {len(data['purchase_orders'])} purchase orders...")
    for po_data in data["purchase_orders"]:
        if not db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_data["po_number"]).first():
            po = PurchaseOrder(
                id=po_data["id"],
                po_number=po_data["po_number"],
                vendor_name=po_data["vendor_name"],
                subtotal=po_data["subtotal"],
                tax=po_data["tax"],
                total_amount=po_data["total_amount"],
                currency=po_data["currency"],
                department=po_data["department"],
                status="OPEN"
            )
            db.add(po)
            db.flush()

            for itm in po_data["items"]:
                poi = PurchaseOrderItem(
                    id=f"poi_{uuid.uuid4().hex[:8]}",
                    po_id=po.id,
                    description=itm["description"],
                    quantity=itm["quantity"],
                    unit_price=itm["unit_price"],
                    total_price=itm["total_price"],
                    category=itm.get("category", "General")
                )
                db.add(poi)
    db.commit()

    print(f"Seeding {len(data['invoices'])} invoices...")
    for inv_data in data["invoices"]:
        if not db.query(Invoice).filter(Invoice.id == inv_data["invoice_id"]).first():
            total_amt = inv_data["total"]
            expected_dec = inv_data["expected_decision"]
            expected_exc = inv_data.get("expected_exception")
            conf = inv_data["extraction_confidence"]

            risk_score = 12.0
            if expected_dec == "BLOCK":
                risk_score = 94.0
            elif expected_dec == "HUMAN_REVIEW":
                risk_score = 72.0 if expected_exc == "PO_VARIANCE" else 65.0

            invoice = Invoice(
                id=inv_data["invoice_id"],
                invoice_number=inv_data["invoice_number"],
                po_number=inv_data.get("po_number"),
                vendor_name=inv_data["vendor_name"],
                document_path="uploads/demo_placeholder.jpg",
                original_filename=f"{inv_data['invoice_number'].lower()}.pdf",
                mime_type="application/pdf",
                document_type="invoice",
                currency=inv_data["currency"],
                subtotal=inv_data["subtotal"],
                tax_amount=inv_data["tax"],
                total_amount=total_amt,
                invoice_date=datetime.date.fromisoformat(inv_data["invoice_date"]),
                extraction_confidence=conf,
                field_confidence={"vendor_name": conf, "total": conf, "invoice_number": conf},
                extracted_data=inv_data,
                validation_status="EXCEPTION" if expected_exc == "ARITHMETIC" else "PASS",
                po_match_status="MISMATCH" if expected_exc == "PO_VARIANCE" else ("PO_NOT_FOUND" if expected_exc == "MISSING_PO" else "EXACT_MATCH"),
                po_variance_percent=12.4 if expected_exc == "PO_VARIANCE" else 0.0,
                policy_status="VIOLATION" if expected_exc in ["AUTO_APPROVAL_LIMIT", "MISSING_PO"] else "PASS",
                anomaly_status="SUSPECTED_DUPLICATE" if expected_exc == "DUPLICATE" else "NONE",
                duplicate_probability=94.0 if expected_exc == "DUPLICATE" else 0.0,
                risk_score=risk_score,
                risk_level=inv_data["expected_risk_level"],
                decision=expected_dec,
                decision_reason=f"Evaluation rule matched: {expected_exc or 'Clean transaction'}",
                explanation=f"Evaluated with ground truth label {expected_dec}. {expected_exc or 'Passed all checks'}.",
                reviewer_status="UNASSIGNED",
                processing_latency_ms=380.0,
                bedrock_latency_ms=290.0,
                tokens_used=820,
                created_at=datetime.datetime.fromisoformat(inv_data["invoice_date"])
            )
            db.add(invoice)
            db.flush()

            # Add sample audit events
            ae = AuditEvent(
                id=f"aud_{uuid.uuid4().hex[:8]}",
                invoice_id=invoice.id,
                agent_name="DECISION_ENGINE",
                action="DECISION_ROUTED",
                status="SUCCESS" if expected_dec == "AUTO_APPROVE" else "WARNING",
                latency_ms=15.0,
                summary=f"Automated evaluation completed: {expected_dec}",
                evidence=f"Ground-truth benchmark validation"
            )
            db.add(ae)

    db.commit()
    print("Database seeding completed successfully!")
    db.close()


if __name__ == "__main__":
    seed_database()
