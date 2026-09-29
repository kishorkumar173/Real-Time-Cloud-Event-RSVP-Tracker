import os
import sys
from datetime import datetime, timezone
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, engine, Base
from backend.models.db_models import User, Event, RSVP, Waitlist, Announcement, Notification
from backend.middleware.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        db.query(Notification).delete()
        db.query(Announcement).delete()
        db.query(Waitlist).delete()
        db.query(RSVP).delete()
        db.query(Event).delete()
        db.query(User).delete()
        db.commit()

        organizer = User(
            email="organizer@cloud.edu",
            password_hash=get_password_hash("Cloud2026!"),
            full_name="Prof. Sarah Jenkins (Organizer)",
            role="ORGANIZER"
        )
        db.add(organizer)

        attendees = [
            User(email="alice@cloud.edu", password_hash=get_password_hash("Cloud2026!"), full_name="Alice Walker", role="ATTENDEE"),
            User(email="bob@cloud.edu", password_hash=get_password_hash("Cloud2026!"), full_name="Bob Miller", role="ATTENDEE"),
            User(email="carol@cloud.edu", password_hash=get_password_hash("Cloud2026!"), full_name="Carol Davis", role="ATTENDEE"),
            User(email="david@cloud.edu", password_hash=get_password_hash("Cloud2026!"), full_name="David Zhang", role="ATTENDEE")
        ]
        db.add_all(attendees)
        db.commit()

        event1 = Event(
            organizer_id=organizer.user_id,
            event_name="Cloud Computing & Real-Time Systems Workshop",
            description="Deep dive into PaaS, WebSockets, ACID Concurrency, and Scalable Cloud Architectures.",
            event_type="IN_PERSON",
            event_date="2026-10-15",
            start_time="10:00",
            end_time="13:00",
            venue="Tech Auditorium Hall A, Cloud University",
            maximum_capacity=3,
            current_going=2,
            registration_deadline="2026-10-14",
            status="PUBLISHED"
        )
        event2 = Event(
            organizer_id=organizer.user_id,
            event_name="AWS, Azure & Google Cloud Architecture Summit",
            description="Annual cloud engineering symposium featuring serverless, containerization, and DevOps best practices.",
            event_type="HYBRID",
            event_date="2026-11-05",
            start_time="09:00",
            end_time="17:00",
            venue="Innovation Center Hall 1",
            online_link="https://meet.cloud.edu/summit-2026",
            maximum_capacity=100,
            current_going=1,
            registration_deadline="2026-11-04",
            status="PUBLISHED"
        )
        db.add_all([event1, event2])
        db.commit()

        rsvp1 = RSVP(event_id=event1.event_id, user_id=attendees[0].user_id, status="GOING")
        rsvp2 = RSVP(event_id=event1.event_id, user_id=attendees[1].user_id, status="GOING")
        rsvp3 = RSVP(event_id=event1.event_id, user_id=attendees[2].user_id, status="MAYBE")
        rsvp4 = RSVP(event_id=event2.event_id, user_id=attendees[0].user_id, status="GOING")
        db.add_all([rsvp1, rsvp2, rsvp3, rsvp4])

        ann = Announcement(event_id=event1.event_id, organizer_id=organizer.user_id, title="Lab Prerequisites Released", message="Ensure Python 3 and Node.js are installed.")
        notif = Notification(user_id=attendees[0].user_id, event_id=event1.event_id, type="RSVP_CONFIRM", message="Confirmed for Cloud Workshop!", read=False)
        db.add_all([ann, notif])
        db.commit()
        print("SEED SUCCESSFUL!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
