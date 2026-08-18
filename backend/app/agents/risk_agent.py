from typing import Tuple, Dict, Any
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState
from app.services.risk_service import risk_service


class RiskAgent(BaseAgent):
    name = "RISK_ENGINE"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        val_res = state.get("validation_results", {})
        po_res = state.get("po_match_results", {})
        pol_res = state.get("policy_results", {})
        anom_res = state.get("anomaly_results", {})
        ext_conf = state.get("extraction_confidence", 1.0)
        field_conf = state.get("field_confidence", {})

        risk_res = risk_service.calculate_risk(
            validation_results=val_res,
            po_results=po_res,
            policy_results=pol_res,
            anomaly_results=anom_res,
            extraction_confidence=ext_conf,
            field_confidence=field_conf
        )

        state["risk_score"] = risk_res.risk_score
        state["risk_level"] = risk_res.risk_level
        state["risk_factors"] = [f.dict() for f in risk_res.risk_factors]

        if risk_res.risk_score <= 30.0:
            status = "SUCCESS"
        elif risk_res.risk_score <= 60.0:
            status = "INFO"
        elif risk_res.risk_score <= 80.0:
            status = "WARNING"
        else:
            status = "FAILED"

        audit_event = {
            "agent_name": self.name,
            "action": "RISK_CALCULATED",
            "status": status,
            "summary": f"Calculated composite risk score: {risk_res.risk_score:.1f}/100 ({risk_res.risk_level}) across {len(risk_res.risk_factors)} factor(s).",
            "details": {
                "risk_score": risk_res.risk_score,
                "risk_level": risk_res.risk_level,
                "factors_count": len(risk_res.risk_factors),
                "factors": [f.dict() for f in risk_res.risk_factors]
            },
            "evidence": "; ".join([f"{f.factor} (+{f.contribution:.0f}pts)" for f in risk_res.risk_factors]) if risk_res.risk_factors else "Zero risk anomalies flagged"
        }

        return state, audit_event


risk_agent = RiskAgent()
