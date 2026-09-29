from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User
from backend.models.schemas import EventCreate, EventUpdate, EventResponse
from backend.services.event_service import EventService
from backend.middleware.security import require_organizer

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, current_user: User = Depends(require_organizer), db: Session = Depends(get_db)):
    return EventService.create_event(db, event_in, organizer_id=current_user.user_id)

@router.get("", response_model=List[EventResponse])
def get_events(skip: int = 0, limit: int = 100, status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    return EventService.get_events(db, skip=skip, limit=limit, status_filter=status_filter)

@router.get("/upcoming", response_model=List[EventResponse])
def get_upcoming_events(db: Session = Depends(get_db)):
    return EventService.get_upcoming_events(db)

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    return EventService.get_event(db, event_id)

@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, event_update: EventUpdate, current_user: User = Depends(require_organizer), db: Session = Depends(get_db)):
    return EventService.update_event(db, event_id, event_update, current_user)

@router.post("/{event_id}/cancel", response_model=EventResponse)
def cancel_event(event_id: str, current_user: User = Depends(require_organizer), db: Session = Depends(get_db)):
    return EventService.cancel_event(db, event_id, current_user)
