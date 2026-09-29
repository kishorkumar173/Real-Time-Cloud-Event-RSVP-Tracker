import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, Text, Boolean
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="ATTENDEE", nullable=False)  # ATTENDEE, ORGANIZER, ADMIN
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    events_organized = relationship("Event", back_populates="organizer", cascade="all, delete-orphan")
    rsvps = relationship("RSVP", back_populates="user", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"

    event_id = Column(String(36), primary_key=True, default=generate_uuid)
    organizer_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    event_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), default="IN_PERSON")  # IN_PERSON, VIRTUAL, HYBRID
    event_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    start_time = Column(String(50), nullable=False)  # HH:MM
    end_time = Column(String(50), nullable=False)    # HH:MM
    venue = Column(String(255), nullable=True)
    online_link = Column(String(500), nullable=True)
    maximum_capacity = Column(Integer, nullable=False, default=100)
    current_going = Column(Integer, default=0, nullable=False)
    registration_deadline = Column(String(50), nullable=True)
    status = Column(String(50), default="PUBLISHED", nullable=False)  # DRAFT, PUBLISHED, FULL, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    organizer = relationship("User", back_populates="events_organized")
    rsvps = relationship("RSVP", back_populates="event", cascade="all, delete-orphan")
    waitlists = relationship("Waitlist", back_populates="event", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="event", cascade="all, delete-orphan")

class RSVP(Base):
    __tablename__ = "rsvps"

    rsvp_id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # GOING, MAYBE, NOT_GOING
    responded_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_rsvp"),
    )

    # Relationships
    event = relationship("Event", back_populates="rsvps")
    user = relationship("User", back_populates="rsvps")

class Waitlist(Base):
    __tablename__ = "waitlists"

    waitlist_id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime, default=utc_now)
    status = Column(String(50), default="WAITING", nullable=False)  # WAITING, PROMOTED, CANCELLED

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_waitlist"),
    )

    event = relationship("Event", back_populates="waitlists")
    user = relationship("User", back_populates="waitlist_entries")

class Announcement(Base):
    __tablename__ = "announcements"

    announcement_id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    organizer_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    event = relationship("Event", back_populates="announcements")

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=True)
    type = Column(String(50), nullable=False)  # RSVP_CONFIRM, REMINDER, VENUE_CHANGE, TIME_CHANGE, CANCELLED, WAITLIST_PROMOTED, ANNOUNCEMENT
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(String(36), nullable=False)
    user_id = Column(String(36), nullable=True)
    timestamp = Column(DateTime, default=utc_now)
    details = Column(Text, nullable=True)
