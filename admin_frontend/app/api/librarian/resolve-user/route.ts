import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, userProfile, libraryBookIssue } from '@/lib/schema'
import { eq, or, and } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req)
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  if (!q.trim()) {
    return NextResponse.json({ found: false })
  }

  try {
    const matchedUser = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: userProfile.username,
      admissionNumber: userProfile.admissionNumber,
      class: userProfile.class,
      section: userProfile.section,
    })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(
      or(
        eq(user.email, q.trim()),
        eq(userProfile.username, q.trim()),
        eq(userProfile.admissionNumber, q.trim())
      )
    )
    .limit(1)

    if (matchedUser.length > 0) {
      const u = matchedUser[0]
      const issues = await db.select()
        .from(libraryBookIssue)
        .where(
          and(
            eq(libraryBookIssue.userId, u.id),
            eq(libraryBookIssue.status, 'active')
          )
        )
      const now = new Date()
      const activeCount = issues.length
      const overdueCount = issues.filter(iss => new Date(iss.dueDate) < now).length
      const canBorrow = activeCount < 5 && overdueCount === 0

      return NextResponse.json({
        found: true,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          username: u.username,
          admissionNumber: u.admissionNumber,
          class: u.class,
          section: u.section,
          activeLoansCount: activeCount,
          overdueLoansCount: overdueCount,
          canBorrow
        }
      })
    } else {
      return NextResponse.json({ found: false })
    }
  } catch (error) {
    console.error('Error resolving user:', error)
    return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
  }
}
