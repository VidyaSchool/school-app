"""
scheduler.py — Automated notification jobs for VidyaSchool
============================================================
Jobs:
  1. Fee due reminder         — 1st of every month at 9 AM IST
  2. Fee overdue alert        — 10th of every month at 10 AM IST
  3. Welcome new students     — Every day at 8 AM IST (new users from last 24 h)
  4. Marks published alert    — Every 30 minutes (notify students when teacher uploads marks)
  5. Library book due soon    — Every day at 9 AM IST (3-day warning)
  6. Weekly attendance nudge  — Every Monday at 8 AM IST
"""

import asyncio
import uuid
from datetime import datetime, timedelta, date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

# ── these are injected at startup from main.py ─────────────────────────────
_engine = None
_send_notification_to_user = None   # async callable(user_id, title, body, db)

def init_scheduler(engine, send_fn):
    """Called from main.py lifespan to inject dependencies."""
    global _engine, _send_notification_to_user
    _engine = engine
    _send_notification_to_user = send_fn


def _get_db():
    from sqlmodel import Session
    return Session(_engine)


# ────────────────────────────────────────────────────────────────────────────
# Helper: send to a list of user_ids
# ────────────────────────────────────────────────────────────────────────────
async def _notify_many(user_ids: list[str], title: str, body: str):
    if not user_ids:
        return
    db = _get_db()
    try:
        for uid in user_ids:
            await _send_notification_to_user(uid, title, body, db)
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────
# Job 1 — Fee due reminder (1st of every month, 9 AM IST)
# ────────────────────────────────────────────────────────────────────────────
async def job_fee_due_reminder():
    print("[Scheduler] Running: fee due reminder")
    from models import FeeInstallment, User
    db = _get_db()
    try:
        today = date.today()
        current_month = today.strftime("%B")   # e.g. "July"
        current_year = str(today.year)

        # Find all pending installments for this month
        records = db.query(FeeInstallment).filter(
            FeeInstallment.month == current_month,
            FeeInstallment.year == current_year,
            FeeInstallment.status.in_(["pending", "overdue"])
        ).all()

        user_ids = list(set(r.user_id for r in records))
        for uid in user_ids:
            # Get the amount for this user
            rec = next((r for r in records if r.user_id == uid), None)
            amount = f"₹{rec.amount:,}" if rec else "the fee"
            await _send_notification_to_user(
                uid,
                "📅 Fee Reminder",
                f"Your {current_month} fee of {amount} is due. Please pay before the due date to avoid a late fee.",
                db
            )
        print(f"[Scheduler] Fee due reminder sent to {len(user_ids)} students.")
    except Exception as e:
        print(f"[Scheduler] Error in fee_due_reminder: {e}")
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────
# Job 2 — Fee overdue alert (10th of every month, 10 AM IST)
# ────────────────────────────────────────────────────────────────────────────
async def job_fee_overdue_alert():
    print("[Scheduler] Running: fee overdue alert")
    from models import FeeInstallment
    db = _get_db()
    try:
        today = date.today()
        # Mark past-due-date pending installments as overdue first
        overdue_recs = db.query(FeeInstallment).filter(
            FeeInstallment.status == "pending",
            FeeInstallment.due_date < today
        ).all()
        for rec in overdue_recs:
            rec.status = "overdue"
            db.add(rec)
        if overdue_recs:
            db.commit()

        # Notify all overdue users
        overdue_now = db.query(FeeInstallment).filter(
            FeeInstallment.status == "overdue"
        ).all()

        user_ids = list(set(r.user_id for r in overdue_now))
        for uid in user_ids:
            recs = [r for r in overdue_now if r.user_id == uid]
            months = ", ".join(r.month for r in recs)
            await _send_notification_to_user(
                uid,
                "⚠️ Fee Overdue",
                f"Your fee for {months} is overdue. Please clear dues immediately to avoid penalties.",
                db
            )
        print(f"[Scheduler] Overdue alerts sent to {len(user_ids)} students.")
    except Exception as e:
        print(f"[Scheduler] Error in fee_overdue_alert: {e}")
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────
# Job 3 — Welcome new students (daily at 8 AM IST)
# ────────────────────────────────────────────────────────────────────────────
async def job_welcome_new_students():
    print("[Scheduler] Running: welcome new students")
    from models import User
    db = _get_db()
    try:
        since = datetime.utcnow() - timedelta(hours=24)
        new_students = db.query(User).filter(
            User.role == "student",
            User.created_at >= since
        ).all()

        for student in new_students:
            first_name = (student.name or "Student").split()[0]
            await _send_notification_to_user(
                student.id,
                "🎉 Welcome to Vidya School!",
                f"Hi {first_name}! Your account is ready. Explore your dashboard to check notices, fees, and more.",
                db
            )
        print(f"[Scheduler] Welcome messages sent to {len(new_students)} new students.")
    except Exception as e:
        print(f"[Scheduler] Error in welcome_new_students: {e}")
    finally:
        db.close()



# ────────────────────────────────────────────────────────────────────────────
# Job 5 — Library book due soon (daily at 9 AM IST, 3-day warning)
# ────────────────────────────────────────────────────────────────────────────
async def job_library_due_soon():
    print("[Scheduler] Running: library due soon")
    from models import LibraryBookIssue, LibraryBook
    db = _get_db()
    try:
        warning_date = datetime.utcnow() + timedelta(days=3)
        soon_issues = db.query(LibraryBookIssue).filter(
            LibraryBookIssue.status == "active",
            LibraryBookIssue.return_date == None,
            LibraryBookIssue.due_date <= warning_date,
            LibraryBookIssue.due_date >= datetime.utcnow()
        ).all()

        for issue in soon_issues:
            book = db.query(LibraryBook).filter(LibraryBook.id == issue.book_id).first()
            book_title = book.title if book else "a book"
            days_left = (issue.due_date - datetime.utcnow()).days
            day_word = "tomorrow" if days_left <= 1 else f"in {days_left} days"
            await _send_notification_to_user(
                issue.user_id,
                "📚 Library Book Due Soon",
                f'"{book_title}" is due {day_word}. Return or renew it from the Library section.',
                db
            )
        print(f"[Scheduler] Library due-soon alerts sent for {len(soon_issues)} issues.")
    except Exception as e:
        print(f"[Scheduler] Error in library_due_soon: {e}")
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────
# Job 6 — Weekly Monday motivation nudge to all students (Mon 8 AM IST)
# ────────────────────────────────────────────────────────────────────────────
WEEKLY_MESSAGES = [
    "Start strong this week! Check your notices and stay on top of your studies. 💪",
    "New week, new goals! Don't forget to check if any fees are due. 📚",
    "Great things happen when you stay consistent. Have a productive week ahead! 🌟",
    "Good morning! Check your dashboard for the latest school notices and updates. 🏫",
]

async def job_weekly_nudge():
    print("[Scheduler] Running: weekly nudge")
    from models import User
    db = _get_db()
    try:
        students = db.query(User).filter(User.role == "student").all()
        # Rotate message each week
        week_num = datetime.utcnow().isocalendar()[1]
        message = WEEKLY_MESSAGES[week_num % len(WEEKLY_MESSAGES)]

        user_ids = [s.id for s in students]
        await _notify_many(user_ids, "👋 Good Morning!", message)
        print(f"[Scheduler] Weekly nudge sent to {len(user_ids)} students.")
    except Exception as e:
        print(f"[Scheduler] Error in weekly_nudge: {e}")
    finally:
        db.close()


# ────────────────────────────────────────────────────────────────────────────
# Scheduler factory
# ────────────────────────────────────────────────────────────────────────────
def create_scheduler() -> AsyncIOScheduler:
    """Build and return the configured scheduler (not yet started)."""
    # IST = UTC+5:30
    IST_OFFSET = {"hour": -5, "minute": -30}   # subtract from IST to get UTC

    scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    # Job 1 — 1st of month, 9:00 AM IST
    scheduler.add_job(
        job_fee_due_reminder,
        CronTrigger(day=1, hour=9, minute=0, timezone="Asia/Kolkata"),
        id="fee_due_reminder",
        name="Monthly fee due reminder",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 2 — 10th of month, 10:00 AM IST
    scheduler.add_job(
        job_fee_overdue_alert,
        CronTrigger(day=10, hour=10, minute=0, timezone="Asia/Kolkata"),
        id="fee_overdue_alert",
        name="Monthly fee overdue alert",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 3 — daily at 8:00 AM IST
    scheduler.add_job(
        job_welcome_new_students,
        CronTrigger(hour=8, minute=0, timezone="Asia/Kolkata"),
        id="welcome_new_students",
        name="Welcome new students daily",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 5 — daily at 9:00 AM IST
    scheduler.add_job(
        job_library_due_soon,
        CronTrigger(hour=9, minute=0, timezone="Asia/Kolkata"),
        id="library_due_soon",
        name="Library book due-soon daily",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Job 6 — every Monday at 8:00 AM IST
    scheduler.add_job(
        job_weekly_nudge,
        CronTrigger(day_of_week="mon", hour=8, minute=0, timezone="Asia/Kolkata"),
        id="weekly_nudge",
        name="Weekly Monday nudge",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    return scheduler
