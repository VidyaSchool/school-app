import uuid
import re
import logging
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select, or_
from typing import Optional, List, Dict, Any

from app.core.auth import require_role, get_current_user
from app.core.database import get_db
from app.core.cache import (
    get_cached_book_by_isbn,
    set_cached_book_by_isbn,
    get_cached_book_by_title,
    set_cached_book_by_title,
    invalidate_books_cache,
    normalize_isbn,
    get_cache,
    set_cache,
)
from models import User, UserProfile, LibraryBook, LibraryBookIssue

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["library"])

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    category: str = "General"
    quantity: int = 1
    location: Optional[str] = None

class BookUpdate(BaseModel):
    id: str
    title: str
    author: str
    isbn: str
    category: str
    quantity: int
    location: Optional[str] = None

class BookDelete(BaseModel):
    id: str

class IssueCreate(BaseModel):
    studentIdentifier: str
    bookId: str
    dueDate: str

class BorrowingAction(BaseModel):
    id: str
    action: str  # 'return' or 'renew'

class StudentRenewRequest(BaseModel):
    id: str

@router.get("/librarian/books")
async def get_books(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cache_key = f"books:search:{search.strip().lower()}" if search else "books:all"
    cached = get_cache(cache_key)
    if cached is not None:
        return cached

    stmt = select(LibraryBook)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                LibraryBook.title.like(search_filter),
                LibraryBook.author.like(search_filter),
                LibraryBook.isbn.like(search_filter),
                LibraryBook.category.like(search_filter)
            )
        )
    books = db.exec(stmt).all()
    result = [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "isbn": b.isbn,
            "category": b.category,
            "quantity": b.quantity,
            "available_quantity": b.available_quantity,
            "availableQuantity": b.available_quantity,
            "location": b.location,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "updated_at": b.updated_at.isoformat() if b.updated_at else None,
        }
        for b in books
    ]
    set_cache(cache_key, result, ttl=300)
    return result

@router.get("/librarian/books/lookup")
async def lookup_book_by_isbn(
    isbn: str = Query(..., description="ISBN-10 or ISBN-13 of the book"),
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    clean_isbn = normalize_isbn(isbn)
    if not clean_isbn or len(clean_isbn) < 7:
        raise HTTPException(status_code=400, detail="Invalid ISBN format")

    # 1. First scan in Redis cache (blazing fast, zero DB scan)
    cached = get_cached_book_by_isbn(clean_isbn)
    if cached:
        return {
            "found": True,
            "source": "redis_cache",
            "book": cached,
            "in_library": True
        }

    # 2. First scan in our API / DB
    book = db.exec(
        select(LibraryBook).where(
            or_(
                LibraryBook.isbn == clean_isbn,
                LibraryBook.isbn == isbn.strip()
            )
        )
    ).first()

    if book:
        book_data = {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "isbn": book.isbn,
            "category": book.category,
            "quantity": book.quantity,
            "available_quantity": book.available_quantity,
            "availableQuantity": book.available_quantity,
            "location": book.location
        }
        set_cached_book_by_isbn(clean_isbn, book_data)
        set_cached_book_by_title(book.title, book_data)
        return {
            "found": True,
            "source": "database",
            "book": book_data,
            "in_library": True
        }

    # 3. Not in DB -> Query OpenLibrary API (https://openlibrary.org/search.json?isbn=...)
    openlib_url = f"https://openlibrary.org/search.json?isbn={clean_isbn}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(openlib_url)
            if resp.status_code == 200:
                data = resp.json()
                docs = data.get("docs", [])
                if docs:
                    doc = docs[0]
                    title = doc.get("title", "Unknown Title")
                    authors = doc.get("author_name", [])
                    author = ", ".join(authors) if authors else "Unknown Author"
                    subjects = doc.get("subject", [])
                    category = subjects[0] if subjects else "General"
                    if len(category) > 50:
                        category = category[:50]
                    cover_i = doc.get("cover_i")
                    cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg" if cover_i else None

                    # Check if book title already exists under another edition/ISBN
                    existing_title = db.exec(select(LibraryBook).where(LibraryBook.title == title)).first()
                    if existing_title:
                        b_data = {
                            "id": existing_title.id,
                            "title": existing_title.title,
                            "author": existing_title.author,
                            "isbn": existing_title.isbn,
                            "category": existing_title.category,
                            "quantity": existing_title.quantity,
                            "available_quantity": existing_title.available_quantity,
                            "availableQuantity": existing_title.available_quantity,
                            "location": existing_title.location,
                            "cover_url": cover_url
                        }
                        set_cached_book_by_isbn(clean_isbn, b_data)
                        return {
                            "found": True,
                            "source": "database",
                            "book": b_data,
                            "in_library": True,
                            "cover_url": cover_url
                        }

                    # Store in DB as instructed:
                    # "once librarian put the ISBN store that detail in db also so in future if book info needed first scan in our api then go to this openlibrary one"
                    book_id = f"bk-{uuid.uuid4()}"
                    new_book = LibraryBook(
                        id=book_id,
                        title=title,
                        author=author,
                        isbn=clean_isbn,
                        category=category,
                        quantity=1,
                        available_quantity=1,
                        location="Main Library",
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(new_book)
                    db.commit()
                    db.refresh(new_book)

                    book_data = {
                        "id": new_book.id,
                        "title": new_book.title,
                        "author": new_book.author,
                        "isbn": new_book.isbn,
                        "category": new_book.category,
                        "quantity": new_book.quantity,
                        "available_quantity": new_book.available_quantity,
                        "availableQuantity": new_book.available_quantity,
                        "location": new_book.location,
                        "cover_url": cover_url
                    }

                    # Cache in Redis for instant subsequent lookups
                    set_cached_book_by_isbn(clean_isbn, book_data)
                    set_cached_book_by_title(title, book_data)
                    invalidate_books_cache()

                    return {
                        "found": True,
                        "source": "openlibrary",
                        "book": book_data,
                        "in_library": True,
                        "auto_registered": True,
                        "cover_url": cover_url
                    }
    except Exception as e:
        logger.warning(f"Error querying OpenLibrary for ISBN {clean_isbn}: {e}")

    return {
        "found": False,
        "message": f"No book details found for ISBN {clean_isbn} in library or OpenLibrary"
    }

@router.post("/librarian/books")
async def add_book(
    book_data: BookCreate,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    clean_isbn = normalize_isbn(book_data.isbn)
    existing = db.exec(select(LibraryBook).where(LibraryBook.isbn == clean_isbn)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")

    book_id = f"bk-{uuid.uuid4()}"
    new_book = LibraryBook(
        id=book_id,
        title=book_data.title,
        author=book_data.author,
        isbn=clean_isbn,
        category=book_data.category,
        quantity=book_data.quantity,
        available_quantity=book_data.quantity,
        location=book_data.location,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_book)
    db.commit()

    saved_data = {
        "id": book_id,
        "title": new_book.title,
        "author": new_book.author,
        "isbn": new_book.isbn,
        "category": new_book.category,
        "quantity": new_book.quantity,
        "available_quantity": new_book.available_quantity,
        "availableQuantity": new_book.available_quantity,
        "location": new_book.location
    }
    set_cached_book_by_isbn(clean_isbn, saved_data)
    set_cached_book_by_title(new_book.title, saved_data)
    invalidate_books_cache()

    return {"success": True, "id": book_id}

@router.patch("/librarian/books")
async def update_book(
    book_data: BookUpdate,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    book = db.get(LibraryBook, book_data.id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    clean_isbn = normalize_isbn(book_data.isbn)
    if clean_isbn != book.isbn:
        existing = db.exec(select(LibraryBook).where(LibraryBook.isbn == clean_isbn)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Another book with this ISBN already exists")

    diff = book_data.quantity - book.quantity
    new_available = max(0, book.available_quantity + diff)

    book.title = book_data.title
    book.author = book_data.author
    book.isbn = clean_isbn
    book.category = book_data.category
    book.quantity = book_data.quantity
    book.available_quantity = new_available
    book.location = book_data.location
    book.updated_at = datetime.utcnow()

    db.add(book)
    db.commit()

    saved_data = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "isbn": book.isbn,
        "category": book.category,
        "quantity": book.quantity,
        "available_quantity": book.available_quantity,
        "availableQuantity": book.available_quantity,
        "location": book.location
    }
    set_cached_book_by_isbn(clean_isbn, saved_data)
    set_cached_book_by_title(book.title, saved_data)
    invalidate_books_cache()

    return {"success": True}

@router.delete("/librarian/books")
async def delete_book(
    del_data: BookDelete,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    book = db.get(LibraryBook, del_data.id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(book)
    db.commit()
    invalidate_books_cache()
    return {"success": True}

@router.get("/librarian/borrowings")
async def get_borrowings(
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    results = db.query(
        LibraryBookIssue, LibraryBook, User, UserProfile
    ).join(
        LibraryBook, LibraryBookIssue.book_id == LibraryBook.id
    ).join(
        User, LibraryBookIssue.user_id == User.id
    ).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    ).order_by(LibraryBookIssue.created_at.desc()).all()

    borrowings = []
    for issue, book, user_obj, profile in results:
        status = issue.status
        if status == "active" and issue.due_date < datetime.utcnow():
            status = "overdue"
        borrowings.append({
            "id": issue.id,
            "bookId": issue.book_id,
            "userId": issue.user_id,
            "issueDate": issue.issue_date.isoformat(),
            "dueDate": issue.due_date.isoformat(),
            "returnDate": issue.return_date.isoformat() if issue.return_date else None,
            "renewalsCount": issue.renewals_count,
            "status": status,
            "bookTitle": book.title,
            "bookAuthor": book.author,
            "bookIsbn": book.isbn,
            "studentName": user_obj.name,
            "studentEmail": user_obj.email,
            "studentUsername": profile.username if profile else None,
            "studentClass": profile.class_ if profile else None,
            "studentSection": profile.section if profile else None,
        })
    return borrowings

@router.post("/librarian/borrowings")
async def issue_book(
    issue_data: IssueCreate,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    clean_id = issue_data.studentIdentifier.strip()
    stmt = select(User).outerjoin(UserProfile, User.id == UserProfile.user_id).where(
        or_(
            User.id == clean_id,
            User.email.ilike(clean_id),
            UserProfile.username.ilike(clean_id),
            UserProfile.admission_number.ilike(clean_id)
        )
    )
    student = db.exec(stmt).first()
    if not student:
        raise HTTPException(
            status_code=400, 
            detail="Student/borrower not found. Please verify admission number, username, or email."
        )

    # Resolve book by ID or ISBN
    book = db.get(LibraryBook, issue_data.bookId)
    if not book:
        clean_isbn = normalize_isbn(issue_data.bookId)
        book = db.exec(select(LibraryBook).where(LibraryBook.isbn == clean_isbn)).first()

    if not book:
        raise HTTPException(status_code=400, detail="Book not found in library catalog")
    
    if book.available_quantity <= 0:
        raise HTTPException(status_code=400, detail="Book is currently out of stock (no copies available)")

    # Smart check: verify user doesn't already hold an active copy of this exact book
    already_holding = db.query(LibraryBookIssue).filter(
        LibraryBookIssue.user_id == student.id,
        LibraryBookIssue.book_id == book.id,
        LibraryBookIssue.status == "active"
    ).first()
    if already_holding:
        raise HTTPException(
            status_code=400, 
            detail=f"{student.name} already holds an active copy of '{book.title}'."
        )

    # Smart check: borrowing quota limit
    active_count = db.query(LibraryBookIssue).filter(
        LibraryBookIssue.user_id == student.id,
        LibraryBookIssue.status == "active"
    ).count()
    if active_count >= 5:
        raise HTTPException(
            status_code=400,
            detail=f"{student.name} has reached the maximum borrowing limit of 5 active books."
        )

    issue_id = f"iss-{uuid.uuid4()}"
    try:
        due_dt = datetime.fromisoformat(issue_data.dueDate.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        due_dt = datetime.utcnow() + timedelta(days=14)

    new_issue = LibraryBookIssue(
        id=issue_id,
        book_id=book.id,
        user_id=student.id,
        issue_date=datetime.utcnow(),
        due_date=due_dt,
        renewals_count=0,
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_issue)

    book.available_quantity = max(0, book.available_quantity - 1)
    db.add(book)
    db.commit()

    # Synchronize Redis cache with fresh available stock
    invalidate_books_cache()
    cached_book = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "isbn": book.isbn,
        "category": book.category,
        "quantity": book.quantity,
        "available_quantity": book.available_quantity,
        "availableQuantity": book.available_quantity,
        "location": book.location
    }
    set_cached_book_by_isbn(book.isbn, cached_book)
    set_cached_book_by_title(book.title, cached_book)

    return {
        "success": True, 
        "id": issue_id,
        "book": {"id": book.id, "title": book.title, "isbn": book.isbn},
        "student": {"id": student.id, "name": student.name, "email": student.email}
    }

@router.patch("/librarian/borrowings")
async def handle_borrowing_action(
    data: BorrowingAction,
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    issue = db.get(LibraryBookIssue, data.id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    book = db.get(LibraryBook, issue.book_id)

    if data.action == "return":
        if issue.status == "returned":
            raise HTTPException(status_code=400, detail="Book is already returned")
        
        issue.status = "returned"
        issue.return_date = datetime.utcnow()
        issue.updated_at = datetime.utcnow()
        db.add(issue)

        if book:
            book.available_quantity = min(book.quantity, book.available_quantity + 1)
            book.updated_at = datetime.utcnow()
            db.add(book)

        db.commit()
        invalidate_books_cache()
        if book:
            set_cached_book_by_isbn(book.isbn, {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "isbn": book.isbn,
                "category": book.category,
                "quantity": book.quantity,
                "available_quantity": book.available_quantity,
                "availableQuantity": book.available_quantity,
                "location": book.location
            })
        return {"success": True}

    elif data.action == "renew":
        if issue.status == "returned":
            raise HTTPException(status_code=400, detail="Cannot renew a returned book")
        if issue.renewals_count >= 3:
            raise HTTPException(status_code=400, detail="Maximum renewals limit reached (3 times)")

        issue.due_date = issue.due_date + timedelta(days=14)
        issue.renewals_count += 1
        issue.status = "active"
        issue.updated_at = datetime.utcnow()
        db.add(issue)
        db.commit()
        return {"success": True}
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'return' or 'renew'")

@router.get("/librarian/resolve-user")
async def resolve_user(
    q: str = "",
    current_user: User = Depends(require_role(["librarian", "admin"])),
    db: Session = Depends(get_db)
):
    clean_q = q.strip()
    if not clean_q:
        return {"found": False}

    stmt = db.query(User, UserProfile).outerjoin(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        or_(
            User.email == clean_q,
            UserProfile.username == clean_q,
            UserProfile.admission_number == clean_q,
            User.id == clean_q,
            User.email.ilike(clean_q),
            UserProfile.username.ilike(clean_q),
            UserProfile.admission_number.ilike(clean_q)
        )
    ).first()

    if stmt:
        user_obj, profile = stmt
        # Smart linking metrics
        active_issues = db.query(LibraryBookIssue).filter(
            LibraryBookIssue.user_id == user_obj.id,
            LibraryBookIssue.status == "active"
        ).all()
        active_count = len(active_issues)
        overdue_count = sum(1 for iss in active_issues if iss.due_date < datetime.utcnow())

        return {
            "found": True,
            "user": {
                "id": user_obj.id,
                "name": user_obj.name,
                "email": user_obj.email,
                "role": user_obj.role,
                "username": profile.username if profile else None,
                "admissionNumber": profile.admission_number if profile else None,
                "class": profile.class_ if profile else None,
                "section": profile.section if profile else None,
                "activeLoansCount": active_count,
                "overdueLoansCount": overdue_count,
                "canBorrow": active_count < 5 and overdue_count == 0,
                "statusNotice": (
                    f"Warning: {overdue_count} overdue book(s)" if overdue_count > 0 
                    else "Borrowing quota full (5 books)" if active_count >= 5 
                    else "Eligible for book issue"
                )
            }
        }
    return {"found": False}

@router.get("/student/borrowings")
async def get_student_borrowings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = db.query(LibraryBookIssue, LibraryBook).join(
        LibraryBook, LibraryBookIssue.book_id == LibraryBook.id
    ).filter(
        LibraryBookIssue.user_id == current_user.id
    ).order_by(LibraryBookIssue.created_at.desc()).all()

    issues = []
    for issue, book in results:
        status = issue.status
        if status == "active" and issue.due_date < datetime.utcnow():
            status = "overdue"
        issues.append({
            "id": issue.id,
            "bookId": issue.book_id,
            "issueDate": issue.issue_date.isoformat(),
            "dueDate": issue.due_date.isoformat(),
            "returnDate": issue.return_date.isoformat() if issue.return_date else None,
            "renewalsCount": issue.renewals_count,
            "status": status,
            "title": book.title,
            "author": book.author,
            "isbn": book.isbn,
        })
    return issues

@router.patch("/student/borrowings")
async def student_renew_book(
    req_data: StudentRenewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    issue = db.exec(
        select(LibraryBookIssue)
        .where(LibraryBookIssue.id == req_data.id)
        .where(LibraryBookIssue.user_id == current_user.id)
    ).first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    if issue.status == "returned":
        raise HTTPException(status_code=400, detail="Cannot renew a returned book")
    if issue.renewals_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum renewals limit reached (3 times)")

    issue.due_date = issue.due_date + timedelta(days=14)
    issue.renewals_count += 1
    issue.status = "active"
    issue.updated_at = datetime.utcnow()

    db.add(issue)
    db.commit()
    return {"success": True}

from pydantic import Field

class ProfileResponse(BaseModel):
    user: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    section: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "image": current_user.image
    }
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    profile_data = None
    
    if profile:
        if section == "personal":
            profile_data = {
                "id": profile.id,
                "user_id": profile.user_id,
                "username": profile.username,
                "phoneNumber": profile.phone_number,
                "class": profile.class_,
                "section": profile.section
            }
        elif section == "parent":
            profile_data = {
                "id": profile.id,
                "user_id": profile.user_id,
                "parentName": profile.parent_name,
                "parentPhone": profile.parent_phone,
                "parentEmail": profile.parent_email
            }
        elif section == "address":
            profile_data = {
                "id": profile.id,
                "user_id": profile.user_id,
                "address": profile.address,
                "city": profile.city,
                "state": profile.state,
                "pincode": profile.pincode
            }
        elif section == "documents":
            profile_data = {
                "id": profile.id,
                "user_id": profile.user_id,
                "admissionNumber": profile.admission_number,
                "onboardingCompleted": profile.onboarding_completed,
                "transportMode": profile.transport_mode
            }
        else:
            profile_data = {
                "id": profile.id,
                "user_id": profile.user_id,
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
                "secondaryRole": profile.secondary_role,
                "transportMode": profile.transport_mode,
                "onboardingCompleted": profile.onboarding_completed,
                "classSectionLastUpdated": profile.class_section_last_updated.isoformat() + "Z" if profile.class_section_last_updated else None,
                "classSectionChanges": profile.class_section_changes
            }
        
    return {"user": user_data, "profile": profile_data}

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    parentName: Optional[str] = None
    parentPhone: Optional[str] = None
    parentEmail: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class")
    section: Optional[str] = None

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

@router.patch("/profile")
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if data.username:
        # Check uniqueness of username
        existing = db.exec(
            select(UserProfile)
            .where(UserProfile.username == data.username)
            .where(UserProfile.user_id != current_user.id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        profile.username = data.username

    # Enforce class and section update limits
    is_class_changed = data.class_ is not None and data.class_ != profile.class_
    is_section_changed = data.section is not None and data.section != profile.section
    if is_class_changed or is_section_changed:
        now = datetime.utcnow()
        if current_user.role in ('teacher', 'librarian'):
            import json
            changes = []
            try:
                if profile.class_section_changes:
                    changes = json.loads(profile.class_section_changes)
            except Exception:
                changes = []
            
            one_year_ago = now - timedelta(days=365)
            active_changes = []
            for d_str in changes:
                try:
                    d_val = datetime.fromisoformat(d_str.replace("Z", ""))
                    if d_val >= one_year_ago:
                        active_changes.append(d_val)
                except Exception:
                    pass
            
            if len(active_changes) >= 2:
                active_changes.sort()
                oldest_change = active_changes[0]
                next_allowed = oldest_change + timedelta(days=365)
                raise HTTPException(
                    status_code=400,
                    detail=f"Teachers cannot change class/section assignment more than 2 times a year. Next change allowed after {next_allowed.date().isoformat()}"
                )
            
            changes.append(now.isoformat() + "Z")
            profile.class_section_changes = json.dumps(changes)
        else:
            # Student limit: 1 time a year
            if profile.class_section_last_updated:
                last_updated = profile.class_section_last_updated
                if (now - last_updated).days < 365:
                    next_allowed = last_updated + timedelta(days=365)
                    raise HTTPException(
                        status_code=400,
                        detail=f"Students can only change class and section once a year. Next change allowed after {next_allowed.date().isoformat()}"
                    )
            profile.class_section_last_updated = now

    if data.phoneNumber is not None:
        profile.phone_number = data.phoneNumber
    if data.address is not None:
        profile.address = data.address
    if data.city is not None:
        profile.city = data.city
    if data.state is not None:
        profile.state = data.state
    if data.pincode is not None:
        profile.pincode = data.pincode
    if data.parentName is not None:
        profile.parent_name = data.parentName
    if data.parentPhone is not None:
        profile.parent_phone = data.parentPhone
    if data.parentEmail is not None:
        profile.parent_email = data.parentEmail
    if data.class_ is not None:
        profile.class_ = data.class_
    if data.section is not None:
        profile.section = data.section

    profile.updated_at = datetime.utcnow()
    db.add(profile)
    db.commit()
    return {"success": True}

