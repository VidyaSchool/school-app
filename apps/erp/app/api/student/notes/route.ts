import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { teacherNote, userProfile, user } from '@/lib/schema'
import { eq, or, and, isNotNull, ne, desc, inArray } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id),
    })

    if (!profile || !profile.class || profile.class === 'none') {
      return NextResponse.json({ notes: [] })
    }

    const rawClass = (profile.class || '').trim()
    const studentSection = (profile.section || '').trim()

    const cleanNum = rawClass.toLowerCase().replace('class', '').trim()
    const classVariations = Array.from(new Set([
      rawClass,
      cleanNum,
      `Class ${cleanNum}`,
      `class ${cleanNum}`,
      'All',
      'all'
    ]))

    // Fetch notes matching student's class and section (or "All" / null)
    const notes = await db
      .select({
        id: teacherNote.id,
        teacher_id: teacherNote.teacherId,
        title: teacherNote.title,
        content: teacherNote.content,
        color: teacherNote.color,
        class: teacherNote.class,
        section: teacherNote.section,
        subject: teacherNote.subject,
        created_at: teacherNote.createdAt,
        updated_at: teacherNote.updatedAt,
        teacher_name: user.name,
      })
      .from(teacherNote)
      .innerJoin(user, eq(teacherNote.teacherId, user.id))
      .where(
        and(
          inArray(teacherNote.class, classVariations),
          or(
            eq(teacherNote.section, 'All'),
            eq(teacherNote.section, 'all'),
            eq(teacherNote.section, studentSection),
            eq(teacherNote.section, '')
          ),
          isNotNull(teacherNote.class),
          ne(teacherNote.class, ''),
          ne(teacherNote.class, 'none')
        )
      )
      .orderBy(desc(teacherNote.updatedAt))

    return NextResponse.json({ notes })
  } catch (error: any) {
    console.error('Error fetching student notes:', error)
    return NextResponse.json({ notes: [] })
  }
}
