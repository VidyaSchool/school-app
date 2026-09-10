import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, session as sessionTable, userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function GET(req: NextRequest) {
  const hdrs = await headers()
  const cookieHeader = hdrs.get('cookie') || ''
  const authHeader = hdrs.get('authorization') || ''

  try {
    const res = await fetch(`${BACKEND_URL}/api/account`, {
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
      cache: 'no-store'
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (error: any) {
    // FastAPI error/offline -> proceed to fast local Drizzle DB fallback
  }

  // Fast Local Drizzle DB Fallback
  try {
    let session = await auth.api.getSession({
      headers: req.headers
    })

    if (!session?.user) {
      const rawCookie = req.cookies.get('better-auth.session_token')?.value || 
                        req.cookies.get('__Secure-better-auth.session_token')?.value
      if (rawCookie) {
        const cleanToken = rawCookie.split('.')[0]
        const dbSession = await db.select().from(sessionTable).where(eq(sessionTable.token, cleanToken)).then(res => res[0])
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db.select().from(userTable).where(eq(userTable.id, dbSession.userId)).then(res => res[0])
          if (dbUser) {
            session = { user: dbUser, session: dbSession }
          }
        }
      }
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id)
    })

    return NextResponse.json({
      user: session.user,
      profile: profile || {
        userId: session.user.id,
        onboardingCompleted: false,
        username: null
      }
    })
  } catch (dbError) {
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
  }
}

