import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select, func, desc

from app.core.auth import require_role, get_current_user
from app.core.database import get_db
from app.core.substitution_engine import (
    SubstitutionEngine,
    get_default_settings,
    class_to_required_category,
)
from models import (
    User,
    UserProfile,
    Timetable,
    TeacherAbsence,
    SubstitutionRecord,
    SubstitutionSettings,
)

router = APIRouter(tags=["substitution"])


# ── Pydantic Request Models ──────────────────────────────────────────────────

class MarkTeacherAbsentRequest(BaseModel):
    teacher_id: str
    date: str  # YYYY-MM-DD
    reason: str = "Sick Leave"
    duration: str = "Full Day"
    remarks: Optional[str] = None


class ManualOverrideRequest(BaseModel):
    substitute_teacher_id: Optional[str] = None
    is_activity_fallback: bool = False
    activity_name: Optional[str] = None
    notes: Optional[str] = None


class UpdateSubstitutionSettingsRequest(BaseModel):
    same_subject_score: Optional[float] = None
    same_category_score: Optional[float] = None
    same_class_score: Optional[float] = None
    same_section_score: Optional[float] = None
    matching_activity_skill_score: Optional[float] = None
    low_workload_bonus: Optional[float] = None
    workload_penalty_per_sub: Optional[float] = None
    high_workload_penalty: Optional[float] = None
    high_workload_threshold: Optional[int] = None
    activity_fallback_threshold: Optional[float] = None
    enabled_activities: Optional[List[str]] = None
    allow_cross_category: Optional[bool] = None


class UpdateTeacherSubstitutionProfileRequest(BaseModel):
    category: Optional[str] = None  # 'PRT', 'TGT', 'PGT'
    activity_skills: Optional[List[str]] = None
    is_available_for_substitution: Optional[bool] = None


# ── Helper for Socket Broadcast ──────────────────────────────────────────────

async def broadcast_substitution_update(date_str: str):
    """Notify all connected clients about substitution updates."""
    try:
        from main import sio
        await sio.emit("substitution_updated", {"date": date_str}, room="community")
        await sio.emit("substitution_updated", {"date": date_str}, broadcast=True)
    except Exception as e:
        print(f"Socket emit substitution_updated error: {e}")


# ── Absence Endpoints ────────────────────────────────────────────────────────

@router.get("/api/admin/absences")
def get_absent_teachers(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    admin: User = Depends(require_role(["admin", "teacher"])),
    db: Session = Depends(get_db),
):
    query = db.query(TeacherAbsence, User, UserProfile).join(
        User, TeacherAbsence.teacher_id == User.id
    ).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    )

    if date:
        query = query.filter(TeacherAbsence.date == date)

    absences = query.order_by(desc(TeacherAbsence.created_at)).all()

    # Calculate affected periods for each absence
    results = []
    for abs_record, u, p in absences:
        # Determine day of week
        try:
            target_dt = datetime.strptime(abs_record.date, "%Y-%m-%d")
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_of_week = days[target_dt.weekday()]
        except Exception:
            day_of_week = "Monday"

        # Count affected timetable slots
        affected_count = db.query(Timetable).filter(
            Timetable.teacher_id == u.id,
            func.lower(Timetable.day_of_week) == day_of_week.lower()
        ).count()

        results.append({
            "id": abs_record.id,
            "teacherId": u.id,
            "teacherName": u.name,
            "teacherEmail": u.email,
            "teacherImage": u.image,
            "teacherUsername": p.username if p else None,
            "admissionNumber": p.admission_number if p else None,
            "assignedClass": p.class_ if p else None,
            "category": p.teacher_category if p and p.teacher_category else "TGT",
            "date": abs_record.date,
            "dayOfWeek": day_of_week,
            "status": abs_record.status,
            "reason": abs_record.reason,
            "duration": abs_record.duration,
            "remarks": abs_record.remarks,
            "affectedPeriodsCount": affected_count,
            "createdAt": abs_record.created_at.isoformat() if abs_record.created_at else None,
        })

    return results


@router.post("/api/admin/absences")
async def mark_teacher_absent(
    data: MarkTeacherAbsentRequest,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    # Verify teacher exists
    teacher = db.query(User).filter(User.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check if already marked absent for this date
    existing = db.query(TeacherAbsence).filter(
        TeacherAbsence.teacher_id == data.teacher_id,
        TeacherAbsence.date == data.date
    ).first()

    if existing:
        existing.status = "absent"
        existing.reason = data.reason
        existing.duration = data.duration
        existing.remarks = data.remarks
        existing.updated_at = datetime.utcnow()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        absence_record = existing
    else:
        absence_record = TeacherAbsence(
            id=f"abs_{uuid.uuid4().hex[:12]}",
            teacher_id=data.teacher_id,
            date=data.date,
            status="absent",
            reason=data.reason,
            duration=data.duration,
            remarks=data.remarks,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(absence_record)
        db.commit()
        db.refresh(absence_record)

    # Automatically run global substitution allocation engine
    engine = SubstitutionEngine(db=db)
    allocations = engine.run_global_allocation(data.date)

    await broadcast_substitution_update(data.date)

    return {
        "success": True,
        "absenceId": absence_record.id,
        "teacherName": teacher.name,
        "date": data.date,
        "allocationsCount": len(allocations),
        "allocations": allocations,
    }


@router.delete("/api/admin/absences/{absence_id}")
async def remove_teacher_absence(
    absence_id: str,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    absence = db.query(TeacherAbsence).filter(TeacherAbsence.id == absence_id).first()
    if not absence:
        raise HTTPException(status_code=404, detail="Absence record not found")

    date_str = absence.date
    teacher_id = absence.teacher_id

    # Remove substitutions associated with this absence or teacher on this date
    db.query(SubstitutionRecord).filter(
        (SubstitutionRecord.absence_id == absence_id) |
        ((SubstitutionRecord.date == date_str) & (SubstitutionRecord.original_teacher_id == teacher_id))
    ).delete(synchronize_session=False)

    db.delete(absence)
    db.commit()

    # Re-run allocation if other absences exist on this date
    remaining_absences = db.query(TeacherAbsence).filter(
        TeacherAbsence.date == date_str,
        TeacherAbsence.status == "absent"
    ).count()

    if remaining_absences > 0:
        engine = SubstitutionEngine(db=db)
        engine.run_global_allocation(date_str)

    await broadcast_substitution_update(date_str)

    return {"success": True, "date": date_str}


# ── Substitution Records & Allocation Endpoints ──────────────────────────────

@router.get("/api/admin/substitutions")
def get_substitutions_for_date(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    admin: User = Depends(require_role(["admin", "teacher"])),
    db: Session = Depends(get_db),
):
    # Fetch all substitution records for this date
    subs = db.query(SubstitutionRecord).filter(
        SubstitutionRecord.date == date
    ).order_by(SubstitutionRecord.start_time).all()

    if not subs:
        # Check if absences exist and auto-run allocation if not yet run
        absences_count = db.query(TeacherAbsence).filter(
            TeacherAbsence.date == date,
            TeacherAbsence.status == "absent"
        ).count()
        if absences_count > 0:
            engine = SubstitutionEngine(db=db)
            engine.run_global_allocation(date)
            subs = db.query(SubstitutionRecord).filter(
                SubstitutionRecord.date == date
            ).order_by(SubstitutionRecord.start_time).all()

    # Gather user details
    user_ids = set()
    for s in subs:
        user_ids.add(s.original_teacher_id)
        if s.substitute_teacher_id:
            user_ids.add(s.substitute_teacher_id)

    users = db.query(User).filter(User.id.in_(list(user_ids))).all() if user_ids else []
    profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(list(user_ids))).all() if user_ids else []

    user_map = {u.id: u for u in users}
    prof_map = {p.user_id: p for p in profiles}

    # Fetch all candidates to generate alternatives list
    try:
        target_dt = datetime.strptime(date, "%Y-%m-%d")
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_of_week = days[target_dt.weekday()]
    except Exception:
        day_of_week = "Monday"

    engine = SubstitutionEngine(db=db)
    candidates = engine.load_teacher_candidates(date, day_of_week)
    absent_ids = {a.teacher_id for a in db.query(TeacherAbsence).filter(TeacherAbsence.date == date).all()}

    results = []
    for s in subs:
        orig_u = user_map.get(s.original_teacher_id)
        sub_u = user_map.get(s.substitute_teacher_id) if s.substitute_teacher_id else None
        sub_p = prof_map.get(s.substitute_teacher_id) if s.substitute_teacher_id else None

        # Parse breakdown
        breakdown_dict = {}
        if s.score_breakdown:
            try:
                breakdown_dict = json.loads(s.score_breakdown)
            except Exception:
                breakdown_dict = {}

        # Generate live candidate alternatives for dropdown
        req_mock = type("ReqMock", (), {
            "start_time": s.start_time,
            "end_time": s.end_time,
            "class_": s.class_,
            "section": s.section,
            "subject": s.subject,
            "original_teacher_id": s.original_teacher_id,
            "required_category": class_to_required_category(s.class_),
        })()

        alternatives = []
        for cid, cand in candidates.items():
            if cid == s.original_teacher_id or cid in absent_ids:
                continue
            is_el, sc, bk, reason = engine.evaluate_academic_candidate(
                candidate=cand,
                req=req_mock,
                absent_teacher_ids=absent_ids,
                assigned_in_period=set(),
            )
            alternatives.append({
                "teacherId": cand.id,
                "name": cand.name,
                "category": cand.category,
                "eligible": is_el,
                "score": sc if is_el else None,
                "breakdown": bk,
                "reason": reason,
            })

        alternatives.sort(key=lambda x: (x["eligible"], x["score"] or -999), reverse=True)

        results.append({
            "id": s.id,
            "date": s.date,
            "periodName": s.period_name,
            "startTime": s.start_time,
            "endTime": s.end_time,
            "class": s.class_,
            "section": s.section,
            "subject": s.subject,
            "room": s.room,
            "originalTeacher": {
                "id": orig_u.id if orig_u else s.original_teacher_id,
                "name": orig_u.name if orig_u else "Absent Teacher",
                "email": orig_u.email if orig_u else "",
                "image": orig_u.image if orig_u else None,
            },
            "substituteTeacher": {
                "id": sub_u.id,
                "name": sub_u.name,
                "email": sub_u.email,
                "image": sub_u.image,
                "category": sub_p.teacher_category if sub_p and sub_p.teacher_category else "TGT",
            } if sub_u else None,
            "status": s.status,
            "isActivityFallback": s.is_activity_fallback,
            "activityName": s.activity_name,
            "suitabilityScore": s.suitability_score,
            "scoreBreakdown": breakdown_dict,
            "notes": s.notes,
            "alternatives": alternatives[:8],
        })

    return results


@router.post("/api/admin/substitutions/run-allocation")
async def trigger_run_allocation(
    payload: Dict[str, str],
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    date_str = payload.get("date")
    if not date_str:
        raise HTTPException(status_code=400, detail="Date is required")

    engine = SubstitutionEngine(db=db)
    allocations = engine.run_global_allocation(date_str)

    await broadcast_substitution_update(date_str)

    return {
        "success": True,
        "date": date_str,
        "totalAllocations": len(allocations),
        "allocations": allocations,
    }


@router.post("/api/admin/substitutions/{substitution_id}/override")
async def override_substitution(
    substitution_id: str,
    data: ManualOverrideRequest,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    sub_rec = db.query(SubstitutionRecord).filter(SubstitutionRecord.id == substitution_id).first()
    if not sub_rec:
        raise HTTPException(status_code=404, detail="Substitution record not found")

    if data.is_activity_fallback:
        sub_rec.substitute_teacher_id = data.substitute_teacher_id
        sub_rec.is_activity_fallback = True
        sub_rec.activity_name = data.activity_name or "Activity Class"
        sub_rec.status = "activity_fallback"
        sub_rec.notes = data.notes or "Manual activity override by admin"
    elif data.substitute_teacher_id:
        target_teacher = db.query(User).filter(User.id == data.substitute_teacher_id).first()
        if not target_teacher:
            raise HTTPException(status_code=404, detail="Selected substitute teacher not found")
        sub_rec.substitute_teacher_id = data.substitute_teacher_id
        sub_rec.is_activity_fallback = False
        sub_rec.activity_name = None
        sub_rec.status = "manual_override"
        sub_rec.notes = data.notes or f"Manually assigned to {target_teacher.name} by admin"
    else:
        # Set unassigned
        sub_rec.substitute_teacher_id = None
        sub_rec.is_activity_fallback = False
        sub_rec.activity_name = None
        sub_rec.status = "unassigned"
        sub_rec.notes = data.notes or "Manually marked unassigned by admin"

    sub_rec.updated_at = datetime.utcnow()
    db.add(sub_rec)
    db.commit()
    db.refresh(sub_rec)

    await broadcast_substitution_update(sub_rec.date)

    return {"success": True, "recordId": sub_rec.id, "status": sub_rec.status}


# ── Substitution Settings Endpoints ──────────────────────────────────────────

@router.get("/api/admin/substitution/settings")
def get_substitution_settings(
    admin: User = Depends(require_role(["admin", "teacher"])),
    db: Session = Depends(get_db),
):
    settings = get_default_settings(db)
    try:
        enabled_acts = json.loads(settings.enabled_activities)
    except Exception:
        enabled_acts = ["Games / Sports", "Arts", "Music", "Library", "Computer"]

    return {
        "same_subject_score": settings.same_subject_score,
        "same_category_score": settings.same_category_score,
        "same_class_score": settings.same_class_score,
        "same_section_score": settings.same_section_score,
        "matching_activity_skill_score": settings.matching_activity_skill_score,
        "low_workload_bonus": settings.low_workload_bonus,
        "workload_penalty_per_sub": settings.workload_penalty_per_sub,
        "high_workload_penalty": settings.high_workload_penalty,
        "high_workload_threshold": settings.high_workload_threshold,
        "activity_fallback_threshold": settings.activity_fallback_threshold,
        "enabled_activities": enabled_acts,
        "allow_cross_category": settings.allow_cross_category,
    }


@router.post("/api/admin/substitution/settings")
def update_substitution_settings(
    data: UpdateSubstitutionSettingsRequest,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    settings = get_default_settings(db)

    if data.same_subject_score is not None: settings.same_subject_score = data.same_subject_score
    if data.same_category_score is not None: settings.same_category_score = data.same_category_score
    if data.same_class_score is not None: settings.same_class_score = data.same_class_score
    if data.same_section_score is not None: settings.same_section_score = data.same_section_score
    if data.matching_activity_skill_score is not None: settings.matching_activity_skill_score = data.matching_activity_skill_score
    if data.low_workload_bonus is not None: settings.low_workload_bonus = data.low_workload_bonus
    if data.workload_penalty_per_sub is not None: settings.workload_penalty_per_sub = data.workload_penalty_per_sub
    if data.high_workload_penalty is not None: settings.high_workload_penalty = data.high_workload_penalty
    if data.high_workload_threshold is not None: settings.high_workload_threshold = data.high_workload_threshold
    if data.activity_fallback_threshold is not None: settings.activity_fallback_threshold = data.activity_fallback_threshold
    if data.enabled_activities is not None: settings.enabled_activities = json.dumps(data.enabled_activities)
    if data.allow_cross_category is not None: settings.allow_cross_category = data.allow_cross_category

    settings.updated_at = datetime.utcnow()
    db.add(settings)
    db.commit()
    db.refresh(settings)

    return {"success": True, "message": "Substitution settings updated successfully"}


# ── Teacher Substitution Profile Endpoints ───────────────────────────────────

@router.get("/api/admin/teachers/substitution-roster")
def get_teachers_substitution_roster(
    admin: User = Depends(require_role(["admin", "teacher"])),
    db: Session = Depends(get_db),
):
    """
    Returns teachers roster with their category (PRT/TGT/PGT), activity skills,
    subjects taught, and substitution availability.
    """
    teachers = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role.in_(["teacher", "librarian"])
    ).all()

    # Sub counts all-time or this month
    results = []
    for u, p in teachers:
        skills = []
        if p.activity_skills:
            try:
                skills = json.loads(p.activity_skills)
            except Exception:
                skills = [s.strip() for s in p.activity_skills.split(",") if s.strip()]

        total_subs = db.query(SubstitutionRecord).filter(
            SubstitutionRecord.substitute_teacher_id == u.id,
            SubstitutionRecord.status.in_(["assigned", "activity_fallback", "manual_override"])
        ).count()

        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "image": u.image,
            "role": u.role,
            "category": p.teacher_category or "TGT",
            "activitySkills": skills,
            "isAvailableForSubstitution": p.is_available_for_substitution,
            "totalSubstitutions": total_subs,
            "assignedClass": p.class_,
            "assignedSection": p.section,
        })

    return results


@router.patch("/api/admin/teachers/{teacher_id}/substitution-profile")
def update_teacher_substitution_profile(
    teacher_id: str,
    data: UpdateTeacherSubstitutionProfileRequest,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == teacher_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    if data.category:
        if data.category not in ["PRT", "TGT", "PGT"]:
            raise HTTPException(status_code=400, detail="Category must be PRT, TGT, or PGT")
        profile.teacher_category = data.category

    if data.activity_skills is not None:
        profile.activity_skills = json.dumps(data.activity_skills)

    if data.is_available_for_substitution is not None:
        profile.is_available_for_substitution = data.is_available_for_substitution

    profile.updated_at = datetime.utcnow()
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {"success": True, "teacherId": teacher_id}
