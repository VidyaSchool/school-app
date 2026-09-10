import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryBook } from '@/lib/schema'
import { eq, like, or } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  try {
    let books
    if (search) {
      books = await db.select()
        .from(libraryBook)
        .where(
          or(
            like(libraryBook.title, `%${search}%`),
            like(libraryBook.author, `%${search}%`),
            like(libraryBook.isbn, `%${search}%`),
            like(libraryBook.category, `%${search}%`)
          )
        )
    } else {
      books = await db.select().from(libraryBook)
    }
    return NextResponse.json(books)
  } catch (error: any) {
    console.error('Error fetching books:', error)
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, author, isbn, category, quantity, location } = await req.json()
    if (!title || !author || !isbn) {
      return NextResponse.json({ error: 'Title, Author, and ISBN are required' }, { status: 400 })
    }

    const existing = await db.select()
      .from(libraryBook)
      .where(eq(libraryBook.isbn, isbn))
      .limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Book with this ISBN already exists' }, { status: 400 })
    }

    const bookId = `bk-${crypto.randomUUID()}`
    const qty = parseInt(quantity) || 1
    await db.insert(libraryBook).values({
      id: bookId,
      title,
      author,
      isbn,
      category: category || 'General',
      quantity: qty,
      availableQuantity: qty,
      location: location || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: bookId })
  } catch (error: any) {
    console.error('Error creating book:', error)
    return NextResponse.json({ error: 'Failed to add book' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, title, author, isbn, category, quantity, location } = await req.json()
    if (!id || !title || !author || !isbn) {
      return NextResponse.json({ error: 'ID, Title, Author, and ISBN are required' }, { status: 400 })
    }

    const existingBook = await db.select()
      .from(libraryBook)
      .where(eq(libraryBook.id, id))
      .limit(1)
    if (existingBook.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (isbn !== existingBook[0].isbn) {
      const existingIsbn = await db.select()
        .from(libraryBook)
        .where(eq(libraryBook.isbn, isbn))
        .limit(1)
      if (existingIsbn.length > 0) {
        return NextResponse.json({ error: 'Another book with this ISBN already exists' }, { status: 400 })
      }
    }

    const newQty = parseInt(quantity) || 1
    const diff = newQty - existingBook[0].quantity
    const newAvailable = Math.max(0, existingBook[0].availableQuantity + diff)

    await db.update(libraryBook)
      .set({
        title,
        author,
        isbn,
        category: category || 'General',
        quantity: newQty,
        availableQuantity: newAvailable,
        location: location || null,
        updatedAt: new Date(),
      })
      .where(eq(libraryBook.id, id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating book:', error)
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.delete(libraryBook).where(eq(libraryBook.id, id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting book:', error)
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
