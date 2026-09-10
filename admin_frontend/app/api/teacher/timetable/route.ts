import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { timetable } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles = ['teacher', 'admin', 'librarian']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const data = await db
      .select()
      .from(timetable)
      .where(eq(timetable.teacherId, session.user.id))
      .orderBy(timetable.dayOfWeek, timetable.startTime)

    return NextResponse.json({ timetable: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles = ['teacher', 'admin', 'librarian']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { class: className, section, subject, dayOfWeek, startTime, endTime, room } = await req.json()

    if (!className || !section || !subject || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Optional conflict check: check if the teacher or class/section is already busy
    const existing = await db
      .select()
      .from(timetable)
      .where(
        and(
          eq(timetable.class, className),
          eq(timetable.section, section),
          eq(timetable.dayOfWeek, dayOfWeek),
          eq(timetable.startTime, startTime)
        )
      )

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Time conflict! This slot is already booked for this class.' }, { status: 409 })
    }

    const id = crypto.randomUUID()

    await db.insert(timetable).values({
      id,
      teacherId: session.user.id,
      class: className,
      section,
      subject,
      dayOfWeek,
      startTime,
      endTime,
      room: room || null,
    })

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles = ['teacher', 'admin', 'librarian']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing slot id' }, { status: 400 })
  }

  try {
    // Verify ownership
    const [entry] = await db
      .select()
      .from(timetable)
      .where(and(eq(timetable.id, id), eq(timetable.teacherId, session.user.id)))

    if (!entry) {
      return NextResponse.json({ error: 'Not found or permission denied' }, { status: 404 })
    }

    await db.delete(timetable).where(eq(timetable.id, id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
