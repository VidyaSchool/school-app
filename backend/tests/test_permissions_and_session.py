import os
import sys
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import pytest
from sqlalchemy.pool import StaticPool
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from models import User, Session as SessionModel, UserProfile, RolePermission, UserPermission
from app.core.database import get_db
from app.core.auth import (
    get_current_user,
    require_role,
    require_permission,
    require_any_permission,
    get_user_effective_permissions,
    invalidate_user_permissions_cache,
    DEFAULT_ROLE_PERMISSIONS
)
from app.core.cache import (
    get_cached_user_permissions,
    set_cached_user_permissions,
    invalidate_user_permissions,
    _memory_cache
)
from app.routes.profile import router as profile_router
from app.routes.admin import router as admin_router


# In-memory SQLite for testing
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SQLModel.metadata.create_all(test_engine)

def get_test_db():
    with Session(test_engine) as session:
        yield session

test_app = FastAPI()
test_app.include_router(profile_router)
test_app.include_router(admin_router)

# Custom test endpoints demonstrating require_permission
@test_app.get("/api/test/protected-marks")
def endpoint_protected_marks(user: User = Depends(require_permission("marks:read"))):
    return {"message": "marks granted", "user": user.name}

@test_app.get("/api/test/protected-roles-manage")
def endpoint_protected_roles(user: User = Depends(require_permission("roles:manage"))):
    return {"message": "roles manage granted", "user": user.name}

test_app.dependency_overrides[get_db] = get_test_db
client = TestClient(test_app)


@pytest.fixture(autouse=True)
def clean_state():
    _memory_cache.clear()
    with Session(test_engine) as session:
        session.query(UserPermission).delete()
        session.query(RolePermission).delete()
        session.query(SessionModel).delete()
        session.query(UserProfile).delete()
        session.query(User).delete()
        session.commit()
    yield
    _memory_cache.clear()


def create_user_and_session(role: str = "student", expired: bool = False):
    with Session(test_engine) as db:
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name=f"Test {role.capitalize()}",
            email=f"{role}_{uuid.uuid4().hex[:6]}@vidyaschool.com",
            role=role,
            email_verified=True
        )
        db.add(user)

        profile = UserProfile(
            id=str(uuid.uuid4()),
            user_id=user_id,
            username=f"{role}_{uuid.uuid4().hex[:6]}",
            onboarding_completed=True
        )
        db.add(profile)

        token = str(uuid.uuid4())
        session_obj = SessionModel(
            id=str(uuid.uuid4()),
            token=token,
            user_id=user_id,
            expires_at=datetime.utcnow() - timedelta(days=1) if expired else datetime.utcnow() + timedelta(days=7),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(session_obj)
        db.commit()
        db.refresh(user)
        db.expunge(user)
        return user, token


def test_unauthenticated_session_request_returns_401():
    res = client.get("/api/session")
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]


def test_authenticated_session_returns_user_role_and_permissions():
    user, token = create_user_and_session(role="student")
    client.cookies.set("better-auth.session_token", token)

    res = client.get("/api/session")
    assert res.status_code == 200
    data = res.json()
    assert data["isAuthenticated"] is True
    assert data["role"] == "student"
    assert data["user"]["id"] == user.id
    assert "marks:read" in data["permissions"]
    assert "attendance:read" in data["permissions"]
    assert "roles:manage" not in data["permissions"]


def test_session_expiration_returns_401():
    user, token = create_user_and_session(role="student", expired=True)
    client.cookies.set("better-auth.session_token", token)

    res = client.get("/api/session")
    assert res.status_code == 401
    assert "Session expired" in res.json()["detail"]


def test_permission_checks_in_fastapi_endpoints():
    student_user, student_token = create_user_and_session(role="student")
    admin_user, admin_token = create_user_and_session(role="admin")

    # 1. Student has marks:read -> 200 OK
    client.cookies.set("better-auth.session_token", student_token)
    res_ok = client.get("/api/test/protected-marks")
    assert res_ok.status_code == 200
    assert res_ok.json()["message"] == "marks granted"

    # 2. Student does NOT have roles:manage -> 403 Forbidden
    res_forbidden = client.get("/api/test/protected-roles-manage")
    assert res_forbidden.status_code == 403
    assert "Permission 'roles:manage' required" in res_forbidden.json()["detail"]

    # 3. Admin has wildcard / full access -> 200 OK
    client.cookies.set("better-auth.session_token", admin_token)
    res_admin = client.get("/api/test/protected-roles-manage")
    assert res_admin.status_code == 200
    assert res_admin.json()["message"] == "roles manage granted"


def test_redis_cache_aside_hit_and_miss():
    user, token = create_user_and_session(role="teacher")
    with Session(test_engine) as db:
        # Cache miss: initially not in cache
        assert get_cached_user_permissions(user.id) is None

        perms = get_user_effective_permissions(user.id, "teacher", db)
        assert "notes:write" in perms

        # Cache hit: now stored in cache
        cached = get_cached_user_permissions(user.id)
        assert cached is not None
        assert "notes:write" in cached

        # Second call returns identical permissions
        perms2 = get_user_effective_permissions(user.id, "teacher", db)
        assert perms == perms2


def test_cache_invalidation_after_role_change():
    student_user, student_token = create_user_and_session(role="student")
    admin_user, admin_token = create_user_and_session(role="admin")

    # 1. Warm cache for student
    with Session(test_engine) as db:
        get_user_effective_permissions(student_user.id, "student", db)
        assert get_cached_user_permissions(student_user.id) is not None

    # 2. Admin promotes student to teacher via API
    client.cookies.set("better-auth.session_token", admin_token)
    change_res = client.post("/api/admin/change-role", json={
        "userId": student_user.id,
        "role": "teacher"
    })
    assert change_res.status_code == 200

    # 3. Verify cache was immediately invalidated
    assert get_cached_user_permissions(student_user.id) is None

    # 4. Next session fetch returns updated teacher permissions
    client.cookies.set("better-auth.session_token", student_token)
    session_res = client.get("/api/session")
    assert session_res.status_code == 200
    data = session_res.json()
    assert data["role"] == "teacher"
    assert "notes:write" in data["permissions"]


def test_permission_revocation_and_stale_cache_protection():
    teacher_user, teacher_token = create_user_and_session(role="teacher")
    admin_user, admin_token = create_user_and_session(role="admin")

    # 1. Teacher initially has notes:read
    with Session(test_engine) as db:
        perms = get_user_effective_permissions(teacher_user.id, "teacher", db)
        assert "notes:read" in perms
        assert get_cached_user_permissions(teacher_user.id) is not None

    # 2. Admin revokes notes:read from this teacher
    client.cookies.set("better-auth.session_token", admin_token)
    revoke_res = client.post(f"/api/admin/users/{teacher_user.id}/permissions", json={
        "permission": "notes:read",
        "granted": False
    })
    assert revoke_res.status_code == 200

    # 3. Verify cache was immediately invalidated to prevent stale permissions
    assert get_cached_user_permissions(teacher_user.id) is None

    # 4. Derived permissions now exclude notes:read
    with Session(test_engine) as db:
        updated_perms = get_user_effective_permissions(teacher_user.id, "teacher", db)
        assert "notes:read" not in updated_perms


def test_redis_failure_graceful_database_fallback(monkeypatch):
    user, token = create_user_and_session(role="librarian")

    # Simulate Redis connection failure
    def mock_broken_get_cache(key):
        raise ConnectionError("Redis cluster unreachable")

    def mock_broken_set_cache(key, val, ttl=3600):
        raise ConnectionError("Redis cluster unreachable")

    monkeypatch.setattr("app.core.cache.get_cache", mock_broken_get_cache)
    monkeypatch.setattr("app.core.cache.set_cache", mock_broken_set_cache)

    with Session(test_engine) as db:
        # Fallback to PostgreSQL executes without crashing
        perms = get_user_effective_permissions(user.id, "librarian", db)
        assert "library:manage" in perms
        assert "library:borrow" in perms


def test_realtime_websocket_invalidation_broadcast(monkeypatch):
    target_user, target_token = create_user_and_session(role="student")
    admin_user, admin_token = create_user_and_session(role="admin")

    emitted_events = []
    async def mock_emit(event, data=None, **kwargs):
        emitted_events.append({"event": event, "data": data, "kwargs": kwargs})

    from main import sio
    monkeypatch.setattr(sio, "emit", mock_emit)

    client.cookies.set("better-auth.session_token", admin_token)
    res = client.post("/api/admin/change-role", json={
        "userId": target_user.id,
        "role": "teacher"
    })
    assert res.status_code == 200

    # Verify session:invalidated event was broadcast with target userId and new role
    invalidation_event = next(
        (e for e in emitted_events if e["event"] == "session:invalidated"),
        None
    )
    assert invalidation_event is not None
    assert invalidation_event["data"]["userId"] == target_user.id
    assert invalidation_event["data"]["role"] == "teacher"
    assert invalidation_event["data"]["reason"] == "role_changed"

