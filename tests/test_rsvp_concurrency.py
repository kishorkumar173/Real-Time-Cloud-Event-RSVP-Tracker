import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

@pytest.fixture
def test_setup():
    org_login = client.post("/api/login", json={"email": "organizer@cloud.edu", "password": "Cloud2026!"}).json()
    org_token = org_login["access_token"]
    org_headers = {"Authorization": f"Bearer {org_token}"}

    # Create special limited capacity event with capacity = 2
    ev_res = client.post("/api/events", json={
        "event_name": "High Concurrency Micro-Summit",
        "description": "Testing atomic capacity limits and transactions",
        "event_date": "2026-12-01",
        "start_time": "10:00",
        "end_time": "11:00",
        "maximum_capacity": 2,
        "status": "PUBLISHED"
    }, headers=org_headers)
    event_id = ev_res.json()["event_id"]

    # Register 3 distinct test attendees
    attendees = []
    for i in range(1, 4):
        email = f"tester_{i}_{event_id[:5]}@cloud.edu"
        client.post("/api/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": f"Tester {i}",
            "role": "ATTENDEE"
        })
        token = client.post("/api/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
        attendees.append({"email": email, "token": token, "headers": {"Authorization": f"Bearer {token}"}})

    return {"event_id": event_id, "attendees": attendees, "org_headers": org_headers}

def test_capacity_enforcement_and_waitlist(test_setup):
    event_id = test_setup["event_id"]
    att1 = test_setup["attendees"][0]
    att2 = test_setup["attendees"][1]
    att3 = test_setup["attendees"][2]

    # Attendee 1 RSVPs GOING (Seat 1/2)
    res1 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=att1["headers"])
    assert res1.status_code == 200
    assert res1.json()["status"] == "GOING"

    # Attendee 2 RSVPs GOING (Seat 2/2 - Capacity reached!)
    res2 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=att2["headers"])
    assert res2.status_code == 200
    assert res2.json()["status"] == "GOING"

    # Attendee 3 attempts GOING (Exceeds capacity -> Should be rejected / waitlisted with 409)
    res3 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=att3["headers"])
    assert res3.status_code == 409
    assert "maximum capacity" in res3.json()["detail"].lower()

    # Check analytics endpoint
    analytics = client.get(f"/api/events/{event_id}/analytics").json()
    assert analytics["going_count"] == 2
    assert analytics["is_full"] == True
    assert analytics["waitlist_count"] == 1
    assert analytics["available_seats"] == 0

def test_duplicate_rsvp_updates_record_not_duplicates(test_setup):
    event_id = test_setup["event_id"]
    att = test_setup["attendees"][0]

    # Submit MAYBE
    res1 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "MAYBE"}, headers=att["headers"])
    assert res1.status_code == 200
    assert res1.json()["status"] == "MAYBE"

    # Submit NOT_GOING from same user for same event
    res2 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "NOT_GOING"}, headers=att["headers"])
    assert res2.status_code == 200
    assert res2.json()["status"] == "NOT_GOING"

    # Ensure still only 1 RSVP record exists for this user
    rsvps = client.get(f"/api/events/{event_id}/rsvps", headers=test_setup["org_headers"]).json()
    user_rsvps = [r for r in rsvps if r["user_email"] == att["email"]]
    assert len(user_rsvps) == 1
    assert user_rsvps[0]["status"] == "NOT_GOING"
