import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, session as sessionTable, userProfile, userPermission } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.vidyaschool.com' : 'http://localhost:8000')
).replace(/\/+$/, '')

export const dynamic = 'force-dynamic'

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    '*',
    'admin:access',
    'roles:manage',
    'permissions:manage',
    'users:read', 'users:write', 'users:delete', 'users:manage',
    'students:read', 'students:write',
    'teachers:read', 'teachers:write', 'teachers:approve',
    'fees:read', 'fees:write', 'fees:manage',
    'notes:read', 'notes:write', 'notes:delete',
    'marks:read', 'marks:write',
    'attendance:read', 'attendance:write',
    'notices:read', 'notices:write', 'notices:delete',
    'timetable:read', 'timetable:write',
    'library:read', 'library:borrow', 'library:manage',
    'documents:read', 'documents:write', 'documents:delete',
    'chats:read', 'chats:write',
    'slider:manage', 'pages:manage',
  ],
  teacher: [
    'attendance:read', 'attendance:write',
    'marks:read', 'marks:write',
    'timetable:read',
    'notes:read', 'notes:write', 'notes:delete',
    'students:read',
    'teachers:read',
    'substitution:read',
    'notices:read', 'notices:write',
    'chats:read', 'chats:write',
    'library:read', 'library:borrow',
    'documents:read', 'documents:write',
  ],
  librarian: [
    'library:read', 'library:borrow', 'library:manage',
    'students:read',
    'teachers:read',
    'notes:read', 'notes:write',
    'notices:read', 'notices:write',
    'chats:read', 'chats:write',
    'documents:read', 'documents:write',
  ],
  account: [
    'fees:read', 'fees:write', 'fees:manage',
    'students:read',
    'notices:read',
    'documents:read',
  ],
  student: [
    'attendance:read',
    'marks:read',
    'fees:read', 'fees:pay',
    'timetable:read',
    'notes:read',
    'notices:read',
    'chats:read', 'chats:write',
    'library:read', 'library:borrow',
    'documents:read',
  ],
}

export async function GET(req: NextRequest) {
  const hdrs = await headers()
  const cookieHeader = hdrs.get('cookie') || ''
  const authHeader = hdrs.get('authorization') || ''

  // 1. Try FastAPI backend session endpoint first (authoritative with Redis cache-aside)
  try {
    const res = await fetch(`${BACKEND_URL}/api/session`, {
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { user: null, role: null, permissions: [], isAuthenticated: false },
        { status: 401 }
      )
    }
  } catch (error) {
    // FastAPI error/offline -> proceed to fast local database fallback
  }

  // 2. Local Fallback via Better-Auth / Drizzle DB
  try {
    let session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      const rawCookie =
        req.cookies.get('better-auth.session_token')?.value ||
        req.cookies.get('__Secure-better-auth.session_token')?.value
      if (rawCookie) {
        const cleanToken = decodeURIComponent(rawCookie).split('.')[0]
        const dbSession = await db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.token, cleanToken))
          .then((res) => res[0])

        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, dbSession.userId))
            .then((res) => res[0])

          if (dbUser) {
            session = { user: dbUser, session: dbSession }
          }
        }
      }
    }

    if (!session?.user) {
      return NextResponse.json(
        { user: null, role: null, permissions: [], isAuthenticated: false },
        { status: 401 }
      )
    }

    const currentUser = session.user
    const userRole = (currentUser.role || 'student').toLowerCase()

    // Retrieve profile for username / onboarding info
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, currentUser.id),
    })

    // Resolve base permissions
    const permsSet = new Set<string>(DEFAULT_ROLE_PERMISSIONS[userRole] || [])

    // Query custom database overrides if available
    try {
      const overrides = await db
        .select()
        .from(userPermission)
        .where(eq(userPermission.userId, currentUser.id))

      for (const ov of overrides) {
        if (ov.granted) {
          permsSet.add(ov.permission)
        } else {
          permsSet.delete(ov.permission)
        }
      }
    } catch {
      // If table doesn't exist yet, proceed with role defaults
    }

    const permissions = Array.from(permsSet).sort()

    return NextResponse.json({
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
        role: userRole,
        username: profile?.username || null,
        admissionNumber: profile?.admissionNumber || null,
        onboardingCompleted: profile?.onboardingCompleted ?? false,
      },
      role: userRole,
      permissions,
      isAuthenticated: true,
      profile: profile || null,
    })
  } catch (dbError) {
    return NextResponse.json(
      { user: null, role: null, permissions: [], isAuthenticated: false, error: 'Failed to resolve session' },
      { status: 500 }
    )
  }
}
