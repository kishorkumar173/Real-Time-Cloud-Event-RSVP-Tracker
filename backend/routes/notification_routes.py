from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User
from backend.models.schemas import NotificationResponse
from backend.middleware.security import get_current_user
from cloud.notification_service import CloudNotificationService

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CloudNotificationService.get_user_notifications(db, current_user.user_id, unread_only)

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = CloudNotificationService.mark_as_read(db, notification_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    CloudNotificationService.mark_all_as_read(db, current_user.user_id)
    return {"message": "All notifications marked as read"}
