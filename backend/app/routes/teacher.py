from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from models import User, UserProfile, FeeInstallment, SubjectClassRequest, SubjectClassAssignment, Exam, StudentSubjectMarks, TeacherNote, Timetable, TeacherAbsence, SubstitutionRecord

router = APIRouter(prefix="/teacher", tags=["teacher"])

# ── Teacher Notes ────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    title: Optional[str] = "Untitled"
    content: Optional[str] = ""
    color: Optional[str] = "default"
    class_: Optional[str] = Field(default=None, alias="class")
    section: Optional[str] = None
    subject: Optional[str] = None
    pdf_url: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class")
    section: Optional[str] = None
    subject: Optional[str] = None
    pdf_url: Optional[str] = None

ALLOWED_NOTE_ROLES = ["teacher", "admin", "librarian"]

@router.get("/notes")
def get_notes(
    current_user: User = Depends(require_role(ALLOWED_NOTE_ROLES)),
    db: Session = Depends(get_db)
):
    notes = db.query(TeacherNote).filter(
        TeacherNote.teacher_id == current_user.id
    ).order_by(TeacherNote.updated_at.desc()).all()
    return {"notes": [n.model_dump() for n in notes]}

@router.get("/notes/{note_id}")
def get_note(
    note_id: str,
    current_user: User = Depends(require_role(ALLOWED_NOTE_ROLES)),
    db: Session = Depends(get_db)
):
    note = db.query(TeacherNote).filter(
        TeacherNote.id == note_id,
        TeacherNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"note": note.model_dump()}

@router.post("/notes")
def create_note(
    body: NoteCreate,
    current_user: User = Depends(require_role(ALLOWED_NOTE_ROLES)),
    db: Session = Depends(get_db)
):
    note = TeacherNote(
        id=str(uuid.uuid4()),
        teacher_id=current_user.id,
        title=body.title or "Untitled",
        content=body.content or "",
        color=body.color or "default",
        class_=body.class_,
        section=body.section,
        subject=body.subject,
        pdf_url=body.pdf_url,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"success": True, "id": note.id}

@router.patch("/notes/{note_id}")
def update_note(
    note_id: str,
    body: NoteUpdate,
    current_user: User = Depends(require_role(ALLOWED_NOTE_ROLES)),
    db: Session = Depends(get_db)
):
    note = db.query(TeacherNote).filter(
        TeacherNote.id == note_id,
        TeacherNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    if body.color is not None:
        note.color = body.color
    if body.class_ is not None:
        note.class_ = body.class_
    if body.section is not None:
        note.section = body.section
    if body.subject is not None:
        note.subject = body.subject
    if body.pdf_url is not None:
        note.pdf_url = body.pdf_url
    note.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True}

@router.delete("/notes/{note_id}")
def delete_note(
    note_id: str,
    current_user: User = Depends(require_role(ALLOWED_NOTE_ROLES)),
    db: Session = Depends(get_db)
):
    note = db.query(TeacherNote).filter(
        TeacherNote.id == note_id,
        TeacherNote.teacher_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"success": True}

@router.get("/class/students", response_model=Dict[str, Any])
def get_class_students(
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get teacher profile
    teacher_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not teacher_profile or not teacher_profile.class_ or teacher_profile.class_ == "none":
        return {
            "class": "Not Assigned",
            "section": "None",
            "students": []
        }
    
    # 2. Get students in the same class and section
    student_records = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role == "student",
        UserProfile.class_ == teacher_profile.class_,
        UserProfile.section == teacher_profile.section
    ).all()
    
    # 3. Format students
    result = []
    for user_obj, profile in student_records:
        result.append({
            "id": profile.admission_number or f"STU-{user_obj.id[:8]}",
            "userId": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "image": user_obj.image,
        })
        
    return {
        "class": teacher_profile.class_,
        "section": teacher_profile.section or "None",
        "students": result
    }

@router.get("/student/{user_id}/details", response_model=Dict[str, Any])
def get_student_details(
    user_id: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get student user record
    student = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # 2. Get student profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    # 3. Get student fees
    fees_records = db.query(FeeInstallment).filter(FeeInstallment.user_id == user_id).all()
    
    marks_data = {}
    
    # Format profile details safely
    details = {
        "userId": student.id,
        "name": student.name,
        "email": student.email,
        "image": student.image,
        "admissionNumber": profile.admission_number if profile else None,
        "phoneNumber": profile.phone_number if profile else None,
        "parentName": profile.parent_name if profile else None,
        "parentPhone": profile.parent_phone if profile else None,
        "parentEmail": profile.parent_email if profile else None,
        "address": profile.address if profile else None,
        "city": profile.city if profile else None,
        "state": profile.state if profile else None,
        "pincode": profile.pincode if profile else None,
        "class": profile.class_ if profile else None,
        "section": profile.section if profile else None,
    }
    
    formatted_fees = []
    for fee in fees_records:
        formatted_fees.append({
            "id": fee.id,
            "month": fee.month,
            "year": fee.year,
            "amount": fee.amount,
            "dueDate": fee.due_date.isoformat() if fee.due_date else None,
            "status": fee.status,
            "paidDate": fee.paid_date.isoformat() if fee.paid_date else None,
            "receiptNo": fee.receipt_no,
            "paymentMethod": fee.payment_method
        })
        
    # Query real exams and marks for the student
    student_exams = []
    student_exam_scores = {}
    if profile and profile.class_ and profile.section:
        exams = db.query(Exam).filter(
            Exam.class_ == profile.class_,
            Exam.section == profile.section
        ).all()
        student_exams = [
            {
                "id": e.id,
                "name": e.name,
                "createdAt": e.created_at.isoformat()
            } for e in exams
        ]
        exam_ids = [e.id for e in exams]
        if exam_ids:
            real_marks = db.query(StudentSubjectMarks).filter(
                StudentSubjectMarks.student_id == user_id,
                StudentSubjectMarks.exam_id.in_(exam_ids)
            ).all()
            for m in real_marks:
                if m.exam_id not in student_exam_scores:
                    student_exam_scores[m.exam_id] = {}
                student_exam_scores[m.exam_id][m.subject] = m.score

    return {
        "details": details,
        "marks": {},
        "fees": formatted_fees,
        "exams": student_exams,
        "examScores": student_exam_scores
    }

import uuid
from pydantic import BaseModel, Field
from datetime import datetime

class SubjectRequestCreate(BaseModel):
    class_: str = Field(alias="class")
    section: str
    subject: str

    class Config:
        populate_by_name = True

@router.get("/subjects", response_model=Dict[str, Any])
def get_teacher_subjects(
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get assignments
    assignments = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.teacher_id == current_user.id
    ).all()
    
    # 2. Get requests
    requests = db.query(SubjectClassRequest).filter(
        SubjectClassRequest.teacher_id == current_user.id
    ).all()
    
    # Check if this teacher is also a class teacher
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    is_class_teacher = profile.class_ is not None and profile.class_ != "none" if profile else False
    class_name = profile.class_ if is_class_teacher else None
    section_name = profile.section if is_class_teacher else None

    return {
        "assignments": [
            {
                "id": a.id,
                "class": a.class_,
                "section": a.section,
                "subject": a.subject,
                "createdAt": a.created_at.isoformat()
            } for a in assignments
        ],
        "requests": [
            {
                "id": r.id,
                "class": r.class_,
                "section": r.section,
                "subject": r.subject,
                "status": r.status,
                "createdAt": r.created_at.isoformat()
            } for r in requests
        ],
        "isClassTeacher": is_class_teacher,
        "class": class_name,
        "section": section_name
    }

@router.post("/subjects/request", response_model=Dict[str, Any])
def create_subject_request(
    payload: SubjectRequestCreate,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # Check if there is already an active assignment or pending request for the same class, section, subject
    existing_request = db.query(SubjectClassRequest).filter(
        SubjectClassRequest.teacher_id == current_user.id,
        SubjectClassRequest.class_ == payload.class_,
        SubjectClassRequest.section == payload.section,
        SubjectClassRequest.subject == payload.subject,
        SubjectClassRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request for this subject-class.")
        
    existing_assignment = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.teacher_id == current_user.id,
        SubjectClassAssignment.class_ == payload.class_,
        SubjectClassAssignment.section == payload.section,
        SubjectClassAssignment.subject == payload.subject
    ).first()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="You are already assigned to teach this subject-class.")

    new_request = SubjectClassRequest(
        id=f"req_{uuid.uuid4().hex[:8]}",
        teacher_id=current_user.id,
        class_=payload.class_,
        section=payload.section,
        subject=payload.subject,
        status="pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return {"status": "success", "id": new_request.id}

@router.get("/requests/pending", response_model=List[Dict[str, Any]])
def get_pending_class_requests(
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get current teacher's profile to find their class and section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or not profile.class_ or profile.class_ == "none":
        # Not a class teacher, return empty list
        return []
        
    # 2. Get pending requests for this class and section
    requests = db.query(SubjectClassRequest, User).join(
        User, SubjectClassRequest.teacher_id == User.id
    ).filter(
        SubjectClassRequest.class_ == profile.class_,
        SubjectClassRequest.section == profile.section,
        SubjectClassRequest.status == "pending"
    ).all()
    
    return [
        {
            "id": r.id,
            "class": r.class_,
            "section": r.section,
            "subject": r.subject,
            "status": r.status,
            "createdAt": r.created_at.isoformat(),
            "teacher": {
                "id": u.id,
                "name": u.name,
                "email": u.email
            }
        } for r, u in requests
    ]

@router.post("/requests/{request_id}/approve", response_model=Dict[str, Any])
def approve_subject_request(
    request_id: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get the request
    req = db.query(SubjectClassRequest).filter(SubjectClassRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is already resolved")
        
    # 2. Verify current user is class teacher of req.class_ / req.section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or (profile.class_ != req.class_ or profile.section != req.section):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only the class teacher of this class can approve requests.")
            
    # Approve request
    req.status = "approved"
    req.updated_at = datetime.utcnow()
    db.add(req)
    
    # Create assignment
    assignment = SubjectClassAssignment(
        id=f"asgn_{uuid.uuid4().hex[:8]}",
        teacher_id=req.teacher_id,
        class_=req.class_,
        section=req.section,
        subject=req.subject
    )
    db.add(assignment)
    db.commit()
    return {"status": "success"}

@router.post("/requests/{request_id}/reject", response_model=Dict[str, Any])
def reject_subject_request(
    request_id: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get the request
    req = db.query(SubjectClassRequest).filter(SubjectClassRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is already resolved")
        
    # 2. Verify current user is class teacher of req.class_ / req.section
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or (profile.class_ != req.class_ or profile.section != req.section):
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only the class teacher of this class can reject requests.")
            
    # Reject request
    req.status = "rejected"
    req.updated_at = datetime.utcnow()
    db.add(req)
    db.commit()
    return {"status": "success"}

@router.get("/subjects/students", response_model=Dict[str, Any])
def get_subject_class_students(
    class_name: str,
    section_name: str,
    subject_name: str = None,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Access verification: check if teacher is assigned to this class/section OR is class teacher of it OR is admin
    is_assigned = db.query(SubjectClassAssignment).filter(
        SubjectClassAssignment.teacher_id == current_user.id,
        SubjectClassAssignment.class_ == class_name,
        SubjectClassAssignment.section == section_name
    ).first() is not None

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    is_class_teacher = profile and profile.class_ == class_name and profile.section == section_name

    if not is_assigned and not is_class_teacher and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view the student list for this class-section."
        )

    # 2. Get students in the specified class and section
    student_records = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role == "student",
        UserProfile.class_ == class_name,
        UserProfile.section == section_name
    ).all()
    
    # 3. Get all exams for this class and section
    exams = db.query(Exam).filter(
        Exam.class_ == class_name,
        Exam.section == section_name
    ).order_by(Exam.created_at.desc()).all()
    exam_ids = [e.id for e in exams]

    # 4. Get all marks for these exams and this subject
    marks_records = []
    if exam_ids and subject_name:
        marks_records = db.query(StudentSubjectMarks).filter(
            StudentSubjectMarks.exam_id.in_(exam_ids),
            StudentSubjectMarks.subject == subject_name
        ).all()

    # Organize marks by student_id and exam_id
    marks_map = {}
    for m in marks_records:
        if m.student_id not in marks_map:
            marks_map[m.student_id] = {}
        marks_map[m.student_id][m.exam_id] = m.score

    # 5. Format student records
    result = []
    for user_obj, prof in student_records:
        student_id = user_obj.id
        student_exam_scores = {}
        for exam_id in exam_ids:
            student_exam_scores[exam_id] = marks_map.get(student_id, {}).get(exam_id, None)

        result.append({
            "id": prof.admission_number or f"STU-{user_obj.id[:8]}",
            "userId": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "image": user_obj.image,
            "examScores": student_exam_scores
        })
        
    return {
        "class": class_name,
        "section": section_name,
        "students": result
    }

class ExamCreate(BaseModel):
    name: str
    class_name: str = Field(alias="class_name")
    section_name: str = Field(alias="section_name")

    class Config:
        populate_by_name = True

class MarksSave(BaseModel):
    exam_id: str
    subject: str
    scores: Dict[str, float]  # mapping from student_user_id to score

@router.get("/exams", response_model=List[Dict[str, Any]])
def get_exams(
    class_name: str,
    section_name: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    exams = db.query(Exam).filter(
        Exam.class_ == class_name,
        Exam.section == section_name
    ).order_by(Exam.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "class": e.class_,
            "section": e.section,
            "createdAt": e.created_at.isoformat()
        } for e in exams
    ]

@router.post("/exams", response_model=Dict[str, Any])
def create_exam(
    payload: ExamCreate,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # Check if this exam name already exists for this class/section
    existing = db.query(Exam).filter(
        Exam.class_ == payload.class_name,
        Exam.section == payload.section_name,
        Exam.name == payload.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="An exam with this name already exists for this class and section.")

    new_exam = Exam(
        id=f"exm_{uuid.uuid4().hex[:8]}",
        name=payload.name,
        class_=payload.class_name,
        section=payload.section_name
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return {
        "status": "success",
        "id": new_exam.id,
        "name": new_exam.name
    }

@router.get("/marks", response_model=Dict[str, Any])
def get_marks(
    exam_id: str,
    subject: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Get the exam
    exam_obj = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam_obj:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # 2. Get students in this class and section
    student_records = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.role == "student",
        UserProfile.class_ == exam_obj.class_,
        UserProfile.section == exam_obj.section
    ).all()
    
    # 3. Get existing marks
    existing_marks = db.query(StudentSubjectMarks).filter(
        StudentSubjectMarks.exam_id == exam_id,
        StudentSubjectMarks.subject == subject
    ).all()
    marks_map = {m.student_id: m.score for m in existing_marks}
    
    # 4. Format students with their scores
    students_list = []
    for user_obj, prof in student_records:
        score = marks_map.get(user_obj.id, None)
        students_list.append({
            "id": prof.admission_number or f"STU-{user_obj.id[:8]}",
            "userId": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "score": score
        })
        
    return {
        "examId": exam_obj.id,
        "examName": exam_obj.name,
        "class": exam_obj.class_,
        "section": exam_obj.section,
        "subject": subject,
        "students": students_list
    }

@router.post("/marks", response_model=Dict[str, Any])
def save_marks(
    payload: MarksSave,
    current_user: User = Depends(require_role(["teacher", "admin"])),
    db: Session = Depends(get_db)
):
    exam_obj = db.query(Exam).filter(Exam.id == payload.exam_id).first()
    if not exam_obj:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # For each student score, upsert
    for student_user_id, score in payload.scores.items():
        # Check if record exists
        record = db.query(StudentSubjectMarks).filter(
            StudentSubjectMarks.exam_id == payload.exam_id,
            StudentSubjectMarks.student_id == student_user_id,
            StudentSubjectMarks.subject == payload.subject
        ).first()
        
        if record:
            record.score = score
            record.updated_at = datetime.utcnow()
            db.add(record)
        else:
            new_record = StudentSubjectMarks(
                id=f"mrk_{uuid.uuid4().hex[:8]}",
                student_id=student_user_id,
                exam_id=payload.exam_id,
                subject=payload.subject,
                score=score
            )
            db.add(new_record)
            
    db.commit()

    # ── Instant notification: tell each student their marks were uploaded ──
    try:
        import asyncio
        from main import send_notification_to_user

        # Group scores by student for a meaningful message
        student_ids = list(payload.scores.keys())
        exam_name = exam_obj.name

        async def _notify():
            notif_db = next(get_db())
            try:
                for sid in student_ids:
                    score = payload.scores[sid]
                    await send_notification_to_user(
                        sid,
                        "📝 Marks Published",
                        f"Your {payload.subject} marks for {exam_name} are out! "
                        f"You scored {int(score) if score == int(score) else score}/100. "
                        f"Check your profile to view details.",
                        notif_db
                    )
            finally:
                notif_db.close()

        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(_notify())
        else:
            loop.run_until_complete(_notify())
    except Exception as _e:
        print(f"[Marks] Notification error (non-fatal): {_e}")

    return {"status": "success"}

# ── Teacher Calendar Agenda Endpoint ──────────────────────────────────────────

@router.get("/calendar")
def get_teacher_calendar(
    current_user: User = Depends(require_role(["teacher", "admin", "librarian"])),
    db: Session = Depends(get_db)
):
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    now = datetime.now()
    # Python weekday(): Monday is 0, Sunday is 6.
    # Map to days list where Sunday is index 0.
    today_idx = (now.weekday() + 1) % 7
    today_day = days[today_idx]
    tomorrow_day = days[(today_idx + 1) % 7]

    months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    today_date_str = f"{today_day.upper()}, {months[now.month - 1]} {now.day}"

    today_slots = db.query(Timetable).filter(
        Timetable.teacher_id == current_user.id,
        Timetable.day_of_week == today_day
    ).order_by(Timetable.start_time).all()

    tomorrow_slots = db.query(Timetable).filter(
        Timetable.teacher_id == current_user.id,
        Timetable.day_of_week == tomorrow_day
    ).order_by(Timetable.start_time).all()

    today_iso = now.strftime("%Y-%m-%d")
    tomorrow_iso = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    # Check if this teacher is absent today or tomorrow
    is_absent_today = db.query(TeacherAbsence).filter(
        TeacherAbsence.teacher_id == current_user.id,
        TeacherAbsence.date == today_iso,
        TeacherAbsence.status == "absent"
    ).first() is not None

    is_absent_tomorrow = db.query(TeacherAbsence).filter(
        TeacherAbsence.teacher_id == current_user.id,
        TeacherAbsence.date == tomorrow_iso,
        TeacherAbsence.status == "absent"
    ).first() is not None

    # Substitutions covering for this teacher if absent
    sub_for_today = {
        s.timetable_id: (s, u) for s, u in db.query(SubstitutionRecord, User).outerjoin(
            User, SubstitutionRecord.substitute_teacher_id == User.id
        ).filter(
            SubstitutionRecord.date == today_iso,
            SubstitutionRecord.original_teacher_id == current_user.id
        ).all()
        if s.timetable_id
    }

    sub_for_tomorrow = {
        s.timetable_id: (s, u) for s, u in db.query(SubstitutionRecord, User).outerjoin(
            User, SubstitutionRecord.substitute_teacher_id == User.id
        ).filter(
            SubstitutionRecord.date == tomorrow_iso,
            SubstitutionRecord.original_teacher_id == current_user.id
        ).all()
        if s.timetable_id
    }

    # Substitutions assigned TO this teacher to cover for someone else
    assigned_subs_today = db.query(SubstitutionRecord, User).join(
        User, SubstitutionRecord.original_teacher_id == User.id
    ).filter(
        SubstitutionRecord.date == today_iso,
        SubstitutionRecord.substitute_teacher_id == current_user.id,
        SubstitutionRecord.status.in_(["assigned", "activity_fallback", "manual_override"])
    ).all()

    assigned_subs_tomorrow = db.query(SubstitutionRecord, User).join(
        User, SubstitutionRecord.original_teacher_id == User.id
    ).filter(
        SubstitutionRecord.date == tomorrow_iso,
        SubstitutionRecord.substitute_teacher_id == current_user.id,
        SubstitutionRecord.status.in_(["assigned", "activity_fallback", "manual_override"])
    ).all()

    def format_time(t_str: str) -> str:
        if not t_str or ":" not in t_str:
            return t_str
        try:
            parts = t_str.split(":")
            h = int(parts[0])
            m = parts[1]
            ampm = "PM" if h >= 12 else "AM"
            h_12 = h % 12 or 12
            return f"{h_12}:{m} {ampm}"
        except Exception:
            return t_str

    # Build today events
    today_events = []
    for s in today_slots:
        if is_absent_today:
            sub_pair = sub_for_today.get(s.id)
            sub_u = sub_pair[1] if sub_pair else None
            sub_name = sub_u.name if sub_u else "Substitute Teacher"
            title = f"{s.subject} (Class {s.class_}-{s.section}) [Absent - Covered by {sub_name}]"
        else:
            title = f"{s.subject} (Class {s.class_}-{s.section})"

        today_events.append({
            "id": s.id,
            "title": title,
            "time": format_time(s.start_time),
            "room": s.room or "",
            "isAbsent": is_absent_today,
            "isSubstitution": False,
        })

    # Add substitutions assigned to this teacher today
    for sub, orig_u in assigned_subs_today:
        label = sub.activity_name if sub.is_activity_fallback else sub.subject
        today_events.append({
            "id": sub.id,
            "title": f"Substitution: {label} (Class {sub.class_}-{sub.section}) [Covering for {orig_u.name}]",
            "time": format_time(sub.start_time),
            "room": sub.room or "",
            "isAbsent": False,
            "isSubstitution": True,
            "isActivityFallback": sub.is_activity_fallback,
        })

    # Build tomorrow events
    tomorrow_events = []
    for s in tomorrow_slots:
        if is_absent_tomorrow:
            sub_pair = sub_for_tomorrow.get(s.id)
            sub_u = sub_pair[1] if sub_pair else None
            sub_name = sub_u.name if sub_u else "Substitute Teacher"
            title = f"{s.subject} (Class {s.class_}-{s.section}) [Absent - Covered by {sub_name}]"
        else:
            title = f"{s.subject} (Class {s.class_}-{s.section})"

        tomorrow_events.append({
            "id": s.id,
            "title": title,
            "time": format_time(s.start_time),
            "room": s.room or "",
            "isAbsent": is_absent_tomorrow,
            "isSubstitution": False,
        })

    for sub, orig_u in assigned_subs_tomorrow:
        label = sub.activity_name if sub.is_activity_fallback else sub.subject
        tomorrow_events.append({
            "id": sub.id,
            "title": f"Substitution: {label} (Class {sub.class_}-{sub.section}) [Covering for {orig_u.name}]",
            "time": format_time(sub.start_time),
            "room": sub.room or "",
            "isAbsent": False,
            "isSubstitution": True,
            "isActivityFallback": sub.is_activity_fallback,
        })

    return {
        "todayDateStr": today_date_str,
        "isAbsentToday": is_absent_today,
        "isAbsentTomorrow": is_absent_tomorrow,
        "todayEvents": today_events,
        "tomorrowEvents": tomorrow_events,
    }

