from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class UserRegister(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = Field("ATTENDEE", pattern="^(ATTENDEE|ORGANIZER|ADMIN)$")

class UserLogin(BaseModel):
    email: str = Field(..., pattern=EMAIL_REGEX)
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str
    email: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class EventBase(BaseModel):
    event_name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    event_type: str = Field("IN_PERSON", pattern="^(IN_PERSON|VIRTUAL|HYBRID)$")
    event_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    venue: Optional[str] = None
    online_link: Optional[str] = None
    maximum_capacity: int = Field(100, ge=1)
    registration_deadline: Optional[str] = None
    status: str = Field("PUBLISHED", pattern="^(DRAFT|PUBLISHED|FULL|COMPLETED|CANCELLED)$")

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    event_name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue: Optional[str] = None
    online_link: Optional[str] = None
    maximum_capacity: Optional[int] = None
    registration_deadline: Optional[str] = None
    status: Optional[str] = None

class EventResponse(EventBase):
    event_id: str
    organizer_id: str
    current_going: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class RSVPCreate(BaseModel):
    status: str = Field(..., pattern="^(GOING|MAYBE|NOT_GOING)$")

class RSVPUpdate(BaseModel):
    status: str = Field(..., pattern="^(GOING|MAYBE|NOT_GOING)$")

class RSVPResponse(BaseModel):
    rsvp_id: str
    event_id: str
    user_id: str
    status: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    responded_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class MyRSVPResponse(BaseModel):
    rsvp_id: str
    event_id: str
    status: str
    event_name: str
    event_date: str
    start_time: str
    venue: Optional[str] = None
    responded_at: Optional[datetime] = None

class WaitlistResponse(BaseModel):
    waitlist_id: str
    event_id: str
    user_id: str
    user_name: Optional[str] = None
    joined_at: Optional[datetime] = None
    status: str
    model_config = {"from_attributes": True}

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    message: str = Field(..., min_length=2)

class AnnouncementResponse(BaseModel):
    announcement_id: str
    event_id: str
    organizer_id: str
    title: str
    message: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class NotificationResponse(BaseModel):
    notification_id: str
    user_id: str
    event_id: Optional[str] = None
    type: str
    message: str
    read: bool
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class EventAnalyticsResponse(BaseModel):
    event_id: str
    event_name: str
    maximum_capacity: int
    current_going: int
    going_count: int
    maybe_count: int
    not_going_count: int
    total_responses: int
    waitlist_count: int
    available_seats: int
    response_rate: float
    capacity_utilization: float
    is_full: bool
    status: str

class RealtimeMessage(BaseModel):
    type: str
    event_id: str
    data: dict
    timestamp: str
