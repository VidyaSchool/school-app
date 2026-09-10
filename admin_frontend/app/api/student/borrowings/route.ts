import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryBook, libraryBookIssue } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawIssues = await db.select({
      id: libraryBookIssue.id,
      bookId: libraryBookIssue.bookId,
      issueDate: libraryBookIssue.issueDate,
      dueDate: libraryBookIssue.dueDate,
      returnDate: libraryBookIssue.returnDate,
      renewalsCount: libraryBookIssue.renewalsCount,
      status: libraryBookIssue.status,
      title: libraryBook.title,
      author: libraryBook.author,
      isbn: libraryBook.isbn,
    })
    .from(libraryBookIssue)
    .innerJoin(libraryBook, eq(libraryBookIssue.bookId, libraryBook.id))
    .where(eq(libraryBookIssue.userId, session.user.id))
    .orderBy(desc(libraryBookIssue.createdAt))

    const now = new Date()
    const issues = rawIssues.map(issue => {
      let status = issue.status
      if (status === 'active' && issue.dueDate < now) {
        status = 'overdue'
      }
      return {
        ...issue,
        status
      }
    })

    return NextResponse.json(issues)
  } catch (error: any) {
    console.error('Error fetching student borrowings:', error)
    return NextResponse.json({ error: 'Failed to fetch borrowing records' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 })
    }

    const issue = await db.select()
      .from(libraryBookIssue)
      .where(
        and(
          eq(libraryBookIssue.id, id),
          eq(libraryBookIssue.userId, session.user.id)
        )
      )
      .limit(1)

    if (issue.length === 0) {
      return NextResponse.json({ error: 'Issue record not found' }, { status: 404 })
    }

    if (issue[0].status === 'returned') {
      return NextResponse.json({ error: 'Cannot renew a returned book' }, { status: 400 })
    }

    if (issue[0].renewalsCount >= 3) {
      return NextResponse.json({ error: 'Maximum renewals limit reached (3 times)' }, { status: 400 })
    }

    const currentDue = new Date(issue[0].dueDate)
    currentDue.setDate(currentDue.getDate() + 14)

    await db.update(libraryBookIssue)
      .set({
        dueDate: currentDue,
        renewalsCount: issue[0].renewalsCount + 1,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(libraryBookIssue.id, id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error renewing student book:', error)
    return NextResponse.json({ error: 'Failed to renew book' }, { status: 500 })
  }
}
