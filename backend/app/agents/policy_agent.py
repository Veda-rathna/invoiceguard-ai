from typing import Tuple, Dict, Any
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState
from app.services.policy_service import policy_service
from app.db.session import SessionLocal
from app.models.vendor import Vendor


class PolicyAgent(BaseAgent):
    name = "POLICY_AGENT"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        extracted = state.get("extracted_data", {})
        po_results = state.get("po_match_results", {})
        vendor_name = extracted.get("vendor_name")
        ext_conf = state.get("extraction_confidence", 1.0)
        field_conf = state.get("field_confidence", {})

        db = SessionLocal()
        vendor_info = None
        try:
            if vendor_name:
                v = db.query(Vendor).filter(Vendor.name == vendor_name).first()
                if v:
                    vendor_info = {
                        "name": v.name,
                        "invoice_count": v.invoice_count,
                        "avg_amount": v.avg_invoice_amount,
                        "is_verified": v.is_verified,
                        "trust_score": v.trust_score
                    }
            
            policy_eval = policy_service.evaluate_policies(
                db=db,
                extracted_data=extracted,
                po_results=po_results,
                vendor_info=vendor_info,
                extraction_confidence=ext_conf,
                field_confidence=field_conf
            )
        finally:
            db.close()

        policy_results = policy_eval.dict()
        state["policy_results"] = policy_results

        has_violations = policy_eval.total_violations > 0
        status = "WARNING" if has_violations else "SUCCESS"
        summary = policy_eval.summary

        failed_policies = [p.policy for p in policy_eval.policy_results if p.status == "FAIL"]
        evidence = f"Policy checks completed. {policy_eval.total_violations} violation(s): {', '.join(failed_policies)}" if has_violations else "Evaluated 6 enterprise compliance rules. All passed."

        audit_event = {
            "agent_name": self.name,
            "action": "POLICY_EVALUATION",
            "status": status,
            "summary": summary,
            "details": policy_results,
            "evidence": evidence
        }

        return state, audit_event


policy_agent = PolicyAgent()
