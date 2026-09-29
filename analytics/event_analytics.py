from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.db_models import Event, RSVP, Waitlist

class EventAnalyticsService:
    @staticmethod
    def get_event_metrics(db: Session, event_id: str):
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if not event:
            return None

        status_counts = (
            db.query(RSVP.status, func.count(RSVP.rsvp_id))
            .filter(RSVP.event_id == event_id)
            .group_by(RSVP.status)
            .all()
        )
        counts_dict = {status: count for status, count in status_counts}

        going = counts_dict.get("GOING", 0)
        maybe = counts_dict.get("MAYBE", 0)
        not_going = counts_dict.get("NOT_GOING", 0)
        total_responses = going + maybe + not_going

        waitlist_count = (
            db.query(func.count(Waitlist.waitlist_id))
            .filter(Waitlist.event_id == event_id, Waitlist.status == "WAITING")
            .scalar() or 0
        )

        available_seats = max(0, event.maximum_capacity - going)
        capacity_utilization = round((going / event.maximum_capacity * 100.0), 2) if event.maximum_capacity > 0 else 0.0
        response_rate = round((total_responses / event.maximum_capacity * 100.0), 2) if event.maximum_capacity > 0 else 0.0

        return {
            "event_id": event.event_id,
            "event_name": event.event_name,
            "maximum_capacity": event.maximum_capacity,
            "current_going": going,
            "going_count": going,
            "maybe_count": maybe,
            "not_going_count": not_going,
            "total_responses": total_responses,
            "waitlist_count": waitlist_count,
            "available_seats": available_seats,
            "response_rate": response_rate,
            "capacity_utilization": capacity_utilization,
            "is_full": going >= event.maximum_capacity,
            "status": event.status
        }

    @staticmethod
    def get_organizer_aggregate_metrics(db: Session, organizer_id: str):
        events = db.query(Event).filter(Event.organizer_id == organizer_id).all()
        total_going = sum(e.current_going for e in events)
        total_capacity = sum(e.maximum_capacity for e in events)
        return {
            "total_events": len(events),
            "total_capacity": total_capacity,
            "total_going": total_going
        }
