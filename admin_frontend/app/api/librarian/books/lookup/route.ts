import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryBook } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req)
  if (!session?.user || (session.user.role !== 'librarian' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const rawIsbn = searchParams.get('isbn') || ''
  const cleanIsbn = rawIsbn.replace(/[^0-9X]/gi, '').toUpperCase()

  if (!cleanIsbn || cleanIsbn.length < 8) {
    return NextResponse.json({ found: false, message: 'Valid ISBN is required' }, { status: 400 })
  }

  try {
    // 1. Check local library database
    const localBooks = await db.select()
      .from(libraryBook)
      .where(eq(libraryBook.isbn, cleanIsbn))
      .limit(1)

    if (localBooks.length > 0) {
      const b = localBooks[0]
      return NextResponse.json({
        found: true,
        source: 'database',
        in_library: true,
        book: {
          id: b.id,
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          category: b.category,
          quantity: b.quantity,
          availableQuantity: b.availableQuantity,
          location: b.location,
        }
      })
    }

    // 2. Fallback: Query Google Books API / OpenLibrary API
    let bookTitle: string | null = null
    let bookAuthor: string | null = null
    let coverUrl: string | null = null
    let category = 'General'

    try {
      const gBooksRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      })
      if (gBooksRes.ok) {
        const gData = await gBooksRes.json()
        if (gData.totalItems > 0 && gData.items?.[0]?.volumeInfo) {
          const info = gData.items[0].volumeInfo
          bookTitle = info.title || null
          bookAuthor = (info.authors && info.authors.length > 0) ? info.authors.join(', ') : 'Unknown Author'
          coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null
          if (info.categories && info.categories.length > 0) {
            category = info.categories[0]
          }
        }
      }
    } catch (gErr) {
      console.warn('Google Books lookup failed, trying OpenLibrary:', gErr)
    }

    if (!bookTitle) {
      try {
        const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`, {
          headers: { 'Accept': 'application/json' }
        })
        if (olRes.ok) {
          const olData = await olRes.json()
          const key = `ISBN:${cleanIsbn}`
          if (olData[key]) {
            const data = olData[key]
            bookTitle = data.title || null
            bookAuthor = data.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author'
            coverUrl = data.cover?.medium || data.cover?.large || data.cover?.small || null
          }
        }
      } catch (olErr) {
        console.warn('OpenLibrary lookup failed:', olErr)
      }
    }

    if (bookTitle) {
      // Auto-register book in database so it can be issued immediately
      const newBookId = `bk-${crypto.randomUUID()}`
      await db.insert(libraryBook).values({
        id: newBookId,
        title: bookTitle,
        author: bookAuthor || 'Unknown Author',
        isbn: cleanIsbn,
        category: category || 'General',
        quantity: 1,
        availableQuantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return NextResponse.json({
        found: true,
        source: 'openlibrary',
        in_library: true,
        auto_registered: true,
        cover_url: coverUrl,
        book: {
          id: newBookId,
          title: bookTitle,
          author: bookAuthor || 'Unknown Author',
          isbn: cleanIsbn,
          category,
          quantity: 1,
          availableQuantity: 1,
        }
      })
    }

    return NextResponse.json({
      found: false,
      message: `No book metadata found for ISBN ${cleanIsbn}`
    })
  } catch (error: any) {
    console.error('Error in ISBN lookup:', error)
    return NextResponse.json({ error: 'Failed to lookup ISBN' }, { status: 500 })
  }
}
