from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.kot import KOTStatus
from app.models.order import PlacedBy
from app.models.menu import DietaryType, StationType

class KOTItemResponse(BaseModel):
    id: str
    dish_id: str
    name: str
    quantity: int
    dietary: DietaryType
    station: StationType
    is_prepared: bool

    class Config:
        from_attributes = True

class KOTResponse(BaseModel):
    id: str
    order_id: str
    kot_number: int
    table_id: str
    status: KOTStatus
    placed_by: PlacedBy
    captain_notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    items: List[KOTItemResponse] = []

    class Config:
        from_attributes = True

class KOTItemCheck(BaseModel):
    is_prepared: bool
