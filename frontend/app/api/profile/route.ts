import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, session as sessionTable, userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.vidyaschool.com' : 'http://localhost:8000')
).replace(/\/+$/, '')

export async function GET(req: NextRequest) {
  try {
    let session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      const rawCookie =
        req.cookies.get('better-auth.session_token')?.value ||
        req.cookies.get('__Secure-better-auth.session_token')?.value
      if (rawCookie) {
        const cleanToken = rawCookie.split('.')[0]
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id),
    })

    return NextResponse.json({
      user: session.user,
      profile: profile || null,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const hdrs = await headers()
  const cookieHeader = hdrs.get('cookie') || ''
  const authHeader = hdrs.get('authorization') || ''
  const body = await req.json()

  // 1. Try FastAPI backend if reachable with a short timeout to prevent slow UI hangs
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    const res = await fetch(`${BACKEND_URL}/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
        ...(authHeader && { authorization: authHeader }),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }

    // If backend returns client validation error (400-499), preserve it
    if (res.status >= 400 && res.status < 500) {
      const errText = await res.text()
      let detail = errText
      try {
        const parsed = JSON.parse(errText)
        detail = parsed.detail || parsed.error || errText
      } catch {}
      return NextResponse.json({ error: detail }, { status: res.status })
    }
  } catch (error: any) {
    // Backend offline / connection refused / timeout -> fallback to direct PostgreSQL via Drizzle
  }

  // 2. Direct Drizzle DB Fallback (PostgreSQL)
  try {
    let session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      const rawCookie =
        req.cookies.get('better-auth.session_token')?.value ||
        req.cookies.get('__Secure-better-auth.session_token')?.value
      if (rawCookie) {
        const cleanToken = rawCookie.split('.')[0]
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingProfile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, session.user.id))
      .then((res) => res[0])

    // Validate username if provided
    let cleanUsername = existingProfile?.username || null
    if (body.username) {
      cleanUsername = String(body.username).trim().toLowerCase()
      if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
        return NextResponse.json(
          { error: 'Username must be 3-15 alphanumeric characters' },
          { status: 400 }
        )
      }

      const existingUserWithUsername = await db
        .select({ userId: userProfile.userId })
        .from(userProfile)
        .where(eq(userProfile.username, cleanUsername))
        .limit(1)
        .then((res) => res[0])

      if (existingUserWithUsername && existingUserWithUsername.userId !== session.user.id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    // Check annual class & section update limitation
    const newClass = body.class !== undefined ? body.class : undefined
    const newSection = body.section !== undefined ? body.section : undefined
    let classSectionLastUpdated = existingProfile?.classSectionLastUpdated

    if (
      existingProfile &&
      ((newClass !== undefined && newClass !== existingProfile.class) ||
        (newSection !== undefined && newSection !== existingProfile.section))
    ) {
      if (existingProfile.classSectionLastUpdated) {
        const diffDays =
          (Date.now() - new Date(existingProfile.classSectionLastUpdated).getTime()) /
          (1000 * 60 * 60 * 24)
        if (diffDays < 365) {
          const nextAllowed = new Date(
            new Date(existingProfile.classSectionLastUpdated).getTime() + 365 * 24 * 60 * 60 * 1000
          )
          return NextResponse.json(
            {
              error: `You can only change your class and section once a year. Next change allowed after ${
                nextAllowed.toISOString().split('T')[0]
              }`,
            },
            { status: 400 }
          )
        }
      }
      classSectionLastUpdated = new Date()
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (cleanUsername) updateData.username = cleanUsername
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber?.trim() || null
    if (body.parentName !== undefined) updateData.parentName = body.parentName?.trim() || null
    if (body.parentPhone !== undefined) updateData.parentPhone = body.parentPhone?.trim() || null
    if (body.parentEmail !== undefined) updateData.parentEmail = body.parentEmail?.trim() || null
    if (body.address !== undefined) updateData.address = body.address?.trim() || null
    if (body.city !== undefined) updateData.city = body.city?.trim() || null
    if (body.state !== undefined) updateData.state = body.state?.trim() || null
    if (body.pincode !== undefined) updateData.pincode = body.pincode?.trim() || null
    if (body.secondaryRole !== undefined) updateData.secondaryRole = body.secondaryRole || null
    if (body.transportMode !== undefined) updateData.transportMode = body.transportMode || null
    if (newClass !== undefined) updateData.class = newClass
    if (newSection !== undefined) updateData.section = newSection
    if (classSectionLastUpdated !== undefined) updateData.classSectionLastUpdated = classSectionLastUpdated

    if (existingProfile) {
      await db.update(userProfile).set(updateData).where(eq(userProfile.userId, session.user.id))
    } else {
      await db.insert(userProfile).values({
        id: randomUUID(),
        userId: session.user.id,
        onboardingCompleted: true,
        ...updateData,
      })
    }

    // If user's name is modified, update in user table as well
    if (body.name && typeof body.name === 'string' && body.name.trim()) {
      await db
        .update(userTable)
        .set({ name: body.name.trim(), updatedAt: new Date() })
        .where(eq(userTable.id, session.user.id))
    }

    return NextResponse.json({
      success: true,
      newUsername: cleanUsername || existingProfile?.username,
    })
  } catch (dbError: any) {
    console.error('[api/profile] Drizzle fallback error:', dbError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
