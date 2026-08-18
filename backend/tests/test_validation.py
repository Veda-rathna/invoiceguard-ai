import pytest
from app.agents.validation_agent import validation_agent
from app.agents.state import InvoiceState


@pytest.mark.asyncio
async def test_validation_arithmetic_pass():
    state: InvoiceState = {
        "invoice_id": "test_1",
        "document_path": "",
        "original_filename": "inv.pdf",
        "mime_type": "application/pdf",
        "document_type": "invoice",
        "extracted_data": {
            "vendor_name": "Acme Corp",
            "invoice_number": "INV-101",
            "subtotal": 10000.0,
            "tax": 1800.0,
            "total": 11800.0,
            "line_items": [
                {"description": "Hardware Widget", "quantity": 10.0, "unit_price": 1000.0, "total": 10000.0}
            ]
        },
        "field_confidence": {},
        "extraction_confidence": 0.95,
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

    updated_state = await validation_agent(state)
    assert updated_state["validation_results"]["status"] == "PASS"
    assert updated_state["validation_results"]["exceptions_count"] == 0


@pytest.mark.asyncio
async def test_validation_arithmetic_mismatch():
    state: InvoiceState = {
        "invoice_id": "test_2",
        "document_path": "",
        "original_filename": "inv.pdf",
        "mime_type": "application/pdf",
        "document_type": "invoice",
        "extracted_data": {
            "vendor_name": "Acme Corp",
            "invoice_number": "INV-102",
            "subtotal": 10000.0,
            "tax": 1800.0,
            "total": 14000.0,  # Intentional discrepancy
            "line_items": []
        },
        "field_confidence": {},
        "extraction_confidence": 0.95,
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

    updated_state = await validation_agent(state)
    assert updated_state["validation_results"]["status"] == "EXCEPTION"
    assert updated_state["validation_results"]["exceptions"][0]["type"] == "TOTAL_MISMATCH"
