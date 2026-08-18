from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LineItem(BaseModel):
    description: str = Field(description="Description of line item or service")
    quantity: float = Field(default=1.0, description="Quantity of item")
    unit_price: float = Field(default=0.0, description="Unit price per item")
    total: float = Field(default=0.0, description="Total amount for this line item")
    confidence: float = Field(default=1.0, description="Confidence score from 0.0 to 1.0")


class FieldEvidence(BaseModel):
    field: str
    value: Any
    confidence: float
    evidence: str


class ExtractedInvoice(BaseModel):
    document_type: str = Field(default="invoice", description="invoice, receipt, credit_note, or other")
    vendor_name: Optional[str] = Field(default=None, description="Name of the billing vendor/merchant")
    vendor_address: Optional[str] = Field(default=None, description="Address or contact details of vendor")
    tax_id: Optional[str] = Field(default=None, description="Vendor GSTIN / VAT / EIN / Tax ID")
    
    invoice_number: Optional[str] = Field(default=None, description="Unique invoice or bill number")
    invoice_date: Optional[str] = Field(default=None, description="Invoice issue date in YYYY-MM-DD format")
    due_date: Optional[str] = Field(default=None, description="Payment due date in YYYY-MM-DD format")
    currency: Optional[str] = Field(default="INR", description="Currency code (e.g. INR, USD, EUR)")
    po_number: Optional[str] = Field(default=None, description="Referenced Purchase Order number")
    
    subtotal: Optional[float] = Field(default=None, description="Net amount before tax")
    tax: Optional[float] = Field(default=None, description="Total tax amount (GST/VAT)")
    total: Optional[float] = Field(default=None, description="Gross total invoice amount payable")
    payment_terms: Optional[str] = Field(default=None, description="Payment terms (e.g. Net 30, Due on Receipt)")
    
    line_items: List[LineItem] = Field(default_factory=list, description="Extracted line items")
    extraction_confidence: float = Field(default=0.9, description="Overall extraction confidence score (0-1.0)")
    field_confidence: Dict[str, float] = Field(default_factory=dict, description="Field-level confidence scores")
    evidence_metadata: List[FieldEvidence] = Field(default_factory=list, description="Visual grounding evidence metadata")
