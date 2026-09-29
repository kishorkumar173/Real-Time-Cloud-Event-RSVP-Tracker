import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

@pytest.fixture
def test_setup():
    org_token = client.post("/api/login", json={"email": "organizer@cloud.edu", "password": "Cloud2026!"}).json()["access_token"]
    org_headers = {"Authorization": f"Bearer {org_token}"}
    ev_res = client.post("/api/events", json={
        "event_name": "High Concurrency Micro-Summit",
        "event_date": "2026-12-01",
        "start_time": "10:00",
        "end_time": "11:00",
        "maximum_capacity": 2,
        "status": "PUBLISHED"
    }, headers=org_headers)
    event_id = ev_res.json()["event_id"]
    attendees = []
    for i in range(1, 4):
        email = f"tester_{i}_{event_id[:5]}@cloud.edu"
        client.post("/api/register", json={"email": email, "password": "Password123!", "full_name": f"Tester {i}", "role": "ATTENDEE"})
        token = client.post("/api/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
        attendees.append({"email": email, "headers": {"Authorization": f"Bearer {token}"}})
    return {"event_id": event_id, "attendees": attendees}

def test_capacity_enforcement_and_waitlist(test_setup):
    event_id = test_setup["event_id"]
    res1 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=test_setup["attendees"][0]["headers"])
    assert res1.status_code == 200
    res2 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=test_setup["attendees"][1]["headers"])
    assert res2.status_code == 200
    res3 = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=test_setup["attendees"][2]["headers"])
    assert res3.status_code == 409
