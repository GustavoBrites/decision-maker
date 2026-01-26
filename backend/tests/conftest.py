import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
# Import models to ensure they are registered with Base
from app.db_models import UserDB, TaskDB, WeeklyGoalDB

# Use environment DATABASE_URL or fallback to in-memory SQLite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///:memory:")

# Handle SQLite-specific connect args
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        poolclass=StaticPool,
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    """Reset the database before each test."""
    # Import models to ensure they are registered with Base
    from app.db_models import UserDB, TaskDB, WeeklyGoalDB
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_header(client):
    """Create a user and log in to get a token."""
    client.post("/api/auth/signup", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
