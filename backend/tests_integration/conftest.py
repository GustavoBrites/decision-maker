import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
# Import to register models
from app.db_models import UserDB, TaskDB, WeeklyGoalDB

# Use environment DATABASE_URL or fallback to in-memory SQLite for tests
# In-memory is safer in Docker environments to avoid disk I/O errors
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

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create the database and tables once for the whole test session."""
    # Ensure we start fresh
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    
    # Cleanup after session
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def clean_tables():
    """Clear data from tables before each test to ensure isolation."""
    # This is faster than dropping and recreating all tables
    session = TestingSessionLocal()
    try:
        session.query(TaskDB).delete()
        session.query(WeeklyGoalDB).delete()
        session.query(UserDB).delete()
        session.commit()
    except Exception:
        session.rollback()
    finally:
        session.close()
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_user_data():
    return {
        "username": "integration_user",
        "email": "integration@example.com",
        "password": "integration_password"
    }

@pytest.fixture
def auth_headers(client, test_user_data):
    """Sign up and log in a user to get auth headers."""
    client.post("/api/auth/signup", json=test_user_data)
    response = client.post("/api/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    })
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
