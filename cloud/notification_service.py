import logging
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.db_models import Notification, User

logger = logging.getLogger("notification_service")

class CloudNotificationService:
    @staticmethod
    def send_notification(db: Session, user_id: str, notif_type: str, message: str, event_id: Optional[str] = None):
        notification = Notification(
            user_id=user_id,
            event_id=event_id,
            type=notif_type,
            message=message,
            read=False,
            created_at=datetime.now(timezone.utc)
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def broadcast_to_event_attendees(db: Session, attendee_ids: List[str], event_id: str, notif_type: str, message: str):
        notifications = []
        now = datetime.now(timezone.utc)
        for uid in set(attendee_ids):
            notif = Notification(
                user_id=uid,
                event_id=event_id,
                type=notif_type,
                message=message,
                read=False,
                created_at=now
            )
            notifications.append(notif)
        if notifications:
            db.bulk_save_objects(notifications)
            db.commit()

    @staticmethod
    def get_user_notifications(db: Session, user_id: str, unread_only: bool = False):
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.read == False)
        return query.order_by(Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str):
        notif = db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notif:
            notif.read = True
            db.commit()
            return True
        return False

    @staticmethod
    def mark_all_as_read(db: Session, user_id: str):
        db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).update({"read": True})
        db.commit()
