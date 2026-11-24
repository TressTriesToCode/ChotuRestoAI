from datetime import datetime, timezone
from decimal import Decimal
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base

class LoyaltyTxType(str, enum.Enum):
    EARN = "earn"
    REDEEM = "redeem"
    EXPIRE = "expire"
    ADJUSTMENT = "adjustment"

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String(36), primary_key=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    phone = Column(String(20), nullable=False, index=True)  # E.164 normalized, e.g. +919820012345
    email = Column(String(128), nullable=True)
    total_orders = Column(Integer, default=0, nullable=False)
    total_spend = Column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    loyalty_points_balance = Column(Integer, default=0, nullable=False)
    marketing_consent = Column(Boolean, default=True, nullable=False)
    tags = Column(String(255), nullable=True)  # Comma-separated or JSON string
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    restaurant = relationship("Restaurant", backref="customers")
    orders = relationship("Order", back_populates="customer")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="customer", cascade="all, delete-orphan")
    feedbacks = relationship("CustomerFeedback", back_populates="customer", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("restaurant_id", "phone", name="uq_customer_restaurant_phone"),
    )

class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"
    
    id = Column(String(36), primary_key=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    transaction_type = Column(SQLEnum(LoyaltyTxType), nullable=False)
    points = Column(Integer, nullable=False)  # positive for earn/adjustment, negative for redeem/expire
    balance_after = Column(Integer, nullable=False)
    reference_order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="loyalty_transactions")
    order = relationship("Order")

class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"
    
    id = Column(String(36), primary_key=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="feedbacks")
    order = relationship("Order")
