from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
from app.core.auth import get_current_user, decode_session_token
from app.core.database import get_db
from models import Session as SessionModel, User

router = APIRouter()

@router.get("/api/sessions/active")
def get_active_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_token = request.cookies.get("better-auth.session_token") or request.cookies.get("__Secure-better-auth.session_token")
    token = decode_session_token(raw_token)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = decode_session_token(auth_header.split(" ", 1)[1])

    sessions = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.expires_at > datetime.utcnow()
    ).order_by(SessionModel.updated_at.desc()).all()

    res = []
    for s in sessions:
        res.append({
            "id": s.id,
            "token": s.token,
            "ip_address": s.ip_address or "Unknown IP",
            "user_agent": s.user_agent or "Unknown Device",
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            "is_current": s.token == token
        })
    return res

@router.delete("/api/sessions/revoke/{session_id}")
def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()

    if not target:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(target)
    db.commit()
    return {"success": True, "message": "Session revoked successfully"}

@router.post("/api/sessions/revoke-others")
def revoke_other_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_token = request.cookies.get("better-auth.session_token") or request.cookies.get("__Secure-better-auth.session_token")
    token = decode_session_token(raw_token)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = decode_session_token(auth_header.split(" ", 1)[1])

    if not token:
        raise HTTPException(status_code=400, detail="Current token missing")

    db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.token != token
    ).delete(synchronize_session=False)

    db.commit()
    return {"success": True, "message": "All other sessions revoked"}
