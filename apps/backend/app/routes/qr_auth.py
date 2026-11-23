"""
QR Code Login — Backend Route
================================
Flow:
  1. Web browser calls POST /api/auth/qr/generate  → gets { qr_token, expires_in }
  2. Frontend renders the qr_token as a QR code.
  3. Mobile app scans QR, sends POST /api/auth/qr/confirm with its Bearer session token
     and the qr_token it read from the QR code.
  4. Backend marks the token "confirmed", creates a new web session for the user, and
     pushes a Socket.IO event "qr_auth_confirmed" to the room named qr_token.
  5. The web browser, which joined that Socket.IO room after step 1, receives the event
     and immediately logs the user in (stores the session token in a cookie via an
     authenticated redirect endpoint).
  6. GET /api/auth/qr/status/{qr_token} is a REST polling fallback for environments
     where Socket.IO may not be available.

Security:
  - Each token is a cryptographically random UUID (128-bit entropy).
  - Tokens expire after 3 minutes.
  - A token can only be confirmed once (state machine: pending → confirmed → consumed).
  - The web session is created only after the mobile user's identity is verified via
    their existing session token.
"""

import uuid
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session

from app.core.auth import get_current_user, create_session_token, get_client_ip
from app.core.database import get_db
from models import User, UserProfile

router = APIRouter(tags=["qr-auth"])

# ---------------------------------------------------------------------------
# In-memory store  { qr_token: {...state...} }
# ---------------------------------------------------------------------------
QR_STORE: Dict[str, Dict[str, Any]] = {}

QR_TTL_SECONDS = 180  # 3 minutes


def _purge_expired() -> None:
    """Remove stale entries from the store (lazy GC)."""
    now = datetime.utcnow()
    expired = [k for k, v in QR_STORE.items() if now > v["expires_at"]]
    for k in expired:
        QR_STORE.pop(k, None)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class QRGenerateResponse(BaseModel):
    qr_token: str
    expires_in: int = QR_TTL_SECONDS


class QRConfirmRequest(BaseModel):
    qr_token: str


class QRStatusResponse(BaseModel):
    status: str  # "pending" | "confirmed" | "expired"
    session_token: Optional[str] = None
    user: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/api/auth/qr/generate", response_model=QRGenerateResponse)
def generate_qr_token():
    """
    Step 1 — Web browser requests a fresh QR token.
    No authentication required — the QR code IS the challenge.
    """
    _purge_expired()

    qr_token = secrets.token_urlsafe(32)          # ~256 bits of entropy
    expires_at = datetime.utcnow() + timedelta(seconds=QR_TTL_SECONDS)

    QR_STORE[qr_token] = {
        "status": "pending",
        "expires_at": expires_at,
        "session_token": None,
        "user_info": None,
    }

    return QRGenerateResponse(qr_token=qr_token, expires_in=QR_TTL_SECONDS)


@router.post("/api/auth/qr/confirm")
async def confirm_qr_token(
    body: QRConfirmRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step 2 — Mobile app (authenticated) scans the QR and hits this endpoint.
    Validates the QR token, creates a new web session, and emits a Socket.IO
    event so the browser is notified immediately.
    """
    _purge_expired()

    qr_token = body.qr_token.strip()
    entry = QR_STORE.get(qr_token)

    if entry is None or datetime.utcnow() > entry["expires_at"]:
        raise HTTPException(status_code=404, detail="QR code has expired or is invalid.")

    if entry["status"] != "pending":
        raise HTTPException(status_code=409, detail="QR code has already been used.")

    # Create a new session for this user (the web login session)
    user_agent = request.headers.get("User-Agent", "VidyaSchool Mobile App")
    client_ip = get_client_ip(request)

    new_session_token = create_session_token(
        current_user.id, db, user_agent=f"QR Login ({user_agent})", ip_address=client_ip
    )

    # Gather user info to send to the web browser
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    user_info = {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name or "User",
        "role": current_user.role or "student",
        "image": current_user.image,
        "class": profile.class_ if profile else None,
        "section": profile.section if profile else None,
    }

    # Update the store
    entry["status"] = "confirmed"
    entry["session_token"] = new_session_token
    entry["user_info"] = user_info

    # Emit Socket.IO event to the browser room immediately
    try:
        from main import sio  # imported here to avoid circular import at module load
        await sio.emit(
            "qr_auth_confirmed",
            {
                "session_token": new_session_token,
                "user": user_info,
            },
            room=f"qr_{qr_token}",
        )
    except Exception as e:
        # Socket.IO emission failure is non-fatal — the browser can still poll
        import logging
        logging.getLogger(__name__).warning("sio.emit failed: %s", e)

    return {
        "success": True,
        "message": f"Authenticated as {user_info['name']}. The browser session has been activated.",
    }


@router.get("/api/auth/qr/status/{qr_token}", response_model=QRStatusResponse)
def poll_qr_status(qr_token: str):
    """
    REST polling fallback — browser polls every 2 s for confirmation.
    After returning 'confirmed' the entry is consumed (one-shot).
    """
    _purge_expired()

    entry = QR_STORE.get(qr_token)

    if entry is None or datetime.utcnow() > entry["expires_at"]:
        return QRStatusResponse(status="expired")

    if entry["status"] == "confirmed":
        token = entry["session_token"]
        user = entry["user_info"]
        # Consume the entry so it can't be replayed
        QR_STORE.pop(qr_token, None)
        return QRStatusResponse(status="confirmed", session_token=token, user=user)

    return QRStatusResponse(status="pending")