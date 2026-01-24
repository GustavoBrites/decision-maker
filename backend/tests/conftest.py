import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import db
from app.models import CreateUserRequest

@pytest.fixture
def client():
    # Reset DB before each test
    db.users = {}
    db.users_by_id = {}
    db.passwords = {}
    db.tasks = {}
    db.goals = {}
    return TestClient(app)

@pytest.fixture
def auth_header(client):
    # Create a user and log in to get a token
    client.post("/auth/signup", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
