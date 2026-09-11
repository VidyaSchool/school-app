import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from models import User, UserProfile, TeacherRequest

router = APIRouter(tags=["profile"])

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Account Info ──────────────────────────────────────────────────────────────

@router.get("/api/account")
def get_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            onboarding_completed=False,
            created_at=get_utc_now(),
            updated_at=get_utc_now()
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    prof_data = {
        "id": profile.id,
        "userId": profile.user_id,
        "admissionNumber": profile.admission_number,
        "username": profile.username,
        "phoneNumber": profile.phone_number,
        "parentName": profile.parent_name,
        "parentPhone": profile.parent_phone,
        "parentEmail": profile.parent_email,
        "address": profile.address,
        "city": profile.city,
        "state": profile.state,
        "pincode": profile.pincode,
        "class": profile.class_,
        "section": profile.section,
        "classSectionLastUpdated": profile.class_section_last_updated.isoformat() if profile.class_section_last_updated else None,
        "classSectionChanges": profile.class_section_changes,
        "secondaryRole": profile.secondary_role,
        "transportMode": profile.transport_mode,
        "onboardingCompleted": profile.onboarding_completed,
        "createdAt": profile.created_at.isoformat() if profile.created_at else None,
        "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
    }

    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "image": current_user.image,
        "role": current_user.role,
        "preferredRole": getattr(current_user, "preferred_role", None),
        "createdAt": current_user.created_at.isoformat() if hasattr(current_user, "created_at") and getattr(current_user, "created_at", None) else None
    }

    return {"user": user_data, "profile": prof_data}


# ── Profile Update ────────────────────────────────────────────────────────────

@router.patch("/api/profile")
@router.patch("/api/profile/update")
def update_user_profile(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    username = data.get("username")
    if username:
        clean_username = str(username).strip().lower()
        existing = db.query(UserProfile).filter(UserProfile.username == clean_username).first()
        if existing and existing.user_id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already taken")
        profile.username = clean_username

    if "phoneNumber" in data: profile.phone_number = data["phoneNumber"]
    if "parentName" in data: profile.parent_name = data["parentName"]
    if "parentPhone" in data: profile.parent_phone = data["parentPhone"]
    if "parentEmail" in data: profile.parent_email = data["parentEmail"]
    if "address" in data: profile.address = data["address"]
    if "city" in data: profile.city = data["city"]
    if "state" in data: profile.state = data["state"]
    if "pincode" in data: profile.pincode = data["pincode"]
    if "secondaryRole" in data: profile.secondary_role = data["secondaryRole"]
    if "transportMode" in data: profile.transport_mode = data["transportMode"]

    new_class = data.get("class")
    new_section = data.get("section")
    is_class_changed = new_class is not None and new_class != profile.class_
    is_section_changed = new_section is not None and new_section != profile.section

    if is_class_changed or is_section_changed:
        now = get_utc_now()
        if profile.class_section_last_updated:
            diff_days = (now - profile.class_section_last_updated).total_seconds() / 86400
            if diff_days < 365:
                next_allowed = profile.class_section_last_updated + timedelta(days=365)
                raise HTTPException(
                    status_code=400,
                    detail=f"You can only change your class and section once a year. Next change allowed after {next_allowed.strftime('%Y-%m-%d')}"
                )
        if new_class is not None: profile.class_ = new_class
        if new_section is not None: profile.section = new_section
        profile.class_section_last_updated = now

    profile.updated_at = get_utc_now()
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {"success": True, "newUsername": profile.username}


# ── Onboarding ────────────────────────────────────────────────────────────────

class OnboardingSubmitRequest(BaseModel):
    admissionNumber: Optional[str] = None
    username: str
    phoneNumber: Optional[str] = None
    parentName: Optional[str] = None
    parentPhone: Optional[str] = None
    parentEmail: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class")
    section: Optional[str] = None
    transportMode: Optional[str] = Field(default=None, alias="transportMode")
    secondaryRole: Optional[str] = None

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


@router.get("/api/onboarding/status")
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return {
        "onboardingCompleted": profile.onboarding_completed if profile else False
    }


@router.post("/api/onboarding")
def submit_onboarding(
    data: OnboardingSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.username:
        existing = db.query(UserProfile).filter(UserProfile.username == data.username).first()
        if existing and existing.user_id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already taken")
            
    if data.admissionNumber:
        existing = db.query(UserProfile).filter(UserProfile.admission_number == data.admissionNumber).first()
        if existing and existing.user_id != current_user.id:
            msg = "Teacher/Librarian ID already exists" if current_user.role in ("teacher", "librarian") else "Admission number already exists"
            raise HTTPException(status_code=400, detail=msg)
    
    secondary_role_val = data.secondaryRole if (current_user.role == "admin" and data.secondaryRole) else None
            
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    now = get_utc_now()
    if profile:
        if data.admissionNumber: profile.admission_number = data.admissionNumber
        profile.username = data.username
        if data.phoneNumber: profile.phone_number = data.phoneNumber
        if data.parentName: profile.parent_name = data.parentName
        if data.parentPhone: profile.parent_phone = data.parentPhone
        if data.parentEmail: profile.parent_email = data.parentEmail
        if data.address: profile.address = data.address
        if data.city: profile.city = data.city
        if data.state: profile.state = data.state
        if data.pincode: profile.pincode = data.pincode
        if data.class_: profile.class_ = data.class_
        if data.section: profile.section = data.section
        if data.transportMode: profile.transport_mode = data.transportMode
        if secondary_role_val: profile.secondary_role = secondary_role_val
        profile.class_section_last_updated = now
        profile.onboarding_completed = True
        profile.updated_at = now
        db.add(profile)
    else:
        profile = UserProfile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            admission_number=data.admissionNumber,
            username=data.username,
            phone_number=data.phoneNumber,
            parent_name=data.parentName,
            parent_phone=data.parentPhone,
            parent_email=data.parentEmail,
            address=data.address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
            class_=data.class_,
            section=data.section,
            secondary_role=secondary_role_val,
            transport_mode=data.transportMode,
            class_section_last_updated=now,
            onboarding_completed=True,
            created_at=now,
            updated_at=now
        )
        db.add(profile)
        
    db.commit()
    return {"success": True}


# ── Teacher Requests (Educator Submission) ───────────────────────────────────

@router.get("/api/teacher-requests")
def get_teacher_request(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(TeacherRequest).filter(TeacherRequest.user_id == current_user.id).first()
    if not req:
        return {"status": "none"}
    return {"status": req.status}


@router.post("/api/teacher-requests")
def create_teacher_request(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(TeacherRequest).filter(TeacherRequest.user_id == current_user.id).first()
    if existing:
        if existing.status == "rejected":
            existing.status = "pending"
            existing.updated_at = datetime.utcnow()
            db.add(existing)
            db.commit()
            return {"success": True, "status": "pending"}
        return {"success": True, "status": existing.status}
        
    req = TeacherRequest(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(req)
    db.commit()
    return {"success": True, "status": "pending"}
