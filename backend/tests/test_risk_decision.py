import pytest
from app.agents.risk_agent import risk_agent
from app.agents.decision_agent import decision_agent
from app.agents.state import InvoiceState


@pytest.mark.asyncio
async def test_safe_invoice_routing():
    state: InvoiceState = {
        "invoice_id": "test_safe",
        "document_path": "",
        "original_filename": "inv.pdf",
        "mime_type": "application/pdf",
        "document_type": "invoice",
        "extracted_data": {"vendor_name": "ABC Tech", "total": 25000.0},
        "field_confidence": {"total": 0.98},
        "extraction_confidence": 0.98,
        "evidence_metadata": [],
        "validation_results": {"status": "PASS"},
        "po_match_results": {"status": "EXACT_MATCH", "found_po": True, "variance_percentage": 0.0},
        "policy_results": {"status": "PASS", "total_violations": 0, "policy_results": []},
        "anomaly_results": {"is_duplicate": False, "duplicate_probability": 0.0},
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

    state = await risk_agent(state)
    assert state["risk_score"] <= 30.0
    assert state["risk_level"] == "LOW"

    state = await decision_agent(state)
    assert state["decision"] == "AUTO_APPROVE"


@pytest.mark.asyncio
async def test_duplicate_block_routing():
    state: InvoiceState = {
        "invoice_id": "test_dup",
        "document_path": "",
        "original_filename": "inv.pdf",
        "mime_type": "application/pdf",
        "document_type": "invoice",
        "extracted_data": {"vendor_name": "ABC Tech", "total": 49560.0},
        "field_confidence": {"total": 0.95},
        "extraction_confidence": 0.95,
        "evidence_metadata": [],
        "validation_results": {"status": "PASS"},
        "po_match_results": {"status": "EXACT_MATCH", "found_po": True},
        "policy_results": {"status": "PASS", "total_violations": 0, "policy_results": []},
        "anomaly_results": {"is_duplicate": True, "duplicate_probability": 94.0, "matched_invoice_id": "INV-ORIG"},
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

    state = await risk_agent(state)
    state = await decision_agent(state)
    assert state["decision"] == "BLOCK"


@pytest.mark.asyncio
async def test_confidence_aware_hitl_escalation():
    # Low extraction confidence on total amount should trigger HUMAN_REVIEW even if everything else passes
    state: InvoiceState = {
        "invoice_id": "test_low_conf",
        "document_path": "",
        "original_filename": "blurry.pdf",
        "mime_type": "application/pdf",
        "document_type": "invoice",
        "extracted_data": {"vendor_name": "ABC Tech", "total": 12000.0},
        "field_confidence": {"total": 0.55},  # Low confidence
        "extraction_confidence": 0.60,
        "evidence_metadata": [],
        "validation_results": {"status": "PASS"},
        "po_match_results": {"status": "EXACT_MATCH", "found_po": True},
        "policy_results": {"status": "PASS", "total_violations": 0, "policy_results": []},
        "anomaly_results": {"is_duplicate": False, "duplicate_probability": 0.0},
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

    state = await risk_agent(state)
    state = await decision_agent(state)
    assert state["decision"] == "HUMAN_REVIEW"
    assert "Confidence-aware HITL" in state["decision_reason"]
