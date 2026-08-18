# Multi-Agent Workflow & LangGraph Orchestration

InvoiceGuard AI organizes financial operations into 8 distinct specialized agents coordinated via a compiled LangGraph `StateGraph`.

---

## 1. Agent Responsibilities & Handoffs

| Agent | Technology Layer | Primary Responsibility | Output State Keys |
|---|---|---|---|
| **1. Document Agent** | Amazon Bedrock (`qwen.qwen3-vl-235b-a22b`) | Multimodal visual understanding, field extraction, field-level confidence ratings, visual grounding notes | `extracted_data`, `field_confidence`, `evidence_metadata` |
| **2. Validation Agent** | Python Arithmetic Engine | Deterministic math checks (`subtotal + tax == total`), required field presence, positive amount checks | `validation_results` |
| **3. PO Matching Agent** | 3-Way ERP Reconciliation + LLM Semantic Matcher | Purchase order database lookup, price and quantity comparison, line-item semantic matching, variance calculation | `po_match_results` |
| **4. Policy Agent** | Dynamic Rule Evaluation Engine | Evaluates transaction against active corporate expense policies (approval ceiling, mandatory PO threshold, max variance %) | `policy_results` |
| **5. Anomaly Agent** | Statistical Outlier & Duplicate Engine | Exact invoice # collision check, vendor-amount-window similarity, historical mean spend deviation | `anomaly_results` |
| **6. Risk Engine** | Additive Calibrated 0–100 Model | Synthesizes all exceptions, penalties, and confidence deficits into a normalized risk score | `risk_score`, `risk_level`, `risk_factors` |
| **7. Decision Engine** | Deterministic Routing Logic | Routes transaction to `AUTO_APPROVE`, `HUMAN_REVIEW`, or `BLOCK` with explicit rationale | `decision`, `decision_reason` |
| **8. Explanation Agent** | Qwen3-VL / LLM Synthesis | Generates concise, auditable executive natural language summary grounded strictly in audit state | `explanation` |

---

## 2. LangGraph State Definition (`InvoiceState`)

```python
class InvoiceState(TypedDict):
    invoice_id: str
    document_path: str
    original_filename: str
    mime_type: str
    document_type: str
    
    extracted_data: Dict[str, Any]
    field_confidence: Dict[str, float]
    extraction_confidence: float
    evidence_metadata: List[Dict[str, Any]]
    
    validation_results: Dict[str, Any]
    po_match_results: Dict[str, Any]
    policy_results: Dict[str, Any]
    anomaly_results: Dict[str, Any]
    
    risk_score: float
    risk_level: str
    risk_factors: List[Dict[str, Any]]
    
    decision: str
    decision_reason: str
    explanation: str
    
    audit_events: List[Dict[str, Any]]
    processing_latency_ms: float
    bedrock_latency_ms: float
    tokens_used: int
    error: Optional[str]
```

---

## 3. Real-Time Audit Event Logging

Every agent records an immutable `AuditEvent` entry in the database with:
- `timestamp` (ISO-8601 UTC)
- `agent_name` (e.g. `PO_MATCHING_AGENT`)
- `status` (`SUCCESS`, `WARNING`, `FAILED`, `INFO`)
- `latency_ms`
- `summary` (Concise operational summary)
- `evidence` (Auditable visual or numeric citation)
