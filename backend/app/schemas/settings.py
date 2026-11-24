from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RestaurantSettingsResponse(BaseModel):
    id: str
    name: str
    code: str
    address: str
    city: str
    phone: str
    currency: str
    cgst_percent: Decimal
    sgst_percent: Decimal
    service_charge_percent: Decimal
    logo_url: Optional[str] = None
    tagline: Optional[str] = None
    gstin: Optional[str] = None
    fssai_number: Optional[str] = None
    business_hours: Optional[str] = None
    upi_vpa: Optional[str] = None
    auto_print_kot: bool = True
    invoice_prefix: str = "INV"
    timezone: str = "Asia/Kolkata"
    tax_effective_from: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RestaurantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    currency: Optional[str] = None
    cgst_percent: Optional[Decimal] = None
    sgst_percent: Optional[Decimal] = None
    service_charge_percent: Optional[Decimal] = None
    logo_url: Optional[str] = None
    tagline: Optional[str] = None
    gstin: Optional[str] = None
    fssai_number: Optional[str] = None
    business_hours: Optional[str] = None
    upi_vpa: Optional[str] = None
    auto_print_kot: Optional[bool] = None
    invoice_prefix: Optional[str] = None
    timezone: Optional[str] = None
