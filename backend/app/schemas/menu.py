from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel
from app.models.table import TableStatus
from app.models.menu import DietaryType, StationType

class TableResponse(BaseModel):
    id: str
    restaurant_id: str
    label: str
    capacity: int
    status: TableStatus
    qr_token: str
    current_order_id: Optional[str] = None
    captain_name: Optional[str] = None
    current_bill: Decimal
    opened_at: Optional[str] = None

    class Config:
        from_attributes = True

class TableStatusUpdate(BaseModel):
    status: TableStatus
    captain_name: Optional[str] = None

class TableTransferRequest(BaseModel):
    target_table_id: str

class MenuItemResponse(BaseModel):
    id: str
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    dietary: DietaryType
    station: StationType
    spice_level: int
    is_bestseller: bool
    is_in_stock: bool
    is_active: bool

    class Config:
        from_attributes = True

class MenuCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    display_order: int
    items: List[MenuItemResponse] = []

    class Config:
        from_attributes = True

class StockStatusUpdate(BaseModel):
    is_in_stock: bool

class MenuItemUpdate(BaseModel):
    is_in_stock: Optional[bool] = None
    price: Optional[Decimal] = None
