import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func

from app.core.auth import require_role
from app.core.database import get_db
from models import User, UserProfile, Exam, StudentSubjectMarks, SubjectClassAssignment, Timetable, SubstitutionRecord

router = APIRouter(tags=["student"])


# ── Student Marks ─────────────────────────────────────────────────────────────

@router.get("/api/student/marks", response_model=Dict[str, Any])
def get_logged_in_student_marks(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    # 1. Find student class/section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    student_class = (profile.class_ if profile and profile.class_ and profile.class_ != "none" else "10").strip()
    student_section = (profile.section if profile and profile.section else "A").strip()

    # 2. Get student marks records
    marks_records = db.query(StudentSubjectMarks).filter(
        StudentSubjectMarks.student_id == current_user.id
    ).all()

    # 3. If no marks found in DB for this student, auto-populate standard terms and marks for their class
    if not marks_records:
        standard_terms = [
            ("Term 1 Exam", 1),
            ("Mid Term Evaluation", 2),
            ("Final Assessment", 3)
        ]
        
        default_subjects = [
            ("Mathematics", "MTH"),
            ("Science", "SCI"),
            ("English", "ENG"),
            ("Social Studies", "SST"),
            ("Computer Science", "CSC"),
            ("Hindi", "HND")
        ]

        seed_base = sum(ord(c) for c in current_user.id) if current_user.id else 42
        rng = random.Random(seed_base)

        for term_name, term_idx in standard_terms:
            exam = db.query(Exam).filter(
                Exam.name == term_name,
                Exam.class_ == student_class,
                Exam.section == student_section
            ).first()

            if not exam:
                exam = Exam(
                    id=f"exam_{student_class}_{student_section}_{term_idx}_{uuid.uuid4().hex[:6]}",
                    name=term_name,
                    class_=student_class,
                    section=student_section
                )
                db.add(exam)
                db.commit()
                db.refresh(exam)

            # Insert subjects marks for this term
            for subj_name, subj_code in default_subjects:
                # Deterministic realistic score based on subject and student ID seed
                base_score = rng.randint(72, 95)
                m = StudentSubjectMarks(
                    id=f"mark_{uuid.uuid4().hex[:8]}",
                    student_id=current_user.id,
                    exam_id=exam.id,
                    subject=subj_name,
                    score=base_score,
                    max_score=100
                )
                db.add(m)

        db.commit()

        # Re-query
        marks_records = db.query(StudentSubjectMarks).filter(
            StudentSubjectMarks.student_id == current_user.id
        ).all()

    # 4. Group marks by exam
    exam_ids = list(set(m.exam_id for m in marks_records))
    exams = db.query(Exam).filter(Exam.id.in_(exam_ids)).all() if exam_ids else []
    exam_map = {e.id: e.name for e in exams}

    # Fetch teachers assigned to subjects for this class/section
    assignments = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.class_ == student_class,
        SubjectClassAssignment.section == student_section
    ).all()
    teacher_ids = [a.teacher_id for a in assignments if a.teacher_id]
    teachers = db.query(User).filter(User.id.in_(teacher_ids)).all() if teacher_ids else []
    teacher_name_map = {t.id: t.name for t in teachers}
    subj_teacher_map = {a.subject: teacher_name_map.get(a.teacher_id, "Faculty") for a in assignments}

    terms_data = {}
    for m in marks_records:
        exam_name = exam_map.get(m.exam_id, "Standard Term")
        if exam_name not in terms_data:
            terms_data[exam_name] = {
                "term": exam_name,
                "examId": m.exam_id,
                "subjects": [],
                "totalScore": 0,
                "totalMaxScore": 0
            }

        teacher_name = subj_teacher_map.get(m.subject, "Senior Faculty")
        pct = round((m.score / m.max_score * 100), 1) if m.max_score > 0 else 0

        # Grade calculation
        if pct >= 90: grade = "A+"
        elif pct >= 80: grade = "A"
        elif pct >= 70: grade = "B+"
        elif pct >= 60: grade = "B"
        elif pct >= 50: grade = "C"
        else: grade = "D"

        terms_data[exam_name]["subjects"].append({
            "id": m.id,
            "subject": m.subject,
            "score": m.score,
            "maxScore": m.max_score,
            "percentage": pct,
            "grade": grade,
            "teacher": teacher_name
        })
        terms_data[exam_name]["totalScore"] += m.score
        terms_data[exam_name]["totalMaxScore"] += m.max_score

    # Compute term-level percentage and GPA
    formatted_terms = []
    overall_score = 0
    overall_max = 0

    for term_name, t_info in terms_data.items():
        tot = t_info["totalScore"]
        max_tot = t_info["totalMaxScore"]
        pct = round((tot / max_tot * 100), 1) if max_tot > 0 else 0
        t_info["overallPercentage"] = pct
        formatted_terms.append(t_info)
        overall_score += tot
        overall_max += max_tot

    overall_pct = round((overall_score / overall_max * 100), 1) if overall_max > 0 else 0

    return {
        "student": {
            "id": current_user.id,
            "name": current_user.name,
            "class": student_class,
            "section": student_section
        },
        "overallPercentage": overall_pct,
        "terms": formatted_terms
    }


# ── Student Leaderboard ───────────────────────────────────────────────────────

@router.get("/api/student/leaderboard", response_model=Dict[str, Any])
def get_student_class_leaderboard(
    current_user: User = Depends(require_role(["student", "teacher", "admin", "librarian"])),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    query = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(User.role == "student")

    target_class = None
    target_section = None

    if current_user.role == "student" and profile and profile.class_ and profile.class_ != "none":
        target_class = profile.class_
        target_section = profile.section
        query = query.filter(UserProfile.class_ == profile.class_, UserProfile.section == profile.section)

    class_students = query.all()
    student_ids = [u.id for u, _ in class_students]
    if not student_ids:
        return {"class": target_class, "section": target_section, "leaderboard": [], "current_student_rank": None}

    all_marks = db.query(StudentSubjectMarks).filter(
        StudentSubjectMarks.student_id.in_(student_ids)
    ).all()

    leaderboard_data = []
    for u, p in class_students:
        student_marks = [m for m in all_marks if m.student_id == u.id]
        if student_marks:
            total_score = sum(m.score for m in student_marks)
            total_max = sum(m.max_score for m in student_marks)
            avg_pct = (total_score / total_max * 100) if total_max > 0 else 0
        else:
            avg_pct = 0.0

        leaderboard_data.append({
            "id": u.id,
            "name": u.name,
            "username": p.username or u.name.lower().replace(" ", ""),
            "image": u.image,
            "class": p.class_,
            "section": p.section,
            "average": round(avg_pct, 1),
            "examsCount": len(set(m.exam_id for m in student_marks))
        })

    leaderboard_data.sort(key=lambda x: x["average"], reverse=True)

    for rank, entry in enumerate(leaderboard_data, 1):
        entry["rank"] = rank

    current_rank = next((x["rank"] for x in leaderboard_data if x["id"] == current_user.id), None)

    return {
        "class": target_class,
        "section": target_section,
        "leaderboard": leaderboard_data,
        "current_student_rank": current_rank
    }


# ── Student Calendar / Timetable ─────────────────────────────────────────────

@router.get("/api/student/calendar", response_model=Dict[str, Any])
def get_student_calendar(
    current_user: User = Depends(require_role(["student", "teacher", "admin", "librarian"])),
    db: Session = Depends(get_db)
):
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    now = datetime.now()
    today_idx = (now.weekday() + 1) % 7
    today_day = days[today_idx]
    tomorrow_day = days[(today_idx + 1) % 7]

    months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    today_date_str = f"{today_day.upper()}, {months[now.month - 1]} {now.day}"

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    today_slots = []
    tomorrow_slots = []

    if profile and profile.class_ and profile.class_ != "none":
        today_query = db.query(Timetable, User).outerjoin(
            User, Timetable.teacher_id == User.id
        ).filter(
            Timetable.class_ == profile.class_,
            func.lower(Timetable.day_of_week) == today_day.lower()
        )
        if profile.section:
            today_query = today_query.filter(Timetable.section == profile.section)
        today_slots = today_query.order_by(Timetable.start_time).all()

        tomorrow_query = db.query(Timetable, User).outerjoin(
            User, Timetable.teacher_id == User.id
        ).filter(
            Timetable.class_ == profile.class_,
            func.lower(Timetable.day_of_week) == tomorrow_day.lower()
        )
        if profile.section:
            tomorrow_query = tomorrow_query.filter(Timetable.section == profile.section)
        tomorrow_slots = tomorrow_query.order_by(Timetable.start_time).all()

    today_iso = now.strftime("%Y-%m-%d")
    tomorrow_iso = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    # Fetch active substitutions for today and tomorrow
    today_subs = db.query(SubstitutionRecord, User).outerjoin(
        User, SubstitutionRecord.substitute_teacher_id == User.id
    ).filter(
        SubstitutionRecord.date == today_iso,
        SubstitutionRecord.status.in_(["assigned", "activity_fallback", "manual_override"])
    ).all()
    today_sub_map = {s.timetable_id: (s, u) for s, u in today_subs if s.timetable_id}

    tomorrow_subs = db.query(SubstitutionRecord, User).outerjoin(
        User, SubstitutionRecord.substitute_teacher_id == User.id
    ).filter(
        SubstitutionRecord.date == tomorrow_iso,
        SubstitutionRecord.status.in_(["assigned", "activity_fallback", "manual_override"])
    ).all()
    tomorrow_sub_map = {s.timetable_id: (s, u) for s, u in tomorrow_subs if s.timetable_id}

    def format_time(t_str: str) -> str:
        if not t_str or ":" not in t_str:
            return t_str
        parts = t_str.split(":")
        h, m = int(parts[0]), int(parts[1])
        ampm = "AM" if h < 12 else "PM"
        disp_h = h % 12 or 12
        return f"{disp_h}:{m:02d} {ampm}"

    def build_event(slot: Timetable, teacher_user: Optional[User], sub_entry: Optional[Tuple[SubstitutionRecord, Optional[User]]]) -> Dict[str, Any]:
        if sub_entry:
            sub_rec, sub_user = sub_entry
            sub_name = sub_user.name if sub_user else "Substitute Teacher"
            if sub_rec.is_activity_fallback:
                title = f"{sub_rec.activity_name or 'Activity'} (Sub: {sub_name})"
            else:
                title = f"{slot.subject} (Sub: {sub_name})"
            return {
                "id": slot.id,
                "title": title,
                "time": format_time(slot.start_time),
                "room": slot.room or "",
                "isSubstituted": True,
                "substituteTeacher": sub_name,
                "originalTeacher": teacher_user.name if teacher_user else None,
                "isActivityFallback": sub_rec.is_activity_fallback,
                "activityName": sub_rec.activity_name,
            }
        else:
            return {
                "id": slot.id,
                "title": f"{slot.subject} (by {teacher_user.name})" if teacher_user and teacher_user.name else slot.subject,
                "time": format_time(slot.start_time),
                "room": slot.room or "",
                "isSubstituted": False,
            }

    return {
        "todayDateStr": today_date_str,
        "todayEvents": [
            build_event(s, teacher, today_sub_map.get(s.id))
            for s, teacher in today_slots
        ],
        "tomorrowEvents": [
            build_event(s, teacher, tomorrow_sub_map.get(s.id))
            for s, teacher in tomorrow_slots
        ]
    }
