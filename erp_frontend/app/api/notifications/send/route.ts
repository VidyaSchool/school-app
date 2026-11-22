import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '')

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || !['teacher', 'librarian', 'admin'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const cookieHeader = req.headers.get('cookie') || ''

  // Use the DB session token from better-auth — not the signed cookie value.
  // The Python backend looks up session.token exactly; cookie values include a signature suffix.
  const sessionToken = session.session?.token
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session token available' }, { status: 401 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      const message =
        res.status === 503
          ? 'Backend is waking up (Render cold start). Wait ~30 seconds and try again.'
          : 'Backend returned an unexpected response.'
      return NextResponse.json({ detail: message }, { status: res.status || 502 })
    }

    console.log('[notifications/send] status:', res.status, 'response:', JSON.stringify(data))
    return NextResponse.json(data, { status: res.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[notifications/send] fetch failed:', message)
    return NextResponse.json(
      { detail: 'Could not reach the backend server. It may be starting up — try again shortly.' },
      { status: 503 }
    )
  }
}
