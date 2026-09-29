from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.models.db_models import Waitlist, RSVP, Event
from cloud.notification_service import CloudNotificationService

class WaitlistService:
    @staticmethod
    def join_waitlist(db: Session, event_id: str, user_id: str):
        existing = db.query(Waitlist).filter(Waitlist.event_id == event_id, Waitlist.user_id == user_id).first()
        if existing:
            if existing.status == "WAITING":
                return existing
            existing.status = "WAITING"
            existing.joined_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing

        waitlist_entry = Waitlist(event_id=event_id, user_id=user_id, status="WAITING", joined_at=datetime.now(timezone.utc))
        db.add(waitlist_entry)
        db.commit()
        db.refresh(waitlist_entry)
        CloudNotificationService.send_notification(db, user_id, "WAITLIST_JOINED", "Added to priority waitlist.", event_id)
        return waitlist_entry

    @staticmethod
    def promote_next_waitlisted_user(db: Session, event: Event):
        next_waitlisted = (
            db.query(Waitlist)
            .filter(Waitlist.event_id == event.event_id, Waitlist.status == "WAITING")
            .order_by(Waitlist.joined_at.asc())
            .first()
        )
        if not next_waitlisted:
            return None

        next_waitlisted.status = "PROMOTED"
        rsvp = db.query(RSVP).filter(RSVP.event_id == event.event_id, RSVP.user_id == next_waitlisted.user_id).first()
        now = datetime.now(timezone.utc)
        if rsvp:
            rsvp.status = "GOING"
            rsvp.updated_at = now
        else:
            rsvp = RSVP(event_id=event.event_id, user_id=next_waitlisted.user_id, status="GOING", responded_at=now, updated_at=now)
            db.add(rsvp)

        event.current_going += 1
        if event.current_going >= event.maximum_capacity:
            event.status = "FULL"
        else:
            event.status = "PUBLISHED"

        db.commit()
        CloudNotificationService.send_notification(db, next_waitlisted.user_id, "WAITLIST_PROMOTED", f"A seat opened up for '{event.event_name}'. Confirmed as GOING!", event.event_id)
        return next_waitlisted
