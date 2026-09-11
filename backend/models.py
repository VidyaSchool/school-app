from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "user"
    id: str = Field(primary_key=True)
    name: str
    email: str
    role: str = Field(default="student")
    preferred_role: Optional[str] = Field(default=None, alias="preferredRole")
    teacher_approval_status: Optional[str] = Field(default="pending", alias="teacherApprovalStatus")
    email_verified: bool = Field(default=False, alias="emailVerified")
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

class Session(SQLModel, table=True):
    __tablename__ = "session"
    id: str = Field(primary_key=True)
    expires_at: datetime = Field(alias="expires_at")
    token: str
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    ip_address: Optional[str] = Field(default=None, alias="ip_address")
    user_agent: Optional[str] = Field(default=None, alias="user_agent")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SliderImage(SQLModel, table=True):
    __tablename__ = "slider_image"
    id: int = Field(primary_key=True)
    url: str
    title: str
    enabled: bool = Field(default=True)
    target_audience: str = Field(default="all")  # "all", "students", "teachers"
    target_classes: str = Field(default="all")  # "all" or comma-separated class IDs: "1,2,3,4,5,6,7,8,9,10,11,12"
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profile"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id", index=True)
    admission_number: Optional[str] = Field(default=None, alias="admission_number")
    username: Optional[str] = Field(default=None, index=True)
    phone_number: Optional[str] = Field(default=None, alias="phone_number")
    parent_name: Optional[str] = Field(default=None, alias="parent_name")
    parent_phone: Optional[str] = Field(default=None, alias="parent_phone")
    parent_email: Optional[str] = Field(default=None, alias="parent_email")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class", index=True, sa_column_kwargs={"name": "class"})
    section: Optional[str] = None
    class_section_last_updated: Optional[datetime] = Field(default=None, alias="class_section_last_updated")
    class_section_changes: Optional[str] = Field(default=None, alias="class_section_changes")
    secondary_role: Optional[str] = Field(default=None, alias="secondary_role")
    transport_mode: Optional[str] = Field(default=None, alias="transport_mode")
    teacher_category: Optional[str] = Field(default=None, alias="teacher_category")  # 'PRT', 'TGT', 'PGT'
    activity_skills: Optional[str] = Field(default=None, alias="activity_skills")  # JSON list string e.g. ["Games / Sports", "Computer"]
    is_available_for_substitution: bool = Field(default=True, alias="is_available_for_substitution")
    onboarding_completed: bool = Field(default=False, alias="onboarding_completed")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FeeInstallment(SQLModel, table=True):
    __tablename__ = "fee_installment"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id", index=True)
    month: str = Field(index=True)
    year: str = Field(index=True)
    amount: int
    due_date: date = Field(alias="due_date")
    status: str = Field(index=True)  # 'paid', 'pending', 'overdue', 'upcoming'
    paid_date: Optional[date] = Field(default=None, alias="paid_date")
    receipt_no: Optional[str] = Field(default=None, alias="receipt_no", index=True)
    payment_method: Optional[str] = Field(default=None, alias="payment_method")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectClassRequest(SQLModel, table=True):
    __tablename__ = "subject_class_request"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id")
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    subject: str
    status: str = Field(default="pending")  # 'pending', 'approved', 'rejected'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectClassAssignment(SQLModel, table=True):
    __tablename__ = "subject_class_assignment"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id")
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    subject: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Exam(SQLModel, table=True):
    __tablename__ = "exam"
    id: str = Field(primary_key=True)
    name: str
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentSubjectMarks(SQLModel, table=True):
    __tablename__ = "student_subject_marks"
    id: str = Field(primary_key=True)
    student_id: str = Field(alias="student_id", foreign_key="user.id")
    exam_id: str = Field(alias="exam_id", foreign_key="exam.id")
    subject: str
    score: float
    max_score: float = Field(default=100.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CommunityMessage(SQLModel, table=True):
    __tablename__ = "community_message"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="userId", foreign_key="user.id")
    content: str
    reply_to: Optional[str] = Field(default=None, alias="replyTo")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

class TeacherRequest(SQLModel, table=True):
    __tablename__ = "teacher_request"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    status: str = Field(default="pending")
    admin_id: Optional[str] = Field(default=None, alias="admin_id", foreign_key="user.id")
    rejection_reason: Optional[str] = Field(default=None, alias="rejection_reason")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Complaint(SQLModel, table=True):
    __tablename__ = "complaint"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    title: str
    recipient: str
    tagged_people: Optional[str] = Field(default=None, alias="tagged_people")
    message: str
    file_url: Optional[str] = Field(default=None, alias="file_url")
    file_name: Optional[str] = Field(default=None, alias="file_name")
    status: str = Field(default="pending")
    sort_order: int = Field(default=0, alias="sort_order")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Notice(SQLModel, table=True):
    __tablename__ = "notice"
    id: str = Field(primary_key=True)
    title: str
    content: str
    category: str = Field(default="General")
    is_urgent: bool = Field(default=False, alias="is_urgent")
    sender_id: str = Field(alias="sender_id", foreign_key="user.id")
    target_role: str = Field(default="all", alias="target_role")
    target_class: Optional[str] = Field(default=None, alias="target_class")
    target_section: Optional[str] = Field(default=None, alias="target_section")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LibraryBook(SQLModel, table=True):
    __tablename__ = "library_book"
    id: str = Field(primary_key=True)
    title: str
    author: str
    isbn: str = Field(unique=True)
    category: str = Field(default="General")
    quantity: int = Field(default=1)
    available_quantity: int = Field(default=1, alias="available_quantity")
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LibraryBookIssue(SQLModel, table=True):
    __tablename__ = "library_book_issue"
    id: str = Field(primary_key=True)
    book_id: str = Field(alias="book_id", foreign_key="library_book.id")
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    issue_date: datetime = Field(default_factory=datetime.utcnow, alias="issue_date")
    due_date: datetime = Field(alias="due_date")
    return_date: Optional[datetime] = Field(default=None, alias="return_date")
    renewals_count: int = Field(default=0, alias="renewals_count")
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FCMToken(SQLModel, table=True):
    __tablename__ = "fcm_token"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    token: str
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updated_at")

class NotificationHistory(SQLModel, table=True):
    __tablename__ = "notification_history"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    title: str
    body: str
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")


class FeeStructure(SQLModel, table=True):
    """Stores the per-class fee configuration (components JSON) for each class (Nursery, KG, 1-12)."""
    __tablename__ = "fee_structure"
    id: str = Field(primary_key=True)
    class_num: int = Field(alias="class_num", index=True)         # -1=Nursery, 0=KG, 1..12
    class_name: Optional[str] = Field(default=None, alias="class_name", index=True) # "Nursery", "KG", "1".."12"
    components: str = Field(default="[]")               # JSON array of {name, amount, billingPeriod}
    transport_fee: int = Field(default=0, alias="transport_fee")   # extra fee for transport users
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TeacherNote(SQLModel, table=True):
    __tablename__ = "teacher_note"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id")
    title: str = Field(default="Untitled")
    content: str = Field(default="")
    color: str = Field(default="default")
    class_: Optional[str] = Field(default=None, alias="class", sa_column_kwargs={"name": "class"})
    section: Optional[str] = Field(default=None)
    subject: Optional[str] = Field(default=None)
    pdf_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRoom(SQLModel, table=True):
    __tablename__ = "chat_room"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_message"
    id: str = Field(primary_key=True)
    room_id: str = Field(alias="room_id", foreign_key="chat_room.id")
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Timetable(SQLModel, table=True):
    __tablename__ = "timetable"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id")
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    subject: str
    day_of_week: str = Field(alias="day_of_week")
    start_time: str = Field(alias="start_time")
    end_time: str = Field(alias="end_time")
    room: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserDocument(SQLModel, table=True):
    __tablename__ = "user_document"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    doc_type: str = Field(alias="doc_type")
    doc_name: str = Field(alias="doc_name")
    file_url: str = Field(alias="file_url")
    file_name: str = Field(alias="file_name")
    file_type: str = Field(alias="file_type")
    file_size: Optional[int] = Field(default=None, alias="file_size")
    status: str = Field(default="uploaded")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updated_at")
class TeacherEmail(SQLModel, table=True):
    __tablename__ = "teacher_email"
    id: str = Field(primary_key=True)
    user_id: str = Field(alias="user_id", foreign_key="user.id")
    folder: str = Field(default="inbox")
    from_address: str = Field(alias="from_address")
    to_address: str = Field(alias="to_address")
    cc_address: Optional[str] = Field(default=None, alias="cc_address")
    subject: str = Field(default="(no subject)")
    body_html: Optional[str] = Field(default=None, alias="body_html")
    body_text: str = Field(default="", alias="body_text")
    resend_id: Optional[str] = Field(default=None, alias="resend_id")
    is_read: bool = Field(default=False, alias="is_read")
    is_starred: bool = Field(default=False, alias="is_starred")
    raw_payload: Optional[str] = Field(default=None, alias="raw_payload")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_at")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updated_at")

class WeatherCache(SQLModel, table=True):
    __tablename__ = "weather_cache"
    id: Optional[int] = Field(default=None, primary_key=True)
    query_key: str = Field(index=True)
    lat: Optional[float] = Field(default=None, index=True)
    lon: Optional[float] = Field(default=None, index=True)
    city_name: str = Field(default="")
    region: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    temperature: float = Field(default=0.0)
    feelslike: Optional[float] = Field(default=None)
    weather_code: Optional[int] = Field(default=None)
    weather_descriptions: str = Field(default="[]")
    weather_icons: str = Field(default="[]")
    wind_speed: Optional[float] = Field(default=None)
    wind_dir: Optional[str] = Field(default=None)
    humidity: Optional[int] = Field(default=None)
    uv_index: Optional[int] = Field(default=None)
    visibility: Optional[float] = Field(default=None)
    pressure: Optional[int] = Field(default=None)
    precip: Optional[float] = Field(default=None)
    is_day: Optional[str] = Field(default="yes")
    raw_response: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class TeacherAbsence(SQLModel, table=True):
    __tablename__ = "teacher_absence"
    id: str = Field(primary_key=True)
    teacher_id: str = Field(alias="teacher_id", foreign_key="user.id", index=True)
    date: str = Field(index=True)  # YYYY-MM-DD
    status: str = Field(default="absent")  # 'absent', 'half_day', 'on_leave'
    reason: str = Field(default="Sick Leave")  # 'Sick Leave', 'Casual Leave', 'Emergency Leave', 'Official Duty'
    duration: str = Field(default="Full Day")
    remarks: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SubstitutionRecord(SQLModel, table=True):
    __tablename__ = "substitution_record"
    id: str = Field(primary_key=True)
    date: str = Field(index=True)  # YYYY-MM-DD
    absence_id: Optional[str] = Field(default=None, alias="absence_id", foreign_key="teacher_absence.id", index=True)
    timetable_id: Optional[str] = Field(default=None, alias="timetable_id", foreign_key="timetable.id", index=True)
    period_name: str = Field(default="Period 1")
    start_time: str = Field(alias="start_time")
    end_time: str = Field(alias="end_time")
    class_: str = Field(alias="class", sa_column_kwargs={"name": "class"})
    section: str
    subject: str
    room: Optional[str] = Field(default=None)
    original_teacher_id: str = Field(alias="original_teacher_id", foreign_key="user.id", index=True)
    substitute_teacher_id: Optional[str] = Field(default=None, alias="substitute_teacher_id", foreign_key="user.id", index=True)
    status: str = Field(default="assigned")  # 'assigned', 'activity_fallback', 'unassigned', 'manual_override'
    is_activity_fallback: bool = Field(default=False)
    activity_name: Optional[str] = Field(default=None)
    suitability_score: Optional[float] = Field(default=None)
    score_breakdown: Optional[str] = Field(default=None)  # JSON string
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SubstitutionSettings(SQLModel, table=True):
    __tablename__ = "substitution_settings"
    id: str = Field(primary_key=True, default="default")
    same_subject_score: float = Field(default=100.0)
    same_category_score: float = Field(default=50.0)
    same_class_score: float = Field(default=40.0)
    same_section_score: float = Field(default=30.0)
    matching_activity_skill_score: float = Field(default=25.0)
    low_workload_bonus: float = Field(default=10.0)
    workload_penalty_per_sub: float = Field(default=15.0)
    high_workload_penalty: float = Field(default=20.0)
    high_workload_threshold: int = Field(default=2)
    activity_fallback_threshold: float = Field(default=35.0)
    enabled_activities: str = Field(default='["Games / Sports", "Arts", "Music", "Library", "Computer"]')
    allow_cross_category: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

