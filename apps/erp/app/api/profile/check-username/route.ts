import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.toLowerCase().trim()
  if (!username) {
    return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 })
  }

  if (!/^[a-zA-Z0-9_-]{3,15}$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Must be 3-15 characters (letters, numbers, hyphens, underscores)' }, { status: 200 })
  }

  const reserved = ['admin', 'api', 'dashboard', 'login', 'signup', 'teacher', 'student', 'librarian', 'accounts', 'root', 'support', 'help', 'docs', 'public']
  if (reserved.includes(username)) {
    return NextResponse.json({ available: false, error: 'This username is reserved' }, { status: 200 })
  }

  try {
    const existing = await db
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(eq(userProfile.username, username))
      .limit(1)

    return NextResponse.json({ available: existing.length === 0 })
  } catch (err: any) {
    return NextResponse.json({ available: false, error: 'Lookup failed' }, { status: 500 })
  }
}
