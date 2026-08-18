from typing import Tuple, Dict, Any
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState
from app.agents.prompts import EXPLANATION_PROMPT
from app.services.llm_service import llm_service


class ExplanationAgent(BaseAgent):
    name = "EXPLANATION_AGENT"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        decision_context = {
            "invoice_id": state.get("invoice_id"),
            "vendor_name": state.get("extracted_data", {}).get("vendor_name"),
            "total_amount": state.get("extracted_data", {}).get("total"),
            "decision": state.get("decision"),
            "decision_reason": state.get("decision_reason"),
            "risk_score": state.get("risk_score"),
            "risk_factors": state.get("risk_factors", []),
            "po_match_results": state.get("po_match_results", {}),
            "policy_results": state.get("policy_results", {}),
            "anomaly_results": state.get("anomaly_results", {}),
            "field_confidence": state.get("field_confidence", {})
        }

        explanation_text, latency_ms = llm_service.invoke_explanation(
            system_prompt=EXPLANATION_PROMPT,
            decision_context=decision_context
        )

        state["explanation"] = explanation_text
        state["bedrock_latency_ms"] = state.get("bedrock_latency_ms", 0.0) + latency_ms

        audit_event = {
            "agent_name": self.name,
            "action": "EXPLANATION_GENERATED",
            "status": "SUCCESS",
            "summary": "Generated auditable human-readable decision explanation grounded strictly in verified audit facts.",
            "details": {
                "explanation": explanation_text,
                "latency_ms": latency_ms
            },
            "evidence": "Factual synthesis of PO variance, anomaly signals, and policy rules"
        }

        return state, audit_event


explanation_agent = ExplanationAgent()
