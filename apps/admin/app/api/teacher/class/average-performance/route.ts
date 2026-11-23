import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  subjectClassAssignment,
  userProfile,
  exam,
  studentSubjectMarks,
  user,
} from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/teacher/class/average-performance
 *
 * Returns class average performance stats for the authenticated teacher's
 * assigned class. Used by the teacher dashboard "Total Visitors" / score chart.
 *
 * Response shape:
 * {
 *   class: string,
 *   section: string,
 *   totalStudents: number,
 *   overallAverage: number,          // 0-100
 *   subjectAverages: { subject: string; average: number }[],
 *   examAverages: { exam: string; average: number; date: string }[],
 *   chartData: { exam: string; average: number }[],  // ready for ChartAreaInteractive
 * }
 */
export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles = ['teacher', 'admin', 'librarian']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const teacherId = session.user.id

  try {
    // ── 1. Find the teacher's primary class assignment ────────────────────
    const assignments = await db
      .select({
        class: subjectClassAssignment.class,
        section: subjectClassAssignment.section,
        subject: subjectClassAssignment.subject,
      })
      .from(subjectClassAssignment)
      .where(eq(subjectClassAssignment.teacherId, teacherId))

    if (assignments.length === 0) {
      return NextResponse.json({
        class: null,
        section: null,
        totalStudents: 0,
        overallAverage: 0,
        subjectAverages: [],
        examAverages: [],
        chartData: [],
        message: 'No class assignment found for this teacher.',
      })
    }

    // Use the first assignment's class & section (primary class)
    const { class: teacherClass, section: teacherSection } = assignments[0]

    // ── 2. Find all students in that class/section ────────────────────────
    const classStudents = await db
      .select({ userId: userProfile.userId })
      .from(userProfile)
      .innerJoin(user, eq(userProfile.userId, user.id))
      .where(
        and(
          eq(userProfile.class, teacherClass),
          eq(userProfile.section, teacherSection),
          eq(user.role, 'student')
        )
      )

    const totalStudents = classStudents.length

    if (totalStudents === 0) {
      return NextResponse.json({
        class: teacherClass,
        section: teacherSection,
        totalStudents: 0,
        overallAverage: 0,
        subjectAverages: [],
        examAverages: [],
        chartData: [],
        message: 'No students found in this class.',
      })
    }

    const studentIds = classStudents.map((s) => s.userId)

    // ── 3. Get all exam marks for students in this class ─────────────────
    //    Join: studentSubjectMarks → exam (to get exam name & date)
    //    Filter by studentIds that belong to this class
    const marksRows = await db
      .select({
        studentId: studentSubjectMarks.studentId,
        subject: studentSubjectMarks.subject,
        score: studentSubjectMarks.score,
        maxScore: studentSubjectMarks.maxScore,
        examId: studentSubjectMarks.examId,
        examName: exam.name,
        examCreatedAt: exam.createdAt,
      })
      .from(studentSubjectMarks)
      .innerJoin(exam, eq(studentSubjectMarks.examId, exam.id))
      .where(
        and(
          eq(exam.class, teacherClass),
          eq(exam.section, teacherSection)
        )
      )

    // Filter to only marks belonging to students of this class
    const filteredMarks = marksRows.filter((m) =>
      studentIds.includes(m.studentId)
    )

    if (filteredMarks.length === 0) {
      return NextResponse.json({
        class: teacherClass,
        section: teacherSection,
        totalStudents,
        overallAverage: 0,
        subjectAverages: [],
        examAverages: [],
        chartData: [],
        message: 'No exam scores recorded yet.',
      })
    }

    // ── 4. Compute overall average (percentage) ───────────────────────────
    const totalScore = filteredMarks.reduce((sum, m) => sum + m.score, 0)
    const totalMax = filteredMarks.reduce((sum, m) => sum + m.maxScore, 0)
    const overallAverage =
      totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

    // ── 5. Per-subject averages ────────────────────────────────────────────
    const subjectMap = new Map<string, { totalScore: number; totalMax: number }>()
    for (const m of filteredMarks) {
      const existing = subjectMap.get(m.subject) ?? { totalScore: 0, totalMax: 0 }
      subjectMap.set(m.subject, {
        totalScore: existing.totalScore + m.score,
        totalMax: existing.totalMax + m.maxScore,
      })
    }
    const subjectAverages = Array.from(subjectMap.entries()).map(
      ([subject, { totalScore, totalMax }]) => ({
        subject,
        average: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
      })
    )

    // ── 6. Per-exam averages (for chart) ──────────────────────────────────
    const examMap = new Map<
      string,
      { examName: string; totalScore: number; totalMax: number; date: Date }
    >()
    for (const m of filteredMarks) {
      const existing = examMap.get(m.examId) ?? {
        examName: m.examName,
        totalScore: 0,
        totalMax: 0,
        date: m.examCreatedAt,
      }
      examMap.set(m.examId, {
        examName: m.examName,
        totalScore: existing.totalScore + m.score,
        totalMax: existing.totalMax + m.maxScore,
        date: m.examCreatedAt,
      })
    }

    const examAverages = Array.from(examMap.values())
      .map(({ examName, totalScore, totalMax, date }) => ({
        exam: examName,
        average: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
        date: date.toISOString(),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Chart-ready data: { date, average } keyed by exam date for ChartAreaInteractive
    const chartData = examAverages.map((e) => ({
      date: e.date.split('T')[0], // YYYY-MM-DD
      average: e.average,
      exam: e.exam,
    }))

    return NextResponse.json({
      class: teacherClass,
      section: teacherSection,
      totalStudents,
      overallAverage,
      subjectAverages,
      examAverages,
      chartData,
    })
  } catch (error: any) {
    console.error('[teacher/class/average-performance] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
