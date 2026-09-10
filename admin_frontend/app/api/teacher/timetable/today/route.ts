import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { timetable } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

const SUBJECT_COLORS = [
  {
    bg: "bg-violet-50/60 dark:bg-violet-500/5",
    border: "border-violet-200/50 dark:border-violet-500/20 border-l-violet-500 dark:border-l-violet-500 border-l-4",
    title: "text-violet-900 dark:text-violet-200",
    time: "text-violet-700/80 dark:text-violet-400/80",
  },
  {
    bg: "bg-sky-50/60 dark:bg-sky-500/5",
    border: "border-sky-200/50 dark:border-sky-500/20 border-l-sky-500 dark:border-l-sky-500 border-l-4",
    title: "text-sky-900 dark:text-sky-200",
    time: "text-sky-700/80 dark:text-sky-400/80",
  },
  {
    bg: "bg-amber-50/60 dark:bg-amber-500/5",
    border: "border-amber-200/50 dark:border-amber-500/20 border-l-amber-500 dark:border-l-amber-500 border-l-4",
    title: "text-amber-900 dark:text-amber-200",
    time: "text-amber-700/80 dark:text-amber-400/80",
  },
  {
    bg: "bg-emerald-50/60 dark:bg-emerald-500/5",
    border: "border-emerald-200/50 dark:border-emerald-500/20 border-l-emerald-500 dark:border-l-emerald-500 border-l-4",
    title: "text-emerald-900 dark:text-emerald-200",
    time: "text-emerald-700/80 dark:text-emerald-400/80",
  },
  {
    bg: "bg-rose-50/60 dark:bg-rose-500/5",
    border: "border-rose-200/50 dark:border-rose-500/20 border-l-rose-500 dark:border-l-rose-500 border-l-4",
    title: "text-rose-900 dark:text-rose-200",
    time: "text-rose-700/80 dark:text-rose-400/80",
  },
  {
    bg: "bg-indigo-50/60 dark:bg-indigo-500/5",
    border: "border-indigo-200/50 dark:border-indigo-500/20 border-l-indigo-500 dark:border-l-indigo-500 border-l-4",
    title: "text-indigo-900 dark:text-indigo-200",
    time: "text-indigo-700/80 dark:text-indigo-400/80",
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current day of week (e.g. 'Monday')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayDay = days[new Date().getDay()]

  try {
    const slots = await db
      .select()
      .from(timetable)
      .where(and(eq(timetable.teacherId, session.user.id), eq(timetable.dayOfWeek, todayDay)))
      .orderBy(timetable.startTime)

    // Map slots to CalendarEvents
    const events = slots.map((slot) => {
      const startParts = slot.startTime.split(':')
      const startHourNum = parseInt(startParts[0], 10)
      const startMinNum = parseInt(startParts[1], 10)
      
      // Calculate float hour offset from 8 AM
      const offsetHour = (startHourNum + startMinNum / 60) - 8
      
      // Calculate end float hour offset from start hour to see if it spans multiple columns
      const endParts = slot.endTime.split(':')
      const endHourNum = parseInt(endParts[0], 10)
      const endMinNum = parseInt(endParts[1], 10)
      const durationHours = (endHourNum + endMinNum / 60) - (startHourNum + startMinNum / 60)

      // Time formatting (e.g., 9:00 AM)
      const displayHour = startHourNum % 12 || 12
      const displayMin = String(startMinNum).padStart(2, '0')
      const ampm = startHourNum >= 12 ? 'PM' : 'AM'
      const timeStr = `${displayHour}:${displayMin} ${ampm}`

      return {
        hour: Math.floor(offsetHour), // match the grid column (0-indexed from 8 AM)
        title: `${slot.subject} (Class ${slot.class}-${slot.section})`,
        time: timeStr,
        color: getSubjectColor(slot.subject),
      }
    })

    return NextResponse.json({ events })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
