from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models.db_models import Event, User, RSVP
from backend.models.schemas import EventCreate, EventUpdate
from cloud.notification_service import CloudNotificationService

class EventService:
    @staticmethod
    def create_event(db: Session, event_in: EventCreate, organizer_id: str):
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
        return event

    @staticmethod
    def get_event(db: Session, event_id: str):
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    @staticmethod
    def get_events(db: Session, skip: int = 0, limit: int = 100, status_filter: str = None):
        query = db.query(Event)
        if status_filter:
            query = query.filter(Event.status == status_filter)
        return query.order_by(Event.event_date.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_upcoming_events(db: Session):
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return db.query(Event).filter(Event.event_date >= today_str, Event.status.in_(["PUBLISHED", "FULL"])).order_by(Event.event_date.asc()).all()

    @staticmethod
    def update_event(db: Session, event_id: str, event_update: EventUpdate, current_user: User):
        event = EventService.get_event(db, event_id)
        if event.organizer_id != current_user.user_id and current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Not authorized to edit this event")
        for key, value in event_update.model_dump(exclude_unset=True).items():
            setattr(event, key, value)
        event.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def cancel_event(db: Session, event_id: str, current_user: User):
        event = EventService.get_event(db, event_id)
        if event.organizer_id != current_user.user_id and current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Not authorized to cancel this event")
        event.status = "CANCELLED"
        event.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)
        attendee_rsvps = db.query(RSVP).filter(RSVP.event_id == event_id).all()
        CloudNotificationService.broadcast_to_event_attendees(
            db, [r.user_id for r in attendee_rsvps], event_id, "CANCELLED", f"Event '{event.event_name}' was cancelled."
        )
        return event
