import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customPage } from "@/lib/schema"
import { eq, or, sql } from "drizzle-orm"
import { getStaticPage } from "@/lib/static-pages"

// Helper to ensure custom_page table exists
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
      );
    `)
  } catch (err) {
    console.error("Failed to ensure custom_page table exists:", err)
  }
}

// GET: Public endpoint (no auth required) to serve pages by slug or id
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const identifier = searchParams.get("slug") || searchParams.get("id") || searchParams.get("uid")

  if (!identifier) {
    return NextResponse.json({ error: "Page identifier (slug or ID) is required" }, { status: 400 })
  }

  const raw = identifier.trim()
  const cleanSlug = raw.toLowerCase().replace(/^\/?p\//, "").replace(/^\/+|\/+$/g, "")

  // 1. Check static pages in code directory first (instant, 0ms DB latency)
  const staticPage = getStaticPage(cleanSlug) || getStaticPage(raw)
  if (staticPage) {
    return NextResponse.json({
      found: true,
      page: {
        id: staticPage.slug,
        title: staticPage.title,
        slug: staticPage.slug,
        widgets: staticPage.widgets,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  // 2. Fallback to database for runtime-created dynamic pages
  try {
    await ensureTableExists()

    const pages = await db
      .select()
      .from(customPage)
      .where(
        or(
          eq(customPage.slug, cleanSlug),
          eq(customPage.slug, raw),
          eq(customPage.slug, `/${cleanSlug}`),
          eq(customPage.slug, `/p/${cleanSlug}`),
          eq(customPage.id, raw),
          eq(customPage.id, cleanSlug)
        )
      )
      .limit(1)

    if (pages.length === 0) {
      return NextResponse.json({ found: false, error: `Page "${cleanSlug}" not found` }, { status: 404 })
    }

    const page = pages[0]
    let parsedWidgets = []
    try {
      parsedWidgets = JSON.parse(page.widgetsJson || "[]")
    } catch {
      parsedWidgets = []
    }

    return NextResponse.json({
      found: true,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        widgets: parsedWidgets,
        updatedAt: page.updatedAt,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load public page"
    console.error("Public page fetch error:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
