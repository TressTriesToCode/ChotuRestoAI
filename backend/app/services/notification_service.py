import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType, NotificationSeverity

class NotificationService:
    @staticmethod
    def create_or_get_notification(
        db: Session,
        restaurant_id: str,
        event_fingerprint: str,
        notif_type: NotificationType,
        title: str,
        message: str,
        severity: NotificationSeverity = NotificationSeverity.INFO,
        reference_id: Optional[str] = None
    ) -> Notification:
        """
        Deduplicates notification events by event_fingerprint.
        If a notification with this fingerprint already exists, it is returned
        without creating duplicate alerts.
        """
        existing = db.query(Notification).filter(
            Notification.event_fingerprint == event_fingerprint
        ).first()
        if existing:
            return existing

        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:10]}",
            restaurant_id=restaurant_id,
            event_fingerprint=event_fingerprint,
            type=notif_type,
            severity=severity,
            title=title,
            message=message,
            reference_id=reference_id,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
