from fastapi import APIRouter, Query, Depends
from typing import Optional, List, Dict, Any
import re
import json
import logging
from sqlmodel import Session, select
from app.core.database import get_db
from models import CustomPage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])

SEARCH_INDEX: List[Dict[str, Any]] = [
    # --- Public Docs ---
    {
        "id": "docs-auth-signup",
        "title": "Account Registration (Signup) - Docs",
        "content": "Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles.",
        "url": "/docs/auth/signup",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["signup", "register", "create account", "credentials", "oauth", "google", "github"]
    },
    {
        "id": "docs-auth-login",
        "title": "Portal Login Streams - Docs",
        "content": "Walkthrough on signing into the dashboard and accessing your designated workspace controls.",
        "url": "/docs/auth/login",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["login", "signin", "redirect", "dashboard", "portal"]
    },
    {
        "id": "docs-auth-approval",
        "title": "Verification & Educator Approvals - Docs",
        "content": "Understand the email verification cycle and administrative approval flows for teachers.",
        "url": "/docs/auth/approval",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["verification", "approval", "waiting room", "pending", "status", "educator"]
    },
    {
        "id": "docs-student-onboarding",
        "title": "Student Profile Onboarding - Docs",
        "content": "Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace.",
        "url": "/docs/student/onboarding",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["onboarding", "profile", "admission number", "commute", "parent", "guardian", "setup"]
    },
    {
        "id": "docs-student-fees",
        "title": "Fees Ledger & Online Payments - Docs",
        "content": "Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely.",
        "url": "/docs/student/fees",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["fees", "tuition", "payment", "razorpay", "receipt", "ledger", "scholarship", "invoice"]
    },
    {
        "id": "docs-student-marks",
        "title": "Academic Marks & Performance Sheets - Docs",
        "content": "Detailed view of your test results, subject aggregates, term percentages, and grade cards.",
        "url": "/docs/student/marks",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["marks", "grades", "exams", "report card", "gpa", "percentage", "tests"]
    },
    {
        "id": "docs-student-library",
        "title": "Library Catalog & Borrowing Tracker - Docs",
        "content": "Manage issued books, verify return deadlines, avoid late fines, and search library collections.",
        "url": "/docs/student/library",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["library", "books", "borrow", "catalog", "due date", "fine", "late fee"]
    },
    {
        "id": "docs-student-complaints",
        "title": "Filing a Complaint & Support Tickets - Docs",
        "content": "Report technical glitches, infrastructural issues, or classroom concerns directly to authorities.",
        "url": "/docs/student/complaints",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["complaint", "support", "ticket", "issue", "escalation", "helpdesk"]
    },
    {
        "id": "docs-teacher-roster",
        "title": "Class Roster & Student Profiles - Docs",
        "content": "Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes.",
        "url": "/docs/teacher/roster",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["roster", "class manager", "student profiles", "emergency contact"]
    },
    {
        "id": "docs-teacher-grading",
        "title": "Marks Submission & Grading Management - Docs",
        "content": "Learn how to record student test scores, batch-submit term exams, and publish grades.",
        "url": "/docs/teacher/grading",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["grading", "marks entry", "exam submit", "scores", "grades editor"]
    },
    {
        "id": "docs-teacher-notices",
        "title": "Publishing Notices & Announcements - Docs",
        "content": "Broadcast class updates, homework tasks, or exam announcements directly to student portals.",
        "url": "/docs/teacher/notices",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["notices", "announcement", "broadcast", "bulletin board", "homework"]
    },
    {
        "id": "docs-teacher-escalations",
        "title": "Leave Requests & supplies Procurements - Docs",
        "content": "How to submit official leaves or supply orders directly to administration.",
        "url": "/docs/teacher/escalations",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["leave", "requests", "supplies", "procurement", "inventory"]
    },
    {
        "id": "docs-teacher-complaints",
        "title": "Educator Support & Complaint Tickets - Docs",
        "content": "Log infrastructural issues or coordinate reports directly with coordinators or IT support.",
        "url": "/docs/teacher/complaints",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["support ticket", "helpdesk", "educator complaint"]
    },
    {
        "id": "docs-privacy-policy",
        "title": "Privacy Policy - Docs",
        "content": "This Privacy Policy details how VidyaSchool collects, utilizes, protects, and governs personal information for students, educators, and guardians.",
        "url": "/docs/privacy-policy",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["privacy", "policy", "data protection", "security", "consent"]
    },
    {
        "id": "docs-terms-of-service",
        "title": "Terms of Service - Docs",
        "content": "These Terms of Service regulate access and use of the VidyaSchool digital portal, mobile applications, and student information systems.",
        "url": "/docs/terms-of-service",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["terms", "service", "agreement", "rules", "conduct", "liability"]
    },

    # --- Student Dashboard Pages ---
    {
        "id": "page-student-dashboard",
        "title": "Student Dashboard - Home",
        "content": "Access your personalized student profile overview, daily notice bulletins, and active shortcuts.",
        "url": "/student/{username}",
        "roles": ["student"],
        "keywords": ["home", "dashboard", "main", "student portal", "overview", "shortcuts"]
    },
    {
        "id": "page-student-fees",
        "title": "Fees Ledger & Payment Portal",
        "content": "Verify outstanding balances, tuition fees, transport fees, and pay online securely via Razorpay.",
        "url": "/student/{username}/fees",
        "roles": ["student"],
        "keywords": ["fees", "tuition", "payment", "razorpay", "bill", "invoice", "finance", "due"]
    },
    {
        "id": "page-student-library",
        "title": "Library Book Catalog",
        "content": "Search the digital catalog library, view active borrowings, and check book return due dates.",
        "url": "/student/{username}/library",
        "roles": ["student"],
        "keywords": ["library", "books", "borrow", "catalog", "search books", "due dates"]
    },
    {
        "id": "page-student-marks",
        "title": "My Marks & Exam Reports",
        "content": "View class test scores, terminal examination marks aggregates, and GPA cards.",
        "url": "/student/{username}/marks",
        "roles": ["student"],
        "keywords": ["marks", "grades", "exams", "report card", "results", "score card"]
    },
    {
        "id": "page-student-notices",
        "title": "Notice Board & Announcements",
        "content": "Read all official school notices, grade announcements, holiday alerts, and academic updates.",
        "url": "/student/{username}/notice",
        "roles": ["student"],
        "keywords": ["notice", "announcements", "bulletin", "school circulars", "alerts"]
    },

    # --- Teacher Dashboard Pages ---
    {
        "id": "page-teacher-dashboard",
        "title": "Teacher Dashboard - Home",
        "content": "Overview of your classes, upcoming subjects, quick tools, and recent notice logs.",
        "url": "/teacher/{username}",
        "roles": ["teacher"],
        "keywords": ["home", "dashboard", "main", "teacher portal", "overview"]
    },
    {
        "id": "page-teacher-class",
        "title": "My Class Roster",
        "content": "Manage student registers for your assigned class, update contact card records, and audit onboarding status.",
        "url": "/teacher/{username}/class",
        "roles": ["teacher"],
        "keywords": ["class", "roster", "students list", "attendance", "register", "grade"]
    },
    {
        "id": "page-teacher-subjects",
        "title": "Subject Marks Editor",
        "content": "Manage subjects, input student scores for assignments, midterms, and submit final terms.",
        "url": "/teacher/{username}/subjects",
        "roles": ["teacher"],
        "keywords": ["subjects", "marks entry", "grading", "class scores", "exams"]
    },
    {
        "id": "page-teacher-requests",
        "title": "Leave & Supply Requests",
        "content": "Submit requests for official leave of absence or classroom supplies procurement.",
        "url": "/teacher/{username}/requests",
        "roles": ["teacher"],
        "keywords": ["requests", "leave", "supplies", "procurement", "orders"]
    },
    {
        "id": "page-teacher-notices",
        "title": "Notice Publishing Desk",
        "content": "Draft and broadcast notice announcements directly to student portals and boards.",
        "url": "/teacher/{username}/notice",
        "roles": ["teacher"],
        "keywords": ["notice", "publish", "announcement", "bulletin", "homework notice"]
    },
    {
        "id": "page-teacher-complaints",
        "title": "Complaints Directory",
        "content": "Audit student complaints or infrastructural concerns routed to your dashboard.",
        "url": "/teacher/{username}/complaints",
        "roles": ["teacher"],
        "keywords": ["complaint", "support ticket", "grievance", "classroom issue"]
    },

    # --- Librarian Dashboard Pages ---
    {
        "id": "page-librarian-dashboard",
        "title": "Librarian Dashboard - Home",
        "content": "Library operations summary, outstanding book returns, and issue metrics.",
        "url": "/librarian/{username}",
        "roles": ["librarian"],
        "keywords": ["home", "dashboard", "main", "librarian portal"]
    },
    {
        "id": "page-librarian-books",
        "title": "Book Catalog Management",
        "content": "Add, edit, or remove books from the school library catalog.",
        "url": "/librarian/{username}/books",
        "roles": ["librarian"],
        "keywords": ["manage books", "catalog", "inventory", "library inventory"]
    },
    {
        "id": "page-librarian-borrowings",
        "title": "Book Issue & Returns Ledger",
        "content": "Issue library books to students or teachers, register returns, and log fine surcharges.",
        "url": "/librarian/{username}/borrowings",
        "roles": ["librarian"],
        "keywords": ["borrowings", "issue book", "return book", "library ledger", "fines"]
    },
    {
        "id": "page-librarian-notice",
        "title": "Librarian Notices Desk",
        "content": "Review notice announcements posted by library and administration boards.",
        "url": "/librarian/{username}/notice",
        "roles": ["librarian"],
        "keywords": ["notices", "bulletin board", "announcements"]
    },

    # --- Admin Dashboard Pages ---
    {
        "id": "page-admin-dashboard",
        "title": "Admin Dashboard - Home",
        "content": "School management control panel, user metrics, and pending educator requests.",
        "url": "/admin/{username}",
        "roles": ["admin"],
        "keywords": ["home", "dashboard", "main", "admin portal", "management"]
    },
    {
        "id": "page-admin-students",
        "title": "Student Accounts Management",
        "content": "Manage enrolled students profiles, check admission numbers, and change user roles.",
        "url": "/admin/{username}/students",
        "roles": ["admin"],
        "keywords": ["students", "student management", "admission", "users role"]
    },
    {
        "id": "page-admin-teachers",
        "title": "Teacher Accounts & Approvals",
        "content": "Review new teacher registrations, approve pending accounts, and manage class teacher allocations.",
        "url": "/admin/{username}/teacher",
        "roles": ["admin"],
        "keywords": ["teachers", "faculty", "approvals", "pending request", "class teacher"]
    },
    {
        "id": "page-admin-requests",
        "title": "Leave & Procurement approvals",
        "content": "Audit and approve teacher leave applications and supply procurements.",
        "url": "/admin/{username}/requests",
        "roles": ["admin"],
        "keywords": ["approvals", "leave approval", "supplies request", "review"]
    },
    {
        "id": "page-admin-fees",
        "title": "School Fees Management",
        "content": "Define school fees structures, track ledger collections, and verify financial summaries.",
        "url": "/admin/{username}/fee-management",
        "roles": ["admin"],
        "keywords": ["fees management", "finance", "fee structure", "collection"]
    },
    {
        "id": "page-admin-complaints",
        "title": "Admin Complaints Desk",
        "content": "Audit and review student and teacher escalation tickets.",
        "url": "/admin/{username}/complaints",
        "roles": ["admin"],
        "keywords": ["complaints", "tickets", "grievance", "support escalations"]
    },
    {
        "id": "page-admin-notice",
        "title": "Admin Notices Directory",
        "content": "Edit and publish official school notices and student circulars.",
        "url": "/admin/{username}/notice",
        "roles": ["admin"],
        "keywords": ["notices", "circulars", "bulletin board", "publish notice"]
    },
    {
        "id": "page-admin-slider",
        "title": "Slider Banner Publisher",
        "content": "Configure and publish image banners displayed on student/teacher dashboard sliders.",
        "url": "/admin/{username}/slider",
        "roles": ["admin"],
        "keywords": ["slider", "banners", "images", "carousel", "ads"]
    },

    # --- Account Dashboard Pages ---
    {
        "id": "page-account-dashboard",
        "title": "Accounts Dashboard - Home",
        "content": "Financial summaries, income ledgers, expense reports, and ledger status.",
        "url": "/accounts/{username}",
        "roles": ["account"],
        "keywords": ["home", "dashboard", "main", "accounts portal", "finance"]
    },
    {
        "id": "page-account-fees",
        "title": "Student Fees Tracker",
        "content": "Audit student tuition installments, overdue payments, and manual fee adjustments.",
        "url": "/accounts/{username}/fees",
        "roles": ["account"],
        "keywords": ["fees ledger", "student payment", "tuition collections"]
    },
    {
        "id": "page-account-structures",
        "title": "Tuition Fee Structures",
        "content": "Configure class-wise monthly tuition, activity fees, and transportation surcharges.",
        "url": "/accounts/{username}/structures",
        "roles": ["account"],
        "keywords": ["fee structure", "class fees", "rates", "surcharge"]
    },
    {
        "id": "page-account-payments",
        "title": "Online Payments Ledger",
        "content": "List of online transactions verified through Razorpay, showing UPI and bank reference codes.",
        "url": "/accounts/{username}/payments",
        "roles": ["account"],
        "keywords": ["razorpay ledger", "transactions", "upi", "card payments"]
    },
    {
        "id": "page-account-expenses",
        "title": "School Expenses Logger",
        "content": "Record school operating costs, utility payments, salary logs, and maintenance bills.",
        "url": "/accounts/{username}/expenses",
        "roles": ["account"],
        "keywords": ["expenses", "expenditure", "bills", "payouts"]
    },
    {
        "id": "page-account-income",
        "title": "Miscellaneous Income Logger",
        "content": "Record school non-tuition revenues, grant sponsorships, and donations.",
        "url": "/accounts/{username}/income",
        "roles": ["account"],
        "keywords": ["revenue", "income", "donations", "grants"]
    },
    {
        "id": "page-account-payroll",
        "title": "Faculty Payroll Manager",
        "content": "Manage salaries, allowances, provident fund deductibles, and release payouts.",
        "url": "/accounts/{username}/payroll",
        "roles": ["account"],
        "keywords": ["payroll", "salaries", "paycheck", "provident fund", "teachers pay"]
    },
    {
        "id": "page-account-ledgers",
        "title": "General Ledgers Accounts",
        "content": "Double-entry bookkeeping accounts, asset ledgers, liability ledgers, and equity balances.",
        "url": "/accounts/{username}/ledgers",
        "roles": ["account"],
        "keywords": ["bookkeeping", "assets", "liabilities", "ledger sheets"]
    },
    {
        "id": "page-account-banks",
        "title": "School Bank Accounts",
        "content": "List bank balances, deposit tracks, bank reconciliation reports, and cash vaults.",
        "url": "/accounts/{username}/banks",
        "roles": ["account"],
        "keywords": ["bank balance", "deposit", "savings account", "reconciliation"]
    },
    {
        "id": "page-account-invoices",
        "title": "Invoices Generation Desk",
        "content": "Issue official school invoices to students, vendors, or transport contractors.",
        "url": "/accounts/{username}/invoices",
        "roles": ["account"],
        "keywords": ["invoice", "bills", "billing desk"]
    },
    {
        "id": "page-account-receipts",
        "title": "Receipts Directory",
        "content": "Generate and print official payment receipt sheets showing transaction details.",
        "url": "/accounts/{username}/receipts",
        "roles": ["account"],
        "keywords": ["receipt", "proof of payment", "print receipt"]
    },
    {
        "id": "page-account-refunds",
        "title": "Refund Requests Desk",
        "content": "Process student refunds for caution deposits, admission cancellations, or double payments.",
        "url": "/accounts/{username}/refunds",
        "roles": ["account"],
        "keywords": ["refunds", "cancel billing", "return money"]
    },
    {
        "id": "page-account-scholarships",
        "title": "Scholarship Allocations",
        "content": "Allocate tuition fee concession waivers to EWS, Merit-based, or Sports scholarship profiles.",
        "url": "/accounts/{username}/scholarships",
        "roles": ["account"],
        "keywords": ["concession", "waivers", "scholarships", "ews discount"]
    },
    {
        "id": "page-account-reports",
        "title": "Financial Audit Reports",
        "content": "Audit balance sheets, profit & loss statements, cash flow charts, and collection aggregates.",
        "url": "/accounts/{username}/reports",
        "roles": ["account"],
        "keywords": ["reports", "balance sheet", "p&l statement", "audit", "profit"]
    },
    {
        "id": "page-account-settings",
        "title": "Financial Configurations Settings",
        "content": "Set tax brackets (GST), automatic fine rates, payment term due limits, and account locks.",
        "url": "/accounts/{username}/settings",
        "roles": ["account"],
        "keywords": ["settings", "tax configuration", "late fine rate", "finance rules"]
    },

    # --- Common Portal Pages ---
    {
        "id": "page-common-community",
        "title": "Community Chat Room",
        "content": "Join the live school community conversation, chat real-time, and read notices.",
        "url": "/community",
        "roles": ["student", "teacher", "librarian", "admin", "account"],
        "keywords": ["chat", "community", "messages", "live talk", "group chat"]
    },
]

def extract_text_from_widgets(widgets_data: Any) -> str:
    """Recursively extract readable text from page builder widgets."""
    texts: List[str] = []

    def _traverse(obj: Any):
        if isinstance(obj, dict):
            # Extract common text properties
            props = obj.get("props", {}) if isinstance(obj.get("props"), dict) else obj
            for key in ["text", "title", "description", "label", "label1", "label2", "label3", 
                        "stat1", "stat2", "stat3", "q1", "a1", "q2", "a2", "q3", "a3", 
                        "col1Title", "col1Body", "col2Title", "col2Body", "col3Title", "col3Body"]:
                val = props.get(key)
                if isinstance(val, str) and val.strip():
                    texts.append(val.strip())
            
            # Recurse into nested widget arrays or child objects
            for k, v in obj.items():
                if k in ["col1Widgets", "col2Widgets", "col3Widgets", "widgets", "children"] and isinstance(v, list):
                    _traverse(v)
                elif isinstance(v, (dict, list)):
                    _traverse(v)
        elif isinstance(obj, list):
            for item in obj:
                _traverse(item)

    _traverse(widgets_data)
    seen = set()
    unique_texts = []
    for t in texts:
        if t not in seen:
            seen.add(t)
            unique_texts.append(t)
    return " ".join(unique_texts)


@router.get("")
def search(
    query: str = Query(..., alias="q"),
    role: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db)
):
    cleaned_query = query.strip().lower()
    if not cleaned_query:
        return []

    # Tokenize the query to match individual keywords
    query_tokens = [t for t in re.split(r"\s+", cleaned_query) if t]
    
    results = []
    
    # 1. Search Static Portal Index
    for item in SEARCH_INDEX:
        # Check if item is role-restricted
        if role and "roles" in item and role not in item["roles"]:
            continue
            
        score = 0
        title_lower = item["title"].lower()
        content_lower = item["content"].lower()
        
        # Exact title match gets absolute highest points
        if cleaned_query == title_lower:
            score += 150
        elif cleaned_query in title_lower:
            score += 80
            
        # Token match points for Title
        for token in query_tokens:
            if token in title_lower:
                score += 20
                
        # Match against keywords list
        for kw in item.get("keywords", []):
            kw_lower = kw.lower()
            if cleaned_query == kw_lower:
                score += 60
            elif cleaned_query in kw_lower:
                score += 30
            else:
                for token in query_tokens:
                    if token == kw_lower:
                        score += 25
                    elif token in kw_lower:
                        score += 12
                        
        # Match in content body
        if cleaned_query in content_lower:
            score += 25
        for token in query_tokens:
            if token in content_lower:
                score += 8
                
        if score > 0:
            item_url = item["url"]
            if username and "{username}" in item_url:
                formatted_url = item_url.format(username=username)
            else:
                formatted_url = item_url.replace("/{username}", "")
                
            results.append({
                "id": item["id"],
                "title": item["title"],
                "content": item["content"],
                "url": formatted_url,
                "score": score
            })

    # 2. Search Dynamic Custom Pages Created via Page Builder
    try:
        if role == "admin":
            stmt = select(CustomPage)
        else:
            stmt = select(CustomPage).where(CustomPage.status == "published")
        custom_pages = db.exec(stmt).all()

        for page in custom_pages:
            title_lower = (page.title or "").lower()
            slug_lower = (page.slug or "").lower()
            slug_words = slug_lower.replace("-", " ")
            
            # Parse widgets_json to extract textual content
            parsed_widgets = []
            if page.widgets_json:
                try:
                    parsed_widgets = json.loads(page.widgets_json)
                except Exception:
                    parsed_widgets = []
                    
            extracted_text = extract_text_from_widgets(parsed_widgets)
            extracted_lower = extracted_text.lower()
            
            score = 0
            
            # Exact title or slug matches
            if cleaned_query == title_lower:
                score += 160
            elif cleaned_query == slug_lower or cleaned_query == slug_words:
                score += 150
            elif cleaned_query in title_lower:
                score += 90
            elif cleaned_query in slug_lower or cleaned_query in slug_words:
                score += 80
                
            # Token matches in title or slug
            for token in query_tokens:
                if token in title_lower:
                    score += 25
                if token in slug_words:
                    score += 20
                    
            # Content matches in widget text
            if cleaned_query in extracted_lower:
                score += 35
            for token in query_tokens:
                if token in extracted_lower:
                    score += 10
                    
            if score > 0:
                snippet = extracted_text[:160].strip()
                if not snippet:
                    snippet = f"Custom page created via Page Builder: /{page.slug}"
                elif len(extracted_text) > 160:
                    snippet += "..."
                    
                results.append({
                    "id": f"page-custom-{page.slug}",
                    "title": page.title,
                    "content": snippet,
                    "url": f"/p/{page.slug}",
                    "score": score
                })
                
                # If admin with username, provide a direct shortcut to edit the page in Page Builder
                if role == "admin" and username:
                    results.append({
                        "id": f"builder-edit-{page.id}",
                        "title": f"Edit {page.title} (Page Builder)",
                        "content": f"Open Elementor Page Builder editor for /{page.slug}",
                        "url": f"/admin/{username}/page-builder/{page.id}",
                        "score": score - 2
                    })
    except Exception as e:
        logger.error(f"Error searching page-builder custom pages: {e}")
            
    # Sort results by score in descending order
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Return top 15 results (limited and clean)
    return [{
        "id": r["id"],
        "title": r["title"],
        "content": r["content"],
        "url": r["url"]
    } for r in results[:15]]

DOC_MARKDOWNS = {
    "/docs/auth/signup": """# Account Registration (Signup)
Learn how to register your profile credentials on the VidyaSchool portal and choose your preferred platform roles.

## Step-by-Step Guide

### 01. Select preferred Role
Choose between 'Student' or 'Teacher' when creating your profile. Students are registered directly on submission, whereas Teachers are queued for manual administrative verification before portal activation.

### 02. Email & Credentials
Provide your full name, institutional email address, and select a secure password. Ensure institutional emails are typed correctly to receive verification links.

### 03. Social Logins (Alternative)
Alternatively, click Google or GitHub icons to link and sign in directly using OAuth social login channels. This automatically verifies your email profile.
""",
    "/docs/auth/login": """# Portal Login Streams
Walkthrough on signing into the dashboard and accessing your designated workspace controls.

## Details

### 1. Credential Login
Input your registered email address and password on the login screen. Click Sign In to verify credentials.

### 2. Automatic Dashboard Redirects
Upon successful authentication, the gateway redirects you to your corresponding dashboard layout:
- **Students**: Redirected to `/student/[username]` dashboard.
- **Teachers**: Redirected to `/teacher/[username]` workspace.
- **Accounts Clerks**: Redirected to `/accounts/[username]` control panels.
- **Administrators**: Redirected to `/admin/[username]` command center.
""",
    "/docs/auth/approval": """# Verification & Educator Approvals
Understand the email verification cycle and administrative approval flows for teachers.

## Details

### 1. Email Verification links
Upon creating an account, an automated email verification link is transmitted. Clicking this link verifies your profile status, enabling dashboard onboarding.

### 2. Educator/Teacher Approval Waiting Room
For security, new teacher registrations are placed in a 'pending' state. Teachers will be redirected to the Waiting Room page and cannot access classroom tools. Once an Administrator audits and approves the teacher request, access is instantly granted.
""",
    "/docs/student/onboarding": """# Student Profile Onboarding
Complete guide on setting up your account profile, emergency coordinates, class allocations, and commuter choices to activate your portal workspace.

## Step-by-Step Guide

### 01. Admission Number & Phone Registration
Input your official school-assigned admission key (e.g. 2024/STU/102). This matches your registration with the central registrar database. Submit your primary mobile number to register for automated text alert streams.

### 02. Assigned Class Bracket & Section Setup
Select your active grade level and sections. This configures your dashboard feeds, class homework journals, and examination calendars. Double-check this selection as class assignments can only be changed by administrators.

### 03. Mode of Commute selection
Choose between 'Walking' and 'School Transport'. Selecting School Transport links your profile to transit logs and school bus schedules. Walkers are tracked for perimeter checkouts only.

### 04. Parent / Guardian Contact Information
Submit parent names, emergency phone numbers, and optional email IDs. This is required for fee-due notices, progress report card sign-offs, and critical school announcements.

### 05. Mailing Address Verification
Provide street address, state, city, and a valid 6-digit postal pincode. This is verified against municipal zones for school transport routing setups.

## Additional Details

### Why is onboarding mandatory?
Without completed onboarding records, the database locks student dashboard access. Complete profile registration resolves database tags, allowing instant ledger views, report card releases, and message boards logs.

### Troubleshooting common errors
If the screen reports 'Admission number already exists', it means another profile is registered with those details. Contact the administration helpdesk to reset credentials. Ensure your pincode contains exactly 6 digits.
""",
    "/docs/student/fees": """# Fees Ledger & Online Payments
Verify outstanding balances, tuition fees, transport fees, and co-curricular concessions, and pay online securely.

## Details

### 1. Auditing the Fees Ledger
Navigate to the Fees section of your sidebar. The ledger details all generated monthly fee installments, itemized by basic tuition, transport surcharge, and activity fees. Outstanding items are categorized as 'Pending' or 'Overdue' (past payment deadline), while settled items are marked as 'Paid'.

### 2. Executing Online Payments
Click the Pay Now button next to any unpaid installment. This launches the secure Razorpay Checkout overlay. You can process transactions using credit/debit cards, NetBanking, mobile wallets, or instant UPI (Google Pay, PhonePe, Paytm). Confirmations are processed in real-time, instantly marking installments as Paid.

### 3. Downloading Official Receipts
Once paid, click the 'PDF Receipt' action next to the installment. This generates a digitally signed PDF invoice showing receipt numbers, transaction reference IDs, and payment stamps. Keep these for tax clearance audits.

### 4. Scholarship Concessions & Waivers
If you are on EWS, Merit-based, or Sports scholarships, concessions are applied directly to the installment amount. Check the 'Applied Waiver' lines on the card detail drawers. Contact the accountant's desk if waivers are missing.
""",
    "/docs/student/marks": """# Academic Marks & Performance Sheets
Detailed view of your test results, subject aggregates, term percentages, and grade cards.

## Details

### 1. Navigating Grades
The Marks portal compiles all test sheets published by teachers. Select terms (Term 1, Mid-Term, Term 2) or filter by specific subjects (Mathematics, Physics, English) using the filter dropdown cards.

### 2. Weighted Grading System
Your final subject percentages are calculated using weighted grades: Assignments contribute 20% to the subject grade, Mid-Terms contribute 30%, and Term Finals contribute 50%. The cumulative GPA is auto-generated upon term final score submissions.

### 3. Accessing Remarks & Sign-offs
Check teacher comments on assignment lines. Report cards require parent sign-off parameters, which are tracked on the profile dashboard sheets.
""",
    "/docs/student/library": """# Library Catalog & Borrowing Tracker
Manage issued books, verify return deadlines, avoid late fines, and search library collections.

## Details

### 1. Borrowed Books Ledger
The library card lists all active books issued to your student card. Each item lists the library barcode, book title, checkout date, and return deadline. Items past deadlines are flagged with high-visibility overdue warnings.

### 2. Fine Calculation Surcharges
Overdue books accumulate library fines at a rate of ₹10 per day. Accumulated fines are added to the next student fees ledger installment automatically. Prompt returns avoid these charges.

### 3. Catalog Search
Search the digital catalog by title, author, or genre to check current shelf availability before visiting the library desk.
""",
    "/docs/student/complaints": """# Filing a Complaint & Support Tickets
Report technical glitches, infrastructural issues, or classroom concerns directly to authorities.

## Details

### 1. Launching a Ticket
Click the File a Complaint button in the sidebar. This opens the complaint submission modal, which bypasses general inbox channels to route issues directly to designated staff.

### 2. Recipient Routing Options
Select the appropriate destination for your issue:
- **Teacher**: For classroom, syllabus, or peer concerns.
- **Tech Support (Admin)**: For portal issues, password resets, or device bugs.
- **Principal / Vice-Principal (Admin)**: For serious escalations or infrastructural reports.

### 3. Tagging Users
Use the 'Tag People' field to reference specific users. Start typing '@' to search and tag students or teachers. Tagged users will receive a copy of the ticket in their portal notifications.

### 4. Tracking Resolutions
Upon submission, the portal outputs a success toast with a unique reference number (e.g., CMP-77169). Use this ID to track updates with support clerks.
""",
    "/docs/teacher/roster": """# Class Roster & Student Profiles
Detailed instructions for teachers to manage student lists, emergency phone numbers, and transit modes.

## Details

### 1. Roster Auditing
Access the Class section of your dashboard. The roster grid lists all assigned class students, including admission codes, registered emails, and onboarding statuses (Completed vs Pending).

### 2. Filtering & Contact Cards
Use search bars to filter by student name. Clicking a student row opens their contact card, listing parent names, emergency phone numbers, and commute modes (Walking vs Transport). This is critical for organizing school bus routes or coordinating parent updates.
""",
    "/docs/teacher/grading": """# Marks Submission & Grading Management
Learn how to record student test scores, batch-submit term exams, and publish grades.

## Details

### 1. Entering Grades
Navigate to your assigned subjects page. Select the target class and exam type (Assignment, Midterm, or Final Exam). The grid updates to show input fields for each student.

### 2. Score Ranges & Validation
Input numeric scores within the designated max limits (e.g. 0-100). The form checks inputs in real-time, preventing input of values exceeding max limits or negative scores.

### 3. Grade Publishing
Review the filled grades and click Submit. Published scores update student report cards instantly and trigger GPA/average percentage recalculations.
""",
    "/docs/teacher/notices": """# Publishing Notices & Announcements
Broadcast class updates, homework tasks, or exam announcements directly to student portals.

## Details

### 1. Creating an Announcement
Open the Notices tab and click New Announcement. Draft your notice, add titles, select target classes (e.g. Class 10-A, Class 9-B), and attach optional files.

### 2. Broadcast Delivery
Clicking Publish instantly pushes the notice to the target student notice board streams. Important notices can be flagged as urgent to display warning flags on student log screens.
""",
    "/docs/teacher/escalations": """# Leave Requests & Supplies Procurements
How to submit official leaves or supply orders directly to administration.

## Details

### 1. Supply Orders
Request classroom materials (supplies, books, lab assets) through the requests panel. Input item names, quantities, and justification reasons. Admin reviews requests in real-time.

### 2. Submitting Leave Requests
Select the leave option, choose date ranges, input reason descriptions, and submit. Status fields update to Approved or Rejected as admin reviews the request.
""",
    "/docs/teacher/complaints": """# Educator Support & Complaint Tickets
Log infrastructural issues or coordinate reports directly with coordinators or IT support.

## Details

### 1. Submitting Support Requests
Use the File a Complaint button in the sidebar. Select Academic Coordinator, Principal, or IT Support, fill in titles, tag users, and describe your request. CMP reference numbers are issued for all submissions.
""",
    "/docs/privacy-policy": """# Privacy Policy
This Privacy Policy details how VidyaSchool and BlazeNeuro collect, process, safeguard, and govern personal data for students, guardians, educators, and administrators across web and mobile platforms.

## 1. Scope & Data Fiduciary Details
Applies to all users across web, Android, iOS, and API interfaces. We process records strictly for educational delivery in compliance with FERPA, COPPA, and DPDP frameworks. We do not sell or monetize student data.

## 2. Information We Collect
- **Identity & Profile**: Legal names, emails, credentials, admission numbers, class/section allocations.
- **Guardian Coordinates**: Parent/guardian contact numbers, emergency addresses, bus route preferences.
- **Academic Records**: Attendance registers, exam marks, gradebooks, report cards, teacher remarks.
- **Financial Logs**: Fee ledgers, transaction references, payment status flags (Razorpay tokenized).
- **Study Materials**: Notes, drawings, syllabus PDFs, complaint tickets.
- **Technical & Session Data**: IP addresses, user-agents, session tokens (`better-auth.session_token`), FCM tokens.

## 3. Purposes & Legal Bases
- Administering student onboarding, attendance, report cards, and digital fee processing.
- Dispatching emergency alerts, attendance notifications, and payment receipts via WebPush, SMS, and email.
- Enforcing Role-Based Access Control (RBAC) and securing multi-device sessions.

## 4. Children's Privacy, FERPA & Parental Consent
School institutions warrant valid parental/guardian consent upon registering student accounts. Minors are never subjected to behavioral profiling, commercial data mining, or targeted advertising.

## 5. Data Sharing & Subprocessors
We do not sell student data. Data is processed through vetted infrastructure partners (Neon PostgreSQL, Vercel, Razorpay, Firebase FCM, AWS S3/Cloudinary, Resend) under strict confidentiality agreements.

## 6. Cookies & Session Management
Strictly necessary session tokens are used to maintain authenticated states. Users can inspect and remotely revoke active device sessions via the Active Sessions security console.

## 7. Data Retention & Security
Records are retained for the duration of student enrollment plus statutory institutional auditing periods (5-7 years). All transmissions are encrypted via HTTPS/TLS 1.3, with AES-256 encryption at rest.

## 8. Your Legal Rights & Grievance Contact
Parents and students retain rights of access, rectification, portability, and session revocation.
For privacy inquiries or grievance redressal, contact our Data Protection Officer at `privacy@vidyaschool.com` or `legal@blazeneuro.com`.
""",
    "/docs/terms-of-service": """# Terms of Service
These Terms of Service regulate access and use of the VidyaSchool digital portal, mobile applications, APIs, student information systems, fee collection interfaces, and associated services operated by VidyaSchool and BlazeNeuro.

## 1. Binding Agreement & Acceptance of Terms
By registering an account, verifying onboarding forms, authenticating sessions, processing fee transactions, or using any portal services, you agree to be legally bound by these Terms and our Privacy Policy. If you disagree with any portion of these Terms, portal access must be discontinued immediately.

## 2. Eligibility & Minor Consent
Students under the age of majority may only use the Platform under the consent, supervision, and financial responsibility of their parent, legal guardian, or authorized educational institution under applicable student data protection laws (FERPA, COPPA, DPDP).

## 3. Accounts, Authentication & Security
Users must provide true, complete, and verifiable admission information. Sharing login credentials or multi-session tokens is prohibited. Users are solely responsible for maintaining credential secrecy and immediately revoking compromised sessions via the Active Sessions dashboard.

## 4. Role-Specific Obligations & Academic Integrity
- **Students**: Academic honesty, non-tampering with marks or attendance, respectful conduct in chat boards.
- **Teachers & Librarians**: Accuracy and integrity of gradebooks, examination registers, lecture notes, and library catalog records. Mandatory administrative verification before account activation.
- **Accountants & Administrators**: Strict compliance with fee structures, audit standards, discount waivers, and user privilege delegations.

## 5. Fees, Gateway Transactions & Refund Policy
Tuition fee processing utilizes licensed third-party gateways (Razorpay, UPI). Digital receipts generated by the accountant portal serve as official settlement proof. VidyaSchool is a technology intermediary; all fee disputes, waivers, and refund policies are governed strictly by the respective educational institution.

## 6. Acceptable Use & Prohibited Conduct
Zero tolerance for security probing, denial-of-service attacks, reverse engineering, automated data scraping, malicious file uploads, cheating/fraud, or defamatory, harassing, and obscene communications.

## 7. Intellectual Property & User Content
VidyaSchool and BlazeNeuro retain all rights and titles to proprietary software, UI, logos, and shaders. Users retain ownership of uploaded study notes while granting VidyaSchool a royalty-free license to host, format, and display such materials for educational delivery.

## 8. AI-Assisted Educational Tools Disclaimer
AI Page Builder, formula helpers, and quiz generators are provided strictly as supplemental study aids on an "AS-IS" basis. VidyaSchool disclaims all warranties regarding the factual correctness or curriculum compliance of AI outputs.

## 9. Electronic Communications & Push Alerts
Users consent to receiving operational and transactional alerts via WebPush, FCM, SMS, and email. Carrier delays or device notification failures do not constitute service liability.

## 10. Third-Party Infrastructure
The Platform relies on third-party cloud infrastructure (Razorpay, Neon Database, Cloudinary/S3, Firebase, Vercel). VidyaSchool is not liable for upstream vendor outages.

## 11. Suspension & Account Termination
We reserve the right to suspend or terminate accounts that breach portal rules, violate academic guidelines, or post false information without prior notice.

## 12. Disclaimer of Warranties
The Platform is provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind, express or implied.

## 13. Limitation of Liability
In no event shall VidyaSchool or BlazeNeuro be liable for indirect, incidental, punitive, or consequential damages. Maximum aggregate liability is strictly capped at fees actually paid in the preceding three months or $100 USD.

## 14. Indemnification
Users agree to defend, indemnify, and hold harmless VidyaSchool and BlazeNeuro from legal claims arising out of user misuse, breach of terms, or law violations.

## 15. Governing Law & Dispute Resolution
Governed by the substantive laws of India. Unresolved disputes shall be settled through mandatory good-faith negotiation followed by binding individual arbitration in Bengaluru, Karnataka, India.

## 16. General Provisions & Legal Contact
For legal inquiries, contact the Legal & Compliance Cell at `legal@blazeneuro.com` or `support@vidyaschool.com`.
"""
}

@router.get("/markdown")
def get_doc_markdown(path: str = Query(...)):
    # Standardize path by removing domain prefix if any
    cleaned_path = path
    if "vercel.app" in path:
        cleaned_path = "/" + path.split("vercel.app/")[-1]
    
    # Strip any trailing/leading slashes
    cleaned_path = "/" + cleaned_path.strip("/")
    
    # Try to load from local .md file in backend/docs/
    import os
    base_docs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "docs")
    
    # Strip leading "/docs" or "/docs/" to find relative path inside docs/
    rel_path_part = cleaned_path
    if rel_path_part.startswith("/docs/"):
        rel_path_part = rel_path_part[6:]
    elif rel_path_part.startswith("/docs"):
        rel_path_part = rel_path_part[5:]
    rel_path_part = rel_path_part.lstrip("/")
    
    file_path = os.path.join(base_docs_dir, rel_path_part + ".md")
    
    md_content = None
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                md_content = f.read()
        except Exception:
            pass
            
    # Fallback to hardcoded dictionary if file reading failed/not found
    if not md_content:
        md_content = DOC_MARKDOWNS.get(cleaned_path)
    
    if not md_content:
        # Generate a generic fallback markdown if path is not mapped
        title = cleaned_path.split("/")[-1].replace("-", " ").title()
        md_content = f"# {title}\nDocumentation details for `{cleaned_path}` are under review. Contact support if you need immediate guidance."
        return {
            "title": title,
            "markdown": md_content
        }
        
    # Extract title from the first header line
    title_line = md_content.split("\n")[0]
    title = title_line.replace("#", "").strip() if title_line.startswith("#") else "Help Article"
    
    return {
        "title": title,
        "markdown": md_content
    }
