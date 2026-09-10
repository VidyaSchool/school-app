import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, session as sessionTable, userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
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

    const fallbackUsername = session.user.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'

    return NextResponse.json({ 
      username: profile?.username || null,
      onboardingCompleted: profile?.onboardingCompleted ?? false,
      role: (session.user as any).role || 'student'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
