import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { timetable } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Try fetching from Python FastAPI backend
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
  try {
    const cookie = hdrs.get('cookie') || ''
    const res = await fetch(`${backendUrl}/api/teacher/calendar`, {
      headers: { cookie },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (e) {
    // Fall back to database query below
  }

  // 2. Fallback to direct Drizzle DB query
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const now = new Date()
  const todayDay = days[now.getDay()]
  const tomorrowDay = days[(now.getDay() + 1) % 7]

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const todayFormatted = `${todayDay.toUpperCase()}, ${months[now.getMonth()]} ${now.getDate()}`

  try {
    const todaySlots = await db
      .select()
      .from(timetable)
      .where(and(eq(timetable.teacherId, session.user.id), eq(timetable.dayOfWeek, todayDay)))
      .orderBy(timetable.startTime)

    const tomorrowSlots = await db
      .select()
      .from(timetable)
      .where(and(eq(timetable.teacherId, session.user.id), eq(timetable.dayOfWeek, tomorrowDay)))
      .orderBy(timetable.startTime)

    const formatTime = (timeStr: string) => {
      const parts = timeStr.split(':')
      if (parts.length < 2) return timeStr
      let h = parseInt(parts[0], 10)
      const m = parts[1]
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      return `${h}:${m} ${ampm}`
    }

    return NextResponse.json({
      todayDateStr: todayFormatted,
      todayEvents: todaySlots.map((s) => ({
        id: s.id,
        title: `${s.subject} (${s.class}-${s.section})`,
        time: formatTime(s.startTime),
        room: s.room || '',
      })),
      tomorrowEvents: tomorrowSlots.map((s) => ({
        id: s.id,
        title: `${s.subject} (${s.class}-${s.section})`,
        time: formatTime(s.startTime),
        room: s.room || '',
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
