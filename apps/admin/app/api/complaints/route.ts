import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { complaint, user } from '@/lib/schema'
import { asc, eq, like } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

async function notifyComplaint(event: string, payload: Record<string, unknown>) {
  try {
    await fetch(`${BACKEND_URL}/notify-complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    })
  } catch (error) {
    console.error('Failed to emit complaint socket event:', error)
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') // 'teacher' or 'admin'
  
  try {
    let query = db.select({
      id: complaint.id,
      userId: complaint.userId,
      title: complaint.title,
      recipient: complaint.recipient,
      taggedPeople: complaint.taggedPeople,
      message: complaint.message,
      fileUrl: complaint.fileUrl,
      fileName: complaint.fileName,
      status: complaint.status,
      sortOrder: complaint.sortOrder,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      senderName: user.name,
      senderEmail: user.email,
      senderRole: user.role,
    })
    .from(complaint)
    .leftJoin(user, eq(complaint.userId, user.id))
    .orderBy(asc(complaint.sortOrder), asc(complaint.createdAt))

    let results
    if (role === 'teacher') {
      results = await query.where(eq(complaint.recipient, 'Teacher'))
    } else if (role === 'librarian') {
      results = await query.where(eq(complaint.recipient, 'Librarian'))
    } else if (role === 'admin') {
      results = await query.where(like(complaint.recipient, '%Admin%'))
    } else {
      results = await query
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const title = formData.get('title') as string
    const recipient = formData.get('recipient') as string
    const taggedPeople = formData.get('taggedPeople') as string
    const message = formData.get('message') as string
    const file = formData.get('file') as File | null

    if (!title || !recipient || !message) {
      return NextResponse.json({ error: 'Title, recipient, and message are required' }, { status: 400 })
    }

    let fileUrl: string | null = null
    let fileName: string | null = null

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })

      const uniqueFilename = `${crypto.randomUUID()}-${file.name}`
      const filePath = path.join(uploadDir, uniqueFilename)
      await writeFile(filePath, buffer)

      fileUrl = `/uploads/${uniqueFilename}`
      fileName = file.name
    }

    const complaintId = `comp-${crypto.randomUUID()}`
    const now = new Date()
    await db.insert(complaint).values({
      id: complaintId,
      userId: session.user.id,
      title,
      recipient,
      taggedPeople: taggedPeople || null,
      message,
      fileUrl,
      fileName,
      status: 'pending',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })

    await notifyComplaint('complaint_created', {
      id: complaintId,
      title,
      recipient,
      status: 'pending',
      senderName: session.user.name,
      senderRole: session.user.role,
      createdAt: now.toISOString(),
    })

    return NextResponse.json({ success: true, id: complaintId })
  } catch (error: any) {
    console.error('Error creating complaint:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, status, orderedIds } = body

    if (orderedIds && Array.isArray(orderedIds)) {
      await Promise.all(
        orderedIds.map((complaintId: string, index: number) =>
          db.update(complaint)
            .set({ sortOrder: index, updatedAt: new Date() })
            .where(eq(complaint.id, complaintId))
        )
      )

      await notifyComplaint('complaint_reordered', { orderedIds })

      return NextResponse.json({ success: true })
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    await db.update(complaint)
      .set({ status, updatedAt: new Date() })
      .where(eq(complaint.id, id))

    await notifyComplaint('complaint_updated', { id, status })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating complaint:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}
