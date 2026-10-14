import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teacherAbsence, substitutionRecord, timetable, user, teacherProfiles } from '@/lib/schema'
import { eq, and, sql, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Valid date (YYYY-MM-DD) query parameter is required' },
        { status: 400 }
      )
    }

    const dt = new Date(`${date}T00:00:00`)
    const dayOfWeek = DAY_NAMES[dt.getDay()]

    // 1. Fetch absent teachers on this date
    const absences = await db
      .select({
        id: teacherAbsence.id,
        teacherId: teacherAbsence.teacherId,
        date: teacherAbsence.date,
        status: teacherAbsence.status,
        reason: teacherAbsence.reason,
        duration: teacherAbsence.duration,
        remarks: teacherAbsence.remarks,
        teacherName: user.name,
        teacherEmail: user.email,
        teacherImage: user.image,
        wingId: teacherProfiles.wingId,
      })
      .from(teacherAbsence)
      .innerJoin(user, eq(teacherAbsence.teacherId, user.id))
      .leftJoin(teacherProfiles, eq(teacherAbsence.teacherId, teacherProfiles.userId))
      .where(eq(teacherAbsence.date, date))
      .orderBy(asc(user.name))

    // 2. Fetch all teachers for substitute lookup
    const allTeachers = await db
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

    const teacherMap = new Map<string, any>(allTeachers.map((t) => [t.id, t]))

    // 3. Fetch all timetable slots on this weekday for the absent teachers
    const absentTeacherIds = absences.map((a) => a.teacherId)
    const timetableSlots = absentTeacherIds.length > 0
      ? await db
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
          .where(
            and(
              sql`LOWER(${timetable.dayOfWeek}) = LOWER(${dayOfWeek})`,
              sql`${timetable.teacherId} IN ${absentTeacherIds}`
            )
          )
      : []

    // 4. Fetch all substitution records on this date
    const subRecords = await db
      .select()
      .from(substitutionRecord)
      .where(eq(substitutionRecord.date, date))

    // Also fetch merged timetable info if any mergedWithTimetableId exists
    const mergedTimetableIds = subRecords
      .map((s) => s.mergedWithTimetableId)
      .filter(Boolean) as string[]

    const mergedTimetableMap = new Map<string, any>()
    if (mergedTimetableIds.length > 0) {
      const mergedSlots = await db
        .select({
          id: timetable.id,
          class: timetable.class,
          section: timetable.section,
          subject: timetable.subject,
          teacherId: timetable.teacherId,
          teacherName: user.name,
        })
        .from(timetable)
        .leftJoin(user, eq(timetable.teacherId, user.id))
        .where(sql`${timetable.id} IN ${mergedTimetableIds}`)

      for (const m of mergedSlots) {
        mergedTimetableMap.set(m.id, m)
      }
    }

    // 5. Build structured matrix rows
    let totalSubstitutionsRequired = 0
    let autoAssignedCount = 0
    let manualOverrideCount = 0
    let mergedCount = 0
    let unassignedCount = 0

    const matrixRows = absences.map((abs) => {
      const periods = []

      for (let periodNum = 1; periodNum <= 8; periodNum++) {
        // Out of Scope logic for Half Day
        let isOutOfScope = false
        if (abs.duration === 'Half Day (Morning)' && periodNum >= 5) {
          isOutOfScope = true
        } else if (abs.duration === 'Half Day (Afternoon)' && periodNum <= 4) {
          isOutOfScope = true
        }

        if (isOutOfScope) {
          periods.push({
            periodNumber: periodNum,
            isOutOfScope: true,
            hasScheduledClass: false,
            timetableSlot: null,
            substitution: null,
          })
          continue
        }

        // Check if teacher had a scheduled class in this period
        const slot = timetableSlots.find(
          (s) => s.teacherId === abs.teacherId && s.periodNumber === periodNum
        )

        if (!slot) {
          // Empty state: teacher had no assigned class
          periods.push({
            periodNumber: periodNum,
            isOutOfScope: false,
            hasScheduledClass: false,
            timetableSlot: null,
            substitution: null,
          })
          continue
        }

        // Substitution required!
        totalSubstitutionsRequired++

        // Find matching substitution record
        const sub = subRecords.find(
          (s) =>
            s.originalTeacherId === abs.teacherId &&
            s.periodNumber === periodNum
        )

        let subData = null
        if (sub) {
          const substitute = sub.substituteTeacherId ? teacherMap.get(sub.substituteTeacherId) : null
          const mergedInfo = sub.mergedWithTimetableId ? mergedTimetableMap.get(sub.mergedWithTimetableId) : null

          if (sub.status === 'AUTO_ASSIGNED') autoAssignedCount++
          else if (sub.status === 'MANUAL_OVERRIDE') manualOverrideCount++
          else if (sub.status === 'MERGED') mergedCount++
          else unassignedCount++

          subData = {
            id: sub.id,
            status: sub.status, // AUTO_ASSIGNED | MANUAL_OVERRIDE | MERGED | UNASSIGNED
            substituteTeacher: substitute
              ? {
                  id: substitute.id,
                  name: substitute.name,
                  email: substitute.email,
                  image: substitute.image,
                  wingId: substitute.wingId || 'General',
                }
              : null,
            mergedWith: mergedInfo
              ? {
                  timetableId: mergedInfo.id,
                  class: mergedInfo.class,
                  section: mergedInfo.section,
                  subject: mergedInfo.subject,
                  teacherName: mergedInfo.teacherName,
                }
              : null,
            notes: sub.notes,
          }
        } else {
          unassignedCount++
        }

        periods.push({
          periodNumber: periodNum,
          isOutOfScope: false,
          hasScheduledClass: true,
          timetableSlot: {
            id: slot.id,
            class: slot.class,
            section: slot.section,
            subject: slot.subject,
          },
          substitution: subData,
        })
      }

      return {
        absenceId: abs.id,
        teacher: {
          id: abs.teacherId,
          name: abs.teacherName,
          email: abs.teacherEmail,
          image: abs.teacherImage,
          wingId: abs.wingId || 'General',
        },
        absence: {
          reason: abs.reason,
          duration: abs.duration,
          remarks: abs.remarks,
        },
        periods,
      }
    })

    return NextResponse.json({
      success: true,
      date,
      dayOfWeek,
      stats: {
        totalAbsent: absences.length,
        totalSubstitutionsRequired,
        autoAssignedCount,
        manualOverrideCount,
        mergedCount,
        unassignedCount,
      },
      absentTeachers: matrixRows,
    })
  } catch (error: any) {
    console.error('Error fetching substitutions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch substitutions matrix' },
      { status: 500 }
    )
  }
}
