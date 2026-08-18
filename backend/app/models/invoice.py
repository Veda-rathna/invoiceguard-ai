import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, index=True)
    invoice_number = Column(String, index=True, nullable=True)
    po_number = Column(String, index=True, nullable=True)
    vendor_name = Column(String, index=True, nullable=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    
    document_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, default="application/pdf")
    document_type = Column(String, default="invoice")  # invoice, receipt, credit_note, unknown
    
    currency = Column(String, default="INR")
    subtotal = Column(Float, nullable=True)
    tax_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    invoice_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    payment_terms = Column(String, nullable=True)
    
    # AI Extraction Metadata
    extraction_confidence = Column(Float, default=0.0)
    field_confidence = Column(JSON, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    evidence_metadata = Column(JSON, nullable=True)
    
    # Analysis & Routing Outputs
    validation_status = Column(String, default="PENDING")  # PASS, EXCEPTION, FAILED
    validation_exceptions = Column(JSON, nullable=True)
    
    po_match_status = Column(String, default="NOT_EVALUATED")  # EXACT_MATCH, PARTIAL_MATCH, MISMATCH, PO_NOT_FOUND
    po_variance_percent = Column(Float, default=0.0)
    po_match_details = Column(JSON, nullable=True)
    
    policy_status = Column(String, default="PENDING")  # PASS, VIOLATION
    policy_results = Column(JSON, nullable=True)
    
    anomaly_status = Column(String, default="NONE")  # NONE, SUSPECTED_DUPLICATE, VENDOR_OUTLIER, NEW_VENDOR
    anomaly_results = Column(JSON, nullable=True)
    duplicate_probability = Column(Float, default=0.0)
    matched_duplicate_id = Column(String, nullable=True)
    
    # Final Risk & Decision
    risk_score = Column(Float, default=0.0)  # 0 to 100
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors = Column(JSON, nullable=True)
    
    decision = Column(String, default="PENDING")  # AUTO_APPROVE, HUMAN_REVIEW, BLOCK, PENDING
    decision_reason = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    
    # Reviewer HITL lifecycle
    reviewer_status = Column(String, default="UNASSIGNED")  # UNASSIGNED, IN_REVIEW, APPROVED, REJECTED, INFO_REQUESTED
    reviewer_user = Column(String, nullable=True)
    reviewer_decision = Column(String, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Telemetry
    processing_latency_ms = Column(Float, default=0.0)
    bedrock_latency_ms = Column(Float, default=0.0)
    tokens_used = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    audit_events = relationship("AuditEvent", back_populates="invoice", cascade="all, delete-orphan", order_by="AuditEvent.timestamp")
