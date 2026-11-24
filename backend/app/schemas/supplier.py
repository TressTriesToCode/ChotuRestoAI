from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.supplier import PurchaseOrderStatus

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None

class SupplierResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderItemCreate(BaseModel):
    ingredient_id: str
    quantity: Decimal
    unit_cost: Decimal

class PurchaseOrderItemResponse(BaseModel):
    id: str
    ingredient_id: str
    quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal

    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(BaseModel):
    id: str
    restaurant_id: str
    supplier_id: str
    po_number: str
    status: PurchaseOrderStatus
    total_amount: Decimal
    invoice_ref: Optional[str] = None
    notes: Optional[str] = None
    issued_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    created_at: datetime
    items: List[PurchaseOrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ReceivePORequest(BaseModel):
    invoice_ref: str
    notes: Optional[str] = None
