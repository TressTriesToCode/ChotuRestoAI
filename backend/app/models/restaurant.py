from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.database.session import Base

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False, default="Mumbai")
    phone = Column(String, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    
    # Configurable Taxes & Charges
    cgst_percent = Column(Numeric(5, 2), default=Decimal("2.50"), nullable=False)
    sgst_percent = Column(Numeric(5, 2), default=Decimal("2.50"), nullable=False)
    service_charge_percent = Column(Numeric(5, 2), default=Decimal("5.00"), nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    users = relationship("User", back_populates="restaurant", cascade="all, delete-orphan")
    tables = relationship("DiningTable", back_populates="restaurant", cascade="all, delete-orphan")
    categories = relationship("MenuCategory", back_populates="restaurant", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant", cascade="all, delete-orphan")
    ingredients = relationship("Ingredient", back_populates="restaurant", cascade="all, delete-orphan")
