from typing import List, Optional, Any
from pydantic import BaseModel, Field


class RiskFactor(BaseModel):
    factor: str
    category: str
    contribution: float
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    evidence: Optional[str] = None
    value: Optional[Any] = None


class RiskResult(BaseModel):
    risk_score: float = 0.0  # 0 to 100
    risk_level: str = "LOW"  # LOW (0-30), MEDIUM (31-60), HIGH (61-80), CRITICAL (81-100)
    risk_factors: List[RiskFactor] = Field(default_factory=list)
    confidence_penalty: float = 0.0
    summary: str = ""
