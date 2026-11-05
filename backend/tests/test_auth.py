"""
Unit and integration tests for Authentication and Resume CRUD.
Uses an isolated in-memory SQLite database to ensure tests pass reliably without requiring a live MySQL instance.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app, verify_database_schema
from app.auth import hash_password, verify_password, create_access_token

# Setup in-memory SQLite test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Creates fresh database schema before each test and tears it down afterwards.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    TestClient that overrides the get_db dependency with our test session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==========================================
# 1. Password Hashing & Verification Tests
# ==========================================

def test_password_hashing():
    plain = "secret123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong_password", hashed) is False


# ==========================================
# 2. JWT Generation & Payload Tests
# ==========================================

def test_jwt_token_generation():
    token = create_access_token(data={"sub": "1", "email": "junaid@example.com"})
    assert isinstance(token, str)
    assert len(token) > 20


def test_database_schema_check_rejects_missing_resume_columns():
    incomplete_engine = create_engine("sqlite:///:memory:")
    with incomplete_engine.begin() as connection:
        connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE resumes (id INTEGER PRIMARY KEY)"))

    with pytest.raises(RuntimeError, match="resumes.template_id"):
        verify_database_schema(incomplete_engine)

    incomplete_engine.dispose()


# ==========================================
# 3. Registration & Login Integration Tests
# ==========================================

def test_register_and_login_flow(client):
    # Step 1: Register new user
    register_payload = {
        "email": "junaid@example.com",
        "password": "Password123!",
        "full_name": "Mohammed Junaid Pasha",
    }
    reg_response = client.post("/api/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    user_data = reg_response.json()
    assert user_data["email"] == "junaid@example.com"
    assert user_data["full_name"] == "Mohammed Junaid Pasha"
    assert "password" not in user_data
    assert "hashed_password" not in user_data

    # Step 2: Attempt duplicate registration (must fail with 400)
    dup_response = client.post("/api/auth/register", json=register_payload)
    assert dup_response.status_code == 400

    # Step 3: Login with correct credentials
    login_payload = {
        "email": "junaid@example.com",
        "password": "Password123!",
    }
    login_response = client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    access_token = token_data["access_token"]

    # Step 4: Login with incorrect password (must fail with 401)
    bad_login_response = client.post("/api/auth/login", json={"email": "junaid@example.com", "password": "WrongPassword"})
    assert bad_login_response.status_code == 401

    # Step 5: Access protected /api/auth/me endpoint using Bearer token
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "junaid@example.com"


# ==========================================
# 4. Resume CRUD Integration Tests
# ==========================================

def test_resume_crud_with_authorization(client):
    # Register & Login
    client.post(
        "/api/auth/register",
        json={"email": "user1@example.com", "password": "Password123!", "full_name": "User One"},
    )
    login_res = client.post("/api/auth/login", json={"email": "user1@example.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Unauthorized access check
    unauth_res = client.get("/api/resumes")
    assert unauth_res.status_code == 401

    # Create Resume
    create_payload = {
        "title": "Software Engineer Resume",
        "content": {"summary": "Experienced CSE engineer", "skills": ["Python", "FastAPI"]},
    }
    create_res = client.post("/api/resumes", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    resume = create_res.json()
    assert resume["title"] == "Software Engineer Resume"
    resume_id = resume["id"]

    # List Resumes
    list_res = client.get("/api/resumes", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Get Single Resume
    get_res = client.get(f"/api/resumes/{resume_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == resume_id

    # Update Resume
    update_res = client.put(f"/api/resumes/{resume_id}", json={"title": "Updated Title"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"

    # Delete Resume
    del_res = client.delete(f"/api/resumes/{resume_id}", headers=headers)
    assert del_res.status_code == 204
