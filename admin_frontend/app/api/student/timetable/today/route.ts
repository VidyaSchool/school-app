import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { timetable, userProfile, user } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

const SUBJECT_COLORS = [
  {
    bg: "bg-violet-50/60 dark:bg-violet-500/5",
    border: "border-violet-200/80 dark:border-violet-500/20",
    badgeBg: "bg-violet-100 dark:bg-violet-500/20",
    badgeText: "text-violet-700 dark:text-violet-300",
    timeBadgeBg: "bg-violet-100/70 dark:bg-violet-500/15",
    timeBadgeText: "text-violet-600 dark:text-violet-400",
  },
  {
    bg: "bg-blue-50/60 dark:bg-blue-500/5",
    border: "border-blue-200/80 dark:border-blue-500/20",
    badgeBg: "bg-blue-100 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    timeBadgeBg: "bg-blue-100/70 dark:bg-blue-500/15",
    timeBadgeText: "text-blue-600 dark:text-blue-400",
  },
  {
    bg: "bg-amber-50/60 dark:bg-amber-500/5",
    border: "border-amber-200/80 dark:border-amber-500/20",
    badgeBg: "bg-amber-100 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    timeBadgeBg: "bg-amber-100/70 dark:bg-amber-500/15",
    timeBadgeText: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-emerald-50/60 dark:bg-emerald-500/5",
    border: "border-emerald-200/80 dark:border-emerald-500/20",
    badgeBg: "bg-emerald-100 dark:bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    timeBadgeBg: "bg-emerald-100/70 dark:bg-emerald-500/15",
    timeBadgeText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    bg: "bg-rose-50/60 dark:bg-rose-500/5",
    border: "border-rose-200/80 dark:border-rose-500/20",
    badgeBg: "bg-rose-100 dark:bg-rose-500/20",
    badgeText: "text-rose-700 dark:text-rose-300",
    timeBadgeBg: "bg-rose-100/70 dark:bg-rose-500/15",
    timeBadgeText: "text-rose-600 dark:text-rose-400",
  },
]

function getSubjectColor(subject: string) {
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) % SUBJECT_COLORS.length
  }
  return SUBJECT_COLORS[hash]
}

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current day of week (e.g. 'Monday')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayDay = days[new Date().getDay()]

  try {
    // 1. Get student profile class/section
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id),
    })

    if (!profile || !profile.class || !profile.section) {
      return NextResponse.json({ events: [] })
    }

    const slots = await db
      .select({
        subject: timetable.subject,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        teacherName: user.name,
      })
      .from(timetable)
      .innerJoin(user, eq(timetable.teacherId, user.id))
      .where(
        and(
          eq(timetable.class, profile.class),
          eq(timetable.section, profile.section),
          eq(timetable.dayOfWeek, todayDay)
        )
      )
      .orderBy(timetable.startTime)

    // Map slots to CalendarEvents
    const events = slots.map((slot) => {
      const startParts = slot.startTime.split(':')
      const startHourNum = parseInt(startParts[0], 10)
      const startMinNum = parseInt(startParts[1], 10)
      
      // Calculate float hour offset from 8 AM
      const offsetHour = (startHourNum + startMinNum / 60) - 8

      // Time formatting (e.g., 9:00 AM)
      const displayHour = startHourNum % 12 || 12
      const displayMin = String(startMinNum).padStart(2, '0')
      const ampm = startHourNum >= 12 ? 'PM' : 'AM'
      const timeStr = `${displayHour}:${displayMin} ${ampm}`

      return {
        hour: Math.floor(offsetHour), // match the grid column (0-indexed from 8 AM)
        title: `${slot.subject} (by ${slot.teacherName})`,
        time: timeStr,
        color: getSubjectColor(slot.subject),
      }
    })

    return NextResponse.json({ events })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
