import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { subjectClassAssignment, userProfile, user } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  })

  if (!profile?.class || !profile?.section) {
    return NextResponse.json({ class: null, section: null, subjects: [], classTeacher: null })
  }

  // Fetch all subject-teacher assignments for this class + section,
  // including each teacher's profile (for designation & secondaryRole)
  const assignments = await db
    .select({
      subject: subjectClassAssignment.subject,
      teacherId: subjectClassAssignment.teacherId,
      teacherName: user.name,
      designation: userProfile.designation,
      secondaryRole: userProfile.secondaryRole,
    })
    .from(subjectClassAssignment)
    .innerJoin(user, eq(subjectClassAssignment.teacherId, user.id))
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(
      and(
        eq(subjectClassAssignment.class, profile.class),
        eq(subjectClassAssignment.section, profile.section)
      )
    )
    .orderBy(subjectClassAssignment.subject)

  // Determine class teacher:
  // Priority 1 – teacher whose designation or secondaryRole explicitly marks them as class teacher
  // Priority 2 – teacher with the most subject assignments (heuristic fallback)
  const classTeacherKeywords = ['class teacher', 'incharge', 'in-charge', 'class incharge']

  const isClassTeacher = (designation: string | null, secondaryRole: string | null) => {
    const haystack = `${designation ?? ''} ${secondaryRole ?? ''}`.toLowerCase()
    return classTeacherKeywords.some((kw) => haystack.includes(kw))
  }

  // Try explicit match first
  const explicitCT = assignments.find((a) =>
    isClassTeacher(a.designation ?? null, a.secondaryRole ?? null)
  )

  let classTeacherName: string | null = null

  if (explicitCT) {
    classTeacherName = explicitCT.teacherName
  } else {
    // Fallback: teacher with most subject assignments
    const teacherCount: Record<string, { name: string; count: number }> = {}
    for (const a of assignments) {
      if (!teacherCount[a.teacherId])
        teacherCount[a.teacherId] = { name: a.teacherName, count: 0 }
      teacherCount[a.teacherId].count++
    }
    const top = Object.values(teacherCount).sort((a, b) => b.count - a.count)[0] ?? null
    classTeacherName = top?.name ?? null
  }

  return NextResponse.json({
    class: profile.class,
    section: profile.section,
    subjects: assignments.map((a) => ({ subject: a.subject, teacherName: a.teacherName })),
    classTeacher: classTeacherName,
  })
}
