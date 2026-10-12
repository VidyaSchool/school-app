import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Set
from urllib.parse import unquote

from fastapi import Depends, HTTPException, Request
from sqlmodel import Session

from app.core.database import get_db
from models import User, Session as SessionModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "Unknown IP"


def create_session_token(
    user_id: str,
    db: Session,
    user_agent: Optional[str] = "VidyaSchool App",
    ip_address: Optional[str] = None
) -> str:
    token = str(uuid.uuid4())
    now = get_utc_now()
    session_obj = SessionModel(
        id=str(uuid.uuid4()),
        token=token,
        user_id=user_id,
        expires_at=now + timedelta(days=30),
        user_agent=user_agent or "VidyaSchool App",
        ip_address=ip_address or "Unknown IP",
        created_at=now,
        updated_at=now
    )
    db.add(session_obj)
    db.commit()
    return token


def decode_session_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return None

    try:
        decoded = unquote(token)
    except Exception:
        decoded = token

    if "." in decoded:
        parts = decoded.split(".", 1)
        if len(parts) == 2 and parts[0] and parts[1]:
            return parts[0]

    return decoded


def get_current_user(request: Request, db: Session = Depends(get_db)):
    raw_token = request.cookies.get("better-auth.session_token") or request.cookies.get("__Secure-better-auth.session_token")
    token = decode_session_token(raw_token)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = decode_session_token(auth_header.split(" ", 1)[1])

    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: No session token found")

    db_session = db.query(SessionModel).filter(SessionModel.token == token).first()

    if not db_session:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")

    if db_session.expires_at < get_utc_now():
        raise HTTPException(status_code=401, detail="Unauthorized: Session expired")

    db_user = db.query(User).filter(User.id == db_session.user_id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")

    return db_user


def require_role(allowed_roles: List[str]):
    def dependency(user: User = Depends(get_current_user)):
        roles = [r.lower() for r in allowed_roles]
        if "teacher" in roles and "librarian" not in roles:
            roles.append("librarian")
        if (user.role or "").lower() not in roles:
            raise HTTPException(status_code=403, detail="Forbidden: Access denied")
        return user

    return dependency


# ── Granular Role-Based Access Control (RBAC) ──────────────────────────────

DEFAULT_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": [
        "*",
        "admin:access",
        "roles:manage",
        "permissions:manage",
        "users:read", "users:write", "users:delete", "users:manage",
        "students:read", "students:write",
        "teachers:read", "teachers:write", "teachers:approve",
        "fees:read", "fees:write", "fees:manage",
        "notes:read", "notes:write", "notes:delete",
        "marks:read", "marks:write",
        "attendance:read", "attendance:write",
        "notices:read", "notices:write", "notices:delete",
        "timetable:read", "timetable:write",
        "library:read", "library:borrow", "library:manage",
        "documents:read", "documents:write", "documents:delete",
        "chats:read", "chats:write",
        "slider:manage", "pages:manage",
    ],
    "teacher": [
        "attendance:read", "attendance:write",
        "marks:read", "marks:write",
        "timetable:read",
        "notes:read", "notes:write", "notes:delete",
        "students:read",
        "teachers:read",
        "substitution:read",
        "notices:read", "notices:write",
        "chats:read", "chats:write",
        "library:read", "library:borrow",
        "documents:read", "documents:write",
    ],
    "librarian": [
        "library:read", "library:borrow", "library:manage",
        "students:read",
        "teachers:read",
        "notes:read", "notes:write",
        "notices:read", "notices:write",
        "chats:read", "chats:write",
        "documents:read", "documents:write",
    ],
    "account": [
        "fees:read", "fees:write", "fees:manage",
        "students:read",
        "notices:read",
        "documents:read",
    ],
    "student": [
        "attendance:read",
        "marks:read",
        "fees:read", "fees:pay",
        "timetable:read",
        "notes:read",
        "notices:read",
        "chats:read", "chats:write",
        "library:read", "library:borrow",
        "documents:read",
    ],
}


def get_user_effective_permissions(user_id: str, role: Optional[str], db: Session) -> List[str]:
    """
    Retrieve effective permissions for a user using Cache-Aside strategy:
    1. Try Redis cache (key: user:{user_id}:permissions)
    2. On miss / Redis offline -> Query PostgreSQL (RolePermission + UserPermission overrides)
    3. Store derived result in Redis with configurable TTL (default 3600s)
    """
    from app.core.cache import get_cached_user_permissions, set_cached_user_permissions

    # 1. Check Redis cache first
    try:
        cached_perms = get_cached_user_permissions(user_id)
        if cached_perms is not None and isinstance(cached_perms, list):
            return cached_perms
    except Exception:
        pass

    # 2. Database retrieval (PostgreSQL is authoritative)
    from models import RolePermission, UserPermission

    user_role = (role or "student").lower()
    perms_set: Set[str] = set()

    # Query role-level permissions from database
    try:
        db_role_perms = db.query(RolePermission.permission).filter(RolePermission.role == user_role).all()
        if db_role_perms:
            perms_set.update(p[0] for p in db_role_perms)
    except Exception:
        pass

    # Fallback to default role permissions if database role_permission has no records for this role
    if not perms_set:
        perms_set.update(DEFAULT_ROLE_PERMISSIONS.get(user_role, []))

    # Apply individual user permission overrides (grants and revocations)
    try:
        overrides = db.query(UserPermission).filter(UserPermission.user_id == user_id).all()
        for ov in overrides:
            if ov.granted:
                perms_set.add(ov.permission)
            else:
                perms_set.discard(ov.permission)
    except Exception:
        pass

    effective = sorted(list(perms_set))

    # 3. Store in Redis cache
    try:
        set_cached_user_permissions(user_id, effective)
    except Exception:
        pass

    return effective


def invalidate_user_permissions_cache(user_id: str) -> None:
    """Evict user's permissions from Redis and in-memory cache."""
    from app.core.cache import invalidate_user_permissions
    try:
        invalidate_user_permissions(user_id)
    except Exception:
        pass


def require_permission(permission: str):
    """
    FastAPI dependency enforcing that the authenticated user possesses the specified permission.
    Returns 401 if unauthenticated, 403 if unauthorized.
    """
    def dependency(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        perms = get_user_effective_permissions(user.id, user.role, db)
        if "*" in perms or (user.role or "").lower() == "admin":
            return user
        if permission not in perms:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Permission '{permission}' required"
            )
        return user

    return dependency


def require_any_permission(permissions: List[str]):
    """
    FastAPI dependency enforcing that the user possesses at least one of the specified permissions.
    """
    def dependency(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        perms = get_user_effective_permissions(user.id, user.role, db)
        if "*" in perms or (user.role or "").lower() == "admin":
            return user
        if not any(p in perms for p in permissions):
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: One of permissions {permissions} required"
            )
        return user

    return dependency
