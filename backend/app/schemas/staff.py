from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.core.permissions import UserRole

class StaffCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: UserRole
    phone: Optional[str] = None

class StaffResponse(BaseModel):
    id: str
    restaurant_id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StaffStatusUpdate(BaseModel):
    is_active: bool

class WaiterAssignmentRequest(BaseModel):
    waiter_id: Optional[str] = None
