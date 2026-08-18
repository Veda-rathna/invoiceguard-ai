import datetime
from typing import Tuple, Dict, Any
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState
from app.services.anomaly_service import anomaly_service
from app.db.session import SessionLocal


class AnomalyAgent(BaseAgent):
    name = "ANOMALY_AGENT"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        extracted = state.get("extracted_data", {})
        invoice_id = state["invoice_id"]
        vendor_name = extracted.get("vendor_name")
        invoice_number = extracted.get("invoice_number")
        total_amount = float(extracted.get("total") or 0.0)
        
        inv_date_str = extracted.get("invoice_date")
        inv_date = None
        if inv_date_str:
            try:
                inv_date = datetime.datetime.fromisoformat(inv_date_str)
            except Exception:
                pass

        db = SessionLocal()
        try:
            anomaly_res = anomaly_service.check_anomalies(
                db=db,
                current_invoice_id=invoice_id,
                vendor_name=vendor_name,
                invoice_number=invoice_number,
                total_amount=total_amount,
                invoice_date=inv_date
            )
        finally:
            db.close()

        state["anomaly_results"] = anomaly_res

        is_dup = anomaly_res.get("is_duplicate", False)
        dup_prob = anomaly_res.get("duplicate_probability", 0.0)
        matched_id = anomaly_res.get("matched_invoice_id")
        has_warnings = len(anomaly_res.get("anomaly_warnings", [])) > 0

        if is_dup:
            summary = f"Potential duplicate invoice flagged ({dup_prob:.0f}% confidence) matching record #{matched_id}."
            status = "FAILED"
            evidence = "; ".join(anomaly_res.get("duplicate_reasons", []))
        elif has_warnings:
            summary = "; ".join(anomaly_res.get("anomaly_warnings", []))
            status = "WARNING"
            evidence = f"Deviation detected: {anomaly_res.get('vendor_deviation_percent', 0):+.1f}% vs baseline"
        else:
            summary = "No duplicate invoices or vendor statistical anomalies detected."
            status = "SUCCESS"
            evidence = "Compared against historical invoice database and vendor baseline profiles"

        audit_event = {
            "agent_name": self.name,
            "action": "ANOMALY_DETECTION",
            "status": status,
            "summary": summary,
            "details": anomaly_res,
            "evidence": evidence
        }

        return state, audit_event


anomaly_agent = AnomalyAgent()
