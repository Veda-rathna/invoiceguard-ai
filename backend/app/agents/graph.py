import time
import logging
from langgraph.graph import StateGraph, END
from app.agents.state import InvoiceState
from app.agents.document_agent import document_agent
from app.agents.validation_agent import validation_agent
from app.agents.po_matching_agent import po_matching_agent
from app.agents.policy_agent import policy_agent
from app.agents.anomaly_agent import anomaly_agent
from app.agents.risk_agent import risk_agent
from app.agents.decision_agent import decision_agent
from app.agents.explanation_agent import explanation_agent

logger = logging.getLogger("agent_orchestrator")


def build_invoice_graph():
    """
    Constructs the end-to-end multi-agent LangGraph workflow:
    START -> Document -> Validation -> PO Matching -> Policy -> Anomaly -> Risk -> Decision -> Explanation -> END
    """
    workflow = StateGraph(InvoiceState)

    # Register Nodes
    workflow.add_node("document_agent", document_agent)
    workflow.add_node("validation_agent", validation_agent)
    workflow.add_node("po_matching_agent", po_matching_agent)
    workflow.add_node("policy_agent", policy_agent)
    workflow.add_node("anomaly_agent", anomaly_agent)
    workflow.add_node("risk_agent", risk_agent)
    workflow.add_node("decision_agent", decision_agent)
    workflow.add_node("explanation_agent", explanation_agent)

    # Define Linear & Conditional Handoffs
    workflow.set_entry_point("document_agent")
    workflow.add_edge("document_agent", "validation_agent")
    workflow.add_edge("validation_agent", "po_matching_agent")
    workflow.add_edge("po_matching_agent", "policy_agent")
    workflow.add_edge("policy_agent", "anomaly_agent")
    workflow.add_edge("anomaly_agent", "risk_agent")
    workflow.add_edge("risk_agent", "decision_agent")
    workflow.add_edge("decision_agent", "explanation_agent")
    workflow.add_edge("explanation_agent", END)

    return workflow.compile()


invoice_orchestrator = build_invoice_graph()


async def run_invoice_orchestration(initial_state: InvoiceState) -> InvoiceState:
    """
    Runs the full compiled LangGraph workflow on an invoice state and returns final evaluated state.
    """
    start_time = time.time()
    final_state = await invoice_orchestrator.ainvoke(initial_state)
    total_latency_ms = (time.time() - start_time) * 1000.0
    final_state["processing_latency_ms"] = round(total_latency_ms, 2)
    return final_state
