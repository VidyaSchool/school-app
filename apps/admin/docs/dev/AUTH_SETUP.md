# Authentication Setup Guide

## Required Environment Variables

Create a `.env.local` file with the following:

```bash
# Neon Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (for email OTP)
RESEND_API_KEY=re_xxxxx

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# GitHub OAuth
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

## Setup Steps

### 1. Neon Database
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### 2. Resend (Email OTP)
1. Go to https://resend.com
2. Sign up and verify your domain (or use resend.dev for testing)
3. Create an API key
4. Copy to `RESEND_API_KEY`

### 3. Google OAuth
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret

### 4. GitHub OAuth
1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Homepage URL: `http://localhost:3000`
4. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Secret

### 5. Generate Auth Secret
```bash
openssl rand -base64 32
```
Copy output to `BETTER_AUTH_SECRET`

### 6. Push Database Schema
```bash
npm run db:push
```

### 7. Run Development Server
```bash
npm run dev
```

## Routes

- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/api/auth/[...all]` - Auth API routes

## Features

✅ Email/Password authentication with verification
✅ Google OAuth
✅ GitHub OAuth
✅ Email OTP via Resend
✅ Password reset
✅ Session management
✅ Drizzle ORM with Neon PostgreSQL
