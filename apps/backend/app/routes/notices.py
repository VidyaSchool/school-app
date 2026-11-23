from sqlalchemy import or_, and_

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from models import Notice, User, UserProfile, TeacherNote

router = APIRouter()


def _serialize_notice(notice: Notice, sender: User | None) -> dict:
    created_at = notice.created_at.isoformat()
    if not created_at.endswith("Z"):
        created_at = f"{created_at}Z"

    return {
        "id": notice.id,
        "title": notice.title,
        "content": notice.content,
        "category": notice.category,
        "isUrgent": notice.is_urgent,
        "senderId": notice.sender_id,
        "targetRole": notice.target_role,
        "targetClass": notice.target_class,
        "targetSection": notice.target_section,
        "createdAt": created_at,
        "senderName": sender.name if sender else "Unknown",
    }


@router.get("/api/notices")
def get_notices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_role = current_user.role or "student"

    if user_role == "student":
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        student_class = profile.class_ if profile and profile.class_ else ""
        student_section = profile.section if profile and profile.section else ""

        results = (
            db.query(Notice, User)
            .outerjoin(User, Notice.sender_id == User.id)
            .filter(
                or_(
                    and_(
                        Notice.target_role.in_(["all", "student"]),
                        Notice.target_class.is_(None),
                    ),
                    and_(
                        Notice.target_class == student_class,
                        or_(
                            Notice.target_section.is_(None),
                            Notice.target_section == "",
                            Notice.target_section == student_section,
                        ),
                    ),
                )
            )
            .order_by(Notice.created_at.desc())
            .all()
        )
    elif user_role in ("teacher", "librarian"):
        results = (
            db.query(Notice, User)
            .outerjoin(User, Notice.sender_id == User.id)
            .filter(
                or_(
                    Notice.target_role.in_(["all", "teacher", "librarian"]),
                    Notice.sender_id == current_user.id,
                )
            )
            .order_by(Notice.created_at.desc())
            .all()
        )
    else:
        results = (
            db.query(Notice, User)
            .outerjoin(User, Notice.sender_id == User.id)
            .order_by(Notice.created_at.desc())
            .all()
        )

    return [_serialize_notice(notice, sender) for notice, sender in results]


@router.get("/api/student/notes")
def get_student_notes(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile or not profile.class_ or profile.class_ == "none":
        return {"notes": []}

    raw_class = (profile.class_ or "").strip()
    student_section = (profile.section or "").strip()

    clean_class_num = raw_class.lower().replace("class", "").strip()
    class_variations = list(set([
        raw_class,
        clean_class_num,
        f"Class {clean_class_num}",
        f"class {clean_class_num}",
        "All", "all"
    ]))

    # Fetch notes where class matches student class (including variations like "12" and "Class 12") or is "All",
    # and section matches student section or is "All" or is NULL/empty.
    results = (
        db.query(TeacherNote, User)
        .join(User, TeacherNote.teacher_id == User.id)
        .filter(
            TeacherNote.class_.in_(class_variations),
            or_(
                TeacherNote.section.in_(["All", "all"]),
                TeacherNote.section.is_(None),
                TeacherNote.section == "",
                TeacherNote.section == student_section,
            ),
            and_(
                TeacherNote.class_.is_not(None),
                TeacherNote.class_ != "",
                TeacherNote.class_ != "none",
            )
        )
        .order_by(TeacherNote.updated_at.desc())
        .all()
    )

    notes_list = []
    for note, teacher in results:
        note_dict = note.model_dump()
        note_dict["teacher_name"] = teacher.name
        notes_list.append(note_dict)

    return {"notes": notes_list}
