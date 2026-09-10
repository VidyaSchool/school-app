import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notice, user, userProfile } from '@/lib/schema'
import { eq, or, and, isNull, desc } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const userRole = session.user.role || 'student'

  try {
    let noticesData: any[] = []

    if (userRole === 'student') {
      // 1. Fetch student's profile to get class and section
      const profile = await db.select({
        class: userProfile.class,
        section: userProfile.section,
      })
      .from(userProfile)
      .where(eq(userProfile.userId, userId))
      .limit(1)

      const studentClass = profile[0]?.class || ''
      const studentSection = profile[0]?.section || ''

      // 2. Fetch notices: admin notices sent to 'all' or 'student'
      // OR teacher notices targeted to studentClass and (section is null or matches studentSection)
      noticesData = await db.select({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        isUrgent: notice.isUrgent,
        senderId: notice.senderId,
        targetRole: notice.targetRole,
        targetClass: notice.targetClass,
        targetSection: notice.targetSection,
        createdAt: notice.createdAt,
        senderName: user.name,
      })
      .from(notice)
      .leftJoin(user, eq(notice.senderId, user.id))
      .where(
        or(
          // Admin notices targeted to student or all
          and(
            or(eq(notice.targetRole, 'all'), eq(notice.targetRole, 'student')),
            isNull(notice.targetClass)
          ),
          // Teacher notices targeted to this student's class
          and(
            eq(notice.targetClass, studentClass),
            or(
              isNull(notice.targetSection),
              eq(notice.targetSection, ''),
              eq(notice.targetSection, studentSection)
            )
          )
        )
      )
      .orderBy(desc(notice.createdAt))

    } else if (userRole === 'teacher' || userRole === 'librarian') {
      // Teachers and librarians see: notices targeted to all or teachers/librarians, or notices they posted themselves
      noticesData = await db.select({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        isUrgent: notice.isUrgent,
        senderId: notice.senderId,
        targetRole: notice.targetRole,
        targetClass: notice.targetClass,
        targetSection: notice.targetSection,
        createdAt: notice.createdAt,
        senderName: user.name,
      })
      .from(notice)
      .leftJoin(user, eq(notice.senderId, user.id))
      .where(
        or(
          eq(notice.targetRole, 'all'),
          eq(notice.targetRole, 'teacher'),
          eq(notice.targetRole, 'librarian'),
          eq(notice.senderId, userId)
        )
      )
      .orderBy(desc(notice.createdAt))

    } else if (userRole === 'admin') {
      // Admins see all notices
      noticesData = await db.select({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        isUrgent: notice.isUrgent,
        senderId: notice.senderId,
        targetRole: notice.targetRole,
        targetClass: notice.targetClass,
        targetSection: notice.targetSection,
        createdAt: notice.createdAt,
        senderName: user.name,
      })
      .from(notice)
      .leftJoin(user, eq(notice.senderId, user.id))
      .orderBy(desc(notice.createdAt))
    }

    return NextResponse.json(noticesData)
  } catch (error: any) {
    console.error('Error fetching notices:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'teacher' && session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, content, category, isUrgent, targetRole, targetClass, targetSection } = await req.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const noticeId = `not-${crypto.randomUUID()}`

    // Teachers can only target specific classes, admins can target roles
    const noticeData = {
      id: noticeId,
      title,
      content,
      category: category || 'General',
      isUrgent: !!isUrgent,
      senderId: session.user.id,
      targetRole: session.user.role === 'admin' ? (targetRole || 'all') : 'class',
      targetClass: (session.user.role === 'teacher' || session.user.role === 'librarian') ? targetClass : null,
      targetSection: (session.user.role === 'teacher' || session.user.role === 'librarian') ? (targetSection || null) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(notice).values(noticeData)

    return NextResponse.json({ success: true, id: noticeId })
  } catch (error: any) {
    console.error('Error creating notice:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 })
    }

    // Admins can delete any notice, others can only delete their own
    if (session.user.role === 'admin') {
      await db.delete(notice).where(eq(notice.id, id))
    } else {
      await db.delete(notice).where(
        and(
          eq(notice.id, id),
          eq(notice.senderId, session.user.id)
        )
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting notice:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
