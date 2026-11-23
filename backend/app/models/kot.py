from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.menu import DietaryType, StationType
from app.models.order import PlacedBy

class KOTStatus(str, enum.Enum):
    COOKING = "cooking"
    READY = "ready"
    BUMPED = "bumped"

class KOT(Base):
    __tablename__ = "kots"
    
    id = Column(String, primary_key=True, index=True)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False, index=True)
    kot_number = Column(Integer, nullable=False, index=True)
    table_id = Column(String, nullable=False, index=True)
    status = Column(SQLEnum(KOTStatus), default=KOTStatus.COOKING, nullable=False)
    placed_by = Column(SQLEnum(PlacedBy), default=PlacedBy.POS, nullable=False)
    captain_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="kots")
    items = relationship("KOTItem", back_populates="kot", cascade="all, delete-orphan")

class KOTItem(Base):
    __tablename__ = "kot_items"
    
    id = Column(String, primary_key=True, index=True)
    kot_id = Column(String, ForeignKey("kots.id"), nullable=False, index=True)
    dish_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    dietary = Column(SQLEnum(DietaryType), default=DietaryType.VEG, nullable=False)
    station = Column(SQLEnum(StationType), default=StationType.CURRY, nullable=False)
    is_prepared = Column(Boolean, default=False, nullable=False)

    kot = relationship("KOT", back_populates="items")
