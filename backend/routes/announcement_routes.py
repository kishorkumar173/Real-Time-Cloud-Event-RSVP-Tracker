from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User, Event, Announcement, RSVP
from backend.models.schemas import AnnouncementCreate, AnnouncementResponse
from backend.middleware.security import get_current_user, require_organizer
from cloud.notification_service import CloudNotificationService
from realtime.realtime_service import manager

router = APIRouter(tags=["Announcements"])

@router.post("/api/events/{event_id}/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    event_id: str,
    announcement_in: AnnouncementCreate,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if event.organizer_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only event organizer can post announcements")

    announcement = Announcement(
        event_id=event_id,
        organizer_id=current_user.user_id,
        title=announcement_in.title,
        message=announcement_in.message,
        created_at=datetime.now(timezone.utc)
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    # 1. Dispatch cloud notification to all attendees
    attendees = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.status.in_(["GOING", "MAYBE"])).all()
    attendee_ids = [r.user_id for r in attendees]
    CloudNotificationService.broadcast_to_event_attendees(
        db=db,
        attendee_ids=attendee_ids,
        event_id=event_id,
        notif_type="ANNOUNCEMENT",
        message=f"New announcement for '{event.event_name}': {announcement.title} - {announcement.message}"
    )

    # 2. Broadcast via WebSocket
    payload = {
        "type": "ANNOUNCEMENT",
        "event_id": event_id,
        "data": {
            "announcement_id": announcement.announcement_id,
            "title": announcement.title,
            "message": announcement.message,
            "created_at": announcement.created_at.isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await manager.broadcast_to_event(event_id, payload)

    return announcement

@router.get("/api/events/{event_id}/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    event_id: str,
    db: Session = Depends(get_db)
):
    return (
        db.query(Announcement)
        .filter(Announcement.event_id == event_id)
        .order_by(Announcement.created_at.desc())
        .all()
    )
