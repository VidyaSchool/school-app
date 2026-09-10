import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { timetable, userProfile, user } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get student profile class/section
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id),
    })

    if (!profile || !profile.class || !profile.section) {
      return NextResponse.json({ timetable: [], message: 'No class/section assigned to your profile.' })
    }

    // 2. Fetch timetable slots with teacher name
    const slots = await db
      .select({
        id: timetable.id,
        class: timetable.class,
        section: timetable.section,
        subject: timetable.subject,
        dayOfWeek: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
        teacherName: user.name,
      })
      .from(timetable)
      .innerJoin(user, eq(timetable.teacherId, user.id))
      .where(
        and(
          eq(timetable.class, profile.class),
          eq(timetable.section, profile.section)
        )
      )
      .orderBy(timetable.dayOfWeek, timetable.startTime)

    return NextResponse.json({ timetable: slots })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
