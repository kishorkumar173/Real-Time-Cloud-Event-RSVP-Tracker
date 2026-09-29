from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User, RSVP, Event
from backend.models.schemas import RSVPCreate, RSVPUpdate, RSVPResponse, MyRSVPResponse
from backend.services.rsvp_service import RSVPService
from backend.middleware.security import get_current_user, require_organizer

router = APIRouter(tags=["RSVP"])

@router.post("/api/events/{event_id}/rsvp", response_model=RSVPResponse)
async def submit_or_update_rsvp(event_id: str, rsvp_in: RSVPCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rsvp, meta = RSVPService.process_rsvp(db, event_id, current_user, rsvp_in.status)
    await RSVPService.broadcast_rsvp_change(db, event_id)
    return RSVPResponse(
        rsvp_id=rsvp.rsvp_id,
        event_id=rsvp.event_id,
        user_id=rsvp.user_id,
        status=rsvp.status,
        user_name=current_user.full_name,
        user_email=current_user.email,
        responded_at=rsvp.responded_at,
        updated_at=rsvp.updated_at
    )

@router.delete("/api/events/{event_id}/rsvp", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_rsvp(event_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    RSVPService.cancel_rsvp(db, event_id, current_user)
    await RSVPService.broadcast_rsvp_change(db, event_id)
    return None

@router.get("/api/events/{event_id}/rsvps", response_model=List[RSVPResponse])
def get_event_rsvps(event_id: str, current_user: User = Depends(require_organizer), db: Session = Depends(get_db)):
    rsvps = db.query(RSVP).filter(RSVP.event_id == event_id).all()
    return [
        RSVPResponse(
            rsvp_id=r.rsvp_id,
            event_id=r.event_id,
            user_id=r.user_id,
            status=r.status,
            user_name=r.user.full_name if r.user else "Attendee",
            user_email=r.user.email if r.user else "",
            responded_at=r.responded_at,
            updated_at=r.updated_at
        ) for r in rsvps
    ]

@router.get("/api/events/{event_id}/my-rsvp")
def get_my_event_rsvp(event_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rsvp = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == current_user.user_id).first()
    return {"status": rsvp.status if rsvp else "NONE", "rsvp_id": rsvp.rsvp_id if rsvp else None}

@router.get("/api/rsvps/me", response_model=List[MyRSVPResponse])
def get_my_rsvps(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rsvps = db.query(RSVP).filter(RSVP.user_id == current_user.user_id).all()
    results = []
    for r in rsvps:
        ev = db.query(Event).filter(Event.event_id == r.event_id).first()
        if ev:
            results.append(MyRSVPResponse(
                rsvp_id=r.rsvp_id,
                event_id=r.event_id,
                status=r.status,
                event_name=ev.event_name,
                event_date=ev.event_date,
                start_time=ev.start_time,
                venue=ev.venue,
                responded_at=r.responded_at
            ))
    return results
