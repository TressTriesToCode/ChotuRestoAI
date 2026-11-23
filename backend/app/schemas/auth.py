from typing import Optional
from pydantic import BaseModel, EmailStr
from app.core.permissions import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    restaurant_id: str
    full_name: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    restaurant_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.CASHIER
    restaurant_id: str
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    restaurant_id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    phone: Optional[str] = None

    class Config:
        from_attributes = True
