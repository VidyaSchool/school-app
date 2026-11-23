import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teacherAbsence, substitutionRecord, timetable, user, teacherProfiles } from '@/lib/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

interface BatchAbsenceItem {
  teacherId: string
  reason: string
  duration: string
  notes?: string
}

const VALID_REASONS = [
  'Sick Leave',
  'Casual Leave',
  'Emergency Leave',
  'Official Duty',
  'Half Day',
  'Unannounced',
]

const VALID_DURATIONS = [
  'Full Day',
  'Half Day (Morning)',
  'Half Day (Afternoon)',
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getAffectedPeriods(duration: string): number[] {
  if (duration === 'Half Day (Morning)') {
    return [1, 2, 3, 4]
  }
  if (duration === 'Half Day (Afternoon)') {
    return [5, 6, 7, 8]
  }
  return [1, 2, 3, 4, 5, 6, 7, 8]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, absences } = body as { date: string; absences: BatchAbsenceItem[] }

    // 1. Validations
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing date (expected YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    if (!Array.isArray(absences) || absences.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one absent teacher must be specified' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const teacherIds = absences.map((a) => a.teacherId?.trim()).filter(Boolean)
    if (new Set(teacherIds).size !== absences.length) {
      return NextResponse.json(
        { success: false, error: 'Duplicate teacher found in batch list. Each teacher can only be marked once per date.' },
        { status: 400 }
      )
    }

    // Validate each row
    for (const item of absences) {
      if (!item.teacherId) {
        return NextResponse.json(
          { success: false, error: 'Every row must have a teacher selected' },
          { status: 400 }
        )
      }
      if (!item.reason || !VALID_REASONS.includes(item.reason)) {
        return NextResponse.json(
          { success: false, error: `Invalid reason for teacher: ${item.reason}` },
          { status: 400 }
        )
      }
      if (!item.duration || !VALID_DURATIONS.includes(item.duration)) {
        return NextResponse.json(
          { success: false, error: `Invalid duration for teacher: ${item.duration}` },
          { status: 400 }
        )
      }
    }

    // Determine day of week
    const dt = new Date(`${date}T00:00:00`)
    const dayOfWeek = DAY_NAMES[dt.getDay()]

    // 2. Persist records into teacher_absence
    const insertedAbsences = []
    for (const item of absences) {
      // Remove any existing absence record for this teacher on this date
      await db
        .delete(teacherAbsence)
        .where(and(eq(teacherAbsence.teacherId, item.teacherId), eq(teacherAbsence.date, date)))

      const absenceId = `abs_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
      await db.insert(teacherAbsence).values({
        id: absenceId,
        teacherId: item.teacherId,
        date: date,
        status: 'absent',
        reason: item.reason,
        duration: item.duration,
        remarks: item.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      insertedAbsences.push({
        id: absenceId,
        teacherId: item.teacherId,
        reason: item.reason,
        duration: item.duration,
        affectedPeriods: getAffectedPeriods(item.duration),
      })
    }

    // 3. Clear previous substitution_records for these absent teachers on this date
    for (const item of absences) {
      await db
        .delete(substitutionRecord)
        .where(
          and(
            eq(substitutionRecord.date, date),
            eq(substitutionRecord.originalTeacherId, item.teacherId)
          )
        )
    }

    // 4. Run auto-assignment proxy algorithm
    // Fetch all absent teacher IDs for this date (including previously saved ones)
    const allAbsencesOnDate = await db
      .select({ teacherId: teacherAbsence.teacherId })
      .from(teacherAbsence)
      .where(eq(teacherAbsence.date, date))
    const absentTeacherIdsSet = new Set(allAbsencesOnDate.map((a) => a.teacherId))

    // Fetch all teachers with profiles
    const allTeachers = await db
      .select({
        id: user.id,
        name: user.name,
        wingId: teacherProfiles.wingId,
        dailyFreeCount: teacherProfiles.dailyFreeCount,
        weeklyProxyCount: teacherProfiles.weeklyProxyCount,
      })
      .from(user)
      .leftJoin(teacherProfiles, eq(user.id, teacherProfiles.userId))
      .where(eq(user.role, 'teacher'))

    const teacherMap = new Map<string, any>(allTeachers.map((t) => [t.id, t]))

    // Fetch all timetable slots on this weekday for all teachers
    const allSlotsToday = await db
      .select({
        id: timetable.id,
        teacherId: timetable.teacherId,
        class: timetable.class,
        section: timetable.section,
        subject: timetable.subject,
        dayOfWeek: timetable.dayOfWeek,
        periodNumber: timetable.periodNumber,
      })
      .from(timetable)
      .where(sql`LOWER(${timetable.dayOfWeek}) = LOWER(${dayOfWeek})`)

    // Build map of period busy status: teacherId -> Set of busy periodNumbers
    const teacherBusyPeriods = new Map<string, Set<number>>()
    for (const slot of allSlotsToday) {
      if (!teacherBusyPeriods.has(slot.teacherId)) {
        teacherBusyPeriods.set(slot.teacherId, new Set())
      }
      teacherBusyPeriods.get(slot.teacherId)!.add(slot.periodNumber)
    }

    // Track assigned substitutes per period for this date
    // First, seed with existing substitutions on this date for other teachers
    const existingSubsOnDate = await db
      .select({
        periodNumber: substitutionRecord.periodNumber,
        substituteTeacherId: substitutionRecord.substituteTeacherId,
      })
      .from(substitutionRecord)
      .where(eq(substitutionRecord.date, date))

    const assignedSubstitutesInPeriod = new Map<number, Set<string>>()
    for (let p = 1; p <= 8; p++) {
      assignedSubstitutesInPeriod.set(p, new Set<string>())
    }
    for (const sub of existingSubsOnDate) {
      if (sub.substituteTeacherId && sub.periodNumber) {
        if (!assignedSubstitutesInPeriod.has(sub.periodNumber)) {
          assignedSubstitutesInPeriod.set(sub.periodNumber, new Set())
        }
        assignedSubstitutesInPeriod.get(sub.periodNumber)!.add(sub.substituteTeacherId)
      }
    }

    // For each absent teacher in this batch:
    let totalSubstitutionsGenerated = 0

    for (const abs of insertedAbsences) {
      const absentTeacherInfo = teacherMap.get(abs.teacherId)
      const targetWing = absentTeacherInfo?.wingId || 'General'

      // Timetable slots of this absent teacher on this weekday
      const teacherSlots = allSlotsToday.filter((s) => s.teacherId === abs.teacherId)

      for (const periodNum of abs.affectedPeriods) {
        // Find if absent teacher had a class in this period
        const slot = teacherSlots.find((s) => s.periodNumber === periodNum)
        if (!slot) {
          // No class assigned in this period -> no substitution required
          continue
        }

        // Available Standby Teachers:
        // 1. Present (not in absentTeacherIdsSet)
        // 2. Same wing_id
        // 3. Not teaching in this period
        // 4. Not already assigned as substitute in this period
        // 5. Not the absent teacher
        const candidates = allTeachers.filter((cand) => {
          if (cand.id === abs.teacherId) return false
          if (absentTeacherIdsSet.has(cand.id)) return false
          const candWing = cand.wingId || 'General'
          if (candWing !== targetWing) return false
          const isTeaching = teacherBusyPeriods.get(cand.id)?.has(periodNum)
          if (isTeaching) return false
          const isAlreadySub = assignedSubstitutesInPeriod.get(periodNum)?.has(cand.id)
          if (isAlreadySub) return false
          return true
        })

        // Sort candidates:
        // Descending by dailyFreeCount, tie-broken ascending by weeklyProxyCount
        candidates.sort((a, b) => {
          const freeA = a.dailyFreeCount ?? 4
          const freeB = b.dailyFreeCount ?? 4
          if (freeB !== freeA) {
            return freeB - freeA
          }
          const proxyA = a.weeklyProxyCount ?? 0
          const proxyB = b.weeklyProxyCount ?? 0
          return proxyA - proxyB
        })

        const bestCand = candidates[0] || null
        const status = bestCand ? 'AUTO_ASSIGNED' : 'UNASSIGNED'
        const substituteId = bestCand ? bestCand.id : null

        if (bestCand) {
          assignedSubstitutesInPeriod.get(periodNum)!.add(bestCand.id)
        }

        const subRecordId = `sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
        await db.insert(substitutionRecord).values({
          id: subRecordId,
          date: date,
          absenceId: abs.id,
          timetableId: slot.id,
          class: slot.class,
          section: slot.section,
          subject: slot.subject || '',
          room: null,
          originalTeacherId: abs.teacherId,
          substituteTeacherId: substituteId,
          status: status,
          isActivityFallback: false,
          activityName: null,
          suitabilityScore: null,
          scoreBreakdown: null,
          notes: null,
          periodNumber: periodNum,
          mergedWithTimetableId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        totalSubstitutionsGenerated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Persisted ${insertedAbsences.length} absences and generated ${totalSubstitutionsGenerated} initial substitutions`,
      count: insertedAbsences.length,
      substitutionsGenerated: totalSubstitutionsGenerated,
      date: date,
    })
  } catch (error: any) {
    console.error('Error in POST /api/absences/batch:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while processing batch absences' },
      { status: 500 }
    )
  }
}
