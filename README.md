# 🎓 VidyaSchool (विद्यास्कूल) - Enterprise School Management System

VidyaSchool is a modern, enterprise-grade, multi-platform School ERP & Educational Ecosystem designed to bridge communication and administration between **Admins**, **Teachers**, **Students**, **Parents**, and **Staff**.

The web ecosystem is built as a **Turborepo + pnpm Workspaces** monorepo featuring four Next.js 16.4 applications, a FastAPI REST & WebSocket service, shared design and auth packages, alongside cross-platform desktop (C++ GTK+) and dual mobile clients (React Native / Expo & Kotlin Android Compose).

---

## 🏛️ Ecosystem Architecture

```
                               ┌─────────────────────────────────────────┐
                               │          VidyaSchool Ecosystem          │
                               └────────────────────┬────────────────────┘
                                                    │
                 ┌───────────────────┬──────────────┴───────┬───────────────────┐
                 │                   │                      │                   │
          ┌──────▼──────┐     ┌──────▼──────┐        ┌──────▼──────┐     ┌──────▼──────┐
          │ Next.js 16  │     │  FastAPI    │        │  C++ GTK+   │     │ Mobile Apps │
          │  Monorepo   │     │  Backend    │        │ Desktop App │     │ Expo/Kotlin │
          │ Ports 3000-3│     │  Port 8000  │        │             │     │             │
          └──────┬──────┘     └──────┬──────┘        └──────┬──────┘     └──────┬──────┘
                 │                   │                      │                   │
                 └───────────────────┼──────────────────────┴───────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │ PostgreSQL (Neon DB)    │
                        │ Firebase / AWS S3 / Resend
                        └─────────────────────────┘
```

---

## 💻 Monorepo Workspace (`Turborepo + pnpm`)

```
vidyaschool/
├── apps/
│   ├── auth/              # @vidyaschool/auth (Port 3002: Central SSO, Login, Device Pairing)
│   ├── erp/               # @vidyaschool/erp (Port 3003: Student, Teacher, Parent & Librarian ERP)
│   ├── admin/             # @vidyaschool/admin (Port 3001: School Governance & Master Control)
│   ├── frontend/          # @vidyaschool/frontend (Port 3000: Marketing & Public Portal)
│   └── backend/           # FastAPI REST & WebSocket Service (Port 8000)
│
├── packages/
│   ├── ui/                # @vidyaschool/ui (Shared library of 41 shadcn/Tailwind UI components)
│   └── auth-client/       # @vidyaschool/auth-client (Shared Better-Auth Client & Session SDK)
│
├── pnpm-workspace.yaml    # Workspace definition
├── turbo.json             # Turborepo task pipeline & cache graph
├── .npmrc                 # Native build script approvals & supply-chain settings
└── package.json           # Root orchestration scripts
```

### 1. 🌐 Web Applications (`apps/`)

* **Central Auth & SSO (`apps/auth` - Port 3002)**:
  * **Stack**: Next.js 16.4.6 + React 19 + Better Auth + Drizzle ORM (Neon DB).
  * **Features**: Centralized authentication, QR code cross-device pairing, OTP verification, onboarding, and wildcard cookie SSO (`.vidyaschool.com`).
* **School ERP (`apps/erp` - Port 3003)**:
  * **Audience**: Students, Teachers, Librarians, Accountants, and Parents.
  * **Features**: Class timetables, fees & ledger, library borrowing, gradebooks, attendance, and student notes.
* **Admin Portal (`apps/admin` - Port 3001)**:
  * **Audience**: School Administrators and Governance.
  * **Features**: Student & Teacher management, fee control, school slider CMS, broadcast notices, AI Page Builder.
* **Public Portal (`apps/frontend` - Port 3000)**:
  * **Audience**: Public Visitors, Prospective Students, and General Information.
  * **Features**: Marketing site, faculty showcases, fee structure disclosures, and admissions.
* **Backend Service (`apps/backend` - Port 8000)**:
  * **Stack**: Python 3.10+ FastAPI + Uvicorn + SQLModel / SQLAlchemy + Socket.IO.
  * **Features**: Real-time events, background schedulers (APScheduler), Firebase Admin, and S3 file processing.

### 2. 📦 Shared Packages (`packages/`)

* **`@vidyaschool/ui`**: Single source of truth for all 41 shadcn/Tailwind components (`Button`, `Dialog`, `Calendar`, `Card`, `Table`, etc.). Changes to UI propagate instantly across all portals.
* **`@vidyaschool/auth-client`**: Central Better Auth client configuration, cookie management, and cross-domain logout helpers so all portals share identical session contracts.

### 3. 🖥️ Desktop Application (`desktop/`)

* **Language & GUI**: C++ 17 with GTK+ 3.0 UI Framework.
* **Features**: Native browser-based OAuth authentication callback interceptor (`http://localhost:8080/callback`) and desktop session state binding.

### 4. 📱 Mobile Applications (`mobile-app/`)

* **React Native / Expo (`mobile-app/native`)**:
  * Expo SDK 57 + React Native 0.86 + Expo Router (File-based navigation).
  * Reanimated 4, Vector Icons, Razorpay Payment SDK, Socket.io Client.
* **Kotlin Android (`mobile-app/kotlin`)**:
  * Native Kotlin + Jetpack Compose + Material 3 design system.
  * Zero-Android-Studio setup using Docker-based build tool (`./build.sh`).

---

## 🛠️ Developer Workflow

### Quick Start

```bash
# 1. Install dependencies across all apps and packages
pnpm install

# 2. Run all web portals concurrently
pnpm dev

# 3. Or run individual services:
pnpm dev:auth      # Central Auth on http://localhost:3002
pnpm dev:erp       # ERP Portal on http://localhost:3003
pnpm dev:admin     # Admin Portal on http://localhost:3001
pnpm dev:frontend  # Public Web on http://localhost:3000
pnpm dev:backend   # FastAPI Backend on http://localhost:8000

# 4. Build all apps with Turborepo caching:
pnpm build
```

---

## 🌿 Branching Strategy (How Big Tech Does It)

In this Monorepo layout, branching is **atomic**:

1. **Branch off `main`:**
   ```bash
   git checkout -b feat/sso-login-flow
   ```
2. **Make coordinated changes:** You can edit the Auth portal in `apps/auth` and the session reader in `apps/erp` in the same branch.
3. **Commit & Open One PR:** Submit a single Pull Request. Reviewers see the full picture in one place.
4. **Intelligent CI:** Turborepo detects which apps were modified and only builds and tests those apps.
5. **No Version Drift:** It is impossible to deploy mismatched versions between Auth and ERP.

---

## 🚀 Deployment Guide

### Vercel (Web Portals)

Each portal is linked to the repository with its specific **Root Directory** configured:

| Project Name | Domain / Service | Root Directory Setting |
| :--- | :--- | :--- |
| `vidyaschool` | Public Portal (`vidyaschool.com`) | `apps/frontend` |
| `school-app` | Admin Portal (`admin.vidyaschool.com`) | `apps/admin` |
| `school-app-2i5w` | Central Auth (`auth.vidyaschool.com`) | `apps/auth` |
| `school-app-tve5` | ERP Portal (`erp.vidyaschool.com`) | `apps/erp` |

> [!IMPORTANT]
> In each Vercel project's **Settings > General > Root Directory**, make sure **"Include source files outside of the Root Directory in the Build Step"** is **CHECKED**. This allows Vercel to access `packages/ui` and `packages/auth-client`.

### AWS Lightsail (FastAPI Backend)

Automated via GitHub Actions ([`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml)):
* Triggers automatically on pushes touching `apps/backend/**`.
* Pulls latest `main`, synchronizes `.venv` and `.env`, and restarts the `vidyaschool-backend` systemd service.
* Verifies health via `http://localhost:8000/api/health`.

---

## ⚙️ Environment Variables Setup

### Central Auth (`apps/auth/.env.local`)
```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_32_char_secret_key
BETTER_AUTH_URL=http://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3002
COOKIE_DOMAIN=.vidyaschool.com

RESEND_API_KEY=re_your_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### ERP Portal (`apps/erp/.env.local`)
```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_32_char_secret_key
BETTER_AUTH_URL=http://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_AUTH_URL=http://localhost:3002
COOKIE_DOMAIN=.vidyaschool.com
```

### Admin Portal (`apps/admin/.env.local`)
```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_32_char_secret_key
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
BACKEND_URL=http://localhost:8000
AWS_S3_BUCKET_NAME=vidyaschool-uploads
```

### Backend API (`apps/backend/.env`)
```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
NVIDIA_API_KEY=nvapi-xxxxxx
AWS_S3_BUCKET_NAME=vidyaschool-uploads
```

---

## 🗄️ Database Management & Migrations

Database operations use Neon PostgreSQL with Drizzle ORM:

```bash
# Generate SQL migration files
pnpm --filter=@vidyaschool/auth db:generate
pnpm --filter=@vidyaschool/erp db:generate

# Push schema changes to database
pnpm --filter=@vidyaschool/auth db:push
```

---

## ✨ Key Platform Features

| Feature | Description |
| :--- | :--- |
| **Role-Based Access Control (RBAC)** | Granular permissions for Admin, Teacher, Student, Parent, and Staff. |
| **Centralized SSO & Pairing** | Better-Auth with wildcard cookie sharing and cross-device QR pairing. |
| **Real-time Messaging** | Socket.IO integrated chat channels for student-teacher communication. |
| **Fee Management & Payments** | Fee tracking, invoice generation, and Razorpay payment integration. |
| **Timetable & Attendance** | Class scheduling, daily attendance tracking, and substitute teacher management. |
| **Study Notes & Documents** | Secure cloud-hosted study materials, class notes, and document sharing. |
| **AI Page Builder** | Dynamic page creation system powered by NVIDIA AI / LLM APIs. |
| **Library Management** | Book cataloging, issuance, tracking, and reservation workflows. |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
Contributions, feature requests, and pull requests are welcome!
