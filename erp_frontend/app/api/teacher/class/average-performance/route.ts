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

export const dynamic = 'force-dynamic'

export interface ClassPerformanceData {
  class: string | null
  section: string | null
  totalStudents: number
  overallAverage: number
  subjectAverages: { subject: string; average: number }[]
  examAverages: { exam: string; average: number; highest: number; date: string }[]
  chartData: { date: string; exam: string; average: number; highest: number }[]
  message?: string
}

export async function getClassAveragePerformanceData(
  teacherId: string
): Promise<ClassPerformanceData> {
  // 1. Find the teacher's primary class assignment
  let teacherClass: string | null = null
  let teacherSection: string | null = null

  const assignments = await db
    .select({
      class: subjectClassAssignment.class,
      section: subjectClassAssignment.section,
      subject: subjectClassAssignment.subject,
    })
    .from(subjectClassAssignment)
    .where(eq(subjectClassAssignment.teacherId, teacherId))

  if (assignments.length > 0) {
    teacherClass = assignments[0].class
    teacherSection = assignments[0].section
  } else {
    // Fallback to teacher's own profile class & section
    const teacherProf = await db
      .select({
        class: userProfile.class,
        section: userProfile.section,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, teacherId))
      .then((res) => res[0])

    if (teacherProf?.class) {
      teacherClass = teacherProf.class
      teacherSection = teacherProf.section || 'A'
    }
  }

  if (!teacherClass || !teacherSection) {
    return {
      class: null,
      section: null,
      totalStudents: 0,
      overallAverage: 0,
      subjectAverages: [],
      examAverages: [],
      chartData: [],
      message: 'No class assignment found for this teacher.',
    }
  }

  // 2. Find all students in that class/section
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
    return {
      class: teacherClass,
      section: teacherSection,
      totalStudents: 0,
      overallAverage: 0,
      subjectAverages: [],
      examAverages: [],
      chartData: [],
      message: 'No students found in this class.',
    }
  }

  const studentIds = classStudents.map((s) => s.userId)

  // 3. Get all exam marks for students in this class
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

  const filteredMarks = marksRows.filter((m) =>
    studentIds.includes(m.studentId)
  )

  if (filteredMarks.length === 0) {
    return {
      class: teacherClass,
      section: teacherSection,
      totalStudents,
      overallAverage: 0,
      subjectAverages: [],
      examAverages: [],
      chartData: [],
      message: 'No exam scores recorded yet.',
    }
  }

  // 4. Compute overall average (percentage)
  const totalScore = filteredMarks.reduce((sum, m) => sum + m.score, 0)
  const totalMax = filteredMarks.reduce((sum, m) => sum + m.maxScore, 0)
  const overallAverage =
    totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

  // 5. Per-subject averages
  const subjectMap = new Map<string, { totalScore: number; totalMax: number }>()
  for (const m of filteredMarks) {
    const existing = subjectMap.get(m.subject) ?? { totalScore: 0, totalMax: 0 }
    subjectMap.set(m.subject, {
      totalScore: existing.totalScore + m.score,
      totalMax: existing.totalMax + m.maxScore,
    })
  }

  const subjectAverages = Array.from(subjectMap.entries())
    .map(([subject, { totalScore, totalMax }]) => ({
      subject,
      average: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
    }))
    .sort((a, b) => b.average - a.average)

  // 6. Per-exam averages & highest scores
  const examMap = new Map<
    string,
    { examName: string; totalScore: number; totalMax: number; highest: number; date: Date }
  >()

  for (const m of filteredMarks) {
    const pct = m.maxScore > 0 ? Math.round((m.score / m.maxScore) * 100) : 0
    const existing = examMap.get(m.examId) ?? {
      examName: m.examName,
      totalScore: 0,
      totalMax: 0,
      highest: 0,
      date: m.examCreatedAt,
    }

    examMap.set(m.examId, {
      examName: m.examName,
      totalScore: existing.totalScore + m.score,
      totalMax: existing.totalMax + m.maxScore,
      highest: Math.max(existing.highest, pct),
      date: m.examCreatedAt,
    })
  }

  const examAverages = Array.from(examMap.values())
    .map(({ examName, totalScore, totalMax, highest, date }) => ({
      exam: examName,
      average: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
      highest,
      date: date.toISOString(),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Chart-ready data for ChartAreaInteractive
  const chartData = examAverages.map((e) => ({
    date: e.date.split('T')[0], // YYYY-MM-DD
    exam: e.exam,
    average: e.average,
    highest: e.highest,
  }))

  return {
    class: teacherClass,
    section: teacherSection,
    totalStudents,
    overallAverage,
    subjectAverages,
    examAverages,
    chartData,
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles = ['teacher', 'admin', 'librarian']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const data = await getClassAveragePerformanceData(session.user.id)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[teacher/class/average-performance] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
