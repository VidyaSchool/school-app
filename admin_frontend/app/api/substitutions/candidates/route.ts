import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teacherAbsence, substitutionRecord, timetable, user, teacherProfiles } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const periodNumberStr = searchParams.get('periodNumber')
    const absentTeacherId = searchParams.get('absentTeacherId')
    const currentClass = searchParams.get('class') || ''
    const currentSubId = searchParams.get('substitutionId')

    if (!date || !periodNumberStr || !absentTeacherId) {
      return NextResponse.json(
        { success: false, error: 'date, periodNumber, and absentTeacherId are required parameters' },
        { status: 400 }
      )
    }

    const periodNumber = parseInt(periodNumberStr, 10)
    if (isNaN(periodNumber) || periodNumber < 1 || periodNumber > 8) {
      return NextResponse.json(
        { success: false, error: 'periodNumber must be between 1 and 8' },
        { status: 400 }
      )
    }

    const dt = new Date(`${date}T00:00:00`)
    const dayOfWeek = DAY_NAMES[dt.getDay()]

    // 1. Get absent teacher's wing_id
    const absentTeacherProfile = await db
      .select({
        wingId: teacherProfiles.wingId,
      })
      .from(teacherProfiles)
      .where(eq(teacherProfiles.userId, absentTeacherId))
      .then((res) => res[0])

    const targetWing = absentTeacherProfile?.wingId || 'General'

    // 2. Get all absent teacher IDs for this date
    const absences = await db
      .select({ teacherId: teacherAbsence.teacherId })
      .from(teacherAbsence)
      .where(eq(teacherAbsence.date, date))
    const absentTeacherIds = new Set(absences.map((a) => a.teacherId))

    // 3. Get all teachers with profiles
    const teachers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        wingId: teacherProfiles.wingId,
        dailyFreeCount: teacherProfiles.dailyFreeCount,
        weeklyProxyCount: teacherProfiles.weeklyProxyCount,
      })
      .from(user)
      .leftJoin(teacherProfiles, eq(user.id, teacherProfiles.userId))
      .where(eq(user.role, 'teacher'))

    const teacherMap = new Map<string, any>(teachers.map((t) => [t.id, t]))

    // 4. Get all timetable slots on this weekday for this period
    const periodTimetableSlots = await db
      .select({
        id: timetable.id,
        teacherId: timetable.teacherId,
        class: timetable.class,
        section: timetable.section,
        subject: timetable.subject,
      })
      .from(timetable)
      .where(
        and(
          sql`LOWER(${timetable.dayOfWeek}) = LOWER(${dayOfWeek})`,
          eq(timetable.periodNumber, periodNumber)
        )
      )

    const teachingTeacherIds = new Set(periodTimetableSlots.map((s) => s.teacherId))

    // 5. Get all substitutions on this date for this period to see who is already covering
    const activeSubstitutions = await db
      .select({
        id: substitutionRecord.id,
        substituteTeacherId: substitutionRecord.substituteTeacherId,
      })
      .from(substitutionRecord)
      .where(
        and(
          eq(substitutionRecord.date, date),
          eq(substitutionRecord.periodNumber, periodNumber)
        )
      )

    const alreadyAssignedSubIds = new Set<string>()
    for (const s of activeSubstitutions) {
      // Don't exclude the teacher if they are assigned to this specific substitution record
      if (s.substituteTeacherId && s.id !== currentSubId) {
        alreadyAssignedSubIds.add(s.substituteTeacherId)
      }
    }

    // ── Section 1: Available Standby Teachers ──
    // - Present (not in absentTeacherIds)
    // - Same wing_id
    // - Free in selected period (not in teachingTeacherIds)
    // - Not already assigned to another substitution in this period
    // - Not the absent teacher
    const standbyTeachers = teachers
      .filter((t) => {
        if (t.id === absentTeacherId) return false
        if (absentTeacherIds.has(t.id)) return false
        const tWing = t.wingId || 'General'
        if (tWing !== targetWing) return false
        if (teachingTeacherIds.has(t.id)) return false
        if (alreadyAssignedSubIds.has(t.id)) return false
        return true
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        image: t.image,
        wingId: t.wingId || 'General',
        dailyFreeCount: t.dailyFreeCount ?? 4,
        weeklyProxyCount: t.weeklyProxyCount ?? 0,
      }))
      // Sort order: Descending by daily_free_count, tie-broken ascending by weekly_proxy_count
      .sort((a, b) => {
        if (b.dailyFreeCount !== a.dailyFreeCount) {
          return b.dailyFreeCount - a.dailyFreeCount
        }
        return a.weeklyProxyCount - b.weeklyProxyCount
      })

    // ── Section 2: Merge Candidates ──
    // - Teachers present in that same period who are already teaching compatible classes (same grade/wing)
    // to facilitate combining sections (e.g. merging 12A with 12BC)
    const normalizeGrade = (cls: string) => cls.replace(/[^0-9]/g, '').trim()
    const targetGrade = normalizeGrade(currentClass)

    const mergeCandidates = periodTimetableSlots
      .filter((slot) => {
        if (slot.teacherId === absentTeacherId) return false
        if (absentTeacherIds.has(slot.teacherId)) return false
        const teacher = teacherMap.get(slot.teacherId)
        if (!teacher) return false
        const teacherWing = teacher.wingId || 'General'

        // Check compatibility: same wing AND (if grade is numeric, same grade level, or exact match)
        const slotGrade = normalizeGrade(slot.class)
        const isSameGrade = targetGrade && slotGrade ? targetGrade === slotGrade : slot.class.toLowerCase() === currentClass.toLowerCase()
        const isSameWing = teacherWing === targetWing

        return isSameWing && (isSameGrade || (!targetGrade && !slotGrade))
      })
      .map((slot) => {
        const teacher = teacherMap.get(slot.teacherId)
        return {
          timetableId: slot.id,
          teacherId: slot.teacherId,
          teacherName: teacher?.name || 'Faculty Member',
          teacherEmail: teacher?.email || '',
          class: slot.class,
          section: slot.section,
          subject: slot.subject,
          wingId: teacher?.wingId || 'General',
        }
      })

    return NextResponse.json({
      success: true,
      periodNumber,
      targetWing,
      standbyTeachers,
      mergeCandidates,
    })
  } catch (error: any) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidate teachers' },
      { status: 500 }
    )
  }
}
