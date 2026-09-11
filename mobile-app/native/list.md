# Vidya School — React Native Expo Migration Checklist

> Tracking every screen, component, service, and feature being ported from the Kotlin app to React Native Expo.  
> Each item is marked `✅ done` as it has been built.

---

## 1. Project Setup & Config

- ✅ done Configure `app.json` (name, slug, scheme, icons, splash)
- ✅ done Install required dependencies (expo-router, async-storage, expo-secure-store, etc.)
- ✅ done Setup TypeScript config
- ✅ done Setup API base URLs (`https://api.vidyaschool.com/`, `https://vidyaschool.vercel.app/`)
- ✅ done Create folder structure (`app/`, `components/`, `services/`, `hooks/`, `theme/`, `types/`)

---

## 2. Theme & Design System

- ✅ done Create theme system (light/dark mode matching Kotlin shadcn-style colors)
  - Light: primary `#18181B`, background `#FAFAFA`, surface `#FFFFFF`, outline `#E4E4E7`
  - Dark: primary `#FFFFFF`, background `#09090B`, surface `#18181B`, outline `#27272A`
- ✅ done Create `ThemeContext` with system/light/dark mode support
- ✅ done Create theme-aware color hook (`useThemeColors`)

---

## 3. Reusable UI Components

- ✅ done `BottomDrawer` — rounded-top sheet with drag handle, ime-padding
- ✅ done `PrimaryButton` — full-width, loading spinner, shadcn style
- ✅ done `SecondaryButton` — outlined variant, loading spinner
- ✅ done `CustomTextField` / `Input` — label, placeholder, password toggle, readOnly, icons
- ✅ done `Select` — dropdown selector with label and options
- ✅ done `SliderSkeleton` — shimmer loading placeholder for image slider
- ✅ done `ImageSlider` — auto-playing horizontal pager with dot indicators
- ✅ done `DashboardHeader` — title, subtitle, menu button, notification bell
- ✅ done `DashboardStickyHeader` — animated sticky header on scroll (integrated)
- ✅ done `SearchResultRow` — icon, title, subtitle, category badge, arrow
- ✅ done `SearchGroupHeader` — uppercase section title (integrated)
- ✅ done `ProfileDetailRow` — label-value pair row (integrated)
- ✅ done `UpdateBanner` — app update notification banner (download/install)

---

## 4. Services / API Layer

- ✅ done Create API client with base URLs and auth headers
- ✅ done **Auth APIs:**
  - ✅ done `POST /api/auth/sign-in/email` — email/password login
  - ✅ done `POST /api/auth/sign-up/email` — email/password signup
  - ✅ done `GET /api/public/user-role/{email}` — get user role
  - ✅ done `POST /api/public/create-session` — create session
  - ✅ done `GET /api/public/verify-session/{token}` — verify session
- ✅ done **Profile APIs:**
  - ✅ done `GET /api/profile` — get user profile
  - ✅ done `PATCH /api/profile` — update profile
- ✅ done **Onboarding APIs:**
  - ✅ done `GET /api/onboarding/status` — check onboarding status
  - ✅ done `POST /api/onboarding` — submit onboarding data
- ✅ done **Slider APIs:**
  - ✅ done `GET /api/slider/images?role=&student_class=` — get slider images
  - ✅ done `POST /api/admin/slider-images` — update slider images (admin)
- ✅ done **Fee APIs:**
  - ✅ done `GET /api/fees` — get fee installments
  - ✅ done `POST /api/fees/pay` — pay fees
  - ✅ done `GET /api/fees/receipt/{receiptNo}` — verify receipt
  - ✅ done `POST /api/create-order` — create Razorpay order
  - ✅ done `POST /api/verify-payment` — verify Razorpay payment
- ✅ done **Library APIs:**
  - ✅ done `GET /api/student/borrowings` — get borrowed books
  - ✅ done `PATCH /api/student/borrowings` — renew book
- ✅ done **Notice APIs:**
  - ✅ done `GET /api/notices` — get notices
- ✅ done **Search APIs:**
  - ✅ done `GET /api/users/search?q=` — search users
  - ✅ done `GET /api/search?q=&role=&username=` — search backend
  - ✅ done `GET /api/search/markdown?path=` — get doc markdown
- ✅ done **Notification APIs:**
  - ✅ done `POST /api/notifications/register-token` — register FCM token
  - ✅ done `GET /api/notifications/history?days=` — get notification history

---

## 5. Session / Auth Management

- ✅ done Create `SessionManager` using AsyncStorage/SecureStore
  - ✅ done Save/load: provider, email, name, role, avatarUrl, sessionToken, studentClass, username
  - ✅ done Theme mode persistence (system/light/dark)
  - ✅ done `isLoggedIn()`, `clearSession()`, `getSessionToken()`

---

## 6. Auth Screens

- ✅ done **Welcome Screen** (`/`)
  - ✅ done Black background with "Vidya School" centered title
  - ✅ done BottomDrawer with Login + Create Account buttons
  - ✅ done Terms & Conditions / Privacy Policy links
- ✅ done **Login Screen** (`/login`)
  - ✅ done "Vidya School" header on black bg
  - ✅ done BottomDrawer with email/password fields
  - ✅ done "Forgot password?" link
  - ✅ done Login button with loading state
  - ✅ done "OR" divider
  - ✅ done "Continue with Google" button
  - ✅ done "Continue with GitHub" button
  - ✅ done "Don't have an account? Create Account" link
  - ✅ done API: login via email, fetch user role, create session
- ✅ done **Signup Screen** (`/signup`)
  - ✅ done Full Name, Email, Password, Confirm Password fields
  - ✅ done Role selector (Student, Teacher, Accounts, Admin)
  - ✅ done Create Account button with loading
  - ✅ done "Already have an account? Sign In" link

---

## 7. Dashboard Layout (Shared Shell)

- ✅ done **Navigation Drawer (Side Menu)**
  - ✅ done User avatar/initials + name + email
  - ✅ done "File a Complaint" menu item → complaint dialog
  - ✅ done "Manage Sessions" menu item
  - ✅ done "Log Out" menu item (red)
- ✅ done **Bottom Tab Navigation**
  - ✅ done Home tab
  - ✅ done Notice tab
  - ✅ done Pay Fees tab (students) / Community tab (others)
  - ✅ done Search tab
  - ✅ done Profile tab
- ✅ done **Pull-to-Refresh** on home tab (verify session, refresh role)
- ✅ done **Complaint Dialog** — department selector, title input, description input

---

## 8. Dashboard Home Screens (role-based)

- ✅ done **Student Home Screen**
  - ✅ done Dashboard header ("Welcome, {name}")
  - ✅ done Animated sticky header on scroll (integrated)
  - ✅ done Image Slider (auto-play, skeleton loading)
  - ✅ done Academic Performance Card with 3 sub-tabs:
    - ✅ done Performance line chart
    - ✅ done Subject bar chart
    - ✅ done Attendance pie chart
  - ✅ done Sliding tab indicator animation
  - ✅ done Library Books Section (preview 3 books, "Show more" gradient overlay)
  - ✅ done Book renewal button with API call
  - ✅ done Student Onboarding Drawer (if not completed)
- ✅ done **Teacher Home Screen**
  - ✅ done Dashboard header ("Welcome, {name}")
  - ✅ done Image Slider with skeleton
  - ✅ done "Today's Schedule" card
- ✅ done **Admin Home Screen**
  - ✅ done Dashboard header ("Welcome, {name}")
  - ✅ done Slider Image Management card:
    - ✅ done Toggle enable/disable per image
    - ✅ done Target audience dropdown (All/Students/Teachers)
    - ✅ done Delete image button
    - ✅ done Add new slider image form (title, URL, target audience chips)
  - ✅ done "System Operations Overview" card
- ✅ done **Accounts Home Screen**
  - ✅ done Dashboard header ("Welcome, Accounts officer")
  - ✅ done "Pending Invoices" card

---

## 9. Student Onboarding Drawer

- ✅ done 4-step wizard with progress bar
- ✅ done **Step 1:** Academic Details — admission number, phone, class selector, section selector, transport mode
- ✅ done **Step 2:** Parent/Guardian Details — parent name, phone, email
- ✅ done **Step 3:** Account Identity — username input with validation
- ✅ done **Step 4:** Contact & Address — street, city, state, pincode
- ✅ done Step validation, Back/Next navigation, Submit API call

---

## 10. Tab Screens

- ✅ done **Notice Tab**
  - ✅ done Fetch notices from API
  - ✅ done Notice cards with title, content, category, urgency badge
  - ✅ done Sender name, target role/class/section info
  - ✅ done Timestamp formatting
- ✅ done **Fees Tab** (students only)
  - ✅ done Fetch fee installments from API
  - ✅ done Display paid/pending/overdue status
  - ✅ done Pay button (Razorpay integration or mock)
  - ✅ done Receipt verification
- ✅ done **Community Tab** (non-students)
  - ✅ done Chat interface
  - ✅ done Message list with sender info
  - ✅ done Message input + send
  - ✅ done Message actions (long-press delete)
  - ✅ done typing animation status
- ✅ done **Search Tab**
  - ✅ done Search input with debounced API calls
  - ✅ done Filter pills (All, Pages, Users, Docs)
  - ✅ done Pages & Features section — navigate to tabs
  - ✅ done Users section — search results with user detail dialog
  - ✅ done Documentation & Help section — doc cards with viewer
  - ✅ done User detail dialog (avatar, name, username, role, status)
- ✅ done **Profile Tab**
  - ✅ done User avatar/initials, name, email, role badge
  - ✅ done Username display/edit with API save
  - ✅ done Profile details: admission number, phone, class/section, parent info, address
  - ✅ done Edit mode toggle
  - ✅ done Theme mode selector (System/Light/Dark)
  - ✅ done Provider info display
  - ✅ done Logout button
- ✅ done **Sessions Tab**
  - ✅ done Current device session card (green dot, provider, email)
  - ✅ done Mock other sessions (Chrome/Windows, Safari/iPhone)
  - ✅ done "Revoke All Other Sessions" button

---

## 11. Standalone Screens

- ✅ done **Fee Receipt Screen** (`/feeReceipt/{receiptNo}`)
  - ✅ done Back button header
  - ✅ done Loading/error states
  - ✅ done Verified payment banner (green)
  - ✅ done Receipt details card (receipt no, student name, admission, class, month, amount, date, mode)
  - ✅ done Footer verification note
- ✅ done **Library Hub Screen** (`/library`)
  - ✅ done Top app bar with back button and book count
  - ✅ done Full book list with renewal status pips
  - ✅ done Renew button with API call
  - ✅ done Overdue status highlighting
  - ✅ done Loading/empty states
- ✅ done **Doc Viewer Screen**
  - ✅ done Back button header
  - ✅ done Fetch markdown content from API
  - ✅ done Render markdown to styled text

---

## 12. Notification System

- ✅ done **Notification Drawer** — slide-in panel with notification history
  - ✅ done Fetch from `GET /api/notifications/history`
  - ✅ done Display title, body, timestamp
  - ✅ done "No notifications" empty state
- ✅ done **Socket.IO real-time notifications** (simulation integrated)

---

## 13. Navigation Flow

- ✅ done Root layout with expo-router
- ✅ done Auth guard — redirect to welcome if not logged in
- ✅ done Role-based routing after login:
  - ✅ done `student` → Student dashboard
  - ✅ done `teacher` → Teacher dashboard
  - ✅ done `admin` → Admin dashboard
  - ✅ done `accounts` → Accounts dashboard
- ✅ done Deep link handling for fee receipts (`/fee/payment/{receiptNo}`)

---

## 14. Data Models / Types

- ✅ done `User`, `Session`, `LoginResponse`, `SignupResponse`
- ✅ done `UserRoleResponse`, `VerifySessionResponse`
- ✅ done `SliderImage`
- ✅ done `FeeInstallment`, `PayFeesRequest/Response`, `CreateOrderRequest/Response`, `VerifyPaymentRequest`
- ✅ done `ProfileResponse`, `UserProfileData`, `ProfileUpdateRequest`
- ✅ done `OnboardingSubmitRequest`, `OnboardingStatusResponse`
- ✅ done `StudentBorrowingResponse`, `StudentRenewRequest`
- ✅ done `NoticeResponse`
- ✅ done `SearchUserResponse`, `SearchBackendResponse`, `DocMarkdownResponse`
- ✅ done `NotificationHistoryItem`

---

## Summary

| Category              | Items | Status |
|-----------------------|-------|--------|
| Project Setup         | 5     | ✅ done |
| Theme & Design        | 3     | ✅ done |
| UI Components         | 14    | ✅ done |
| API Endpoints         | 22    | ✅ done |
| Session Management    | 4     | ✅ done |
| Auth Screens          | 3     | ✅ done |
| Dashboard Layout      | 5     | ✅ done |
| Home Screens (roles)  | 4     | ✅ done |
| Onboarding            | 5     | ✅ done |
| Tab Screens           | 6     | ✅ done |
| Standalone Screens    | 3     | ✅ done |
| Notifications         | 2     | ✅ done |
| Navigation            | 5     | ✅ done |
| Data Models           | 11    | ✅ done |
| **Total**             | **~92** | ✅ done |
