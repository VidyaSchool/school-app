# 🎓 VidyaSchool (विद्यास्कूल) - Enterprise School Management System

VidyaSchool is a modern, enterprise-grade, multi-platform School ERP & Educational Ecosystem designed to bridge communication and administration between **Admins**, **Teachers**, **Students**, **Parents**, and **Staff**.

The platform features a web application (Next.js 16), a backend REST & WebSocket service (FastAPI), a cross-platform desktop authentication client (C++ GTK+), and dual mobile clients (React Native / Expo & Kotlin Android Compose).

---

## 🏛️ Ecosystem Overview

```
                      ┌─────────────────────────────────────────┐
                      │          VidyaSchool Ecosystem          │
                      └────────────────────┬────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴───────┬──────────────────┐
         │                  │                      │                  │
  ┌──────▼──────┐    ┌──────▼──────┐        ┌──────▼──────┐    ┌──────▼──────┐
  │ Next.js 16  │    │  FastAPI    │        │  C++ GTK+   │    │ Mobile Apps │
  │ Web Portals │    │  Backend    │        │ Desktop App │    │ Expo/Kotlin │
  │ Port 3000   │    │  REST & WS  │        │             │    │             │
  │ Port 3001   │    │             │        │             │    │             │
  └──────┬──────┘    └──────┬──────┘        └──────┬──────┘    └──────┬──────┘
         │                  │                      │                  │
         └──────────────────┼──────────────────────┴──────────────────┘
                            │
               ┌────────────▼────────────┐
               │ PostgreSQL (Neon DB)   │
               │ Firebase / AWS S3 / Sentry│
               └─────────────────────────┘
```

---

## 💻 Sub-System Breakdown

### 1. 🌐 Web Portals
- **Main Portal (`/frontend` - Port 3000)**:
  - **Audience**: Students, Teachers, Librarians, Accountants, and Public Visitors.
  - **Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
  - **Auth & Routing**: Better-Auth authentication, role-based edge middleware redirecting `/admin` requests to Port 3001.
  - **Integrations**: Drizzle ORM (Neon DB), TanStack Table, Recharts, KaTeX, Monaco Editor, Socket.IO Client, Resend, AWS S3.
- **Admin Portal (`/admin_frontend` - Port 3001)**:
  - **Audience**: School Administrators and Governance.
  - **Features**: Student & Teacher Management, Fee Control, School Slider CMS, Broadcast Notices, AI Page Builder.
  - **Isolation**: Strict administrative role guard, dedicated Admin Login experience, and isolated UI workspace.

### 2. ⚡ Backend Service (`/backend`)
- **Framework**: Python FastAPI + Uvicorn + SQLModel / SQLAlchemy
- **Real-Time Communication**: Python Socket.IO (WebSockets engine for real-time messaging)
- **Scheduler & Background Tasks**: APScheduler (Automated notices, background processing)
- **Cloud & Auth Services**: Firebase Admin SDK, Amazon S3 (`boto3`), Sentry SDK, PDFPlumber, QR Code Generator (`qrcode`).

### 3. 🖥️ Desktop Application (`/desktop`)
- **Language & GUI**: C++ 17 with GTK+ 3.0 UI Framework
- **Cross-Platform Networking**: Native POSIX sockets (Linux/macOS) & Winsock `ws2_32` (Windows)
- **Features**: Native browser-based OAuth authentication callback interceptor (`http://localhost:8080/callback`) and desktop session state binding.

### 4. 📱 Mobile Applications (`/mobile-app`)
- **React Native / Expo (`/mobile-app/native`)**:
  - Expo SDK 57 + React Native 0.86 + Expo Router (File-based navigation)
  - Reanimated 4, Vector Icons, Razorpay Payment SDK, Socket.io Client.
- **Kotlin Android (`/mobile-app/kotlin`)**:
  - Native Kotlin + Jetpack Compose + Material 3 design system.
  - Zero-Android-Studio setup using Docker-based build tool (`./build.sh`).

---

## ✨ Key Platform Features

| Feature | Description |
| :--- | :--- |
| **Role-Based Access Control (RBAC)** | Granular permissions for **Admin**, **Teacher**, **Student**, **Parent**, and **Staff** members. |
| **Real-time Chat & Messaging** | Socket.IO integrated chat channels for student-teacher and parent-teacher communication. |
| **Fee Management & Payments** | Online fee tracking, invoice generation, and Razorpay integration with AWS S3 receipt uploads. |
| **Timetable & Attendance** | Interactive class scheduling, daily attendance tracking, and substitute teacher management. |
| **Teacher Notes & Documents** | Secure cloud-hosted study materials, class notes, and document sharing system. |
| **AI Page Builder** | Dynamic page creation system powered by NVIDIA AI / LLM APIs. |
| **Notices & Announcements** | Automated and audience-targeted school notice broadcast board. |
| **Library Management** | Book cataloging, issuance, tracking, and reservation workflows. |
| **QR Code Device Auth** | Cross-device QR login for quick authentication across Desktop and Mobile clients. |

---

## 🛠️ Technology Stack Summary

| Domain | Technologies |
| :--- | :--- |
| **Frontend Web** | Next.js 16, React 19, Tailwind CSS v4, Better-Auth, Drizzle ORM, Radix UI, Monaco Editor |
| **Backend REST API** | Python 3.10+, FastAPI, SQLModel, Uvicorn, Python Socket.IO, Sentry, APScheduler |
| **Database** | PostgreSQL (Neon Serverless), Drizzle Migrations |
| **Desktop Client** | C++ 17, GTK+ 3.0, CMake, Make, POSIX / Winsock HTTP Callback Listener |
| **Mobile Native** | React Native 0.86, Expo 57, Expo Router, Razorpay, Kotlin, Jetpack Compose |
| **Cloud & Storage** | AWS S3, Firebase Admin, Resend Email API, NVIDIA API |

---

## 📁 Repository Directory Structure

```
vidyaschool/
├── admin_frontend/                 # Next.js Dedicated Admin Portal (Port 3001)
│   ├── app/                        # Admin Dashboard, Slider, Notices, Page Builder
│   ├── components/                 # Administrative UI & widgets
│   ├── lib/                        # Better Auth, DB schema & helpers
│   ├── middleware.ts               # Strict admin role guard & route protection
│   └── package.json                # Admin Portal Dependencies
├── backend/                        # FastAPI Python Backend Service
│   ├── app/
│   │   ├── core/                   # Security, DB session, config
│   │   └── routes/                 # API Endpoints (auth, chats, fees, library, notices, etc.)
│   ├── models.py                   # SQLModel Database Schemas
│   ├── scheduler.py                # APScheduler Background Job Runner
│   ├── mcp_server.py               # Model Context Protocol Server
│   ├── requirements.txt            # Python Dependencies
│   └── start_backend.sh            # Backend Launch Script
├── desktop/                        # C++ GTK+ Desktop Client
│   ├── main.cpp                    # Native GTK+ Login & Callback App
│   ├── CMakeLists.txt              # CMake Build Configuration
│   ├── Makefile                    # Linux Build Makefile
│   └── run.sh                      # Quick Linux Build & Run Script
├── frontend/                       # Next.js Main Web Portal (Port 3000)
│   ├── app/                        # Next.js App Router (Pages & API routes)
│   ├── components/                 # React UI Components (Shadcn / Radix)
│   ├── drizzle/ & migrations/      # Drizzle ORM Schemas & Database Migrations
│   ├── lib/                        # Auth, DB, S3 & API Helper Utilities
│   ├── middleware.ts               # Next.js Route Guard & Admin Port Redirection
│   ├── package.json                # Frontend Dependencies
│   └── drizzle.config.ts           # Drizzle Kit Configuration
├── mobile-app/                     # Dual Mobile Client Infrastructure
│   ├── native/                     # React Native / Expo Application
│   │   ├── app/                    # Expo Router Screens
│   │   ├── components/             # Mobile React UI Components
│   │   └── package.json            # Expo Dependencies
│   └── kotlin/                     # Native Kotlin / Jetpack Compose App
│       ├── app/                    # Android Compose Application Source
│       ├── build.sh                # Dockerized Zero-Setup APK Build Script
│       └── Dockerfile              # Android Build Container Specification
├── .gitignore                      # Git Ignore Rules
└── README.md                       # Repository Overview
```

---

## ⚙️ Environment Variables Setup

### 1. Main Frontend (`frontend/.env.local`)
Create `frontend/.env.local` with the following key variables:

```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Payments & Email
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
RESEND_API_KEY=re_your_resend_api_key

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AWS S3 Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=vidyaschool-uploads
```

### 2. Admin Frontend (`admin_frontend/.env.local`)
Create `admin_frontend/.env.local` with matching database credentials pointing to port 3001:

```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MAIN_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

RESEND_API_KEY=re_your_resend_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=vidyaschool-uploads
```

### 3. Backend (`backend/.env`)
Create `backend/.env` with the following variables:

```env
DATABASE_URL=postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

NVIDIA_API_KEY=nvapi-xxxxxx

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=vidyaschool-uploads

RESEND_API_KEY=re_your_resend_api_key
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.x or v20.x
- **Python**: 3.10+
- **Docker**: (Optional, for building Kotlin Android APK without Android Studio)
- **GCC / CMake / GTK+ 3.0**: (Optional, for C++ Desktop application)

---

### 1. Launching Backend Service 🐍

```bash
# Navigate to backend
cd backend

# Create virtual environment & activate
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
./start_backend.sh
# Server runs at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

---

### 2. Launching Web Portals 🌐

#### Main Portal (Students, Teachers, Staff - Port 3000):
```bash
cd frontend
npm install
npm run dev
# Web Portal runs at http://localhost:3000
```

#### Dedicated Admin Portal (School Administrators - Port 3001):
```bash
cd admin_frontend
npm install
npm run dev
# Admin Portal runs at http://localhost:3001
```

---

### 3. Launching Desktop Application 🖥️

#### On Linux:
```bash
cd desktop

# Install GTK 3 dependencies (Ubuntu/Debian)
sudo apt-get install libgtk-3-dev build-essential

# Build & Run using script
chmod +x run.sh
./run.sh
```

#### On Windows:
```cmd
cd desktop
build.bat
login_app.exe
```

---

### 4. Running Mobile Applications 📱

#### React Native / Expo App:
```bash
cd mobile-app/native

# Install dependencies
npm install

# Start Expo dev server
npm run start
```

#### Kotlin Android App (Docker Zero-Setup Build):
```bash
cd mobile-app/kotlin

# Build APK inside Docker container
./build.sh

# Install produced APK on connected phone via ADB
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🗄️ Database Management & Migrations

The database uses Neon PostgreSQL with Drizzle ORM on the web frontend and SQLModel on the backend.

```bash
cd frontend

# Generate SQL migration files
npm run db:generate

# Apply migrations directly to PostgreSQL database
npm run db:push

# Launch interactive Drizzle Studio UI
npm run db:studio
```

---

## 📜 License & Contributing

Distributed under the MIT License. See `LICENSE` for details.
Contributions, feature requests, and pull requests are welcome!

---

*Made with ❤️ for modern education management.*
