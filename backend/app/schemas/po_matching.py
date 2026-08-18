from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class POItemMatch(BaseModel):
    invoice_item: str
    po_item: Optional[str] = None
    invoice_qty: float
    po_qty: Optional[float] = None
    invoice_price: float
    po_price: Optional[float] = None
    semantic_match_score: float = 1.0
    matched: bool = True
    variance_reason: Optional[str] = None


class POMatchResult(BaseModel):
    po_number: Optional[str] = None
    found_po: bool = False
    vendor_match: bool = False
    po_match: bool = False
    item_match: bool = False
    quantity_match: bool = False
    price_match: bool = False
    total_match: bool = False
    
    invoice_total: float = 0.0
    po_total: float = 0.0
    variance_amount: float = 0.0
    variance_percentage: float = 0.0
    
    status: str = "NOT_EVALUATED"  # EXACT_MATCH, PARTIAL_MATCH, MISMATCH, PO_NOT_FOUND, PO_NOT_REQUIRED
    item_matches: List[POItemMatch] = Field(default_factory=list)
    summary: str = ""


class PurchaseOrderItemSchema(BaseModel):
    id: Optional[str] = None
    line_number: int = 1
    description: str
    quantity: float
    unit_price: float
    total_price: float
    category: Optional[str] = None


class PurchaseOrderCreate(BaseModel):
    po_number: str
    vendor_name: str
    total_amount: float
    subtotal: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    currency: str = "INR"
    department: str = "Finance"
    items: List[PurchaseOrderItemSchema] = Field(default_factory=list)


class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    vendor_name: str
    total_amount: float
    subtotal: float
    tax: float
    currency: str
    status: str
    department: str
    created_at: Any
    items: List[PurchaseOrderItemSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True
