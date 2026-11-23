import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { db } from '@/lib/db'
import { session as sessionTable } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const cookieStore = await cookies()
  const hdrs = await headers()

  const rawCookie = hdrs.get('cookie') || ''
  const cookieMatch = rawCookie.match(/(?:__Secure-better-auth\.session_token|better-auth\.session_token)=([^;]+)/)
  const tokenVal = cookieMatch ? cookieMatch[1] : null

  if (tokenVal) {
    const cleanToken = decodeURIComponent(tokenVal).split('.')[0]
    try {
      await db.delete(sessionTable).where(eq(sessionTable.token, cleanToken))
    } catch (e) {
      console.error('[logout route] Error deleting DB session:', e)
    }
  }

  // Delete cookies on server response
  const response = NextResponse.json({ success: true })
  
  response.cookies.set('better-auth.session_token', '', {
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  response.cookies.set('__Secure-better-auth.session_token', '', {
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  })

  return response
}
