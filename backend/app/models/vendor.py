import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON
from app.db.session import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    tax_id = Column(String, nullable=True)
    category = Column(String, default="General")
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Statistical baseline for anomaly detection
    invoice_count = Column(Integer, default=0)
    avg_invoice_amount = Column(Float, default=0.0)
    median_invoice_amount = Column(Float, default=0.0)
    min_invoice_amount = Column(Float, default=0.0)
    max_invoice_amount = Column(Float, default=0.0)
    std_dev_amount = Column(Float, default=0.0)
    typical_frequency_days = Column(Float, default=30.0)
    
    trust_score = Column(Float, default=95.0)  # 0 to 100
    metadata_json = Column(JSON, nullable=True)
