import os
import sys
from datetime import datetime, timezone

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, engine, Base
from backend.models.db_models import User, Event, RSVP, Waitlist, Announcement, Notification
from backend.middleware.security import get_password_hash

def seed_database():
    print("Initializing schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Clearing existing records for clean demo seed...")
            db.query(Notification).delete()
            db.query(Announcement).delete()
            db.query(Waitlist).delete()
            db.query(RSVP).delete()
            db.query(Event).delete()
            db.query(User).delete()
            db.commit()

        print("Seeding synthetic users...")
        organizer = User(
            email="organizer@cloud.edu",
            password_hash=get_password_hash("Cloud2026!"),
            full_name="Prof. Sarah Jenkins (Organizer)",
            role="ORGANIZER"
        )
        db.add(organizer)

        attendees_data = [
            ("alice@cloud.edu", "Alice Walker"),
            ("bob@cloud.edu", "Bob Miller"),
            ("carol@cloud.edu", "Carol Davis"),
            ("david@cloud.edu", "David Zhang"),
            ("emma@cloud.edu", "Emma Watson"),
        ]

        attendee_objs = []
        for email, name in attendees_data:
            att = User(
                email=email,
                password_hash=get_password_hash("Cloud2026!"),
                full_name=name,
                role="ATTENDEE"
            )
            db.add(att)
            attendee_objs.append(att)

        db.commit()
        db.refresh(organizer)
        for att in attendee_objs:
            db.refresh(att)

        print("Seeding synthetic events...")
        # Event 1: Limited capacity = 3 (Perfect for capacity limit & waitlist demo)
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
        db.add(event1)

        # Event 2: Major Summit
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
        db.add(event2)

        db.commit()
        db.refresh(event1)
        db.refresh(event2)

        print("Seeding initial RSVPs...")
        # Alice is GOING to Event 1
        rsvp_alice = RSVP(
            event_id=event1.event_id,
            user_id=attendee_objs[0].user_id,
            status="GOING",
            responded_at=datetime.now(timezone.utc)
        )
        # Bob is GOING to Event 1 (Now 2 out of 3 seats filled)
        rsvp_bob = RSVP(
            event_id=event1.event_id,
            user_id=attendee_objs[1].user_id,
            status="GOING",
            responded_at=datetime.now(timezone.utc)
        )
        # Carol is MAYBE to Event 1
        rsvp_carol = RSVP(
            event_id=event1.event_id,
            user_id=attendee_objs[2].user_id,
            status="MAYBE",
            responded_at=datetime.now(timezone.utc)
        )
        db.add_all([rsvp_alice, rsvp_bob, rsvp_carol])

        # Alice is also GOING to Event 2
        rsvp_alice_ev2 = RSVP(
            event_id=event2.event_id,
            user_id=attendee_objs[0].user_id,
            status="GOING",
            responded_at=datetime.now(timezone.utc)
        )
        db.add(rsvp_alice_ev2)
        db.commit()

        print("Seeding initial Announcements & Notifications...")
        announcement = Announcement(
            event_id=event1.event_id,
            organizer_id=organizer.user_id,
            title="Lab Prerequisites Released",
            message="Please ensure you have Python 3 and Node.js installed on your laptop prior to session start.",
            created_at=datetime.now(timezone.utc)
        )
        db.add(announcement)

        notif1 = Notification(
            user_id=attendee_objs[0].user_id,
            event_id=event1.event_id,
            type="RSVP_CONFIRM",
            message="Your RSVP for 'Cloud Computing & Real-Time Systems Workshop' is confirmed as GOING.",
            read=True
        )
        notif2 = Notification(
            user_id=attendee_objs[0].user_id,
            event_id=event1.event_id,
            type="ANNOUNCEMENT",
            message="New announcement: Lab Prerequisites Released",
            read=False
        )
        db.add_all([notif1, notif2])
        db.commit()

        print("==================================================")
        print("SEED COMPLETED SUCCESSFULLY!")
        print("Test Credentials:")
        print("  ORGANIZER: organizer@cloud.edu | Password: Cloud2026!")
        print("  ATTENDEE A: alice@cloud.edu     | Password: Cloud2026!")
        print("  ATTENDEE B: bob@cloud.edu       | Password: Cloud2026!")
        print("  ATTENDEE C: carol@cloud.edu     | Password: Cloud2026!")
        print("  ATTENDEE D: david@cloud.edu     | Password: Cloud2026!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
