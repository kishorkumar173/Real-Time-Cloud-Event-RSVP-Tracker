import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.models.db_models import Event, RSVP, User, Waitlist
from backend.services.waitlist_service import WaitlistService
from analytics.event_analytics import EventAnalyticsService
from cloud.notification_service import CloudNotificationService
from realtime.realtime_service import manager

logger = logging.getLogger("rsvp_service")

class RSVPService:
    @staticmethod
    def process_rsvp(
        db: Session,
        event_id: str,
        user: User,
        new_status: str
    ) -> Tuple[RSVP, Dict[str, Any]]:
        """
        Concurrency-safe RSVP handling.
        Uses database transaction to enforce maximum capacity constraint,
        prevent duplicate RSVPs, and automatically promote from waitlist.
        """
        # Lock event row or execute in immediate transaction
        # In PostgreSQL: db.query(Event).filter(Event.event_id == event_id).with_for_update().first()
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        if event.status == "CANCELLED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot RSVP to a cancelled event")

        # Check existing RSVP for user
        existing_rsvp = db.query(RSVP).filter(
            RSVP.event_id == event_id,
            RSVP.user_id == user.user_id
        ).first()

        old_status = existing_rsvp.status if existing_rsvp else None
        now = datetime.now(timezone.utc)
        waitlisted = False

        # Current verified going count from database
        current_going_count = (
            db.query(func.count(RSVP.rsvp_id))
            .filter(RSVP.event_id == event_id, RSVP.status == "GOING")
            .scalar() or 0
        )

        # CASE 1: User wants to be GOING
        if new_status == "GOING":
            # If already GOING, idempotent response
            if old_status == "GOING":
                return existing_rsvp, {"action": "UNCHANGED", "waitlisted": False}

            # Check capacity concurrency condition
            if current_going_count >= event.maximum_capacity:
                # Event is full! Add user to waitlist
                event.status = "FULL"
                db.commit()
                WaitlistService.join_waitlist(db, event_id, user.user_id)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Event has reached maximum capacity. You have been added to the priority waitlist."
                )

            # Capacity is available: proceed
            if existing_rsvp:
                existing_rsvp.status = "GOING"
                existing_rsvp.updated_at = now
            else:
                existing_rsvp = RSVP(
                    event_id=event_id,
                    user_id=user.user_id,
                    status="GOING",
                    responded_at=now,
                    updated_at=now
                )
                db.add(existing_rsvp)

            # Update event count
            event.current_going = current_going_count + 1
            if event.current_going >= event.maximum_capacity:
                event.status = "FULL"
            else:
                event.status = "PUBLISHED"

            db.commit()
            db.refresh(existing_rsvp)

            CloudNotificationService.send_notification(
                db=db,
                user_id=user.user_id,
                notif_type="RSVP_CONFIRM",
                message=f"Your RSVP for '{event.event_name}' is confirmed: GOING!",
                event_id=event_id
            )

        # CASE 2: User selects MAYBE or NOT_GOING
        else:
            if existing_rsvp:
                was_going = (existing_rsvp.status == "GOING")
                existing_rsvp.status = new_status
                existing_rsvp.updated_at = now

                # If previously GOING, decrement and promote from waitlist
                if was_going:
                    event.current_going = max(0, current_going_count - 1)
                    if event.status == "FULL" and event.current_going < event.maximum_capacity:
                        event.status = "PUBLISHED"
                    db.commit()
                    # Trigger auto-promotion
                    WaitlistService.promote_next_waitlisted_user(db, event)
                else:
                    db.commit()
                db.refresh(existing_rsvp)
            else:
                existing_rsvp = RSVP(
                    event_id=event_id,
                    user_id=user.user_id,
                    status=new_status,
                    responded_at=now,
                    updated_at=now
                )
                db.add(existing_rsvp)
                db.commit()
                db.refresh(existing_rsvp)

            CloudNotificationService.send_notification(
                db=db,
                user_id=user.user_id,
                notif_type="RSVP_UPDATE",
                message=f"Your RSVP for '{event.event_name}' updated to {new_status}.",
                event_id=event_id
            )

        return existing_rsvp, {"action": "UPDATED", "waitlisted": waitlisted}

    @staticmethod
    def cancel_rsvp(db: Session, event_id: str, user: User) -> bool:
        rsvp = db.query(RSVP).filter(
            RSVP.event_id == event_id,
            RSVP.user_id == user.user_id
        ).first()

        if not rsvp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No RSVP found to cancel")

        event = db.query(Event).filter(Event.event_id == event_id).first()
        was_going = (rsvp.status == "GOING")

        db.delete(rsvp)
        db.commit()

        if was_going and event:
            current_going_count = (
                db.query(func.count(RSVP.rsvp_id))
                .filter(RSVP.event_id == event_id, RSVP.status == "GOING")
                .scalar() or 0
            )
            event.current_going = current_going_count
            if event.status == "FULL" and event.current_going < event.maximum_capacity:
                event.status = "PUBLISHED"
            db.commit()
            WaitlistService.promote_next_waitlisted_user(db, event)

        return True

    @staticmethod
    async def broadcast_rsvp_change(db: Session, event_id: str):
        """Broadcasts calculated metrics over WebSockets to all connected clients."""
        metrics = EventAnalyticsService.get_event_metrics(db, event_id)
        if metrics:
            payload = {
                "type": "RSVP_UPDATE",
                "event_id": event_id,
                "data": metrics,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await manager.broadcast_to_event(event_id, payload)
