import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { customPage } from "@/lib/schema"
import { eq, desc, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

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
      );
    `)
  } catch (err) {
    console.error("Failed to ensure custom_page table exists in PostgreSQL:", err)
  }
}

// GET: Load single page design or list all custom pages
export async function GET(req: NextRequest) {
  const authCheck = await verifyAdminAuth()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  const { searchParams } = new URL(req.url)
  const uid = searchParams.get("uid") || searchParams.get("id")

  try {
    await ensureTableExists()

    // If no UID is specified, return all pages for the builder dashboard
    if (!uid) {
      const allPages = await db
        .select({
          id: customPage.id,
          title: customPage.title,
          slug: customPage.slug,
          status: customPage.status,
          authorId: customPage.authorId,
          createdAt: customPage.createdAt,
          updatedAt: customPage.updatedAt,
        })
        .from(customPage)
        .orderBy(desc(customPage.updatedAt))

      return NextResponse.json({
        success: true,
        pages: allPages.map((p) => ({
          uid: p.id,
          id: p.id,
          name: p.title,
          title: p.title,
          slug: p.slug,
          status: p.status || "published",
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      })
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load page"
    console.error("Failed to load page from database:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// Helper to verify user is authenticated as an admin
async function verifyAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) {
    return { ok: false, status: 401, error: "Unauthorized: Admin session required" as const }
  }
  const isUserAdmin = session.user.role === "admin" || (session.user as { isAdmin?: boolean }).isAdmin
  if (!isUserAdmin) {
    return { ok: false, status: 403, error: "Forbidden: Admin privileges required" as const }
  }
  return { ok: true, user: session.user }
}

// POST: Save or Update page design in database & sync with FastAPI backend
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdminAuth()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const body = await req.json()
    const { uid, title, widgets, slug, status } = body

    if (!uid) {
      return NextResponse.json({ error: "Page UID is required" }, { status: 400 })
    }

    await ensureTableExists()

    const widgetsJson = JSON.stringify(widgets || [])
    const pageTitle = title || "Responsive Elementor Page"
    const pageSlug = slug || pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const authorId = authCheck.user?.id || "admin"
    const pageStatus = status || "published"
    const now = new Date()

    // 1. Direct PostgreSQL DB save
    const existing = await db.select().from(customPage).where(eq(customPage.id, uid)).limit(1)

    if (existing.length > 0) {
      await db
        .update(customPage)
        .set({
          title: pageTitle,
          slug: pageSlug,
          widgetsJson,
          status: pageStatus,
          updatedAt: now,
        })
        .where(eq(customPage.id, uid))
    } else {
      await db.insert(customPage).values({
        id: uid,
        title: pageTitle,
        slug: pageSlug,
        widgetsJson,
        authorId,
        status: pageStatus,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 2. Also notify/sync with FastAPI backend if running
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const internalKey = process.env.INTERNAL_SERVICE_SECRET || "vidyaschool-secure-internal-sync-key"
    try {
      await fetch(`${backendUrl}/api/page-builder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Service-Key": internalKey,
          Cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          uid,
          title: pageTitle,
          slug: pageSlug,
          widgets: widgets || [],
          status: pageStatus,
          author_id: authorId,
        }),
      })
    } catch {
      // Backend sync error is non-fatal since DB is already updated
    }

    return NextResponse.json({
      success: true,
      message: "Page saved successfully to database!",
      uid,
      title: pageTitle,
      slug: pageSlug,
      status: pageStatus,
      updatedAt: now,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save page to database"
    console.error("Failed to save page to database:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// DELETE: Delete a custom page by UID
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdminAuth()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  const { searchParams } = new URL(req.url)
  const uid = searchParams.get("uid") || searchParams.get("id")

  if (!uid) {
    return NextResponse.json({ error: "Page UID is required" }, { status: 400 })
  }

  try {
    await ensureTableExists()
    await db.delete(customPage).where(eq(customPage.id, uid))

    // Also sync delete to FastAPI backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const internalKey = process.env.INTERNAL_SERVICE_SECRET || "vidyaschool-secure-internal-sync-key"
    try {
      await fetch(`${backendUrl}/api/page-builder?uid=${encodeURIComponent(uid)}`, {
        method: "DELETE",
        headers: {
          "X-Internal-Service-Key": internalKey,
          Cookie: req.headers.get("cookie") || "",
        },
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ success: true, message: "Page deleted successfully" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete page"
    console.error("Failed to delete page:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// PATCH: Rename, change slug, or toggle published status
export async function PATCH(req: NextRequest) {
  const authCheck = await verifyAdminAuth()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const body = await req.json()
    const { uid, title, slug, status } = body

    if (!uid) {
      return NextResponse.json({ error: "Page UID is required" }, { status: 400 })
    }

    await ensureTableExists()
    const updates: { title?: string; slug?: string; status?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    }
    if (title !== undefined) updates.title = title
    if (slug !== undefined) updates.slug = slug
    if (status !== undefined) updates.status = status

    await db.update(customPage).set(updates).where(eq(customPage.id, uid))

    // Also sync to FastAPI backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const internalKey = process.env.INTERNAL_SERVICE_SECRET || "vidyaschool-secure-internal-sync-key"
    try {
      await fetch(`${backendUrl}/api/page-builder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Service-Key": internalKey,
          Cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify({ uid, title, slug, status }),
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ success: true, message: "Page updated successfully", uid })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update page"
    console.error("Failed to update page:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
