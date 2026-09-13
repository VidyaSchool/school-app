import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customPage } from "@/lib/schema"
import { eq, ne, and, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// Helper to normalize and sanitize slug
export function normalizeSlug(raw?: string, titleFallback?: string): string {
  const source = (raw || "").trim() || (titleFallback || "").trim() || "custom-page"
  const clean = source
    .toLowerCase()
    .replace(/^\/?p\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return clean || "custom-page"
}

// Helper to ensure custom_page table exists in PostgreSQL database
async function ensureTableExists() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "custom_page" (
        "id" text PRIMARY KEY,
        "title" text NOT NULL DEFAULT 'Responsive Elementor Page',
        "slug" text NOT NULL DEFAULT 'responsive-elementor-page',
        "widgets_json" text NOT NULL DEFAULT '[]',
        "author_id" text,
        "status" text NOT NULL DEFAULT 'published',
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW()
      )
    `)
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "custom_page_slug_unique_idx" ON "custom_page" (LOWER("slug"))
    `)
  } catch (err) {
    console.error("Failed to ensure custom_page table exists in PostgreSQL:", err)
  }
}

// GET: Load page design by uid / id from database
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uid = searchParams.get("uid") || searchParams.get("id")

  if (!uid) {
    return NextResponse.json({ error: "Page UID is required" }, { status: 400 })
  }

  try {
    await ensureTableExists()

    const existingPages = await db.select().from(customPage).where(eq(customPage.id, uid)).limit(1)

    if (existingPages.length === 0) {
      return NextResponse.json({
        found: false,
        message: "Page not found in database",
      })
    }

    const page = existingPages[0]
    let parsedWidgets = []
    try {
      parsedWidgets = JSON.parse(page.widgetsJson || "[]")
    } catch {
      parsedWidgets = []
    }

    return NextResponse.json({
      found: true,
      page: {
        uid: page.id,
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        widgets: parsedWidgets,
        updatedAt: page.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("Failed to load page from database:", error)
    return NextResponse.json(
      { error: error.message || "Failed to load page" },
      { status: 500 }
    )
  }
}

// POST: Save or Update page design in database
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { uid, title, widgets, slug } = body

    if (!uid) {
      return NextResponse.json({ error: "Page UID is required" }, { status: 400 })
    }

    await ensureTableExists()

    const widgetsJson = JSON.stringify(widgets || [])
    const pageTitle = (title || "").trim() || "Responsive Elementor Page"
    const pageSlug = normalizeSlug(slug, pageTitle)

    // Enforce unique slug: check if another page already uses this slug
    const slugConflict = await db
      .select({ id: customPage.id, title: customPage.title, slug: customPage.slug })
      .from(customPage)
      .where(
        and(
          ne(customPage.id, uid),
          eq(sql`LOWER(${customPage.slug})`, pageSlug.toLowerCase())
        )
      )
      .limit(1)

    if (slugConflict.length > 0) {
      return NextResponse.json(
        {
          error: `The slug "${pageSlug}" is already in use by page "${slugConflict[0].title}". Every page must have a unique URL slug.`,
          conflictPageId: slugConflict[0].id,
          conflictPageTitle: slugConflict[0].title,
        },
        { status: 409 }
      )
    }

    // Check if page exists in DB
    const existing = await db.select().from(customPage).where(eq(customPage.id, uid)).limit(1)

    const now = new Date()

    if (existing.length > 0) {
      // Update existing page
      await db
        .update(customPage)
        .set({
          title: pageTitle,
          slug: pageSlug,
          widgetsJson,
          updatedAt: now,
        })
        .where(eq(customPage.id, uid))
    } else {
      // Insert new page
      await db.insert(customPage).values({
        id: uid,
        title: pageTitle,
        slug: pageSlug,
        widgetsJson,
        authorId: session.user.id,
        status: "published",
        createdAt: now,
        updatedAt: now,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Page changes successfully saved to database!",
      uid,
      title: pageTitle,
      updatedAt: now,
    })
  } catch (error: any) {
    console.error("Failed to save page to database:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save page to database" },
      { status: 500 }
    )
  }
}
