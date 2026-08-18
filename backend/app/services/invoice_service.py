import uuid
import datetime
import logging
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.invoice import Invoice
from app.models.audit import AuditEvent
from app.models.vendor import Vendor
from app.agents.graph import run_invoice_orchestration
from app.agents.state import InvoiceState

logger = logging.getLogger("invoice_service")


class InvoiceService:
    @staticmethod
    def get_by_id(db: Session, invoice_id: str) -> Optional[Invoice]:
        return db.query(Invoice).filter(Invoice.id == invoice_id).first()

    @staticmethod
    def list_invoices(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        decision: Optional[str] = None,
        risk_level: Optional[str] = None,
        vendor_name: Optional[str] = None
    ) -> Tuple[List[Invoice], int]:
        query = db.query(Invoice)
        
        if decision:
            query = query.filter(Invoice.decision == decision)
        if risk_level:
            query = query.filter(Invoice.risk_level == risk_level)
        if status:
            query = query.filter(Invoice.reviewer_status == status)
        if vendor_name:
            query = query.filter(Invoice.vendor_name.ilike(f"%{vendor_name}%"))

        total = query.count()
        items = query.order_by(desc(Invoice.created_at)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def list_review_queue(db: Session, skip: int = 0, limit: int = 50) -> Tuple[List[Invoice], int]:
        """
        Returns invoices requiring human review, prioritized with highest risk first.
        """
        query = db.query(Invoice).filter(
            (Invoice.decision == "HUMAN_REVIEW") | (Invoice.reviewer_status == "IN_REVIEW")
        )
        total = query.count()
        # Sort by risk_score desc, then created_at asc (oldest first)
        items = query.order_by(desc(Invoice.risk_score), Invoice.created_at.asc()).offset(skip).limit(limit).all()
        return items, total

    @classmethod
    async def process_new_invoice(
        cls,
        db: Session,
        file_path: str,
        original_filename: str,
        mime_type: str,
        custom_id: Optional[str] = None
    ) -> Invoice:
        invoice_id = custom_id or f"inv_{uuid.uuid4().hex[:10]}"
        
        # 1. Create Initial Invoice Record
        invoice = Invoice(
            id=invoice_id,
            original_filename=original_filename,
            document_path=file_path,
            mime_type=mime_type,
            document_type="invoice",
            validation_status="PROCESSING",
            decision="PROCESSING",
            reviewer_status="UNASSIGNED"
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        # 2. Construct LangGraph Initial State
        initial_state: InvoiceState = {
            "invoice_id": invoice_id,
            "document_path": file_path,
            "original_filename": original_filename,
            "mime_type": mime_type,
            "document_type": "invoice",
            "extracted_data": {},
            "field_confidence": {},
            "extraction_confidence": 0.0,
            "evidence_metadata": [],
            "validation_results": {},
            "po_match_results": {},
            "policy_results": {},
            "anomaly_results": {},
            "risk_score": 0.0,
            "risk_level": "LOW",
            "risk_factors": [],
            "decision": "PENDING",
            "decision_reason": "",
            "explanation": "",
            "audit_events": [],
            "processing_latency_ms": 0.0,
            "bedrock_latency_ms": 0.0,
            "tokens_used": 0,
            "error": None
        }

        # 3. Execute LangGraph Multi-Agent Orchestration
        logger.info(f"Triggering LangGraph multi-agent pipeline for invoice {invoice_id}...")
        final_state = await run_invoice_orchestration(initial_state)

        # 4. Save Final State & Results to Database
        extracted = final_state.get("extracted_data", {})
        po_results = final_state.get("po_match_results", {})
        
        invoice.invoice_number = extracted.get("invoice_number")
        invoice.po_number = extracted.get("po_number")
        invoice.vendor_name = extracted.get("vendor_name")
        invoice.document_type = final_state.get("document_type", "invoice")
        invoice.currency = extracted.get("currency", "INR")
        invoice.subtotal = extracted.get("subtotal")
        invoice.tax_amount = extracted.get("tax")
        invoice.total_amount = extracted.get("total")
        
        # Parse Dates
        if extracted.get("invoice_date"):
            try:
                invoice.invoice_date = datetime.datetime.fromisoformat(extracted.get("invoice_date"))
            except Exception:
                pass
        if extracted.get("due_date"):
            try:
                invoice.due_date = datetime.datetime.fromisoformat(extracted.get("due_date"))
            except Exception:
                pass

        invoice.extraction_confidence = final_state.get("extraction_confidence", 0.0)
        invoice.field_confidence = final_state.get("field_confidence", {})
        invoice.extracted_data = extracted
        invoice.evidence_metadata = final_state.get("evidence_metadata", [])
        
        invoice.validation_status = final_state.get("validation_results", {}).get("status", "PASS")
        invoice.validation_exceptions = final_state.get("validation_results", {}).get("exceptions", [])
        
        invoice.po_match_status = po_results.get("status", "NOT_EVALUATED")
        invoice.po_variance_percent = po_results.get("variance_percentage", 0.0)
        invoice.po_match_details = po_results
        
        invoice.policy_status = final_state.get("policy_results", {}).get("status", "PASS")
        invoice.policy_results = final_state.get("policy_results", {}).get("policy_results", [])
        
        invoice.anomaly_status = "SUSPECTED_DUPLICATE" if final_state.get("anomaly_results", {}).get("is_duplicate") else "NONE"
        invoice.anomaly_results = final_state.get("anomaly_results", {})
        invoice.duplicate_probability = final_state.get("anomaly_results", {}).get("duplicate_probability", 0.0)
        invoice.matched_duplicate_id = final_state.get("anomaly_results", {}).get("matched_invoice_id")
        
        invoice.risk_score = final_state.get("risk_score", 0.0)
        invoice.risk_level = final_state.get("risk_level", "LOW")
        invoice.risk_factors = final_state.get("risk_factors", [])
        
        invoice.decision = final_state.get("decision", "HUMAN_REVIEW")
        invoice.decision_reason = final_state.get("decision_reason")
        invoice.explanation = final_state.get("explanation")
        
        invoice.processing_latency_ms = final_state.get("processing_latency_ms", 0.0)
        invoice.bedrock_latency_ms = final_state.get("bedrock_latency_ms", 0.0)
        invoice.tokens_used = final_state.get("tokens_used", 0)

        # 5. Persist Chronological Audit Events
        for ev in final_state.get("audit_events", []):
            audit_id = f"aud_{uuid.uuid4().hex[:10]}"
            audit_event = AuditEvent(
                id=audit_id,
                invoice_id=invoice_id,
                agent_name=ev.get("agent_name", "SYSTEM"),
                action=ev.get("action", "PROCESS"),
                status=ev.get("status", "SUCCESS"),
                latency_ms=ev.get("latency_ms", 0.0),
                summary=ev.get("summary", ""),
                details=ev.get("details"),
                evidence=ev.get("evidence")
            )
            db.add(audit_event)

        # 6. Update Vendor Baseline Stats
        if invoice.vendor_name and invoice.total_amount and invoice.decision == "AUTO_APPROVE":
            cls._update_vendor_baseline(db, invoice.vendor_name, invoice.total_amount)

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def _update_vendor_baseline(db: Session, vendor_name: str, new_amount: float):
        vendor = db.query(Vendor).filter(Vendor.name == vendor_name).first()
        if not vendor:
            vendor = Vendor(
                id=f"ven_{uuid.uuid4().hex[:8]}",
                name=vendor_name,
                invoice_count=1,
                avg_invoice_amount=new_amount,
                median_invoice_amount=new_amount,
                min_invoice_amount=new_amount,
                max_invoice_amount=new_amount
            )
            db.add(vendor)
        else:
            old_count = vendor.invoice_count
            new_count = old_count + 1
            new_avg = ((vendor.avg_invoice_amount * old_count) + new_amount) / new_count
            vendor.invoice_count = new_count
            vendor.avg_invoice_amount = round(new_avg, 2)
            vendor.max_invoice_amount = max(vendor.max_invoice_amount or 0.0, new_amount)
            vendor.min_invoice_amount = min(vendor.min_invoice_amount or new_amount, new_amount)
        db.commit()

    @staticmethod
    def apply_reviewer_action(
        db: Session,
        invoice_id: str,
        action: str,
        reviewer_user: str,
        comment: Optional[str] = None
    ) -> Optional[Invoice]:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return None

        now = datetime.datetime.utcnow()
        invoice.reviewer_status = action  # APPROVED, REJECTED, INFO_REQUESTED
        invoice.reviewer_decision = action
        invoice.reviewer_user = reviewer_user
        invoice.reviewer_notes = comment
        invoice.reviewed_at = now

        # Add Audit Event
        audit_id = f"aud_{uuid.uuid4().hex[:10]}"
        action_title = f"HUMAN_{action.upper()}"
        summary = f"Human reviewer ({reviewer_user}) marked invoice as {action}."
        if comment:
            summary += f" Notes: '{comment}'"

        audit_event = AuditEvent(
            id=audit_id,
            invoice_id=invoice_id,
            agent_name="HUMAN_REVIEWER",
            action=action_title,
            status="SUCCESS" if action == "APPROVED" else "WARNING",
            summary=summary,
            details={"reviewer": reviewer_user, "action": action, "notes": comment},
            evidence="Authorized financial reviewer override via HITL interface"
        )
        db.add(audit_event)
        db.commit()
        db.refresh(invoice)
        return invoice


invoice_service = InvoiceService()
