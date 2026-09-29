import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.models.db_models import Waitlist, RSVP, Event
from cloud.notification_service import CloudNotificationService

logger = logging.getLogger("waitlist_service")

class WaitlistService:
    @staticmethod
    def join_waitlist(db: Session, event_id: str, user_id: str) -> Waitlist:
        # Check existing waitlist entry
        existing = db.query(Waitlist).filter(
            Waitlist.event_id == event_id,
            Waitlist.user_id == user_id
        ).first()

        if existing:
            if existing.status == "WAITING":
                return existing
            existing.status = "WAITING"
            existing.joined_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing

        waitlist_entry = Waitlist(
            event_id=event_id,
            user_id=user_id,
            status="WAITING",
            joined_at=datetime.now(timezone.utc)
        )
        db.add(waitlist_entry)
        db.commit()
        db.refresh(waitlist_entry)

        CloudNotificationService.send_notification(
            db=db,
            user_id=user_id,
            notif_type="WAITLIST_JOINED",
            message="Event is currently full. You have been added to the priority waitlist.",
            event_id=event_id
        )
        return waitlist_entry

    @staticmethod
    def promote_next_waitlisted_user(db: Session, event: Event) -> Optional[Waitlist]:
        """
        Promotes the next FIFO attendee on the waitlist when a GOING slot opens.
        Runs inside an active database transaction.
        """
        next_waitlisted = (
            db.query(Waitlist)
            .filter(Waitlist.event_id == event.event_id, Waitlist.status == "WAITING")
            .order_by(Waitlist.joined_at.asc())
            .first()
        )

        if not next_waitlisted:
            return None

        # Promote user
        next_waitlisted.status = "PROMOTED"

        # Create or update RSVP to GOING
        rsvp = db.query(RSVP).filter(
            RSVP.event_id == event.event_id,
            RSVP.user_id == next_waitlisted.user_id
        ).first()

        now = datetime.now(timezone.utc)
        if rsvp:
            rsvp.status = "GOING"
            rsvp.updated_at = now
        else:
            rsvp = RSVP(
                event_id=event.event_id,
                user_id=next_waitlisted.user_id,
                status="GOING",
                responded_at=now,
                updated_at=now
            )
            db.add(rsvp)

        event.current_going += 1
        if event.current_going >= event.maximum_capacity:
            event.status = "FULL"
        else:
            event.status = "PUBLISHED"

        db.commit()
        db.refresh(next_waitlisted)

        CloudNotificationService.send_notification(
            db=db,
            user_id=next_waitlisted.user_id,
            notif_type="WAITLIST_PROMOTED",
            message=f"Great news! A seat opened up for '{event.event_name}'. Your RSVP is now confirmed as GOING.",
            event_id=event.event_id
        )
        logger.info(f"Promoted user {next_waitlisted.user_id} from waitlist for event {event.event_id}")
        return next_waitlisted
