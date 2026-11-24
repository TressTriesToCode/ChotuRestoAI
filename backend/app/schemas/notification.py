from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.notification import NotificationType, NotificationSeverity

class NotificationCreate(BaseModel):
    event_fingerprint: str
    type: NotificationType
    severity: NotificationSeverity = NotificationSeverity.INFO
    title: str
    message: str
    reference_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    restaurant_id: str
    type: NotificationType
    severity: NotificationSeverity
    title: str
    message: str
    reference_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
