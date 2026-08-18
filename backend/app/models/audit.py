import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), index=True, nullable=False)
    
    agent_name = Column(String, index=True, nullable=False)  # DOCUMENT_AGENT, VALIDATION_AGENT, PO_AGENT, POLICY_AGENT, ANOMALY_AGENT, RISK_ENGINE, DECISION_ENGINE, EXPLANATION_AGENT, HUMAN_REVIEWER
    action = Column(String, nullable=False)
    status = Column(String, default="SUCCESS")  # SUCCESS, EXCEPTION, WARNING, FAILED, INFO
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    latency_ms = Column(Float, default=0.0)
    
    summary = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    evidence = Column(Text, nullable=True)
    
    invoice = relationship("Invoice", back_populates="audit_events")
