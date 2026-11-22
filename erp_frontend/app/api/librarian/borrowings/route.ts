import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryBook, libraryBookIssue, user, userProfile } from '@/lib/schema'
import { eq, or, and, desc } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const borrowings = await db.select({
      id: libraryBookIssue.id,
      bookId: libraryBookIssue.bookId,
      userId: libraryBookIssue.userId,
      issueDate: libraryBookIssue.issueDate,
      dueDate: libraryBookIssue.dueDate,
      returnDate: libraryBookIssue.returnDate,
      renewalsCount: libraryBookIssue.renewalsCount,
      status: libraryBookIssue.status,
      bookTitle: libraryBook.title,
      bookAuthor: libraryBook.author,
      bookIsbn: libraryBook.isbn,
      studentName: user.name,
      studentEmail: user.email,
      studentUsername: userProfile.username,
      studentClass: userProfile.class,
      studentSection: userProfile.section,
    })
    .from(libraryBookIssue)
    .innerJoin(libraryBook, eq(libraryBookIssue.bookId, libraryBook.id))
    .innerJoin(user, eq(libraryBookIssue.userId, user.id))
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .orderBy(desc(libraryBookIssue.createdAt))

    return NextResponse.json(borrowings)
  } catch (error: any) {
    console.error('Error fetching borrowings:', error)
    return NextResponse.json({ error: 'Failed to fetch borrowings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { studentIdentifier, bookId, dueDate } = await req.json()
    if (!studentIdentifier || !bookId || !dueDate) {
      return NextResponse.json({ error: 'Student username/email, Book, and Due Date are required' }, { status: 400 })
    }

    const studentUser = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(
      or(
        eq(user.email, studentIdentifier),
        eq(userProfile.username, studentIdentifier)
      )
    )
    .limit(1)

    if (studentUser.length === 0) {
      return NextResponse.json({ error: 'Student not found in system. Please verify username/email.' }, { status: 400 })
    }

    const book = await db.select()
      .from(libraryBook)
      .where(eq(libraryBook.id, bookId))
      .limit(1)

    if (book.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 400 })
    }

    if (book[0].availableQuantity <= 0) {
      return NextResponse.json({ error: 'Book is currently out of stock (no copies available)' }, { status: 400 })
    }

    const issueId = `iss-${crypto.randomUUID()}`

    await db.insert(libraryBookIssue).values({
      id: issueId,
      bookId,
      userId: studentUser[0].id,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      renewalsCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.update(libraryBook)
      .set({
        availableQuantity: book[0].availableQuantity - 1,
        updatedAt: new Date(),
      })
      .where(eq(libraryBook.id, bookId))

    return NextResponse.json({ success: true, id: issueId })
  } catch (error: any) {
    console.error('Error creating borrowing:', error)
    return NextResponse.json({ error: 'Failed to issue book' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, action } = await req.json()
    if (!id || !action) {
      return NextResponse.json({ error: 'Issue ID and action are required' }, { status: 400 })
    }

    const issue = await db.select()
      .from(libraryBookIssue)
      .where(eq(libraryBookIssue.id, id))
      .limit(1)

    if (issue.length === 0) {
      return NextResponse.json({ error: 'Issue record not found' }, { status: 404 })
    }

    const bookId = issue[0].bookId

    if (action === 'return') {
      if (issue[0].status === 'returned') {
        return NextResponse.json({ error: 'Book is already returned' }, { status: 400 })
      }

      await db.update(libraryBookIssue)
        .set({
          status: 'returned',
          returnDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(libraryBookIssue.id, id))

      const book = await db.select()
        .from(libraryBook)
        .where(eq(libraryBook.id, bookId))
        .limit(1)

      if (book.length > 0) {
        await db.update(libraryBook)
          .set({
            availableQuantity: Math.min(book[0].quantity, book[0].availableQuantity + 1),
            updatedAt: new Date(),
          })
          .where(eq(libraryBook.id, bookId))
      }

      return NextResponse.json({ success: true })

    } else if (action === 'renew') {
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
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be return or renew' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error updating borrowing:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
