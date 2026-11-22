import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, userProfile } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
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
    })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(
      or(
        eq(user.email, q.trim()),
        eq(userProfile.username, q.trim())
      )
    )
    .limit(1)

    if (matchedUser.length > 0) {
      return NextResponse.json({ found: true, user: matchedUser[0] })
    } else {
      return NextResponse.json({ found: false })
    }
  } catch (error) {
    console.error('Error resolving user:', error)
    return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
  }
}
