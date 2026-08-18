import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, JSON
from app.db.session import Base


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(String, primary_key=True, index=True)
    rule_key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="General")  # Threshold, Matching, Vendor, Compliance
    
    threshold_value = Column(Float, nullable=True)
    bool_value = Column(Boolean, nullable=True)
    string_value = Column(String, nullable=True)
    unit = Column(String, nullable=True)  # %, currency, days, score
    
    is_active = Column(Boolean, default=True)
    severity_if_failed = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    risk_points = Column(Float, default=20.0)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
