from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models.db_models import Event, User, RSVP
from backend.models.schemas import EventCreate, EventUpdate
from cloud.database_service import CloudDatabaseService
from cloud.notification_service import CloudNotificationService

class EventService:
    @staticmethod
    def create_event(db: Session, event_in: EventCreate, organizer_id: str) -> Event:
        event = Event(
            organizer_id=organizer_id,
            event_name=event_in.event_name,
            description=event_in.description,
            event_type=event_in.event_type,
            event_date=event_in.event_date,
            start_time=event_in.start_time,
            end_time=event_in.end_time,
            venue=event_in.venue,
            online_link=event_in.online_link,
            maximum_capacity=event_in.maximum_capacity,
            current_going=0,
            registration_deadline=event_in.registration_deadline,
            status=event_in.status,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        CloudDatabaseService.log_audit(
            db=db,
            action="CREATE_EVENT",
            entity="Event",
            entity_id=event.event_id,
            user_id=organizer_id,
            details=f"Created event '{event.event_name}' with capacity {event.maximum_capacity}"
        )
        return event

    @staticmethod
    def get_event(db: Session, event_id: str) -> Event:
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event

    @staticmethod
    def get_events(db: Session, skip: int = 0, limit: int = 100, status_filter: Optional[str] = None) -> List[Event]:
        query = db.query(Event)
        if status_filter:
            query = query.filter(Event.status == status_filter)
        return query.order_by(Event.event_date.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_upcoming_events(db: Session) -> List[Event]:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return db.query(Event).filter(
            Event.event_date >= today_str,
            Event.status.in_(["PUBLISHED", "FULL"])
        ).order_by(Event.event_date.asc(), Event.start_time.asc()).all()

    @staticmethod
    def update_event(db: Session, event_id: str, event_update: EventUpdate, current_user: User) -> Event:
        event = EventService.get_event(db, event_id)
        if event.organizer_id != current_user.user_id and current_user.role != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this event")

        update_dict = event_update.model_dump(exclude_unset=True)
        venue_changed = "venue" in update_dict and update_dict["venue"] != event.venue
        time_changed = ("start_time" in update_dict and update_dict["start_time"] != event.start_time) or \
                       ("event_date" in update_dict and update_dict["event_date"] != event.event_date)

        for key, value in update_dict.items():
            setattr(event, key, value)
        event.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)

        # Notify attendees of significant changes
        if venue_changed or time_changed:
            attendee_rsvps = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.status.in_(["GOING", "MAYBE"])).all()
            attendee_ids = [r.user_id for r in attendee_rsvps]
            msg = f"Event '{event.event_name}' updated: "
            if time_changed:
                msg += f"New Date/Time: {event.event_date} {event.start_time}. "
            if venue_changed:
                msg += f"New Venue: {event.venue}. "
            CloudNotificationService.broadcast_to_event_attendees(
                db=db,
                attendee_ids=attendee_ids,
                event_id=event_id,
                notif_type="EVENT_UPDATE",
                message=msg
            )

        CloudDatabaseService.log_audit(
            db=db,
            action="UPDATE_EVENT",
            entity="Event",
            entity_id=event_id,
            user_id=current_user.user_id,
            details=f"Updated event {event_id}"
        )
        return event

    @staticmethod
    def cancel_event(db: Session, event_id: str, current_user: User) -> Event:
        event = EventService.get_event(db, event_id)
        if event.organizer_id != current_user.user_id and current_user.role != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this event")

        event.status = "CANCELLED"
        event.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)

        attendee_rsvps = db.query(RSVP).filter(RSVP.event_id == event_id).all()
        attendee_ids = [r.user_id for r in attendee_rsvps]
        CloudNotificationService.broadcast_to_event_attendees(
            db=db,
            attendee_ids=attendee_ids,
            event_id=event_id,
            notif_type="CANCELLED",
            message=f"Event '{event.event_name}' has been cancelled by the organizer."
        )

        CloudDatabaseService.log_audit(
            db=db,
            action="CANCEL_EVENT",
            entity="Event",
            entity_id=event_id,
            user_id=current_user.user_id,
            details=f"Cancelled event {event_id}"
        )
        return event

    @staticmethod
    def delete_event(db: Session, event_id: str, current_user: User) -> bool:
        event = EventService.get_event(db, event_id)
        if event.organizer_id != current_user.user_id and current_user.role != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this event")
        db.delete(event)
        db.commit()
        return True
