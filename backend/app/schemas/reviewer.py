from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ReviewerActionRequest(BaseModel):
    action: str = Field(description="APPROVE, REJECT, REQUEST_INFO")
    reviewer_user: str = Field(default="Finance Manager")
    comment: Optional[str] = None
    override_reason: Optional[str] = None


class ReviewerActionResponse(BaseModel):
    invoice_id: str
    action: str
    status: str
    reviewer_user: str
    comment: Optional[str] = None
    timestamp: Any


class SimulationRequest(BaseModel):
    auto_approval_limit: Optional[float] = 50000.0
    po_required_above: Optional[float] = 10000.0
    maximum_po_variance_percent: Optional[float] = 5.0
    new_vendor_requires_review: Optional[bool] = True
    minimum_extraction_confidence: Optional[float] = 75.0
    duplicate_similarity_threshold: Optional[float] = 90.0


class SimulationMetrics(BaseModel):
    total_invoices: int
    auto_approved_count: int
    human_review_count: int
    blocked_count: int
    automation_rate: float
    avg_risk_score: float
    total_spend: float
    flagged_spend: float


class SimulationResult(BaseModel):
    baseline: SimulationMetrics
    proposed: SimulationMetrics
    difference: Dict[str, Any]
    impact_summary: str
