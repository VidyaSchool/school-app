import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { teacherNote } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

const ALLOWED = ['teacher', 'admin', 'librarian']

export async function GET(req: Request) {
  const session = await getAuthenticatedSession()
  if (!session?.user || !ALLOWED.includes(session.user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const [note] = await db
      .select()
      .from(teacherNote)
      .where(and(eq(teacherNote.id, id), eq(teacherNote.teacherId, session.user.id)))
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ note })
  }

  const notes = await db
    .select()
    .from(teacherNote)
    .where(eq(teacherNote.teacherId, session.user.id))
    .orderBy(desc(teacherNote.updatedAt))

  return NextResponse.json({ notes })
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession()
  if (!session?.user || !ALLOWED.includes(session.user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, color } = await req.json()

  const id = crypto.randomUUID()
  await db.insert(teacherNote).values({
    id,
    teacherId: session.user.id,
    title: title?.trim() || 'Untitled',
    content: content ?? '',
    color: color ?? 'default',
  })

  return NextResponse.json({ success: true, id })
}

export async function PATCH(req: Request) {
  const session = await getAuthenticatedSession()
  if (!session?.user || !ALLOWED.includes(session.user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, title, content, color } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await db
    .update(teacherNote)
    .set({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(color !== undefined && { color }),
      updatedAt: new Date(),
    })
    .where(and(eq(teacherNote.id, id), eq(teacherNote.teacherId, session.user.id)))

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getAuthenticatedSession()
  if (!session?.user || !ALLOWED.includes(session.user.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await db
    .delete(teacherNote)
    .where(and(eq(teacherNote.id, id), eq(teacherNote.teacherId, session.user.id)))

  return NextResponse.json({ success: true })
}
