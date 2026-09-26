import { Badge } from "@/components/ui/badge"
import { Shield, Lightbulb, AlertTriangle, HelpCircle, CheckCircle2 } from "lucide-react"
import { DocsPage, DocsBody } from "fumadocs-ui/page"

interface Step {
  step: string
  title: string
  desc: string
}

interface Detail {
  title: string
  body: string
}

interface FAQ {
  q: string
  a: string
}

interface GuideArticle {
  title: string
  badge: string
  description: string
  steps?: Step[]
  details?: Detail[]
  tips?: string[]
  warnings?: string[]
  faqs?: FAQ[]
}

const ARTICLES: Record<string, Record<string, GuideArticle>> = {
  "getting-started": {
    overview: {
      title: "Platform Overview",
      badge: "Welcome",
      description: "VidyaSchool is a comprehensive school management portal that connects students, teachers, administrators, and accounts clerks in a unified digital workspace. This guide introduces you to the platform's key modules and how they work together.",
      details: [
        {
          title: "What is VidyaSchool?",
          body: "VidyaSchool is an integrated school management system designed to digitize every aspect of academic operations — from student enrollment and fee collection, to mark submission and library management. The platform is role-based, meaning each user type (student, teacher, accounts clerk, administrator) sees a personalized portal with tools relevant to their role."
        },
        {
          title: "Core Modules",
          body: "The platform is built around six core modules:\n• Authentication & Onboarding — Secure multi-role login, email verification, and step-by-step profile setup.\n• Academic Records — Teacher grade submission, student report cards, weighted GPA calculations, and performance tracking.\n• Fee Management — Itemized fee ledgers, online Razorpay payments, PDF receipt downloads, and waiver tracking.\n• Library System — Digital catalog, book issuance tracking, return deadlines, and fine accumulation.\n• Communication Hub — Class-level notice boards, circulars, announcements, and direct messaging.\n• Complaint & Support Desk — Structured ticket submission, routing to appropriate staff, and reference tracking."
        },
        {
          title: "Portal Access URLs",
          body: "Each role has a dedicated dashboard path:\n• Students: /student/[username] — Academic dashboard with marks, fees, notices, and library access.\n• Teachers: /teacher/[username] — Classroom workspace with grade entry, notice publishing, and roster management.\n• Accounts Clerks: /accounts/[username] — Fee management, ledger administration, and payment tracking.\n• Administrators: /admin/[username] — Full system control including user management, approvals, and reports."
        },
        {
          title: "Technology & Security",
          body: "VidyaSchool is built on Next.js 16 with server-side rendering for fast, SEO-friendly pages. Authentication is powered by BetterAuth with JWT sessions and optional OAuth (Google/GitHub). All data is stored in a PostgreSQL database via Neon serverless with Drizzle ORM. The platform supports Progressive Web App (PWA) installation for mobile access, and all API endpoints are protected by role-based access control (RBAC) middleware."
        }
      ],
      tips: [
        "Install the VidyaSchool PWA on your mobile device from the Downloads page for the best mobile experience.",
        "Use the keyboard shortcut ⌘F (Cmd+F) to quickly search through the documentation.",
        "Each module has a dedicated help section — look for the '?' icon in your dashboard sidebar."
      ]
    },
    quickstart: {
      title: "Quick Start by Role",
      badge: "Getting Started",
      description: "Follow the path that matches your role to get up and running on VidyaSchool in under 10 minutes.",
      steps: [
        {
          step: "01",
          title: "Create your account",
          desc: "Visit the Signup page and register with your institutional email. Select your role (Student or Teacher) carefully — this determines your entire portal experience and cannot be changed without administrator intervention."
        },
        {
          step: "02",
          title: "Verify your email",
          desc: "Check your inbox for a verification link sent immediately after signup. Click the link within 24 hours to activate your account. If you don't receive it, check your spam folder or use the 'Resend verification' option on the login page."
        },
        {
          step: "03",
          title: "Wait for approval (Teachers only)",
          desc: "Teacher accounts require manual admin approval before gaining portal access. You'll see a 'Pending Approval' screen after login. Expect 1-2 business days for verification. Students skip this step and proceed directly."
        },
        {
          step: "04",
          title: "Complete onboarding",
          desc: "On first login, you'll be guided through a multi-step onboarding wizard. For students, this includes admission number, class/section selection, commute mode, and parent/guardian contact details. For teachers, this includes staff ID, subject assignments, and department details. Complete all steps to unlock your full dashboard."
        },
        {
          step: "05",
          title: "Explore your dashboard",
          desc: "Once onboarded, your personalized dashboard is active. Students see their academic overview, fee status, and recent notices. Teachers see their class roster, grade entry panels, and announcement tools. Use the left sidebar to navigate between modules."
        }
      ],
      tips: [
        "Bookmark your portal URL (/student/[username] or /teacher/[username]) for fast daily access.",
        "Enable browser notifications to receive instant alerts for new notices and fee due reminders."
      ],
      faqs: [
        {
          q: "I signed up but can't log in. What's wrong?",
          a: "Most login issues are caused by an unverified email. Check your inbox (including spam) for the verification link. If you're a teacher, your account may still be pending admin approval — check the waiting room screen after login."
        },
        {
          q: "Can I change my role after registration?",
          a: "No — roles are set at registration and are locked for security. Contact your school administrator if you registered with the wrong role. They can delete and re-create your account with the correct role."
        },
        {
          q: "Is there a mobile app?",
          a: "Yes — VidyaSchool is available as a Progressive Web App (PWA). Visit the Downloads page in the header navigation to get installation instructions for iOS and Android."
        }
      ]
    },
    roles: {
      title: "Roles & Permissions",
      badge: "Access Control",
      description: "VidyaSchool uses role-based access control (RBAC) to ensure each user only sees and interacts with tools relevant to their responsibilities.",
      details: [
        {
          title: "Student Role",
          body: "Students have read-only access to their own academic data. Capabilities include:\n• View personal marks, report cards, and GPA.\n• View and pay fee ledger installments.\n• Access the library catalog and track borrowed books.\n• Read class notices and school circulars.\n• File complaint/support tickets directed at teachers or administration.\n• Update personal profile details (address, contact info).\nStudents cannot view other students' data, submit grades, or publish notices."
        },
        {
          title: "Teacher Role",
          body: "Teachers have read-write access to classroom tools. Capabilities include:\n• View and manage the class roster for assigned classes.\n• Enter, edit, and submit student marks for all exam types.\n• Publish notices and announcements to specific classes.\n• Submit leave requests and supply orders to administration.\n• Receive and respond to student complaint tickets.\n• View student profiles (contact info, commute details) for their classes only."
        },
        {
          title: "Accounts Clerk Role",
          body: "Accounts clerks manage financial operations. Capabilities include:\n• Create, edit, and delete fee ledger entries for all students.\n• Record and verify manual payment transactions.\n• Apply scholarship concessions and waivers.\n• Generate and download batch fee reports.\n• View student financial history and outstanding balances."
        },
        {
          title: "Administrator Role",
          body: "Administrators have full system access. Capabilities include:\n• Approve or reject teacher registration requests.\n• Manage all user accounts (create, suspend, delete).\n• Access all data across all roles.\n• Manage class and section configurations.\n• View complaint tickets from all sources and assign resolutions.\n• Access system-wide reports and analytics."
        }
      ],
      warnings: [
        "Never share your login credentials. Each user is responsible for activity under their account.",
        "Students attempting to access teacher or admin routes will be redirected to the Unauthorized page."
      ],
      faqs: [
        {
          q: "Can a teacher also be an accounts clerk?",
          a: "No — roles are mutually exclusive. A single account can only hold one role. If a staff member has dual responsibilities, they would need two separate accounts (one per role)."
        },
        {
          q: "Who do I contact if my role permissions seem wrong?",
          a: "Contact your school administrator. They can audit your role assignment and correct any discrepancies in the admin panel."
        }
      ]
    }
  },
  auth: {
    signup: {
      title: "Account Registration",
      badge: "Authentication",
      description: "Complete guide to creating your VidyaSchool account, selecting your role, and understanding what happens immediately after registration.",
      steps: [
        {
          step: "01",
          title: "Navigate to the Signup Page",
          desc: "Click 'Signup' in the top navigation bar, or visit /signup directly. The signup page presents two registration paths: institutional credential signup (email + password) and OAuth social login (Google or GitHub). Both paths are equally secure."
        },
        {
          step: "02",
          title: "Select your Role",
          desc: "Choose between 'Student' or 'Teacher' using the role selector at the top of the form. This selection is critical — it determines your portal access permanently. Students are registered and verified immediately on form submission. Teachers are placed in a pending queue and require manual administrator approval before gaining dashboard access."
        },
        {
          step: "03",
          title: "Enter your Credentials",
          desc: "Provide your full legal name (as it appears in school records), your institutional email address, and a strong password (minimum 8 characters, at least one uppercase letter and one number). Double-check your email — verification links and notices will be sent here."
        },
        {
          step: "04",
          title: "Submit & Check Email",
          desc: "Click 'Create Account'. The system immediately sends a verification email to your address. Open your inbox and click the verification link. This link expires in 24 hours. Once clicked, your account status changes from 'Unverified' to 'Active' (for students) or 'Pending Approval' (for teachers)."
        },
        {
          step: "05",
          title: "Social Login Alternative",
          desc: "Clicking the Google or GitHub buttons skips the password form and launches an OAuth consent flow. Your name and email are pulled automatically from your social account, bypassing manual email verification. However, you must still select a role before initiating the OAuth flow."
        }
      ],
      tips: [
        "Use your school-issued email address (e.g. name@school.edu.in) for faster admin verification.",
        "Strong passwords should be at least 12 characters. Consider a passphrase like 'Vidya2025Secure!'.",
        "If you accidentally registered with the wrong role, contact your administrator immediately — role changes require manual database intervention."
      ],
      warnings: [
        "Do not use a personal Gmail/Yahoo address if your school requires institutional email — it may delay or prevent admin approval.",
        "Verification links expire after 24 hours. If yours expired, use 'Resend Verification' on the login page."
      ],
      faqs: [
        {
          q: "I didn't receive a verification email. What should I do?",
          a: "Check your spam or junk mail folder first. If it's not there, wait 5 minutes and try the 'Resend Verification Email' button on the login screen. If issues persist, contact your school's IT desk to whitelist emails from the VidyaSchool domain."
        },
        {
          q: "Can I register without an institutional email?",
          a: "Yes — the system accepts any valid email format. However, teachers using non-institutional emails may face longer verification times as administrators verify credentials manually."
        },
        {
          q: "What happens if I close the signup page before verifying?",
          a: "Your account is created in an unverified state. Simply log in and you'll be prompted to verify. Use 'Resend Verification' if needed."
        }
      ]
    },
    login: {
      title: "Portal Login Streams",
      badge: "Authentication",
      description: "Step-by-step walkthrough for signing into VidyaSchool, understanding the automatic dashboard routing, and troubleshooting common login failures.",
      steps: [
        {
          step: "01",
          title: "Visit the Login Page",
          desc: "Click 'Login' in the header navigation, or go to /login. The login page supports both credential login (email + password) and social OAuth (Google/GitHub). Choose the same method you used during registration for the fastest authentication."
        },
        {
          step: "02",
          title: "Enter your Credentials",
          desc: "Type your registered email address and password. The 'Remember me' checkbox extends your session for 30 days, so you don't need to log in daily. Leave it unchecked on shared or public devices."
        },
        {
          step: "03",
          title: "Automatic Dashboard Redirect",
          desc: "After successful authentication, the gateway middleware reads your role and redirects you to your designated workspace:\n• Students → /student/[username]\n• Teachers → /teacher/[username]\n• Accounts Clerks → /accounts/[username]\n• Administrators → /admin/[username]\nThis redirect happens automatically — you don't need to navigate manually."
        },
        {
          step: "04",
          title: "Onboarding Check",
          desc: "If your profile onboarding is incomplete, you'll be intercepted by the Onboarding Dialog before reaching your dashboard. Complete all required fields to proceed. You cannot skip mandatory onboarding steps."
        }
      ],
      tips: [
        "Use the social login button that matches your registration method for instant access.",
        "If you've forgotten your password, click 'Forgot Password' on the login page to receive a reset link.",
        "Sessions expire after 30 days by default. If you're auto-logged-out, simply log in again."
      ],
      warnings: [
        "Never log in on public computers without unchecking 'Remember me'. Always sign out when finished.",
        "Three consecutive failed login attempts will temporarily lock your account for 15 minutes."
      ],
      faqs: [
        {
          q: "I entered the correct password but login fails. What's happening?",
          a: "First, check that Caps Lock is off. If you registered with a social provider (Google/GitHub), you cannot use password login — use the corresponding social button instead. If you're still locked out, use Forgot Password."
        },
        {
          q: "Why am I redirected to /unauthorized after login?",
          a: "This happens when your account role doesn't match the route you're trying to access, or your account is suspended. Contact your administrator."
        },
        {
          q: "Can I be logged into multiple roles at the same time?",
          a: "No — one session corresponds to one account and one role. You would need a different browser or incognito window for a second account."
        }
      ]
    },
    approval: {
      title: "Email Verification & Educator Approval",
      badge: "Authentication",
      description: "Understand the email verification cycle for all users and the administrator approval process specific to teacher accounts.",
      details: [
        {
          title: "Email Verification (All Users)",
          body: "When you create an account with email/password, VidyaSchool sends an automated verification email immediately. Click the link in the email to confirm your address. Until verified, you will see a verification prompt every time you log in. Your account status changes from 'Unverified' to 'Active' once confirmed. Social login (Google/GitHub) bypasses this step entirely, as the provider has already verified your email."
        },
        {
          title: "Teacher Approval Waiting Room",
          body: "For security, all new teacher registrations are placed in a 'Pending' state after email verification. When a pending teacher logs in, they are redirected to the Educator Waiting Room — a dedicated page showing their approval status. They cannot access any classroom or grade management tools until approved. Approval is performed by school administrators via the Admin control panel. Once approved, the teacher's account instantly transitions to 'Active' and they are notified to log in again."
        },
        {
          title: "Approval Timeline & Process",
          body: "Administrators review pending teacher accounts daily during school working hours (Monday–Friday, 8 AM–4 PM). Typical approval time is 1–2 business days. During the review, admins verify the teacher's staff ID, department assignment, and class allocations. If additional documents are required, administrators may contact you via your registered email."
        },
        {
          title: "Rejection & Resubmission",
          body: "If a teacher account is rejected (e.g., mismatched credentials), the administrator will notify them by email with a reason. Rejected accounts can re-register with corrected details or contact the school IT desk for manual correction. Student accounts cannot be rejected — all verified students are immediately active."
        }
      ],
      tips: [
        "Teachers: Submit your staff ID and department in the onboarding fields to speed up approval.",
        "Keep an eye on your email during the approval waiting period for any follow-up from administrators."
      ],
      faqs: [
        {
          q: "How long does teacher approval take?",
          a: "Typically 1–2 school business days. If it's been more than 3 days, contact your school's IT or admin desk directly."
        },
        {
          q: "Can a teacher use any features while pending approval?",
          a: "No. The waiting room page is all that's accessible until approval is granted. This is a security measure to prevent unauthorized classroom access."
        }
      ]
    },
    "password-reset": {
      title: "Password Reset & Account Recovery",
      badge: "Authentication",
      description: "How to securely reset a forgotten password and recover access to your VidyaSchool account.",
      steps: [
        {
          step: "01",
          title: "Click 'Forgot Password'",
          desc: "On the login page, click the 'Forgot Password?' link below the password field. This opens the password reset form."
        },
        {
          step: "02",
          title: "Enter your Registered Email",
          desc: "Enter the email address you used to register your account. The system validates that an account with that email exists before sending the reset link."
        },
        {
          step: "03",
          title: "Check your Inbox",
          desc: "A password reset email is sent within 1–2 minutes. The email contains a time-limited reset link (valid for 1 hour). Click the link to open the password reset form."
        },
        {
          step: "04",
          title: "Set a New Password",
          desc: "Enter and confirm your new password. It must be at least 8 characters. Avoid reusing your previous password. Click 'Reset Password' to save. You'll be automatically redirected to the login page."
        }
      ],
      warnings: [
        "Password reset links expire after 1 hour. Request a new one if yours has expired.",
        "If you registered with Google or GitHub (social login), you don't have a VidyaSchool password. Log in using your social provider."
      ],
      faqs: [
        {
          q: "I didn't receive the reset email. What should I do?",
          a: "Check your spam folder. If it's not there after 5 minutes, request another reset link. Make sure you're entering the email you registered with."
        },
        {
          q: "I use social login and can't reset my password here. What do I do?",
          a: "Social login accounts don't use VidyaSchool passwords. To reset your access, use the password reset option on your Google or GitHub account settings page."
        }
      ]
    },
    "qr-login": {
      title: "QR Code Mobile Login",
      badge: "Passwordless Auth",
      description: "How to use VidyaSchool's high-entropy QR Code login stream to instantly sign into desktop web browsers without typing passwords.",
      steps: [
        {
          step: "01",
          title: "Open Login Page on Desktop",
          desc: "Navigate to the VidyaSchool login page (/login) on your desktop or laptop browser and select the 'QR Code Login' tab. A unique 256-bit QR code will be generated on screen."
        },
        {
          step: "02",
          title: "Open VidyaSchool Mobile App",
          desc: "Launch the authenticated VidyaSchool mobile app on your smartphone where you are already signed in."
        },
        {
          step: "03",
          title: "Scan the Desktop QR Code",
          desc: "Tap the QR Scanner icon in the mobile app header navigation and align your phone camera with the QR code displayed on your desktop screen."
        },
        {
          step: "04",
          title: "Confirm & Automatic Sign-In",
          desc: "The mobile app validates the QR token with your active session. Within milliseconds, a Socket.IO confirmation signal is sent to the desktop browser, automatically logging you in and opening your dashboard (/student/[username] or /teacher/[username])."
        }
      ],
      tips: [
        "QR codes expire after 180 seconds (3 minutes) for security. Click 'Refresh QR Code' on screen if expired.",
        "Never scan QR codes sent via email, social media, or chat messages — QR codes must only be scanned directly from the official portal desktop screen."
      ],
      warnings: [
        "Only scan QR codes displayed on your official school portal desktop screen (localhost or vidyaschool.vercel.app).",
        "If your phone reports 'Invalid or expired QR token', click 'Refresh QR Code' on your browser to generate a fresh token."
      ],
      faqs: [
        {
          q: "What if the QR code isn't scanning?",
          a: "Ensure your computer screen brightness is turned up and hold your phone camera 6-12 inches away from the monitor. If it still doesn't scan, click 'Refresh QR Code' to render a fresh code."
        },
        {
          q: "Is QR code login secure?",
          a: "Yes! Each QR code contains a single-use 256-bit entropy token backed by a 3-minute TTL and cryptographically bound to your mobile session."
        }
      ]
    },
    "session-security": {
      title: "Session Revocation & Safety",
      badge: "Device Security",
      description: "User guide for auditing active logged-in devices, revoking suspicious sessions, and maintaining account security.",
      steps: [
        {
          step: "01",
          title: "Access Account Settings",
          desc: "Log into your portal and navigate to My Account (/account or /student/[username]/account)."
        },
        {
          step: "02",
          title: "Inspect Active Sessions",
          desc: "Scroll to the 'Active Devices & Sessions' section. This panel lists every browser, computer, and mobile phone currently signed into your account, including IP address, user-agent, creation date, and current session indicators."
        },
        {
          step: "03",
          title: "Revoke Specific Session",
          desc: "If you recognize a device you no longer use (or a public library computer you forgot to log out of), click the 'Revoke' button next to that device. The session token is immediately deleted from the database."
        },
        {
          step: "04",
          title: "Revoke All Other Devices",
          desc: "To instantly log out all other laptops, tablets, and phones while keeping your current browser active, click 'Log Out All Other Devices'."
        }
      ],
      tips: [
        "Periodically check your Active Sessions list, especially after using shared school computers or cyber cafés.",
        "Click 'Log Out All Other Devices' immediately if you suspect someone knows your password or if your smartphone was lost."
      ],
      warnings: [
        "Session revocation takes effect instantly across Next.js edge middleware and FastAPI backend — any subsequent request from a revoked device will return an HTTP 401 Unauthorized error."
      ],
      faqs: [
        {
          q: "What happens when I revoke a session?",
          a: "The session token is permanently purged from the PostgreSQL database. The revoked device is immediately logged out on its next request."
        },
        {
          q: "How long do sessions stay active?",
          a: "Standard sessions remain active for 30 days unless manually revoked or logged out."
        }
      ]
    }
  },
  student: {
    onboarding: {
      title: "Student Profile Onboarding",
      badge: "Onboarding Wizard",
      description: "Complete guide to setting up your student profile after first login. Onboarding is mandatory and unlocks all portal features including the fee ledger, marks, and library access.",
      steps: [
        {
          step: "01",
          title: "Admission Number",
          desc: "Enter your official school-assigned admission number exactly as it appears on your school ID or enrollment letter (e.g., 2024/STU/102). This key uniquely identifies your record in the school's registrar database. If the system reports 'Admission number not found', verify the format with your school office."
        },
        {
          step: "02",
          title: "Phone Number",
          desc: "Submit your primary 10-digit mobile number (Indian format). This is used for automated SMS alerts on fee dues, exam notifications, and critical school announcements. Ensure it's an active number you check regularly."
        },
        {
          step: "03",
          title: "Class & Section",
          desc: "Select your current grade level (e.g., Class 10) and section (e.g., Section A). This configures your class dashboard, homework feeds, and examination schedules. Double-check this selection carefully — class assignments can only be changed by administrators, not by students."
        },
        {
          step: "04",
          title: "Mode of Commute",
          desc: "Select 'Walking' or 'School Transport' to indicate how you travel to school. Students on school transport are linked to bus route logs and timetables. Walkers are tracked for perimeter check-in/checkout only. If your commute method changes later, contact the administration office."
        },
        {
          step: "05",
          title: "Parent / Guardian Information",
          desc: "Enter your parent or guardian's full name, primary phone number, and optional email address. This is required for fee-due notices, emergency contact routing, report card sign-off confirmations, and critical school announcements. All parent contact data is stored securely and is never shared externally."
        },
        {
          step: "06",
          title: "Residential Address",
          desc: "Provide your complete home address including street, city, state, and a valid 6-digit postal pincode. Address data is used for school transport routing and official correspondence. Verify that the pincode is exactly 6 digits — the form will reject invalid pincodes."
        }
      ],
      tips: [
        "Have your school ID card ready before starting onboarding — it contains your admission number.",
        "All onboarding data can be reviewed (but not edited) in your Profile section after submission. Contact your school admin for corrections."
      ],
      warnings: [
        "Without completed onboarding, your dashboard remains locked. You cannot view marks, fees, or notices until all required fields are filled.",
        "Entering an incorrect class/section will cause your marks and notices to be misrouted. Verify carefully."
      ],
      faqs: [
        {
          q: "My admission number shows 'already registered'. What does this mean?",
          a: "Another account has already used this admission number. This could mean a duplicate registration error or a previous account. Contact your school's IT desk to resolve the conflict."
        },
        {
          q: "Can I skip onboarding and come back later?",
          a: "No. Onboarding is mandatory and the portal dashboard remains locked until all required steps are complete. The entire process takes approximately 5 minutes."
        },
        {
          q: "I made a mistake during onboarding. Can I edit my details?",
          a: "Some profile fields (name, phone, address) can be updated from your Profile settings. Structural details like your class, section, or admission number require an administrator to modify. Submit a support ticket or visit your school office."
        }
      ]
    },
    fees: {
      title: "Fees Ledger & Online Payments",
      badge: "Finance Center",
      description: "Comprehensive guide to viewing your fee schedule, understanding installment statuses, paying online, downloading receipts, and checking scholarship concessions.",
      details: [
        {
          title: "Understanding the Fee Ledger",
          body: "The Fees section displays a complete ledger of all generated fee installments for your current academic year. Each row in the ledger represents one installment (typically monthly or per-term) and shows:\n• Installment type (Tuition, Transport, Activity/Co-curricular, Library)\n• Due date and amount\n• Payment status: Pending (not yet paid), Overdue (past due date), or Paid (settled)\n• Any applied scholarship concessions or waivers\nInstallments are generated by the Accounts Clerk at the beginning of each period."
        },
        {
          title: "Paying Online via Razorpay",
          body: "To pay a Pending or Overdue installment:\n1. Click the 'Pay Now' button next to the installment.\n2. The Razorpay secure checkout overlay opens.\n3. Choose your preferred payment method:\n   • Credit / Debit Card (Visa, Mastercard, RuPay)\n   • NetBanking (all major Indian banks)\n   • Mobile Wallets (Paytm, PhonePe, Amazon Pay)\n   • UPI (Google Pay, PhonePe, BHIM)\n4. Complete the transaction. Payment confirmation is processed in real-time.\n5. The installment status instantly updates to 'Paid' and a receipt is generated."
        },
        {
          title: "Downloading PDF Receipts",
          body: "After a successful payment, a 'Download Receipt' button appears next to the installment. Clicking it generates a PDF receipt that includes:\n• School name and official header\n• Student name and admission number\n• Installment details (type, period, amount)\n• Razorpay transaction reference ID\n• Payment timestamp and digital confirmation stamp\nStore receipts safely for fee clearance certificates, scholarship applications, or tax purposes."
        },
        {
          title: "Scholarship Concessions & Waivers",
          body: "If you are enrolled in a scholarship programme (Merit-based, EWS, Sports, or Special Needs), concessions are applied directly to your fee installments by the Accounts Clerk. These appear as:\n• A reduced 'Payable Amount' on the installment row\n• An 'Applied Waiver: ₹X' line in the installment detail drawer\n• A 'Scholarship Type' label (e.g., 'Merit — 25% Waiver')\nIf a waiver you're entitled to is not showing, contact the Accounts desk immediately — waivers must be applied before the due date."
        },
        {
          title: "Late Payments & Overdue Installments",
          body: "Installments not paid by the due date change status to 'Overdue' and are highlighted in amber/red. Overdue fees may attract a late payment surcharge as per school policy (typically ₹50–₹100 per installment per month). Overdue installments are also flagged to your parent/guardian via SMS notification. Settle overdue amounts promptly to avoid escalation to the school office."
        }
      ],
      tips: [
        "Use UPI for the fastest payment processing — most transactions complete in under 10 seconds.",
        "Download and store all payment receipts in a folder at the start of each academic year for easy retrieval during fee clearance.",
        "Set a reminder 3 days before each installment due date to avoid overdue status."
      ],
      warnings: [
        "Online payments are final and non-refundable through the portal. For corrections, contact the Accounts Clerk directly.",
        "Do not close the browser tab during the Razorpay checkout. This may result in a deducted amount with no receipt generated — report this immediately to your accounts desk with your bank transaction reference."
      ],
      faqs: [
        {
          q: "My payment was deducted from my bank but the portal still shows 'Pending'. What happened?",
          a: "This is a payment processing delay. Wait 10–15 minutes and refresh the page — most payments auto-confirm. If the status doesn't update within 30 minutes, note your Razorpay transaction ID from your bank statement and contact your school's Accounts Clerk with the reference number."
        },
        {
          q: "Can my parents pay directly without logging into the portal?",
          a: "Payments must be initiated through a logged-in student account. You can pay on your phone while your parents are present, or share your screen. The school may also accept cash or cheque at the Accounts desk for families without digital payment access."
        },
        {
          q: "What installments types will I see?",
          a: "Installment types include Tuition (base academic fee), Transport (if enrolled in school bus), Activity Fee (co-curricular programs), and Library Security Deposit (refundable at year end). The exact breakdown depends on your enrollment selections."
        }
      ]
    },
    marks: {
      title: "Academic Marks & Performance Sheets",
      badge: "Report Cards",
      description: "How to access your test results, understand the weighted grading system, navigate term-wise performance sheets, and read teacher feedback.",
      details: [
        {
          title: "Navigating the Marks Portal",
          body: "Access Marks from your student sidebar. The marks portal displays all published assessment results organised by:\n• Academic Year (e.g., 2024–25)\n• Term (Term 1 / Mid-Term / Term 2 / Annual)\n• Subject (Mathematics, Physics, English, etc.)\nUse the filter dropdowns to narrow by term or subject. Results appear only after your teacher has published them — unpublished assessments show a 'Results Pending' placeholder."
        },
        {
          title: "Understanding the Weighted Grading System",
          body: "VidyaSchool uses a weighted grading model for final subject percentages:\n• Assignments/Class Tests: 20% weight\n• Mid-Term Examinations: 30% weight\n• Term Final Examinations: 50% weight\n\nExample: If you scored 80/100 in Assignments, 70/100 in Mid-Term, and 85/100 in Finals for Mathematics:\nWeighted Score = (80 × 0.20) + (70 × 0.30) + (85 × 0.50) = 16 + 21 + 42.5 = 79.5%\n\nThe cumulative GPA is computed across all subjects at the end of each term using the standard 10-point GPA scale."
        },
        {
          title: "Reading the Report Card",
          body: "The full-term report card is accessible from the 'Report Card' tab. It shows:\n• Subject-wise marks in each assessment category\n• Weighted final percentage per subject\n• Grade letter (A+, A, B+, B, C, D, F)\n• Cumulative GPA for the term\n• Class rank and percentile\n• Teacher remarks per subject\n• Overall conduct and attendance notes\nReport cards require parent sign-off, which is tracked digitally. The portal will alert you when your parent needs to acknowledge the card."
        },
        {
          title: "Grade Scale Reference",
          body: "The letter grade scale used by VidyaSchool:\n• 90–100%: A+ (Outstanding)\n• 80–89%: A (Excellent)\n• 70–79%: B+ (Very Good)\n• 60–69%: B (Good)\n• 50–59%: C (Satisfactory)\n• 40–49%: D (Needs Improvement)\n• Below 40%: F (Fail — Re-examination Required)\nSubjects with an F grade require a supplementary examination. Contact your class teacher for re-exam scheduling."
        }
      ],
      tips: [
        "Check marks regularly after each assessment — teachers publish results within 3–5 working days of the exam.",
        "If you believe a mark is incorrect, raise a re-valuation request through your class teacher within 7 days of publication."
      ],
      faqs: [
        {
          q: "My marks are published for some subjects but not others. Is this normal?",
          a: "Yes — each subject teacher publishes marks independently. Results appear as they are submitted. If a subject's results are more than 2 weeks late, inform your class teacher."
        },
        {
          q: "How is my GPA calculated if I'm missing one assessment?",
          a: "Missing assessments are recorded as 0/max marks, which heavily impacts the weighted score. If you were absent for a valid reason (medical, etc.), speak to your teacher about a make-up assessment."
        }
      ]
    },
    library: {
      title: "Library Catalog & Borrowing Tracker",
      badge: "Library Desk",
      description: "Manage your borrowed books, track return deadlines, search the digital catalog, and understand fine calculations.",
      details: [
        {
          title: "Your Borrowed Books Ledger",
          body: "The Library section shows all books currently issued to your student card. Each entry displays:\n• Book title and author\n• Library barcode / ISBN\n• Date of checkout\n• Return deadline (typically 14 days from checkout)\n• Current status: Active (within deadline), Due Soon (within 2 days of deadline), or Overdue (past deadline)\nOverdue books are highlighted in red with the number of overdue days displayed."
        },
        {
          title: "Fine Calculation",
          body: "Library fines are charged at ₹10 per overdue book per day. Fines accumulate from the day after the return deadline. At the end of each month, outstanding library fines are added to your next fee installment automatically by the Accounts Clerk. You can view your current fine balance in the Library section. Return overdue books immediately to stop the fine counter."
        },
        {
          title: "Searching the Digital Catalog",
          body: "Use the Catalog Search tab to browse the library collection without visiting the physical library. Search by:\n• Book Title (partial match supported)\n• Author Name\n• Genre / Subject\n• ISBN\nSearch results show the book's current availability (Available on Shelf / Checked Out / Reserved). If a book is checked out, the expected return date is shown so you can plan your visit."
        },
        {
          title: "Borrowing Limits & Renewals",
          body: "Each student may borrow up to 3 books simultaneously. Renewals can be requested through the portal if no other student has reserved the book — click 'Renew' on the active loan entry. Renewals extend the deadline by 7 days and can be done once per loan. Lost or damaged books must be reported to the librarian — replacement charges apply."
        }
      ],
      tips: [
        "Return books 1–2 days before the deadline to account for processing time at the library desk.",
        "Use the Catalog Search before visiting the library to confirm a book is available on the shelf."
      ],
      warnings: [
        "Fines accumulate on weekends and holidays too. Return books before the deadline to avoid charges.",
        "Failure to return a book for more than 30 days may result in a hold on your fee clearance and examination participation."
      ],
      faqs: [
        {
          q: "I returned a book but it still shows as 'Issued' in my portal. What should I do?",
          a: "The librarian must scan the book's return at the desk for the system to update. If it's been more than 1 school day since your return, visit the library desk with your return acknowledgment slip and ask them to update the record."
        },
        {
          q: "Can I reserve a book that's currently checked out?",
          a: "Yes — click 'Reserve' on the catalog entry. You'll be notified when the book is returned and available for pickup. Reservations are held for 2 school days before being released to the next person in queue."
        }
      ]
    },
    notices: {
      title: "Notices & School Circulars",
      badge: "Notice Board",
      description: "How to access class notices, school-wide circulars, and urgent announcements published by teachers and administration.",
      details: [
        {
          title: "Types of Notices",
          body: "The Notices section aggregates all announcements relevant to you:\n• Class Notices: Published by your class teacher or subject teachers — homework, exam schedules, assignment deadlines.\n• School Circulars: Published by administration — fee reminders, holiday announcements, event notifications.\n• Urgent Alerts: Flagged as urgent by the publisher and displayed with a high-visibility warning badge at the top of your notice board.\nNotices are sorted newest-first. Unread notices are highlighted until opened."
        },
        {
          title: "Filtering & Searching Notices",
          body: "Use the filter panel to narrow notices by:\n• Source: All, Class Notices, School Circulars\n• Date range: This week, This month, Custom range\n• Subject: Filter by subject-specific notices\nUse the search bar to find specific notices by keyword in the title or content."
        },
        {
          title: "Attachments & Downloads",
          body: "Notices may include downloadable attachments such as PDFs (question papers, syllabus documents, event forms) or images (timetables, event posters). Click the attachment icon to download directly to your device."
        }
      ],
      tips: [
        "Enable browser notifications to receive alerts for new notices without checking the portal manually.",
        "Check urgent notices immediately — they often contain time-sensitive information like exam venue changes."
      ],
      faqs: [
        {
          q: "I'm not seeing notices from a particular subject. Why?",
          a: "Notices are class-specific. Ensure your class and section were set correctly during onboarding. If they were, the teacher may not have published any notices yet for that subject."
        }
      ]
    },
    complaints: {
      title: "Filing a Complaint & Support Tickets",
      badge: "Support Desk",
      description: "Step-by-step guide to submitting complaints, reporting issues, tagging users, and tracking your ticket status.",
      steps: [
        {
          step: "01",
          title: "Open the Complaint Modal",
          desc: "Click the 'File a Complaint' button in the student sidebar (marked with a flag icon). This opens the structured complaint submission modal. You can also access it from the Help section of your dashboard."
        },
        {
          step: "02",
          title: "Select the Recipient",
          desc: "Choose the appropriate escalation target:\n• Class Teacher — For classroom issues, syllabus concerns, peer disputes, or assessment-related grievances.\n• IT / Tech Support (Admin) — For portal bugs, login problems, data discrepancies, or device issues.\n• Principal / Vice-Principal — For serious infrastructure complaints, safety concerns, or policy escalations."
        },
        {
          step: "03",
          title: "Write your Complaint",
          desc: "Add a clear title (e.g., 'Library fine not cleared after book return') and a detailed description. Include relevant dates, locations, and any reference numbers you have. The more detail you provide, the faster the resolution."
        },
        {
          step: "04",
          title: "Tag Relevant Users",
          desc: "Use the 'Tag People' field to reference specific users involved in the issue. Type '@' followed by a name to search and select students or teachers. Tagged users receive a notification and a copy of the ticket in their portal."
        },
        {
          step: "05",
          title: "Submit & Track",
          desc: "Click Submit. A success notification appears with a unique reference number (e.g., CMP-77169). Save this number — use it when following up with staff. All your submitted tickets are viewable under 'My Complaints' in the sidebar, along with their current status (Open, In Progress, Resolved, Closed)."
        }
      ],
      tips: [
        "Be specific and factual in complaint descriptions. Vague complaints take longer to resolve.",
        "Keep your CMP reference number — it's the fastest way to follow up with staff."
      ],
      warnings: [
        "Filing false or malicious complaints is a disciplinary offence and may result in account suspension."
      ],
      faqs: [
        {
          q: "How long does it take for a complaint to be resolved?",
          a: "Response times vary by priority. Urgent/safety complaints are addressed within 24 hours. Standard complaints are reviewed within 3–5 school days. IT issues are typically resolved within 1–2 business days."
        },
        {
          q: "Can I edit a complaint after submitting?",
          a: "No — submitted complaints are locked to maintain audit integrity. If you need to add information, submit a follow-up comment on the ticket thread, or reference the CMP number in a new ticket."
        }
      ]
    }
  },
  teacher: {
    roster: {
      title: "Class Roster & Student Profiles",
      badge: "Classroom Manager",
      description: "How to access your assigned class roster, view student profiles, emergency contacts, and commute information.",
      details: [
        {
          title: "Accessing the Roster",
          body: "Navigate to the 'Class' section in your teacher sidebar. The roster displays all students enrolled in classes assigned to you. If you teach multiple classes or subjects, use the class selector dropdown at the top to switch between rosters (e.g., Class 10-A, Class 9-B)."
        },
        {
          title: "Student Information Grid",
          body: "Each row in the roster shows:\n• Student's full name and profile photo\n• Admission number\n• Registered email address\n• Onboarding status (Complete / Pending — students with pending onboarding have limited features)\n• Commute mode (Walking / School Transport)\nClick any row to expand the student's contact card."
        },
        {
          title: "Contact Cards & Emergency Details",
          body: "The expanded contact card shows:\n• Parent/guardian name and emergency phone number\n• Secondary contact (if provided)\n• Residential address\n• Commute details (bus route number, stop name for transport students)\nThis information is critical for emergency communications, parent-teacher meetings, and coordinating bus schedules."
        },
        {
          title: "Filtering & Searching",
          body: "Use the search bar to filter students by name. Use the 'Filter' panel to segment by commute mode (useful for bus route coordination), onboarding status (to follow up on pending students), or gender. Export the filtered list as a CSV for offline use (admin permission required)."
        }
      ],
      tips: [
        "Check onboarding statuses at the start of term and follow up with students who haven't completed their profiles — their marks and fees won't route correctly until onboarding is done.",
        "Save emergency contacts for your class to your phone at the start of term for quick access."
      ],
      faqs: [
        {
          q: "I can see students from another class in my roster. Is this correct?",
          a: "You should only see students from classes assigned to you by the administrator. If you're seeing unexpected students, contact your school admin to review your class assignments."
        },
        {
          q: "A student's contact details seem outdated. Who updates them?",
          a: "Students can update their own phone number and address in their profile settings. Parent contact details can only be changed by the student or an administrator. Encourage the student to update via their portal."
        }
      ]
    },
    grading: {
      title: "Marks Submission & Grading",
      badge: "Grades Editor",
      description: "Step-by-step instructions for entering student scores, understanding validation rules, and publishing grades to student report cards.",
      steps: [
        {
          step: "01",
          title: "Navigate to Marks Entry",
          desc: "Go to the 'Marks' or 'Grades' section in your teacher sidebar. Select your subject from the subject dropdown. The marks entry panel loads for your assigned classes and subject."
        },
        {
          step: "02",
          title: "Select Exam Type & Term",
          desc: "Choose the exam type from the selector:\n• Assignment / Class Test (contributes 20% to subject grade)\n• Mid-Term Examination (contributes 30%)\n• Term Final Examination (contributes 50%)\nAlso select the relevant academic term (Term 1, Mid-Term, Term 2, Annual)."
        },
        {
          step: "03",
          title: "Enter Scores",
          desc: "The grade entry grid shows all students in the class. For each student, enter their numeric score in the input field. The maximum mark is shown in the column header (e.g., '/100'). The form validates in real-time — values exceeding the maximum or negative numbers are rejected immediately."
        },
        {
          step: "04",
          title: "Mark Absent Students",
          desc: "For students who were absent during the exam, use the 'Ab' (Absent) toggle instead of entering a score. Absent entries are recorded separately from 0-mark entries and may be eligible for make-up exams as per school policy."
        },
        {
          step: "05",
          title: "Review & Publish",
          desc: "Before publishing, review the entire grade sheet using the preview panel. Verify all entries are correct — published marks immediately update student report cards and trigger parent notification emails. Once published, marks can only be corrected by an administrator. Click 'Publish Grades' to finalize."
        }
      ],
      warnings: [
        "Published marks cannot be self-edited. Double-check all entries before clicking Publish. Corrections require an administrator.",
        "Ensure all students in the roster are accounted for (either with a score or an Absent mark) before publishing — unsubmitted entries block grade publication."
      ],
      tips: [
        "Use the 'Save Draft' option to save progress and return later without publishing.",
        "For large classes, use the CSV import option to upload marks in bulk from a spreadsheet."
      ],
      faqs: [
        {
          q: "I published a grade with an error. What do I do?",
          a: "Contact your school administrator immediately with the student's name, the incorrect score, and the correct score. Administrators can edit published marks in the admin panel. Do not file a new submission — it will conflict."
        },
        {
          q: "Why does the system reject some of my score inputs?",
          a: "The system validates that scores are (1) non-negative, (2) not exceeding the maximum marks, and (3) numeric only. Check that you haven't accidentally entered letters or symbols."
        }
      ]
    },
    notices: {
      title: "Publishing Notices & Announcements",
      badge: "Bulletin Board",
      description: "How to create, format, and publish class announcements, exam schedules, and homework notices to student dashboards.",
      steps: [
        {
          step: "01",
          title: "Open the Notices Panel",
          desc: "Go to 'Notices' in your teacher sidebar. The panel shows all previously published notices and a 'New Announcement' button."
        },
        {
          step: "02",
          title: "Create the Notice",
          desc: "Click 'New Announcement'. Fill in:\n• Title (required): e.g., 'Maths Unit Test — Chapter 5 & 6'\n• Body text (required): The full notice content. Use paragraph breaks for readability.\n• Target classes: Select one or multiple classes that should receive this notice.\n• Attachments (optional): Upload PDFs, images, or Word documents."
        },
        {
          step: "03",
          title: "Set Priority",
          desc: "Toggle 'Mark as Urgent' for time-sensitive announcements (exam venue changes, emergency alerts). Urgent notices are displayed with a red warning badge at the top of the student's notice board and trigger an immediate push notification."
        },
        {
          step: "04",
          title: "Publish",
          desc: "Click 'Publish'. The notice is instantly pushed to the notice boards of all students in the selected classes. A confirmation toast shows the notice ID and delivery count."
        }
      ],
      tips: [
        "Write notice titles clearly — students see only the title in the notice list before clicking to expand.",
        "Schedule exam-related notices at least 7 days in advance to give students adequate preparation time."
      ],
      faqs: [
        {
          q: "Can I edit a notice after publishing?",
          a: "Yes — click the notice in your notice list and select 'Edit'. Updates are reflected immediately on student boards. Students who already read the notice will see a 'Updated' badge."
        },
        {
          q: "Can I target a specific section within a class?",
          a: "Yes — the target selector lets you choose a full class (e.g., Class 10) or a specific section (e.g., Class 10-A only)."
        }
      ]
    },
    escalations: {
      title: "Leave Requests & Supply Procurement",
      badge: "Requests Center",
      description: "How to formally submit leave applications and classroom supply orders to school administration through the portal.",
      details: [
        {
          title: "Submitting a Leave Request",
          body: "Go to 'Requests' in your sidebar and click 'New Leave Request'. Fill in:\n• Leave type: Sick Leave, Casual Leave, Earned Leave, Emergency Leave\n• Start and end dates (use the date picker)\n• Reason: A clear written explanation\n• Supporting documents (optional): Medical certificates, etc.\nClick Submit. Your request enters the administrator's review queue. You'll receive an email and in-portal notification when the request is Approved or Rejected."
        },
        {
          title: "Leave Approval Timeline",
          body: "Leave requests are typically reviewed within 1 school day for emergency leaves and 2–3 school days for planned leaves. Once approved, your attendance records are automatically updated to reflect the approved leave period. Rejected requests include an admin comment explaining the reason."
        },
        {
          title: "Supply & Resource Orders",
          body: "To order classroom supplies (chalk, markers, lab equipment, textbooks, stationery):\n1. Click 'New Supply Order' in the Requests panel.\n2. List each item with quantity and justification.\n3. Submit for admin review.\nApproved orders are processed by the school stores team within 3–5 school days. You'll receive a confirmation when items are ready for pickup."
        },
        {
          title: "Tracking Request Status",
          body: "All submitted requests appear in the Requests panel with their current status:\n• Pending — Awaiting admin review\n• Approved — Request accepted and being processed\n• Rejected — Request denied (admin comment attached)\n• Fulfilled — Supply order has been delivered\nClick any request to view the full details and admin response."
        }
      ],
      tips: [
        "Submit planned leave requests at least 3 school days in advance to allow time for class coverage arrangements.",
        "Attach supporting documents (medical certificates, event letters) to strengthen your leave request."
      ],
      faqs: [
        {
          q: "My leave was rejected. Can I appeal?",
          a: "Yes — visit the school administration office directly or submit a new request with additional documentation. Portal-submitted re-requests are reviewed in the same queue."
        },
        {
          q: "What is the maximum leave I can take per term?",
          a: "Leave limits are governed by your school's staff leave policy, not the portal software. Contact your HR department for the exact allowance."
        }
      ]
    },
    complaints: {
      title: "Educator Support & Complaint Tickets",
      badge: "Helpdesk",
      description: "How teachers can file support tickets for IT issues, infrastructure problems, or escalation to administration.",
      details: [
        {
          title: "Filing a Support Ticket",
          body: "Click 'File a Complaint' in your sidebar. Select the appropriate recipient:\n• IT Support (Admin): For portal bugs, device malfunctions, projector/smartboard issues, or network problems.\n• Academic Coordinator: For timetable conflicts, syllabus disputes, or inter-departmental issues.\n• Principal / Vice-Principal: For serious escalations, safety concerns, or policy violations.\nFill in the title, detailed description, and any relevant context. Attach screenshots or photos of the issue if applicable."
        },
        {
          title: "Tagging Students or Colleagues",
          body: "Use the 'Tag People' field to reference specific students or other staff members involved in the issue. This notifies them and gives them visibility into the ticket thread. Useful for multi-party issues (e.g., a classroom dispute involving multiple students)."
        },
        {
          title: "Tracking Resolutions",
          body: "All submitted tickets are tracked in 'My Complaints' in your sidebar. Statuses update in real-time as admin processes the ticket. You receive an in-portal notification and email when your ticket status changes to 'In Progress', 'Resolved', or 'Closed'. Include your CMP reference number in all follow-up communications."
        }
      ],
      faqs: [
        {
          q: "How quickly are IT issues resolved?",
          a: "Critical IT issues (portal outage, assessment submission failures) are treated as high priority and addressed within 4 business hours. Standard IT issues are resolved within 1–2 business days."
        }
      ]
    }
  },
  admissions: {
    overview: {
      title: "Admissions Overview",
      badge: "Admissions",
      description: "Complete guide to the VidyaSchool admissions process — from enquiry to enrollment confirmation.",
      steps: [
        {
          step: "01",
          title: "Submit an Enquiry",
          desc: "Visit the school office or contact the admissions desk to receive the Admissions Prospectus for the relevant academic year. The prospectus details available classes, fee structure, and seat availability per grade."
        },
        {
          step: "02",
          title: "Complete the Application Form",
          desc: "Obtain and fill the official Admissions Application Form. The form requires student details (name, date of birth, previous school), parent/guardian details (name, occupation, contact), and academic history (previous class, percentage, school name). Ensure all fields are completed accurately — errors can delay processing."
        },
        {
          step: "03",
          title: "Submit Documents",
          desc: "Submit the completed application form along with all required supporting documents to the admissions office. See the Document Requirements page for the full checklist. Incomplete document submissions will be returned and may delay your admission date."
        },
        {
          step: "04",
          title: "Entrance Assessment (if applicable)",
          desc: "Admissions to Classes 6 and above may require a placement assessment to determine appropriate class placement. The assessment covers Mathematics and English proficiency. You'll be notified of the date and time after document submission. Results are typically shared within 3 school days."
        },
        {
          step: "05",
          title: "Fee Payment & Enrollment Confirmation",
          desc: "Upon acceptance, you'll receive an enrollment letter with your provisional admission number and a fee payment schedule. Pay the initial enrollment fee and security deposit at the Accounts desk (cash, cheque, or bank transfer). Once payment is confirmed, your student portal account will be created within 1–2 working days."
        },
        {
          step: "06",
          title: "Portal Access & Onboarding",
          desc: "You'll receive login credentials for the VidyaSchool portal via the email provided in the application. Log in and complete the student onboarding wizard to activate your full dashboard — classes, fee ledger, library access, and notice board."
        }
      ],
      tips: [
        "Apply early — seats in popular grade levels fill up 2–3 months before the academic year begins.",
        "Keep digital copies (scanned PDFs) of all submitted documents for your personal records."
      ],
      faqs: [
        {
          q: "Is there an age cutoff for admissions?",
          a: "Yes — VidyaSchool follows the state education board's age criteria. For Class 1, the child must be 6 years old by June 1st of the admission year. Age criteria for other classes follow proportionally. Contact the admissions office for specific grade requirements."
        },
        {
          q: "Can I apply mid-year?",
          a: "Mid-year admissions are considered subject to seat availability and admin discretion. Contact the admissions desk directly. Lateral transfers from other schools require a Transfer Certificate (TC) and the standard document set."
        },
        {
          q: "Are there reserved seats for EWS or differently-abled students?",
          a: "Yes — VidyaSchool reserves seats as per applicable government guidelines. Contact the admissions office for the current reservation policy and documentation requirements."
        }
      ]
    },
    documents: {
      title: "Document Requirements",
      badge: "Admissions",
      description: "Complete checklist of documents required for a successful admissions application to VidyaSchool.",
      details: [
        {
          title: "For New Class 1 Admissions",
          body: "The following original documents plus one self-attested photocopy of each are required:\n• Birth Certificate (Municipal Corporation / Hospital issued)\n• Aadhar Card of the child\n• Parent/Guardian Aadhar Cards (both, if available)\n• 4 recent passport-sized photographs of the child\n• Proof of Residence (utility bill, bank statement, or rental agreement — dated within 3 months)\n• Pre-school/Kindergarten completion certificate (if applicable)\n• Any medical records relevant to special needs or allergies"
        },
        {
          title: "For Class 2–12 Lateral Admissions",
          body: "All documents from the new Class 1 list, plus:\n• Transfer Certificate (TC) from the previous school, countersigned by the issuing school principal\n• Original Report Card / Mark Sheet from the last attended class\n• Character Certificate from the previous school\n• Migration Certificate (for students transferring from a different state board or CBSE/ICSE to state syllabus)\n• Caste Certificate (if applying under reserved category)"
        },
        {
          title: "For Scholarship Applicants",
          body: "Students applying for scholarship concessions must additionally provide:\n• Income Certificate issued by a revenue officer (not older than 6 months)\n• Previous academic year's report card showing qualifying grades (Merit scholarships require 80%+)\n• Relevant achievement certificates (Sports, Performing Arts, etc.) for category-specific scholarships\n• EWS Certificate (for economically weaker section concessions)"
        },
        {
          title: "Document Submission Guidelines",
          body: "• All documents must be submitted as originals for verification, along with one self-attested photocopy per document.\n• Documents in languages other than English or the regional state language must be accompanied by an officially translated copy.\n• Photocopies should be on A4 paper, clear and legible.\n• The admissions team will return originals after verification — keep them safely."
        }
      ],
      warnings: [
        "Submission of fraudulent or forged documents will result in immediate cancellation of admission and may lead to legal consequences.",
        "Ensure the Transfer Certificate is from the student's most recent school — TCs from schools attended more than one academic year ago require an explanation letter."
      ],
      faqs: [
        {
          q: "What if my birth certificate is in another language?",
          a: "You must provide an officially translated copy along with the original. Translations must be done by a certified translator or notarized authority."
        },
        {
          q: "Can I submit documents digitally?",
          a: "Physical copies are required for the initial submission and verification. After verification, digital copies can be uploaded to your student portal profile for record-keeping."
        }
      ]
    },
    fees: {
      title: "Admission Fee Structure",
      badge: "Admissions",
      description: "Overview of one-time admission fees, annual charges, and recurring installment structure for the current academic year.",
      details: [
        {
          title: "One-Time Admission Charges",
          body: "The following are charged once at the time of enrollment:\n• Admission Processing Fee: ₹500 (non-refundable)\n• Security Deposit: ₹2,000 (refundable at the end of the academic year or on withdrawal, subject to no dues)\n• Identity Card & Smart Card: ₹200 (covers student ID card and library card)\n• School Almanac / Diary: ₹150"
        },
        {
          title: "Annual Charges (Collected at Start of Year)",
          body: "The following are charged once per academic year:\n• Annual School Development Fund: ₹1,500\n• Academic Material Fee (books, lab manuals, stationery pack): Varies by class (₹800–₹2,500)\n• Examination Registration Fee: ₹400 (covers all internal examinations)\n• Co-Curricular Activities Fee: ₹600 (mandatory; covers participation in school events, annual day, sports day)"
        },
        {
          title: "Monthly Tuition Installments",
          body: "Tuition fees are collected in monthly installments. Rates vary by class:\n• Classes 1–5: ₹1,200/month\n• Classes 6–8: ₹1,600/month\n• Classes 9–10: ₹2,000/month\n• Classes 11–12: ₹2,400/month\nInstallments are due on or before the 10th of each month. Late payments attract a ₹100 surcharge per month after the due date."
        },
        {
          title: "Optional Charges",
          body: "The following are charged only if applicable:\n• School Transport Fee: ₹800–₹1,400/month depending on distance zone\n• Meal Programme (Tiffin): ₹900/month\n• Additional Co-Curricular Modules (Classical Dance, Robotics Club, etc.): ₹400–₹800/term\nAll optional services must be enrolled in at the start of the academic year through the school office."
        }
      ],
      warnings: [
        "Fee structures are subject to revision at the start of each academic year. Always refer to the current year's prospectus for accurate figures.",
        "The security deposit is forfeited if a student withdraws during the academic year without completing the required notice period (typically 30 days)."
      ],
      faqs: [
        {
          q: "Can fees be paid in instalments?",
          a: "Annual charges can sometimes be split into two instalments (beginning and mid-year) upon prior written request to the Accounts Clerk. Monthly tuition is already an instalment — further splitting is not available."
        },
        {
          q: "Is there a sibling discount?",
          a: "Yes — a 10% sibling concession is applied to the second and subsequent siblings enrolled simultaneously. This is applied automatically by the Accounts Clerk on fee generation. Contact the accounts desk if it doesn't appear."
        }
      ]
    }
  },
  "co-curriculars": {
    overview: {
      title: "Co-Curricular Programs Overview",
      badge: "Co-Curricular",
      description: "VidyaSchool's co-curricular programme is a structured complement to academic learning, encompassing performing arts, STEM innovation, athletics, and cultural activities.",
      details: [
        {
          title: "Why Co-Curriculars Matter",
          body: "VidyaSchool's academic philosophy recognises that holistic development extends far beyond textbooks. Co-curricular activities cultivate creativity, teamwork, discipline, and leadership. Participation in these programmes is reflected in student portfolios and is considered during scholarship evaluations and annual recognition ceremonies."
        },
        {
          title: "Programme Structure",
          body: "Co-curricular activities are organised into three main tracks:\n• Performing Arts: Classical Indian Dance, Choral & Classical Singing, Instrumental Music\n• STEM & Innovation: Lego Robotics, Science Olympiad Preparation, Coding Club\n• Sports & Athletics: School Cricket Team, Athletics Track, Yoga & Wellness\nEach track runs weekly sessions during school hours (designated activity periods) and may include additional weekend rehearsals for major events."
        },
        {
          title: "Enrollment & Selection",
          body: "Students select one primary co-curricular track at the start of each academic year through the school office. Some programmes (e.g., Robotics Club, School Cricket Team) have limited seats and require an audition or selection trial. Students may participate in additional activities beyond their primary track on a best-effort basis, subject to teacher recommendation."
        },
        {
          title: "Annual Showcase Events",
          body: "VidyaSchool holds several marquee events where co-curricular groups perform or compete:\n• Annual Day (March): School-wide cultural showcase featuring all performing arts groups.\n• Science & Innovation Fair (October): Student projects and Robotics demonstrations.\n• Sports Day (January): Athletics competition, team sports, and yoga demonstration.\n• Inter-School Competitions: Participating schools in district-level competitions in dance, music, robotics, and sports throughout the year."
        }
      ],
      tips: [
        "Enroll early — popular activities like Robotics and Dance fill up within the first week of the enrollment window.",
        "Co-curricular participation is noted on your academic profile and can strengthen scholarship applications."
      ]
    },
    arts: {
      title: "Performing Arts Programme",
      badge: "Performing Arts",
      description: "Detailed overview of VidyaSchool's performing arts tracks — classical dance, vocal music, and instrumental music.",
      details: [
        {
          title: "Classical & Fusion Dance",
          body: "VidyaSchool's dance programme offers training in Bharatanatyam (classical Indian dance) and Contemporary/Fusion styles. Students are grouped by experience level (Beginner, Intermediate, Advanced). Weekly 60-minute sessions are held in the school's dedicated dance studio. Students perform at Annual Day and may be selected for inter-school dance competitions. The programme is open to all genders and all class levels (Class 1–12)."
        },
        {
          title: "Choral & Classical Singing",
          body: "The vocal music programme trains students in Western choral singing and Hindustani classical music. The school choir participates in annual competitions and school functions. Individual Hindustani vocal training follows the Bhatkhande system. Assessments are conducted termly with a performance recital at the end of the academic year. Vocal training is available to all students regardless of prior experience."
        },
        {
          title: "Instrumental Music",
          body: "Instrumental music covers both Western (keyboard, guitar, flute) and Indian classical instruments (tabla, harmonium, sitar). Students select their instrument at enrollment and receive individual or small-group instruction. Instruments are available for use during school sessions; personal instruments are encouraged for home practice. Students are assessed in two recitals per year (Term 1 end and Annual Day)."
        },
        {
          title: "Assessments & Grading",
          body: "Co-curricular arts performance is graded on a 3-point scale (Commendable, Satisfactory, Needs Practice) based on:\n• Attendance and participation (40%)\n• Skill progression over the term (30%)\n• Performance quality in recitals/events (30%)\nGrades appear in the student's annual report card under the 'Co-Curricular Activities' section."
        }
      ],
      faqs: [
        {
          q: "Do I need prior dance or music experience to enroll?",
          a: "No — the programme caters to all skill levels. Beginner groups start from foundational techniques. Your placement is determined in an orientation session in the first week."
        },
        {
          q: "Can I switch instruments mid-year?",
          a: "Instrument changes are permitted at the start of Term 2 only, subject to availability and teacher approval. Requests must be submitted to the Music Department."
        }
      ]
    },
    stem: {
      title: "STEM & Robotics Programme",
      badge: "STEM",
      description: "VidyaSchool's STEM programme develops engineering thinking, computational skills, and scientific inquiry through hands-on robotics, coding, and science projects.",
      details: [
        {
          title: "Lego Robotics Club",
          body: "Using LEGO Mindstorms and LEGO Spike Prime kits, students design, build, and programme autonomous robots. Sessions are held twice weekly in the school's dedicated STEM Lab. The club participates in the First LEGO League (FLL) district competitions annually. Students collaborate in teams of 3–4, with roles rotating between designer, builder, and programmer each project cycle."
        },
        {
          title: "Science Olympiad Preparation",
          body: "A structured programme preparing students for national and state-level science olympiads (NSO, SOF, NTSE). Covers advanced topics in Physics, Chemistry, Biology, and Mathematics beyond the standard curriculum. Weekly problem-solving sessions focus on analytical reasoning, experimental design, and speed-accuracy skills. Open to students in Classes 6–12 with a minimum 75% in Science subjects."
        },
        {
          title: "Coding & App Development Club",
          body: "Students learn programming through a progression of tools:\n• Classes 3–5: Scratch visual programming, block-based logic\n• Classes 6–8: Python fundamentals, algorithms, and data structures\n• Classes 9–12: Web development (HTML, CSS, JavaScript), app prototyping, and project portfolios\nThe club participates in district hackathons and CodeChef school-level competitions. Students who complete advanced tracks receive a VidyaSchool STEM proficiency certificate."
        },
        {
          title: "Science & Innovation Fair",
          body: "Held every October, the Science Fair is the STEM programme's flagship event. Students present individual or group projects on science, engineering, or technology themes. A panel of external judges (including representatives from partnering organisations like IIT Delhi and industry sponsors) evaluates projects on innovation, methodology, presentation, and real-world applicability. Winning projects may be recommended for regional-level competitions."
        }
      ],
      tips: [
        "STEM Club students should bring their own laptop or tablet for coding sessions — school devices are available but limited.",
        "Start Science Fair projects early (August) to allow time for testing, iteration, and presentation preparation."
      ],
      faqs: [
        {
          q: "Do I need to know how to code before joining the Coding Club?",
          a: "No prior experience is required. The club starts from absolute basics for younger students. Older students with existing experience are placed in the intermediate/advanced cohort."
        },
        {
          q: "How are Robotics Club teams formed?",
          a: "Teams are formed at the start of the year by the programme coordinator, balancing experience levels. Students may request teammates, but final assignments are at the coordinator's discretion to ensure balanced teams."
        }
      ]
    },
    sports: {
      title: "Sports & Athletics Programme",
      badge: "Sports",
      description: "VidyaSchool's sports programme fosters physical fitness, teamwork, and competitive spirit through structured athletics training and team sports.",
      details: [
        {
          title: "Team Sports",
          body: "VidyaSchool fields school teams in the following sports for inter-school competitions:\n• Cricket (Under-14 and Under-19 categories)\n• Football (Under-14 and Under-19 categories)\n• Kabaddi (Girls and Boys)\n• Basketball\nTrial sessions are held in the first month of the academic year. Selected students train 3 days per week during the designated sports period and may attend Saturday practice sessions."
        },
        {
          title: "Athletics Track Events",
          body: "All students participate in annual athletics competitions held on Sports Day (January). Track events include 100m sprint, 200m, 400m, relay races, and long jump. Students are automatically entered based on their class; selection for inter-school athletics meets is based on Sports Day performance."
        },
        {
          title: "Yoga & Wellness",
          body: "A structured 30-minute yoga and mindfulness session is integrated into the weekly schedule for all students. The programme covers asana practice, pranayama breathing techniques, and guided relaxation. Yoga assessment is included in the student's co-curricular report card. The wellness programme also includes periodic health check-ups conducted by the school health officer."
        },
        {
          title: "Sports Day",
          body: "The annual Sports Day is held every January and is a major school event. All students participate in at least one track event. The day includes team sports finals, gymnastics demonstration, mass yoga performance, and the prestigious School Sports Trophy ceremony where top individual and team performers are recognised. Parents and guardians are invited to attend."
        }
      ],
      tips: [
        "Students trying out for team sports should wear proper sports shoes and bring a water bottle to trial sessions.",
        "Regular participation in yoga sessions is marked and contributes to your co-curricular grade."
      ],
      faqs: [
        {
          q: "What if I have a medical condition that prevents me from playing sports?",
          a: "Students with medical conditions should submit a doctor's certificate to the Physical Education teacher at the start of the year. Alternative activities (scorekeeper, event management volunteer, etc.) will be arranged to ensure participation in Sports Day."
        },
        {
          q: "How do I join a school sports team?",
          a: "Attend the open trial session announced by the Physical Education Department in the first month of school. Selections are skill-based and finalised within 2 weeks of trials."
        }
      ]
    }
  },
  "developers": {
    architecture: {
      title: "System Architecture & Core Stack",
      badge: "Developer Guide",
      description: "Comprehensive technical blueprint of VidyaSchool's dual-engine hybrid architecture, tech stack components, repository anatomy, and communication contracts.",
      details: [
        {
          title: "Core Technology Stack",
          body: "VidyaSchool is built using a modern, resilient technology stack:\n• Frontend Framework: Next.js 16 (React 19, App Router) with Server Components & Edge Middleware.\n• Design System: Custom Vanilla CSS tokens + Tailwind CSS with Glassmorphism aesthetic and automatic dark mode.\n• Documentation: Fumadocs UI with PageTree navigation and custom Markdown theme overrides.\n• Primary Database: PostgreSQL (Neon Serverless / Docker Postgres) shared by Node.js and Python runtimes.\n• Frontend ORM: Drizzle ORM for type-safe database queries and migrations.\n• Python Backend: FastAPI (Python 3.12+) running an ASGI server with SQLModel / SQLAlchemy ORM.\n• Realtime Gateway: Socket.IO AsyncServer for instant notifications, online presence, and administrative alerts.\n• Authentication: Better-Auth with session token cookie synchronization across Node.js & Python.\n• Telemetry & Monitoring: Sentry SDK for client and server error tracing."
        },
        {
          title: "Dual-Engine Hybrid Proxy Architecture",
          body: "The platform operates on a high-throughput hybrid proxy model:\n1. Edge Interception: Next.js Middleware (middleware.ts) intercepts incoming requests, verifies session tokens, enforces rate limits, and performs zero-waterfall redirects from /[role] to /[role]/[username].\n2. SSR UI & Local APIs: Next.js Server Components handle UI rendering and light CRUD operations.\n3. FastAPI Microservices: Requests to /api/backend/* or proxied account/profile routes are forwarded directly to the Python FastAPI backend (running on port 8000) for complex business logic, fee calculations, and AI page generation."
        },
        {
          title: "Repository Directory Anatomy",
          body: "The codebase is organized into two primary root modules:\n• /frontend:\n  - app/: Next.js App Router pages (admin, student, teacher, accounts, librarian, docs, login, signup).\n  - components/: Reusable UI components (buttons, badges, sidebar, dialogs, avatar uploaders).\n  - lib/: Core utilities, database schema (schema.ts), Better-Auth client/server helpers, and rate-limit.ts.\n  - middleware.ts: Edge firewall, rate limiter, and fast role router.\n• /backend:\n  - main.py: FastAPI entry point, ASGI server initialization, CORS regex, and exception handlers.\n  - app/core/: Security auth helpers (auth.py), database connection (database.py), and rate limit middleware (rate_limit.py).\n  - app/routes/: Specialized domain routers (fees.py, teacher.py, chats.py, library.py, page_builder_ai.py).\n  - models.py: SQLModel database entities matching PostgreSQL schema."
        }
      ],
      tips: [
        "Refer to /frontend/lib/schema.ts and /backend/models.py whenever adding or modifying database fields.",
        "Use /api/backend/[...path] as the proxy route when triggering FastAPI endpoints from Next.js client components."
      ],
      faqs: [
        {
          q: "Why does the application use both Next.js and FastAPI?",
          a: "Next.js delivers fast Server-Side Rendering (SSR), SEO, and edge routing for the web UI, while FastAPI provides high-performance asynchronous Python processing for heavy computations, data analytics, AI element generation, and Socket.IO realtime events."
        },
        {
          q: "How do Next.js and FastAPI share user sessions?",
          a: "Both services query the same PostgreSQL database. Next.js sets session tokens in HTTP cookies; FastAPI decodes the token from the request cookie or Bearer header and validates it against the shared 'session' database table."
        }
      ]
    },
    frontend: {
      title: "Frontend Framework & UI System",
      badge: "Next.js 16 & UI",
      description: "Technical guide to Next.js 16 App Router usage, server component rendering, custom CSS design system, and Fumadocs integration.",
      details: [
        {
          title: "Server vs Client Component Strategy",
          body: "VidyaSchool follows a strict React Server Component (RSC) architecture:\n• Server Components: All page layouts (app/[role]/[username]/layout.tsx) and root route redirect handlers (app/student/page.tsx) run purely on the server to prevent client loading state waterfalls.\n• Client Components ('use client'): Used strictly for interactive forms, real-time charts, tab interfaces, socket listeners, and avatar uploaders."
        },
        {
          title: "Design System & Aesthetics",
          body: "The UI design prioritizes visual excellence and responsiveness:\n• Curated HSL Color Tokens: CSS variables in globals.css provide harmonious dark/light mode themes.\n• Modern Typography: Inter/Roboto/Outfit Google fonts instead of browser defaults.\n• Interactive Glassmorphism: Smooth backdrop blurs, dynamic gradients, subtle micro-animations, and custom hover states.\n• Dark Mode System: Synced via ThemeProvider and customized in Fumadocs UI."
        },
        {
          title: "Fast Role Redirection Engine",
          body: "When users visit a root role URL (e.g., /student or /teacher):\n• Middleware (middleware.ts) immediately checks session credentials and resolves the user's username.\n• The request is redirected at the Edge layer to /[role]/[username] before any client-side JavaScript bundle executes.\n• Page layouts enforce role ownership so users can only access their own dashboard."
        }
      ],
      tips: [
        "Always use requireRole(['role']) in server components to enforce role authorization.",
        "Keep client components localized at the leaf level to maximize server rendering performance."
      ]
    },
    backend: {
      title: "FastAPI Backend Engine",
      badge: "Python Engine",
      description: "Technical documentation for the Python 3.12+ FastAPI backend, domain routers, exception handlers, and Socket.IO realtime server.",
      details: [
        {
          title: "FastAPI Application Structure",
          body: "The Python backend (backend/main.py) is built on FastAPI and Uvicorn:\n• ASGI Application: Mounted with Socket.IO AsyncServer for realtime websockets.\n• CORS Middleware: Configured with strict regex matching localhost, Vercel deployments, and production domains.\n• Global Exception Handler: Custom StarletteHTTPException handler guarantees all error responses return a standardized JSON body containing both 'detail' and 'error' keys."
        },
        {
          title: "Domain Routers & Modules",
          body: "The backend is partitioned into dedicated domain routers:\n• app/routes/fees.py: Fee calculation engine, itemized installment ledgers, Razorpay payment webhooks, and account profile CRUD.\n• app/routes/chats.py: AI chat assistance, leaderboard engine, and class marks processing.\n• app/routes/page_builder_ai.py: Streaming AI page builder with elementor templates.\n• app/routes/teacher.py: Faculty rosters, subject assignments, and leave requests."
        },
        {
          title: "Realtime Socket.IO Events",
          body: "The realtime server broadcasts live events:\n• join: Client establishes active presence and room connectivity.\n• approval_status & request_updated: Broadcasts teacher approval status updates to admin rooms.\n• substitution_updated: Emits real-time faculty substitution updates."
        }
      ],
      tips: [
        "Run 'python3 -m py_compile main.py app/routes/fees.py' to validate Python syntax before committing.",
        "Always use Depends(get_db) for thread-safe database session management in FastAPI routes."
      ]
    },
    database: {
      title: "Database & ORM Schema Sync",
      badge: "PostgreSQL & ORM",
      description: "Unified database architecture, Drizzle ORM (TypeScript) and SQLModel (Python) parity, and database migration guidelines.",
      details: [
        {
          title: "Unified PostgreSQL Database",
          body: "Both frontend and backend services connect to the same PostgreSQL database instance:\n• Host: Serverless Neon PostgreSQL or local PostgreSQL container.\n• Connection Pooling: Configured with pool_pre_ping=True and pool_recycle=300 in Python, and connection pooling in Drizzle ORM."
        },
        {
          title: "TypeScript (Drizzle) & Python (SQLModel) Parity",
          body: "Database entities are mapped 1:1 across languages:\n• user <-> User: id, name, email, role, preferred_role, teacher_approval_status.\n• user_profile <-> UserProfile: user_id, admission_number, username, phone_number, parent_name, class (class_), section, transport_mode, onboarding_completed.\n• session <-> SessionModel: token, user_id, expires_at, ip_address, user_agent.\n• fee_installment <-> FeeInstallment: user_id, month, year, amount, due_date, status, paid_date, receipt_no."
        },
        {
          title: "Migration Workflow",
          body: "When modifying database tables:\n1. Update frontend/lib/schema.ts (Drizzle schema).\n2. Update backend/models.py (SQLModel schema).\n3. Run 'npx drizzle-kit generate' or migration SQL scripts to apply changes to PostgreSQL."
        }
      ],
      tips: [
        "In Python SQLModel, use Field(alias='...') for columns named after Python reserved keywords (e.g. class_ alias 'class').",
        "Verify date field formats: Drizzle uses JavaScript Date objects, while FastAPI serializes ISO 8601 strings."
      ]
    },
    security: {
      title: "Security, Auth & Rate Limiting",
      badge: "Security & Rate Limit",
      description: "Comprehensive security architecture, session token verification, dual-layer sliding window rate limiters, and RBAC firewall.",
      details: [
        {
          title: "Dual-Layer Sliding Window Rate Limiter",
          body: "To protect against DDoS and brute-force attacks, rate limiters are active on both tiers:\n1. Next.js Edge Rate Limiter (frontend/lib/rate-limit.ts & middleware.ts):\n   - Strict endpoints (/api/auth/*, /api/profile/*, /api/admin/*): 60 requests per minute per IP.\n   - General API endpoints (/api/*): 180 requests per minute per IP.\n2. FastAPI Rate Limiter (backend/app/core/rate_limit.py):\n   - Auth & session endpoints: 60 requests per minute per IP.\n   - Health checks: 300 requests per minute per IP.\n   - Standard API endpoints: 180 requests per minute per IP.\nExceeded limits trigger an HTTP 429 Too Many Requests response with Retry-After and X-RateLimit-* headers."
        },
        {
          title: "Session Authentication & Token Parsing",
          body: "Session verification workflow:\n• Session Token Cookie: Stored as better-auth.session_token.\n• Token Decoding: Strips signature prefixes (split by '.') and unquotes URL-encoded tokens.\n• DB Verification: Checks expiration date (expires_at > UTC now) against PostgreSQL session records."
        },
        {
          title: "Role-Based Access Control (RBAC)",
          body: "Multi-layered authorization enforcement:\n• Middleware Firewall: Enforces role permissions per path prefix (/student, /teacher, /admin, /accounts, /librarian).\n• Server Helper: requireRole(['role']) verifies active session role in server components.\n• Layout Security: Validates that requested profile usernames match the authenticated user."
        }
      ],
      tips: [
        "Rate limiters use in-memory sliding windows with automated 5-minute cleanup cycles.",
        "Always forward request cookie and authorization headers when making server-to-server proxy calls."
      ]
    },
    deployment: {
      title: "Deployment, CI/CD & Environment Setup",
      badge: "Deployment & Setup",
      description: "Complete guide for local developer onboarding, environment variable configuration, testing, and production deployment.",
      details: [
        {
          title: "Local Development Setup",
          body: "Follow these steps to run the full application locally:\n\n1. Frontend (Next.js):\n   $ cd frontend\n   $ npm install\n   $ npm run dev\n   (App running at http://localhost:3000)\n\n2. Backend (FastAPI):\n   $ cd backend\n   $ python3 -m venv .venv\n   $ source .venv/bin/activate\n   $ pip install -r requirements.txt\n   $ uvicorn main:app --reload --port 8000\n   (API running at http://localhost:8000)"
        },
        {
          title: "Environment Variable Configuration",
          body: "Required configuration parameters:\n• DATABASE_URL: PostgreSQL connection string (postgresql://user:pass@host/dbname).\n• BACKEND_URL / NEXT_PUBLIC_BACKEND_URL: FastAPI backend address (http://localhost:8000 in dev).\n• BETTER_AUTH_SECRET: Secret key for session encryption.\n• SENTRY_DSN: Telemetry DSN for client/server error monitoring.\n• FIREBASE_CREDENTIALS_JSON: Firebase Admin SDK credentials for push notifications."
        },
        {
          title: "Production Deployment",
          body: "Deployment target configuration:\n• Frontend: Vercel / Docker container running Next.js build (npm run build).\n• Backend: Render / Railway / AWS ECS running FastAPI uvicorn worker.\n• Database: Neon Serverless PostgreSQL with SSL connection mode."
        },
        {
          title: "Code Validation Commands",
          body: "Always run code quality checks before submitting pull requests:\n• Frontend TypeScript Validation: npx tsc --noEmit\n• Backend Python Compilation: python3 -m py_compile app/core/auth.py app/routes/fees.py main.py"
        }
      ],
      tips: [
        "Use 'git status' to verify all modified files before pushing changes to origin main.",
        "Keep .env files out of source control; use .env.example for template reference."
      ]
    }
  }
}

export default async function DocArticlePage({
  params
}: {
  params: Promise<{ role: string; section: string }>
}) {
  const { role, section } = await params
  const article = ARTICLES[role]?.[section]

  if (!article) {
    return (
      <div className="p-8 md:p-12 text-center text-muted-foreground text-sm">
        Documentation page not found.
      </div>
    )
  }

  const toc: { title: string; url: string; depth: number }[] = []
  toc.push({ title: "Overview", url: "#overview", depth: 2 })
  if (article.steps) toc.push({ title: "Step-by-Step Guide", url: "#guide", depth: 2 })
  if (article.tips) toc.push({ title: "Tips", url: "#tips", depth: 2 })
  if (article.warnings) toc.push({ title: "Important Warnings", url: "#warnings", depth: 2 })
  if (article.details) {
    article.details.forEach((det) => {
      const slug = det.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      toc.push({ title: det.title, url: `#${slug}`, depth: 2 })
    })
  }
  if (article.faqs) toc.push({ title: "FAQs", url: "#faqs", depth: 2 })

  const roleLabel =
    role === "student" ? "Students"
    : role === "teacher" ? "Educators"
    : role === "auth" ? "All Users"
    : role === "getting-started" ? "All Users"
    : role === "admissions" ? "Prospective Students"
    : role === "co-curriculars" ? "Students"
    : "Users"

  return (
    <DocsPage toc={toc}>
      <DocsBody>
        {/* Header */}
        <div className="space-y-3" id="overview">
          <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] font-semibold border-primary/20">
            {article.badge}
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {article.title}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {article.description}
          </p>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-muted/20 border border-muted-foreground/10 rounded-xl text-xs space-y-2">
          <p className="font-semibold flex items-center gap-1.5 text-foreground">
            <Shield className="size-4 text-emerald-500" />
            <span>Note for {roleLabel}</span>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This portal module is fully integrated with your dashboard profile. Contact administration if permissions are restricted.
          </p>
        </div>

        {/* Steps */}
        {article.steps && (
          <section className="space-y-6 pt-4" id="guide">
            <h2 className="text-xl font-bold text-foreground">Step-by-Step Guide</h2>
            <div className="space-y-5">
              {article.steps.map((st) => (
                <div key={st.step} className="flex gap-4 text-sm leading-relaxed border-b pb-5 border-muted/30 last:border-b-0">
                  <span className="font-extrabold text-primary text-base shrink-0 w-6">{st.step}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{st.title}</h3>
                    <p className="text-muted-foreground mt-1 whitespace-pre-line">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tips */}
        {article.tips && article.tips.length > 0 && (
          <section className="pt-4" id="tips">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Lightbulb className="size-4 text-blue-500" />
                Tips
              </h3>
              <ul className="space-y-2">
                {article.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="size-3.5 text-blue-400 mt-0.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Warnings */}
        {article.warnings && article.warnings.length > 0 && (
          <section className="pt-4" id="warnings">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Important Warnings
              </h3>
              <ul className="space-y-2">
                {article.warnings.map((warn, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Details */}
        {article.details && (
          <section className="space-y-8 pt-4">
            {article.details.map((det, i) => {
              const slug = det.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
              return (
                <div key={i} className="space-y-2">
                  <h2 className="text-lg font-bold text-foreground" id={slug}>{det.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{det.body}</p>
                </div>
              )
            })}
          </section>
        )}

        {/* FAQs */}
        {article.faqs && article.faqs.length > 0 && (
          <section className="space-y-4 pt-6" id="faqs">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {article.faqs.map((faq, i) => (
                <div key={i} className="border border-border/60 rounded-xl p-4 space-y-2 bg-muted/10">
                  <p className="font-semibold text-sm text-foreground">{faq.q}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </DocsBody>
    </DocsPage>
  )
}
