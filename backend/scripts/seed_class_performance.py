import uuid
import random
from datetime import datetime
from app.core.database import engine
from sqlmodel import text

STUDENTS_DATA = [
    {"name": "Rahul Sharma", "username": "rahul.sharma", "adm": "VS-2026-101", "email": "rahul.sharma@vidyaschool.com", "parent": "Sanjay Sharma", "phone": "9811223344"},
    {"name": "Priya Patel", "username": "priya.patel", "adm": "VS-2026-102", "email": "priya.patel@vidyaschool.com", "parent": "Ramesh Patel", "phone": "9822334455"},
    {"name": "Aarav Singh", "username": "aarav.singh", "adm": "VS-2026-103", "email": "aarav.singh@vidyaschool.com", "parent": "Vikram Singh", "phone": "9833445566"},
    {"name": "Sneha Verma", "username": "sneha.verma", "adm": "VS-2026-104", "email": "sneha.verma@vidyaschool.com", "parent": "Sunil Verma", "phone": "9844556677"},
    {"name": "Rohan Gupta", "username": "rohan.gupta", "adm": "VS-2026-105", "email": "rohan.gupta@vidyaschool.com", "parent": "Deepak Gupta", "phone": "9855667788"},
    {"name": "Ananya Reddy", "username": "ananya.reddy", "adm": "VS-2026-106", "email": "ananya.reddy@vidyaschool.com", "parent": "Kishore Reddy", "phone": "9866778899"},
    {"name": "Kabir Mehta", "username": "kabir.mehta", "adm": "VS-2026-107", "email": "kabir.mehta@vidyaschool.com", "parent": "Rajesh Mehta", "phone": "9877889900"},
    {"name": "Diya Joshi", "username": "diya.joshi", "adm": "VS-2026-108", "email": "diya.joshi@vidyaschool.com", "parent": "Alok Joshi", "phone": "9888990011"},
    {"name": "Ishaan Nair", "username": "ishaan.nair", "adm": "VS-2026-109", "email": "ishaan.nair@vidyaschool.com", "parent": "Madhavan Nair", "phone": "9899001122"},
    {"name": "Tanvi Malhotra", "username": "tanvi.malhotra", "adm": "VS-2026-110", "email": "tanvi.malhotra@vidyaschool.com", "parent": "Arun Malhotra", "phone": "9812345678"},
    {"name": "Aditya Chauhan", "username": "aditya.chauhan", "adm": "VS-2026-111", "email": "aditya.chauhan@vidyaschool.com", "parent": "Pradeep Chauhan", "phone": "9823456789"},
    {"name": "Meera Iyer", "username": "meera.iyer", "adm": "VS-2026-112", "email": "meera.iyer@vidyaschool.com", "parent": "Suresh Iyer", "phone": "9834567890"},
]

EXAMS_DATA = [
    {"name": "Unit Test 1", "date": datetime(2025, 8, 10, 10, 0, 0), "base_avg": 73},
    {"name": "Term 1 Examination", "date": datetime(2025, 10, 15, 10, 0, 0), "base_avg": 76},
    {"name": "Mid Term Evaluation", "date": datetime(2025, 12, 10, 10, 0, 0), "base_avg": 79},
    {"name": "Unit Test 2", "date": datetime(2026, 1, 20, 10, 0, 0), "base_avg": 82},
    {"name": "Pre-Board Examination", "date": datetime(2026, 2, 25, 10, 0, 0), "base_avg": 85},
    {"name": "Final Assessment", "date": datetime(2026, 3, 22, 10, 0, 0), "base_avg": 87},
]

SUBJECTS = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"]

def seed_class_data():
    with engine.begin() as conn:
        # 1. Find teacher Ankit
        teacher_row = conn.execute(text("SELECT id, name FROM \"user\" WHERE role = 'teacher' LIMIT 1")).first()
        if not teacher_row:
            print("Teacher not found!")
            return
        teacher_id, teacher_name = teacher_row
        print(f"Assigning class to teacher: {teacher_name} ({teacher_id})")

        # 2. Add teacher assignments for Class 12-A
        conn.execute(text("DELETE FROM subject_class_assignment WHERE teacher_id = :tid"), {"tid": teacher_id})
        for subj in ["Mathematics", "Physics", "Computer Science"]:
            conn.execute(text("""
                INSERT INTO subject_class_assignment (id, teacher_id, class, section, subject, created_at, updated_at)
                VALUES (:id, :tid, '12', 'A', :subj, NOW(), NOW())
            """), {"id": f"asgn_{uuid.uuid4().hex[:10]}", "tid": teacher_id, "subj": subj})
        print("Subject class assignments created.")

        # 3. Create students
        student_ids = []
        for s in STUDENTS_DATA:
            existing = conn.execute(text("SELECT id FROM \"user\" WHERE email = :email"), {"email": s["email"]}).first()
            if existing:
                s_id = existing[0]
            else:
                s_id = f"stu_{uuid.uuid4().hex[:12]}"
                conn.execute(text("""
                    INSERT INTO \"user\" (id, name, email, email_verified, role, preferred_role, created_at, updated_at)
                    VALUES (:id, :name, :email, true, 'student', 'student', NOW(), NOW())
                """), {"id": s_id, "name": s["name"], "email": s["email"]})

            # Ensure profile exists
            conn.execute(text("""
                INSERT INTO user_profile (id, user_id, admission_number, username, phone_number, parent_name, parent_phone, address, city, state, pincode, class, section, onboarding_completed, created_at, updated_at)
                VALUES (:pid, :uid, :adm, :usr, :ph, :pname, :pphone, 'Block B, Sector 14', 'Gurugram', 'Haryana', '122001', '12', 'A', true, NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    admission_number = EXCLUDED.admission_number,
                    username = EXCLUDED.username,
                    class = '12',
                    section = 'A',
                    onboarding_completed = true,
                    updated_at = NOW()
            """), {
                "pid": f"prof_{uuid.uuid4().hex[:10]}",
                "uid": s_id,
                "adm": s["adm"],
                "usr": s["username"],
                "ph": s["phone"],
                "pname": s["parent"],
                "pphone": s["phone"]
            })
            student_ids.append(s_id)
        print(f"Ensured {len(student_ids)} students in Class 12-A.")

        # 4. Create real exams for Class 12-A
        conn.execute(text("DELETE FROM student_subject_marks WHERE exam_id IN (SELECT id FROM exam WHERE class = '12' AND section = 'A')"))
        conn.execute(text("DELETE FROM exam WHERE class = '12' AND section = 'A'"))

        exam_ids = []
        for e in EXAMS_DATA:
            e_id = f"exam_12_A_{uuid.uuid4().hex[:8]}"
            conn.execute(text("""
                INSERT INTO exam (id, name, class, section, created_at)
                VALUES (:id, :name, '12', 'A', :date)
            """), {"id": e_id, "name": e["name"], "date": e["date"]})
            exam_ids.append((e_id, e["name"], e["base_avg"]))
        print(f"Created {len(exam_ids)} exams for Class 12-A.")

        # 5. Populate realistic marks for each student and subject across all exams
        marks_to_insert = []
        rng = random.Random(42)

        for e_id, e_name, base_avg in exam_ids:
            for s_idx, s_id in enumerate(student_ids):
                # Student ability variance: each student has slight baseline bias
                student_bias = (s_idx - len(student_ids) / 2) * 2.2
                for subj in SUBJECTS:
                    subj_bias = 2 if subj in ["Computer Science", "English"] else -1
                    score = int(base_avg + student_bias + subj_bias + rng.randint(-6, 6))
                    score = max(55, min(99, score))
                    marks_to_insert.append({
                        "id": f"mrk_{uuid.uuid4().hex[:10]}",
                        "student_id": s_id,
                        "exam_id": e_id,
                        "subject": subj,
                        "score": score,
                        "max_score": 100
                    })

        for m in marks_to_insert:
            conn.execute(text("""
                INSERT INTO student_subject_marks (id, student_id, exam_id, subject, score, max_score, created_at, updated_at)
                VALUES (:id, :student_id, :exam_id, :subject, :score, :max_score, NOW(), NOW())
            """), m)
        print(f"Successfully seeded {len(marks_to_insert)} student subject marks!")

if __name__ == "__main__":
    seed_class_data()
