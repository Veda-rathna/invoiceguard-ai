from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.extraction import ExtractedInvoice, LineItem, FieldEvidence
from app.schemas.po_matching import POMatchResult
from app.schemas.policy import PolicyEvaluationResponse
from app.schemas.risk import RiskResult, RiskFactor


class AuditEventResponse(BaseModel):
    id: str
    invoice_id: str
    agent_name: str
    action: str
    status: str
    timestamp: Any
    latency_ms: float
    summary: str
    details: Optional[Dict[str, Any]] = None
    evidence: Optional[str] = None

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    po_number: Optional[str] = None
    vendor_name: Optional[str] = None
    document_type: str = "invoice"
    currency: str = "INR"
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None


class InvoiceResponse(InvoiceBase):
    id: str
    original_filename: str
    mime_type: str
    document_path: str
    created_at: Any
    
    # Intelligence & Scoring
    extraction_confidence: float
    validation_status: str
    po_match_status: str
    po_variance_percent: float
    policy_status: str
    anomaly_status: str
    duplicate_probability: float
    risk_score: float
    risk_level: str
    decision: str
    decision_reason: Optional[str] = None
    explanation: Optional[str] = None
    
    # Reviewer
    reviewer_status: str
    reviewer_user: Optional[str] = None
    reviewer_decision: Optional[str] = None
    reviewed_at: Optional[Any] = None

    class Config:
        from_attributes = True


class InvoiceDetailResponse(InvoiceResponse):
    field_confidence: Optional[Dict[str, float]] = None
    extracted_data: Optional[Dict[str, Any]] = None
    evidence_metadata: Optional[List[Dict[str, Any]]] = None
    validation_exceptions: Optional[List[Dict[str, Any]]] = None
    po_match_details: Optional[Dict[str, Any]] = None
    policy_results: Optional[List[Dict[str, Any]]] = None
    anomaly_results: Optional[Dict[str, Any]] = None
    risk_factors: Optional[List[Dict[str, Any]]] = None
    reviewer_notes: Optional[str] = None
    processing_latency_ms: float = 0.0
    bedrock_latency_ms: float = 0.0
    tokens_used: int = 0
    audit_events: List[AuditEventResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    items: List[InvoiceResponse]
    total: int
    page: int
    size: int
    total_pages: int
