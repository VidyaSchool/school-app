import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryBook } from '@/lib/schema'
import { eq, or } from 'drizzle-orm'
import { getAuthenticatedSession } from '@/lib/auth-helpers'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isbn = searchParams.get('isbn') || ''
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').toUpperCase()

  if (!cleanIsbn || cleanIsbn.length < 7) {
    return NextResponse.json({ error: 'Valid ISBN is required' }, { status: 400 })
  }

  try {
    // 1. Scan local Database first
    const existing = await db.select()
      .from(libraryBook)
      .where(or(eq(libraryBook.isbn, cleanIsbn), eq(libraryBook.isbn, isbn.trim())))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({
        found: true,
        source: 'database',
        book: existing[0],
        in_library: true
      })
    }

    // 2. Fetch from OpenLibrary API
    const openlibRes = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanIsbn)}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 } // Next.js cache 24h
    })

    if (openlibRes.ok) {
      const data = await openlibRes.json()
      const docs = data.docs || []
      if (docs.length > 0) {
        const doc = docs[0]
        const title = doc.title || 'Unknown Title'
        const author = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : 'Unknown Author'
        const category = Array.isArray(doc.subject) && doc.subject.length > 0 ? String(doc.subject[0]).slice(0, 50) : 'General'
        const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null

        // Store into database so future requests find it directly in our DB
        const bookId = `bk-${crypto.randomUUID()}`
        await db.insert(libraryBook).values({
          id: bookId,
          title,
          author,
          isbn: cleanIsbn,
          category,
          quantity: 1,
          availableQuantity: 1,
          location: 'Main Library',
        })

        const savedBook = {
          id: bookId,
          title,
          author,
          isbn: cleanIsbn,
          category,
          quantity: 1,
          availableQuantity: 1,
          location: 'Main Library',
          cover_url: coverUrl
        }

        return NextResponse.json({
          found: true,
          source: 'openlibrary',
          book: savedBook,
          in_library: true,
          auto_registered: true,
          cover_url: coverUrl
        })
      }
    }

    return NextResponse.json({
      found: false,
      message: `No book details found for ISBN ${cleanIsbn} in catalog or OpenLibrary`
    })
  } catch (error: any) {
    console.error('Error during ISBN lookup:', error)
    return NextResponse.json({ error: 'Failed to lookup book' }, { status: 500 })
  }
}
