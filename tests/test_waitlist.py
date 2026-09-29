import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_waitlist_auto_promotion():
    org_token = client.post("/api/login", json={"email": "organizer@cloud.edu", "password": "Cloud2026!"}).json()["access_token"]
    org_headers = {"Authorization": f"Bearer {org_token}"}
    ev_res = client.post("/api/events", json={
        "event_name": "Exclusive 1-Seat Cloud Masterclass",
        "event_date": "2026-12-15",
        "start_time": "15:00",
        "end_time": "16:00",
        "maximum_capacity": 1,
        "status": "PUBLISHED"
    }, headers=org_headers)
    event_id = ev_res.json()["event_id"]
    client.post("/api/register", json={"email": "wait_a@cloud.edu", "password": "Password123!", "full_name": "Wait A", "role": "ATTENDEE"})
    token_a = client.post("/api/login", json={"email": "wait_a@cloud.edu", "password": "Password123!"}).json()["access_token"]
    client.post("/api/register", json={"email": "wait_b@cloud.edu", "password": "Password123!", "full_name": "Wait B", "role": "ATTENDEE"})
    token_b = client.post("/api/login", json={"email": "wait_b@cloud.edu", "password": "Password123!"}).json()["access_token"]

    res_a = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    res_b = client.post(f"/api/events/{event_id}/rsvp", json={"status": "GOING"}, headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 409

    cancel_res = client.delete(f"/api/events/{event_id}/rsvp", headers={"Authorization": f"Bearer {token_a}"})
    assert cancel_res.status_code == 204
    my_rsvp_b = client.get(f"/api/events/{event_id}/my-rsvp", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert my_rsvp_b["status"] == "GOING"
