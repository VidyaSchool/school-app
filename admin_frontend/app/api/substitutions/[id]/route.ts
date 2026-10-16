import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { substitutionRecord, user, teacherProfiles, timetable } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, substituteTeacherId, mergedWithTimetableId, notes } = body as {
      action: 'assign' | 'merge' | 'unassign'
      substituteTeacherId?: string
      mergedWithTimetableId?: string
      notes?: string
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Substitution ID is required' }, { status: 400 })
    }

    // Verify existing record
    const existing = await db
      .select()
      .from(substitutionRecord)
      .where(eq(substitutionRecord.id, id))
      .then((res) => res[0])

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Substitution record not found' }, { status: 404 })
    }

    let updatedRecord: any

    if (action === 'assign') {
      if (!substituteTeacherId) {
        return NextResponse.json({ success: false, error: 'substituteTeacherId is required for assign action' }, { status: 400 })
      }

      await db
        .update(substitutionRecord)
        .set({
          substituteTeacherId,
          mergedWithTimetableId: null,
          status: 'MANUAL_OVERRIDE',
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(substitutionRecord.id, id))

      // Decrement the newly assigned teacher's daily_free_count and increment weekly_proxy_count
      try {
        await db
          .update(teacherProfiles)
          .set({
            weeklyProxyCount: sql`COALESCE(${teacherProfiles.weeklyProxyCount}, 0) + 1`,
            dailyFreeCount: sql`GREATEST(0, COALESCE(${teacherProfiles.dailyFreeCount}, 4) - 1)`,
          })
          .where(eq(teacherProfiles.userId, substituteTeacherId))
      } catch (err) {
        console.warn('Could not update teacher_profiles proxy counters:', err)
      }
    } else if (action === 'merge') {
      if (!mergedWithTimetableId) {
        return NextResponse.json({ success: false, error: 'mergedWithTimetableId is required for merge action' }, { status: 400 })
      }

      await db
        .update(substitutionRecord)
        .set({
          mergedWithTimetableId,
          substituteTeacherId: null,
          status: 'MERGED',
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(substitutionRecord.id, id))
    } else if (action === 'unassign') {
      await db
        .update(substitutionRecord)
        .set({
          substituteTeacherId: null,
          mergedWithTimetableId: null,
          status: 'UNASSIGNED',
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(substitutionRecord.id, id))
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 })
    }

    // Fetch updated record with relations
    const record = await db
      .select()
      .from(substitutionRecord)
      .where(eq(substitutionRecord.id, id))
      .then((res) => res[0])

    let substituteTeacher = null
    if (record?.substituteTeacherId) {
      substituteTeacher = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          wingId: teacherProfiles.wingId,
        })
        .from(user)
        .leftJoin(teacherProfiles, eq(user.id, teacherProfiles.userId))
        .where(eq(user.id, record.substituteTeacherId))
        .then((res) => res[0] || null)
    }

    let mergedWith = null
    if (record?.mergedWithTimetableId) {
      mergedWith = await db
        .select({
          timetableId: timetable.id,
          class: timetable.class,
          section: timetable.section,
          subject: timetable.subject,
          teacherName: user.name,
        })
        .from(timetable)
        .leftJoin(user, eq(timetable.teacherId, user.id))
        .where(eq(timetable.id, record.mergedWithTimetableId))
        .then((res) => res[0] || null)
    }

    return NextResponse.json({
      success: true,
      substitution: {
        id: record.id,
        status: record.status,
        substituteTeacher,
        mergedWith,
        notes: record.notes,
      },
    })
  } catch (error: any) {
    console.error('Error updating substitution:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update substitution' },
      { status: 500 }
    )
  }
}
