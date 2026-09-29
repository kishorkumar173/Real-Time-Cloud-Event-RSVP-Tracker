from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.models.db_models import Event, RSVP, User
from backend.services.waitlist_service import WaitlistService
from analytics.event_analytics import EventAnalyticsService
from cloud.notification_service import CloudNotificationService
from realtime.realtime_service import manager

class RSVPService:
    @staticmethod
    def process_rsvp(db: Session, event_id: str, user: User, new_status: str):
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        if event.status == "CANCELLED":
            raise HTTPException(status_code=400, detail="Cannot RSVP to a cancelled event")

        existing_rsvp = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == user.user_id).first()
        old_status = existing_rsvp.status if existing_rsvp else None
        now = datetime.now(timezone.utc)

        current_going_count = (
            db.query(func.count(RSVP.rsvp_id))
            .filter(RSVP.event_id == event_id, RSVP.status == "GOING")
            .scalar() or 0
        )

        if new_status == "GOING":
            if old_status == "GOING":
                return existing_rsvp, {"action": "UNCHANGED"}

            if current_going_count >= event.maximum_capacity:
                event.status = "FULL"
                db.commit()
                WaitlistService.join_waitlist(db, event_id, user.user_id)
                raise HTTPException(status_code=409, detail="Event has reached maximum capacity. You have been added to the priority waitlist.")

            if existing_rsvp:
                existing_rsvp.status = "GOING"
                existing_rsvp.updated_at = now
            else:
                existing_rsvp = RSVP(event_id=event_id, user_id=user.user_id, status="GOING", responded_at=now, updated_at=now)
                db.add(existing_rsvp)

            event.current_going = current_going_count + 1
            if event.current_going >= event.maximum_capacity:
                event.status = "FULL"
            else:
                event.status = "PUBLISHED"
            db.commit()
            db.refresh(existing_rsvp)
            CloudNotificationService.send_notification(db, user.user_id, "RSVP_CONFIRM", f"Your RSVP for '{event.event_name}' is confirmed: GOING!", event_id)
        else:
            if existing_rsvp:
                was_going = (existing_rsvp.status == "GOING")
                existing_rsvp.status = new_status
                existing_rsvp.updated_at = now
                if was_going:
                    event.current_going = max(0, current_going_count - 1)
                    if event.status == "FULL" and event.current_going < event.maximum_capacity:
                        event.status = "PUBLISHED"
                    db.commit()
                    WaitlistService.promote_next_waitlisted_user(db, event)
                else:
                    db.commit()
                db.refresh(existing_rsvp)
            else:
                existing_rsvp = RSVP(event_id=event_id, user_id=user.user_id, status=new_status, responded_at=now, updated_at=now)
                db.add(existing_rsvp)
                db.commit()
                db.refresh(existing_rsvp)
            CloudNotificationService.send_notification(db, user.user_id, "RSVP_UPDATE", f"Your RSVP for '{event.event_name}' updated to {new_status}.", event_id)

        return existing_rsvp, {"action": "UPDATED"}

    @staticmethod
    def cancel_rsvp(db: Session, event_id: str, user: User):
        rsvp = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == user.user_id).first()
        if not rsvp:
            raise HTTPException(status_code=404, detail="No RSVP found to cancel")
        event = db.query(Event).filter(Event.event_id == event_id).first()
        was_going = (rsvp.status == "GOING")
        db.delete(rsvp)
        db.commit()
        if was_going and event:
            current_going_count = db.query(func.count(RSVP.rsvp_id)).filter(RSVP.event_id == event_id, RSVP.status == "GOING").scalar() or 0
            event.current_going = current_going_count
            if event.status == "FULL" and event.current_going < event.maximum_capacity:
                event.status = "PUBLISHED"
            db.commit()
            WaitlistService.promote_next_waitlisted_user(db, event)
        return True

    @staticmethod
    async def broadcast_rsvp_change(db: Session, event_id: str):
        metrics = EventAnalyticsService.get_event_metrics(db, event_id)
        if metrics:
            await manager.broadcast_to_event(event_id, {
                "type": "RSVP_UPDATE",
                "event_id": event_id,
                "data": metrics,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
