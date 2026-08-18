from typing import TypedDict, Optional, Dict, Any, List


class InvoiceState(TypedDict):
    invoice_id: str
    document_path: str
    original_filename: str
    mime_type: str
    document_type: str
    
    # Document Intelligence Output
    extracted_data: Dict[str, Any]
    field_confidence: Dict[str, float]
    extraction_confidence: float
    evidence_metadata: List[Dict[str, Any]]
    
    # Validation Agent Output
    validation_results: Dict[str, Any]
    
    # PO Matching Agent Output
    po_match_results: Dict[str, Any]
    
    # Policy Agent Output
    policy_results: Dict[str, Any]
    
    # Anomaly Agent Output
    anomaly_results: Dict[str, Any]
    
    # Risk Engine Output
    risk_score: float
    risk_level: str
    risk_factors: List[Dict[str, Any]]
    
    # Decision Engine Output
    decision: str  # AUTO_APPROVE, HUMAN_REVIEW, BLOCK
    decision_reason: str
    
    # Explanation Agent Output
    explanation: str
    
    # Execution Telemetry and Audit Timeline
    audit_events: List[Dict[str, Any]]
    processing_latency_ms: float
    bedrock_latency_ms: float
    tokens_used: int
    error: Optional[str]
