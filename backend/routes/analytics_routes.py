from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User
from backend.models.schemas import EventAnalyticsResponse
from backend.middleware.security import get_current_user, require_organizer
from analytics.event_analytics import EventAnalyticsService

router = APIRouter(prefix="/api", tags=["Analytics"])

@router.get("/events/{event_id}/analytics", response_model=EventAnalyticsResponse)
def get_event_analytics(
    event_id: str,
    db: Session = Depends(get_db)
):
    metrics = EventAnalyticsService.get_event_metrics(db, event_id)
    if not metrics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return metrics

@router.get("/analytics/organizer")
def get_organizer_summary(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db)
):
    return EventAnalyticsService.get_organizer_aggregate_metrics(db, current_user.user_id)
