import os
import sys
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure local imports resolve correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from mcp.server.fastmcp import FastMCP

from app.core.database import engine
from models import (
    User, 
    UserProfile, 
    SubjectClassAssignment, 
    SubjectClassRequest, 
    Exam, 
    StudentSubjectMarks, 
    Notice, 
    TeacherNote,
    Timetable
)

# Initialize FastMCP Server
mcp = FastMCP("VidyaSchool Teacher Dashboard")

# ── Helper: Resolve User by Email ──
def _get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()

# ── Tool 1: List Assigned Classes ──
@mcp.tool()
def list_assigned_classes(teacher_email: str) -> str:
    """
    List all subjects, classes, and sections assigned to a teacher.
    :param teacher_email: The email address of the teacher.
    """
    with Session(engine) as session:
        user = _get_user_by_email(session, teacher_email)
        if not user:
            return f"Error: User with email '{teacher_email}' not found."
            
        assignments = session.exec(
            select(SubjectClassAssignment).where(SubjectClassAssignment.teacher_id == user.id)
        ).all()
        
        if not assignments:
            return f"Teacher '{user.name}' ({teacher_email}) has no class assignments."
            
        res = [f"Class Assignments for {user.name}:"]
        for a in assignments:
            res.append(f"- Class: {a.class_} | Section: {a.section} | Subject: {a.subject}")
        return "\n".join(res)

# ── Tool 2: Get Student Roster ──
@mcp.tool()
def get_student_roster(class_name: str, section: str) -> str:
    """
    Retrieve the roster of students enrolled in a specific class and section.
    :param class_name: The class name/number (e.g. 'Class 10' or '10').
    :param section: The section letter (e.g. 'A').
    """
    with Session(engine) as session:
        # Query UserProfiles matching the class and section
        profiles = session.exec(
            select(UserProfile).where(
                UserProfile.class_ == class_name,
                UserProfile.section == section
            )
        ).all()
        
        if not profiles:
            return f"No students found in Class: {class_name} | Section: {section}."
            
        res = [f"Student Roster for {class_name} - {section}:"]
        for p in profiles:
            # Fetch user details
            u = session.exec(select(User).where(User.id == p.user_id)).first()
            if u:
                res.append(
                    f"- Name: {u.name} | Email: {u.email} | Admission No: {p.admission_number or 'N/A'} | Phone: {p.phone_number or 'N/A'} (Parent: {p.parent_name or 'N/A'} - {p.parent_phone or 'N/A'})"
                )
        return "\n".join(res)

# ── Tool 3: Submit Student Marks ──
@mcp.tool()
def submit_student_marks(
    student_email: str, 
    exam_name: str, 
    subject: str, 
    score: float, 
    max_score: float = 100.0
) -> str:
    """
    Submit or update examination marks for a student.
    :param student_email: The student's email address.
    :param exam_name: The name of the exam (e.g. 'Mid-Term', 'Annual Exams').
    :param subject: The subject name (e.g. 'Mathematics', 'Science').
    :param score: The marks scored by the student.
    :param max_score: The maximum possible marks (defaults to 100.0).
    """
    with Session(engine) as session:
        # Resolve student
        student = _get_user_by_email(session, student_email)
        if not student:
            return f"Error: Student with email '{student_email}' not found."
            
        # Get student profile to identify class & section
        profile = session.exec(select(UserProfile).where(UserProfile.user_id == student.id)).first()
        if not profile or not profile.class_:
            return f"Error: Student '{student.name}' is not enrolled or onboarded in any class."
            
        # Resolve or create the Exam record
        exam = session.exec(
            select(Exam).where(
                Exam.name == exam_name,
                Exam.class_ == profile.class_,
                Exam.section == (profile.section or "")
            )
        ).first()
        
        if not exam:
            exam = Exam(
                id=f"exam_{uuid.uuid4().hex[:10]}",
                name=exam_name,
                class_=profile.class_,
                section=(profile.section or ""),
                created_at=datetime.utcnow()
            )
            session.add(exam)
            session.commit()
            session.refresh(exam)
            
        # Check if marks record already exists
        marks = session.exec(
            select(StudentSubjectMarks).where(
                StudentSubjectMarks.student_id == student.id,
                StudentSubjectMarks.exam_id == exam.id,
                StudentSubjectMarks.subject == subject
            )
        ).first()
        
        if marks:
            marks.score = score
            marks.max_score = max_score
            marks.updated_at = datetime.utcnow()
            status = "updated"
        else:
            marks = StudentSubjectMarks(
                id=f"marks_{uuid.uuid4().hex[:10]}",
                student_id=student.id,
                exam_id=exam.id,
                subject=subject,
                score=score,
                max_score=max_score,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(marks)
            status = "submitted"
            
        session.commit()
        return f"Successfully {status} marks for {student.name} in {subject} ({exam_name}): {score}/{max_score}."

# ── Tool 4: Publish Notice ──
@mcp.tool()
def publish_notice(
    sender_email: str, 
    title: str, 
    content: str, 
    category: str, 
    target_class: str = None, 
    target_section: str = None
) -> str:
    """
    Publish a new bulletin board notice for students or staff.
    :param sender_email: Email of the teacher publishing the notice.
    :param title: The title of the notice.
    :param content: The body text content.
    :param category: Category ('Academic', 'Co-Curricular', 'Administrative', 'General').
    :param target_class: Optional class restriction (e.g. 'Class 10').
    :param target_section: Optional section restriction (e.g. 'A').
    """
    with Session(engine) as session:
        sender = _get_user_by_email(session, sender_email)
        if not sender:
            return f"Error: Sender with email '{sender_email}' not found."
            
        notice = Notice(
            id=f"notice_{uuid.uuid4().hex[:10]}",
            title=title,
            content=content,
            category=category,
            is_urgent=False,
            sender_id=sender.id,
            target_role="student" if target_class else "all",
            target_class=target_class,
            target_section=target_section,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(notice)
        session.commit()
        
        target_str = f"for {target_class}-{target_section}" if target_class else "for everyone"
        return f"Notice '{title}' published successfully by {sender.name} {target_str}."

# ── Tool 5: Manage Lesson Notes ──
@mcp.tool()
def manage_notes(
    teacher_email: str, 
    action: str, 
    note_id: str = None, 
    title: str = None, 
    content: str = None, 
    class_name: str = None, 
    section: str = None, 
    subject: str = None
) -> str:
    """
    Perform CRUD actions on a teacher's lesson planner notes.
    :param teacher_email: Email of the teacher.
    :param action: Action to perform: 'create', 'read', 'update', 'delete', 'list'.
    :param note_id: ID of the note (required for 'read', 'update', 'delete').
    :param title: Title of the note (for 'create', 'update').
    :param content: Content of the note (for 'create', 'update').
    :param class_name: Targeted class number (for 'create', 'update').
    :param section: Targeted section (for 'create', 'update').
    :param subject: Targeted subject (for 'create', 'update').
    """
    with Session(engine) as session:
        user = _get_user_by_email(session, teacher_email)
        if not user:
            return f"Error: User with email '{teacher_email}' not found."
            
        action = action.lower()
        
        if action == "list":
            notes = session.exec(
                select(TeacherNote).where(TeacherNote.teacher_id == user.id).order_by(TeacherNote.updated_at.desc())
            ).all()
            if not notes:
                return "No notes found."
            res = [f"Notes list for {user.name}:"]
            for n in notes:
                res.append(f"- [{n.id}] {n.title} (Class: {n.class_ or 'None'} | Subject: {n.subject or 'None'})")
            return "\n".join(res)
            
        elif action == "create":
            if not title or not content:
                return "Error: 'title' and 'content' are required to create a note."
            note = TeacherNote(
                id=f"note_{uuid.uuid4().hex[:10]}",
                teacher_id=user.id,
                title=title,
                content=content,
                color="default",
                class_=class_name,
                section=section,
                subject=subject,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(note)
            session.commit()
            return f"Note '{title}' created successfully with ID: {note.id}."
            
        # Actions requiring note_id
        if not note_id:
            return "Error: 'note_id' is required for this action."
            
        note = session.exec(
            select(TeacherNote).where(TeacherNote.id == note_id, TeacherNote.teacher_id == user.id)
        ).first()
        
        if not note:
            return f"Error: Note with ID '{note_id}' not found or belongs to another teacher."
            
        if action == "read":
            return f"Title: {note.title}\nSubject: {note.subject or 'None'}\nClass: {note.class_ or 'None'} - {note.section or 'None'}\nContent:\n{note.content}"
            
        elif action == "update":
            if title:
                note.title = title
            if content:
                note.content = content
            if class_name:
                note.class_ = class_name
            if section:
                note.section = section
            if subject:
                note.subject = subject
            note.updated_at = datetime.utcnow()
            session.commit()
            return f"Note '{note.title}' (ID: {note_id}) updated successfully."
            
        elif action == "delete":
            session.delete(note)
            session.commit()
            return f"Note '{note.title}' (ID: {note_id}) deleted successfully."
            
        return f"Error: Unknown action '{action}'."

# ── Tool 6: Request Class Subject ──
@mcp.tool()
def request_subject_class(
    teacher_email: str, 
    class_name: str, 
    section: str, 
    subject: str
) -> str:
    """
    Submit a request to teach a specific subject and class.
    :param teacher_email: The teacher's email.
    :param class_name: The class name/number (e.g. 'Class 10').
    :param section: The section letter (e.g. 'A').
    :param subject: The subject name (e.g. 'History').
    """
    with Session(engine) as session:
        user = _get_user_by_email(session, teacher_email)
        if not user:
            return f"Error: User with email '{teacher_email}' not found."
            
        # Check existing request or assignment
        existing = session.exec(
            select(SubjectClassRequest).where(
                SubjectClassRequest.teacher_id == user.id,
                SubjectClassRequest.class_ == class_name,
                SubjectClassRequest.section == section,
                SubjectClassRequest.subject == subject,
                SubjectClassRequest.status == "pending"
            )
        ).first()
        
        if existing:
            return f"A pending request to teach {subject} for {class_name}-{section} already exists."
            
        new_req = SubjectClassRequest(
            id=f"req_{uuid.uuid4().hex[:10]}",
            teacher_id=user.id,
            class_=class_name,
            section=section,
            subject=subject,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(new_req)
        session.commit()
        return f"Teaching request submitted successfully (ID: {new_req.id}). Awaiting class teacher approval."

# ── Tool 9: Get Students with Marks ──
@mcp.tool()
def get_students_with_marks(
    exam_name: str,
    subject: str = None,
    min_score: float = 70.0
) -> str:
    """
    Retrieve students who scored at or above a specific score threshold in an exam.
    :param exam_name: Name of the exam (e.g. 'Mid-Term', 'Annual Exams', or specify 'recent' for latest).
    :param subject: Optional subject filter (e.g. 'Mathematics').
    :param min_score: Minimum score threshold (defaults to 70.0).
    """
    with Session(engine) as session:
        # 1. Resolve exam target
        target_exam_ids = []
        is_recent_query = any(kw in exam_name.lower() for kw in ["recent", "last", "latest", "recent exam", "last exam", "latest exam"]) or exam_name == ""
        
        if is_recent_query:
            latest_exam = session.exec(select(Exam).order_by(Exam.created_at.desc())).first()
            if latest_exam:
                target_exam_ids = [latest_exam.id]
                resolved_name = latest_exam.name
            else:
                return "Error: No exams exist in the database yet."
        else:
            exams = session.exec(select(Exam).where(Exam.name.ilike(f"%{exam_name}%"))).all()
            if exams:
                target_exam_ids = [e.id for e in exams]
                resolved_name = ", ".join(list(set([e.name for e in exams])))
            else:
                latest_exam = session.exec(select(Exam).order_by(Exam.created_at.desc())).first()
                if latest_exam:
                    target_exam_ids = [latest_exam.id]
                    resolved_name = f"{latest_exam.name} (Fallback since '{exam_name}' was not found)"
                else:
                    return f"Error: Exam matching '{exam_name}' not found, and no default exams exist."

        # 2. Query marks
        stmt = select(User, StudentSubjectMarks, Exam).join(
            StudentSubjectMarks, User.id == StudentSubjectMarks.student_id
        ).join(
            Exam, StudentSubjectMarks.exam_id == Exam.id
        ).where(
            Exam.id.in_(target_exam_ids),
            StudentSubjectMarks.score >= min_score
        )
        if subject:
            stmt = stmt.where(StudentSubjectMarks.subject.ilike(f"%{subject}%"))
        results = session.exec(stmt).all()
        if not results:
            return f"No students found with score >= {min_score} in exam '{resolved_name}'."
        
        res = [f"Students with score >= {min_score} in '{resolved_name}':"]
        for u, m, e in results:
            subj_str = f" in {m.subject}" if m.subject else ""
            res.append(f"- {u.name} ({u.email}): {m.score}/{m.max_score}{subj_str} (Exam: {e.name})")
        return "\n".join(res)

# ── Tool 7: Schedule Timetable Slot ──
@mcp.tool()
def schedule_timetable_slot(
    teacher_email: str,
    class_name: str,
    section: str,
    subject: str,
    day_of_week: str,
    start_time: str,
    end_time: str,
    room: str = None
) -> str:
    """
    Schedule a teaching class slot in the timetable database.
    :param teacher_email: The email of the teacher.
    :param class_name: The target class name (e.g. 'Class 10').
    :param section: The section letter (e.g. 'A').
    :param subject: The subject name (e.g. 'English').
    :param day_of_week: The day of the week ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday').
    :param start_time: Start time 24h format (e.g. '09:00').
    :param end_time: End time 24h format (e.g. '09:45').
    :param room: Optional room/classroom location.
    """
    with Session(engine) as session:
        teacher = _get_user_by_email(session, teacher_email)
        if not teacher:
            return f"Error: Teacher with email '{teacher_email}' not found."
        
        # Check for collision
        period_number = 1
        existing = session.exec(
            select(Timetable).where(
                Timetable.class_ == class_name,
                Timetable.section == section,
                Timetable.day_of_week == day_of_week,
                Timetable.period_number == period_number
            )
        ).first()
        if existing:
            return f"Collision: Slot already scheduled for {class_name}-{section} on {day_of_week} for Period {period_number}."

        slot = Timetable(
            id=f"slot_{uuid.uuid4().hex[:10]}",
            teacher_id=teacher.id,
            class_=class_name,
            section=section,
            subject=subject,
            day_of_week=day_of_week,
            period_number=period_number,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(slot)
        session.commit()
        return f"Successfully scheduled {subject} class for {class_name}-{section} on {day_of_week} (Period {period_number})."

# ── Tool 8: Get Teacher Timetable ──
@mcp.tool()
def get_teacher_timetable(teacher_email: str) -> str:
    """
    Retrieve the current teacher's weekly scheduled timetable slots.
    :param teacher_email: The email of the teacher.
    """
    with Session(engine) as session:
        teacher = _get_user_by_email(session, teacher_email)
        if not teacher:
            return f"Error: Teacher with email '{teacher_email}' not found."
        
        slots = session.exec(
            select(Timetable)
            .where(Timetable.teacher_id == teacher.id)
            .order_by(Timetable.day_of_week, Timetable.period_number)
        ).all()
        if not slots:
            return "No scheduled classes found in your timetable."
        res = [f"Timetable for {teacher.name}:"]
        for s in slots:
            res.append(f"- {s.day_of_week}: {s.subject} ({s.class_}-{s.section}) during Period {s.period_number}")
        return "\n".join(res)

if __name__ == "__main__":
    # Start stdio transport mcp loop
    mcp.run(transport="stdio")
