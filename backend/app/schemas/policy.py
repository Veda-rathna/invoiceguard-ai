from typing import List, Optional, Any
from pydantic import BaseModel, Field


class PolicyCheckResult(BaseModel):
    policy: str
    rule_name: str
    status: str  # PASS, FAIL, WARNING, SKIPPED
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    risk_contribution: float = 0.0
    evidence: str = ""
    actual_value: Any = None
    threshold_value: Any = None


class PolicyEvaluationResponse(BaseModel):
    status: str  # PASS, VIOLATION
    total_violations: int = 0
    policy_results: List[PolicyCheckResult] = Field(default_factory=list)
    summary: str = ""


class PolicyRuleSchema(BaseModel):
    id: str
    rule_key: str
    name: str
    description: Optional[str] = None
    category: str = "General"
    threshold_value: Optional[float] = None
    bool_value: Optional[bool] = None
    string_value: Optional[str] = None
    unit: Optional[str] = None
    is_active: bool = True
    severity_if_failed: str = "MEDIUM"
    risk_points: float = 20.0
    updated_at: Optional[Any] = None

    class Config:
        from_attributes = True


class PolicyRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    threshold_value: Optional[float] = None
    bool_value: Optional[bool] = None
    string_value: Optional[str] = None
    unit: Optional[str] = None
    is_active: Optional[bool] = None
    severity_if_failed: Optional[str] = None
    risk_points: Optional[float] = None
