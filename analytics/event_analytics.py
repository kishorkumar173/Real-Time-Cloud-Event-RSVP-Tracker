from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.db_models import Event, RSVP, Waitlist

class EventAnalyticsService:
    @staticmethod
    def get_event_metrics(db: Session, event_id: str) -> Dict[str, Any]:
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if not event:
            return None

        # Aggregate counts by RSVP status
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
        conversion_rate = round((going / total_responses * 100.0), 2) if total_responses > 0 else 0.0

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
            "conversion_rate": conversion_rate,
            "is_full": going >= event.maximum_capacity,
            "status": event.status
        }

    @staticmethod
    def get_organizer_aggregate_metrics(db: Session, organizer_id: str) -> Dict[str, Any]:
        events = db.query(Event).filter(Event.organizer_id == organizer_id).all()
        total_events = len(events)
        total_going = 0
        total_maybe = 0
        total_not_going = 0
        total_capacity = 0
        total_waitlist = 0

        for ev in events:
            metrics = EventAnalyticsService.get_event_metrics(db, ev.event_id)
            total_going += metrics["going_count"]
            total_maybe += metrics["maybe_count"]
            total_not_going += metrics["not_going_count"]
            total_capacity += ev.maximum_capacity
            total_waitlist += metrics["waitlist_count"]

        total_responses = total_going + total_maybe + total_not_going
        overall_utilization = round((total_going / total_capacity * 100.0), 2) if total_capacity > 0 else 0.0

        return {
            "total_events": total_events,
            "total_capacity": total_capacity,
            "total_responses": total_responses,
            "total_going": total_going,
            "total_maybe": total_maybe,
            "total_not_going": total_not_going,
            "total_waitlist": total_waitlist,
            "overall_capacity_utilization": overall_utilization
        }
