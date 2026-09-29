from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User, Event, Announcement, RSVP
from backend.models.schemas import AnnouncementCreate, AnnouncementResponse
from backend.middleware.security import require_organizer
from cloud.notification_service import CloudNotificationService
from realtime.realtime_service import manager

router = APIRouter(tags=["Announcements"])

@router.post("/api/events/{event_id}/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(event_id: str, announcement_in: AnnouncementCreate, current_user: User = Depends(require_organizer), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
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

    attendees = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.status.in_(["GOING", "MAYBE"])).all()
    CloudNotificationService.broadcast_to_event_attendees(
        db, [r.user_id for r in attendees], event_id, "ANNOUNCEMENT", f"Announcement for '{event.event_name}': {announcement.title}"
    )

    await manager.broadcast_to_event(event_id, {
        "type": "ANNOUNCEMENT",
        "event_id": event_id,
        "data": {
            "announcement_id": announcement.announcement_id,
            "title": announcement.title,
            "message": announcement.message,
            "created_at": announcement.created_at.isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return announcement

@router.get("/api/events/{event_id}/announcements", response_model=List[AnnouncementResponse])
def get_announcements(event_id: str, db: Session = Depends(get_db)):
    return db.query(Announcement).filter(Announcement.event_id == event_id).order_by(Announcement.created_at.desc()).all()
