import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

@pytest.fixture
def auth_tokens():
    org_res = client.post("/api/login", json={"email": "organizer@cloud.edu", "password": "Cloud2026!"})
    att_res = client.post("/api/login", json={"email": "alice@cloud.edu", "password": "Cloud2026!"})
    return {"organizer": org_res.json()["access_token"], "attendee": att_res.json()["access_token"]}

def test_organizer_can_create_event(auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['organizer']}"}
    res = client.post("/api/events", json={
        "event_name": "DevOps & Kubernetes Cloud Camp",
        "description": "Hands on container orchestration and CI/CD.",
        "event_type": "IN_PERSON",
        "event_date": "2026-11-20",
        "start_time": "14:00",
        "end_time": "17:00",
        "maximum_capacity": 40,
        "status": "PUBLISHED"
    }, headers=headers)
    assert res.status_code == 201

def test_attendee_forbidden_from_creating_event(auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['attendee']}"}
    res = client.post("/api/events", json={
        "event_name": "Rogue Event",
        "event_date": "2026-11-21",
        "start_time": "10:00",
        "end_time": "12:00",
        "maximum_capacity": 10,
        "status": "PUBLISHED"
    }, headers=headers)
    assert res.status_code == 403
