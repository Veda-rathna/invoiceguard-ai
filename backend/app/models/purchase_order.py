import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True, nullable=False)
    vendor_name = Column(String, index=True, nullable=False)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    
    issue_date = Column(DateTime, default=datetime.datetime.utcnow)
    currency = Column(String, default="INR")
    
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    status = Column(String, default="OPEN")  # OPEN, FULFILLED, PARTIALLY_FULFILLED, CANCELLED
    department = Column(String, default="Operations")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan", lazy="joined")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(String, primary_key=True, index=True)
    po_id = Column(String, ForeignKey("purchase_orders.id"), nullable=False)
    line_number = Column(Integer, default=1)
    description = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    category = Column(String, nullable=True)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
