import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_waitlist_auto_promotion():
    # 1. Login organizer
    org_res = client.post("/api/login", json={"email": "organizer@cloud.edu", "password": "Cloud2026!"})
    org_headers = {"Authorization": f"Bearer {org_res.json()['access_token']}"}

    # 2. Create 1-seat event
    ev_res = client.post("/api/events", json={
        "event_name": "Exclusive 1-Seat Cloud Masterclass",
        "description": "Auto-promotion demonstration",
        "event_date": "2026-12-15",
        "start_time": "15:00",
        "end_time": "16:00",
        "maximum_capacity": 1,
        "status": "PUBLISHED"
    }, headers=org_headers)
    event_id = ev_res.json()["event_id"]

    # 3. Register user A & user B
    client.post("/api/register", json={"email": "wait_a@cloud.edu", "password": "Password123!", "full_name": "Wait A", "role": "ATTENDEE"})
    token_a = client.post("/api/login", json={"email": "wait_a@cloud.edu", "password": "Password123!"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    client.post("/api/register", json={"email": "wait_b@cloud.edu", "password": "Password123!", "full_name": "Wait B", "role": "ATTENDEE"})
    token_b = client.post("/api/login", json={"email": "wait_b@cloud.edu", "password": "Password123!"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 4. User A takes the 1 seat
    res_a = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=headers_a)
    assert res_a.status_code == 200

    # 5. User B attempts GOING -> rejected & waitlisted
    res_b = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers=headers_b)
    assert res_b.status_code == 409

    # 6. User A cancels RSVP!
    cancel_res = client.delete(f"/api/events/{event_id}/rsvp", headers=headers_a)
    assert cancel_res.status_code == 204

    # 7. Check User B's RSVP - should be automatically promoted to GOING!
    my_rsvp_b = client.get(f"/api/events/{event_id}/my-rsvp", headers=headers_b).json()
    assert my_rsvp_b["status"] == "GOING"

    # 8. Check event analytics - capacity remains 1/1 filled
    analytics = client.get(f"/api/events/{event_id}/analytics").json()
    assert analytics["going_count"] == 1
