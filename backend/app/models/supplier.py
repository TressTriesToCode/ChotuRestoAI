from datetime import datetime, timezone
from decimal import Decimal
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base

class PurchaseOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String(36), primary_key=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False, index=True)
    contact_person = Column(String(128), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    gst_number = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    restaurant = relationship("Restaurant", backref="suppliers")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(String(36), primary_key=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    po_number = Column(String(64), nullable=False, index=True)
    status = Column(SQLEnum(PurchaseOrderStatus), default=PurchaseOrderStatus.DRAFT, nullable=False)
    total_amount = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    invoice_ref = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    
    issued_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "po_number", name="uq_po_restaurant_number"),
    )

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    id = Column(String(36), primary_key=True, index=True)
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(String(36), ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Numeric(10, 3), nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)
    total_cost = Column(Numeric(10, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    ingredient = relationship("Ingredient")
