from typing import Tuple, Dict, Any
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState


class DecisionAgent(BaseAgent):
    name = "DECISION_ENGINE"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        risk_score = state.get("risk_score", 0.0)
        anomaly_results = state.get("anomaly_results", {})
        dup_prob = anomaly_results.get("duplicate_probability", 0.0)
        ext_conf = state.get("extraction_confidence", 1.0)
        field_conf = state.get("field_confidence", {})
        total_conf = field_conf.get("total", ext_conf)
        policy_results = state.get("policy_results", {})
        violations_count = policy_results.get("total_violations", 0)
        val_status = state.get("validation_results", {}).get("status", "PASS")

        # Deterministic Routing Rules
        if dup_prob >= 90.0:
            decision = "BLOCK"
            reason = f"Automated block triggered: High confidence duplicate invoice detected ({dup_prob:.0f}% similarity)."
            audit_status = "FAILED"
        elif total_conf < 0.70 or ext_conf < 0.75:
            decision = "HUMAN_REVIEW"
            reason = f"Confidence-aware HITL escalation: Model confidence for financial fields ({total_conf*100:.1f}%) is below required threshold."
            audit_status = "WARNING"
        elif val_status == "EXCEPTION":
            decision = "HUMAN_REVIEW"
            reason = "Financial validation arithmetic error detected on document."
            audit_status = "WARNING"
        elif violations_count > 0:
            decision = "HUMAN_REVIEW"
            reason = f"Corporate expense policy violation detected ({violations_count} rule(s) breached)."
            audit_status = "WARNING"
        elif risk_score >= 61.0:
            decision = "HUMAN_REVIEW"
            reason = f"Elevated transaction risk score ({risk_score:.0f}/100) exceeds auto-approval limits."
            audit_status = "WARNING"
        elif risk_score <= 30.0:
            decision = "AUTO_APPROVE"
            reason = f"Transaction cleared all validation checks and policy rules with low risk ({risk_score:.0f}/100)."
            audit_status = "SUCCESS"
        else:
            decision = "HUMAN_REVIEW"
            reason = f"Moderate risk transaction ({risk_score:.0f}/100) routed to review queue for verification."
            audit_status = "INFO"

        state["decision"] = decision
        state["decision_reason"] = reason

        audit_event = {
            "agent_name": self.name,
            "action": "DECISION_ROUTED",
            "status": audit_status,
            "summary": f"Transaction routed to → {decision} ({reason})",
            "details": {
                "decision": decision,
                "reason": reason,
                "risk_score": risk_score,
                "violations_count": violations_count,
                "duplicate_probability": dup_prob
            },
            "evidence": f"Rule-based deterministic routing engine evaluated risk ({risk_score:.1f}) and policy status"
        }

        return state, audit_event


decision_agent = DecisionAgent()
