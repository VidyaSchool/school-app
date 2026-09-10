import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function PATCH(req: NextRequest) {
  const hdrs = await headers()
  const cookieHeader = hdrs.get('cookie') || ''
  const authHeader = hdrs.get('authorization') || ''
  const body = await req.json()

  try {
    const res = await fetch(`${BACKEND_URL}/api/profile/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const errText = await res.text()
      let detail = errText
      try {
        const parsed = JSON.parse(errText)
        detail = parsed.detail || errText
      } catch {}
      return NextResponse.json({ error: detail }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[api/profile/update] FastAPI proxy error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
