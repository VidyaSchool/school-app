import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { session as sessionTable } from '@/lib/schema'
import { eq, ne, and, isNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  
  if (!currentSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeSessions = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.userId, currentSession.user.id))

  const reqHeaders = await headers()
  const currentIp = reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || reqHeaders.get('x-real-ip') || null

  // Map and clean up session fields
  const formattedSessions = activeSessions.map((sess) => {
    const isCurrent = sess.id === currentSession.session.id
    return {
      ...sess,
      ipAddress: sess.ipAddress || (isCurrent ? currentIp : null),
      userAgent: sess.userAgent || (isCurrent ? reqHeaders.get('user-agent') : 'VidyaSchool Mobile App'),
    }
  })

  // Group sessions by unique device (userAgent + ipAddress) to avoid repetition
  const uniqueSessions: typeof formattedSessions = []
  const seen = new Set<string>()

  // Always keep the current session first
  for (const sess of formattedSessions) {
    const isCurrent = sess.id === currentSession.session.id
    const key = `${sess.userAgent || ''}-${sess.ipAddress || ''}`
    
    if (isCurrent) {
      uniqueSessions.push(sess)
      seen.add(key)
    }
  }

  // Add other sessions only if they represent a different device
  for (const sess of formattedSessions) {
    const isCurrent = sess.id === currentSession.session.id
    if (isCurrent) continue
    
    const key = `${sess.userAgent || ''}-${sess.ipAddress || ''}`
    if (!seen.has(key)) {
      uniqueSessions.push(sess)
      seen.add(key)
    }
  }

  return NextResponse.json({
    currentSessionId: currentSession.session.id,
    sessions: uniqueSessions,
  })
}

export async function DELETE(req: NextRequest) {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  
  if (!currentSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const targetSessionId = searchParams.get('id')

  if (targetSessionId === 'other') {
    // Revoke all other sessions (logout from other devices)
    await db
      .delete(sessionTable)
      .where(
        and(
          eq(sessionTable.userId, currentSession.user.id),
          ne(sessionTable.id, currentSession.session.id)
        )
      )
    return NextResponse.json({ success: true, message: 'Logged out of all other devices' })
  }

  if (!targetSessionId) {
    return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
  }

  // Get the target session to identify its device (userAgent and ipAddress)
  const targetSession = await db
    .select()
    .from(sessionTable)
    .where(
      and(
        eq(sessionTable.id, targetSessionId),
        eq(sessionTable.userId, currentSession.user.id)
      )
    )
    .then((res) => res[0])

  if (!targetSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Revoke all sessions matching this device (same userAgent and ipAddress)
  await db
    .delete(sessionTable)
    .where(
      and(
        eq(sessionTable.userId, currentSession.user.id),
        targetSession.userAgent ? eq(sessionTable.userAgent, targetSession.userAgent) : isNull(sessionTable.userAgent),
        targetSession.ipAddress ? eq(sessionTable.ipAddress, targetSession.ipAddress) : isNull(sessionTable.ipAddress)
      )
    )

  return NextResponse.json({ success: true, message: 'Session revoked' })
}
