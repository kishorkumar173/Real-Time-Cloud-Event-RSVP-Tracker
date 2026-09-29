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
    data = res.json()
    assert data["email"] == unique_email
    assert data["role"] == "ATTENDEE"
    assert "user_id" in data

def test_duplicate_registration_fails(unique_email):
    # First registration
    client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Original User",
        "role": "ATTENDEE"
    })
    # Second duplicate registration
    res = client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Duplicate User",
        "role": "ATTENDEE"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_login_success(unique_email):
    client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Login Tester",
        "role": "ATTENDEE"
    })
    res = client.post("/api/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "ATTENDEE"

def test_login_invalid_password(unique_email):
    client.post("/api/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Wrong Pass Tester",
        "role": "ATTENDEE"
    })
    res = client.post("/api/login", json={
        "email": unique_email,
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
