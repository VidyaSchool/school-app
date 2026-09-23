import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.vidyaschool.com' : 'http://localhost:8000')
).replace(/\/+$/, '')

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Session not found' }, { status: 401 })
    }

    const body = await req.json()
    const {
      username,
      admissionNumber,
      phoneNumber,
      parentName,
      parentPhone,
      parentEmail,
      address,
      city,
      state,
      pincode,
      class: studentClass,
      section,
      transportMode,
      secondaryRole,
      designation,
      role,
    } = body

    const cleanUsername = (username || '').trim().toLowerCase()
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
      return NextResponse.json({ error: 'Invalid username format (3-15 alphanumeric characters)' }, { status: 400 })
    }

    // Check username collisions
    const existing = await db
      .select({ id: userProfile.id, userId: userProfile.userId })
      .from(userProfile)
      .where(eq(userProfile.username, cleanUsername))
      .limit(1)

    if (existing.length > 0 && existing[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    // Update user role / preferredRole in Better-Auth user table
    const targetRole = role || 'student'
    await db
      .update(userTable)
      .set({
        role: targetRole as any,
        preferredRole: targetRole,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id))

    // Upsert UserProfile record
    const existingProfile = await db
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(eq(userProfile.userId, session.user.id))
      .limit(1)

    const profileData = {
      username: cleanUsername,
      admissionNumber: admissionNumber?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      parentName: parentName?.trim() || null,
      parentPhone: parentPhone?.trim() || null,
      parentEmail: parentEmail?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      pincode: pincode?.trim() || null,
      class: studentClass || null,
      section: section || null,
      transportMode: transportMode || null,
      secondaryRole: secondaryRole || null,
      designation: designation || null,
      onboardingCompleted: true,
      updatedAt: new Date(),
    }

    if (existingProfile.length > 0) {
      await db
        .update(userProfile)
        .set(profileData)
        .where(eq(userProfile.userId, session.user.id))
    } else {
      await db.insert(userProfile).values({
        id: randomUUID(),
        userId: session.user.id,
        ...profileData,
        createdAt: new Date(),
      })
    }

    // Forward to FastAPI backend in the background for sync (non-blocking)
    try {
      const cookieHeader = req.headers.get('cookie') || ''
      const authHeader = req.headers.get('authorization') || ''
      fetch(`${BACKEND_URL}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cookie': cookieHeader,
          ...(authHeader && { 'authorization': authHeader }),
        },
        body: JSON.stringify({
          username: cleanUsername,
          preferredRole: targetRole,
          admissionNumber: admissionNumber?.trim() || undefined,
          phoneNumber: phoneNumber?.trim() || undefined,
          parentName: parentName?.trim() || undefined,
          parentPhone: parentPhone?.trim() || undefined,
          parentEmail: parentEmail?.trim() || undefined,
          address: address?.trim() || undefined,
          city: city?.trim() || undefined,
          state: state?.trim() || undefined,
          pincode: pincode?.trim() || undefined,
          class: studentClass || undefined,
          section: section || undefined,
          transportMode: transportMode || undefined,
        }),
      }).catch(() => {})
    } catch {}

    return NextResponse.json({ 
      success: true, 
      username: cleanUsername,
      role: targetRole,
    })
  } catch (error: any) {
    console.error('[/api/onboarding/complete] error:', error)
    return NextResponse.json({ error: error.message || 'Failed to complete profile' }, { status: 500 })
  }
}
