from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class LineItem(BaseModel):
    """Represents a single line item in an invoice"""
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    amount: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None

class InvoiceMetadata(BaseModel):
    """Represents the metadata/header information of an invoice"""
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_tax_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    po_number: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = None
    total_amount: Optional[float] = None
    payment_terms: Optional[str] = None

class InvoiceData(BaseModel):
    """Complete invoice structure"""
    metadata: InvoiceMetadata
    line_items: List[LineItem] = Field(default_factory=list)

class Vendor(BaseModel):
    """Vendor master data"""
    vendor_id: str
    name: str
    normalized_name: str  # For search matching
    address: Optional[str] = None
    tax_id: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: str