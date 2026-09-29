import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

@pytest.fixture
def unique_email():
    return f"user_{uuid.uuid4().hex[:8]}@cloud.edu"

def test_register_user_success(unique_email):
    res = client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "New Cloud User",
        "role": "ATTENDEE"
    })
    assert res.status_code == 201

def test_duplicate_registration_fails(unique_email):
    client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Original User",
        "role": "ATTENDEE"
    })
    res = client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Duplicate User",
        "role": "ATTENDEE"
    })
    assert res.status_code == 400

def test_login_success(unique_email):
    client.post("/api/register", json={"email": unique_email, "password": "Password123!", "full_name": "Login Tester", "role": "ATTENDEE"})
    res = client.post("/api/login", json={"email": unique_email, "password": "Password123!"})
    assert res.status_code == 200
    assert "access_token" in res.json()
