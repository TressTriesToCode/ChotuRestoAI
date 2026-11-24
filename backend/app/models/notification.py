from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from app.database.session import Base

class NotificationType(str, enum.Enum):
    ORDER = "order"
    KOT_DELAY = "kot_delay"
    LOW_STOCK = "low_stock"
    PAYMENT_FAILED = "payment_failed"
    ASSISTANCE = "assistance"
    DELIVERY = "delivery"

class NotificationSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    event_fingerprint = Column(String(128), unique=True, index=True, nullable=False)  # Deduplication key
    type = Column(SQLEnum(NotificationType), default=NotificationType.ORDER, nullable=False)
    severity = Column(SQLEnum(NotificationSeverity), default=NotificationSeverity.INFO, nullable=False)
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    reference_id = Column(String(64), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
