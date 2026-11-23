from datetime import datetime, timezone
from decimal import Decimal
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Numeric, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class TransactionType(str, enum.Enum):
    CONSUMPTION = "consumption"
    PURCHASE = "purchase"
    ADJUSTMENT = "adjustment"
    WASTAGE = "wastage"

class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(String, primary_key=True, index=True)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    unit = Column(String, default="kg", nullable=False)  # kg, g, l, ml, pcs
    current_stock = Column(Numeric(10, 3), default=Decimal("0.000"), nullable=False)
    reorder_threshold = Column(Numeric(10, 3), default=Decimal("5.000"), nullable=False)
    cost_per_unit = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    supplier_name = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    restaurant = relationship("Restaurant", back_populates="ingredients")
    recipe_items = relationship("RecipeItem", back_populates="ingredient")
    transactions = relationship("StockTransaction", back_populates="ingredient", cascade="all, delete-orphan")

class RecipeItem(Base):
    __tablename__ = "recipe_items"
    
    id = Column(String, primary_key=True, index=True)
    menu_item_id = Column(String, ForeignKey("menu_items.id"), nullable=False, index=True)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False, index=True)
    quantity_required = Column(Numeric(10, 3), nullable=False)  # quantity of ingredient per 1 serving
    
    menu_item = relationship("MenuItem", back_populates="recipe_items")
    ingredient = relationship("Ingredient", back_populates="recipe_items")

class StockTransaction(Base):
    __tablename__ = "stock_transactions"
    
    id = Column(String, primary_key=True, index=True)
    restaurant_id = Column(String, ForeignKey("restaurants.id"), nullable=False, index=True)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False, index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    quantity = Column(Numeric(10, 3), nullable=False)  # negative for consumption, positive for purchase
    reference_id = Column(String, nullable=True)       # e.g., order_id or PO number
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    ingredient = relationship("Ingredient", back_populates="transactions")
