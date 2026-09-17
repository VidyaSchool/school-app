import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { galleryImage } from "@/lib/schema"
import { eq, desc, asc, sql, or } from "drizzle-orm"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import { deleteFromS3 } from "@/lib/s3"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const ALLOWED_CATEGORIES = [
  "Campus & Life",
  "Academics & Labs",
  "Arts & Music",
  "Cultural & Arts",
  "STEM & Robotics",
  "Robotics & STEM",
  "Sports & Athletics",
  "Leadership",
  "Events & Celebrations",
]

export function normalizeCategory(cat: string): string {
  const c = (cat || "").trim()
  const lower = c.toLowerCase()
  if (lower === "cultural & arts" || lower === "cultural and arts" || lower === "arts & music" || lower === "arts and music") {
    return "Arts & Music"
  }
  if (lower === "robotics & stem" || lower === "robotics and stem" || lower === "stem & robotics" || lower === "stem and robotics") {
    return "STEM & Robotics"
  }
  const found = ALLOWED_CATEGORIES.find((k) => k.toLowerCase() === lower)
  return found || "Campus & Life"
}

const ALLOWED_ASPECT_RATIOS = [
  "aspect-[4/3]",
  "aspect-[16/9]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[9/16]",
]

function sanitizeString(val: any, maxLength = 150): string {
  if (typeof val !== "string") return ""
  return val
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim()
    .slice(0, maxLength)
}

function sanitizeUrl(val: any): string | null {
  if (typeof val !== "string") return null
  const trimmed = val.trim()

  // Safe local upload path
  if (/^\/uploads\/gallery\/[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return trimmed
  }

  // Safe remote URL (must be HTTPS or localhost HTTP)
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol === "https:" ||
      ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.protocol === "http:")
    ) {
      return parsed.toString()
    }
  } catch {}
  return null
}

function sanitizeId(val: any): string {
  if (typeof val !== "string") return `gal_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
  const clean = val.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64)
  return clean || `gal_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
}

// Helper: Ensure the gallery_image table exists in PostgreSQL
async function ensureTableExists() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "gallery_image" (
        "id" text PRIMARY KEY,
        "title" text NOT NULL DEFAULT 'Gallery Photo',
        "description" text DEFAULT '',
        "category" text NOT NULL DEFAULT 'Campus & Life',
        "src" text NOT NULL,
        "aspect_ratio" text NOT NULL DEFAULT 'aspect-[4/3]',
        "location" text DEFAULT 'Main Campus, Gurugram',
        "date" text DEFAULT '2026',
        "order" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW()
      )
    `)
  } catch (err) {
    console.error("Failed to ensure gallery_image table exists:", err)
  }
}

// Helper: Verify admin authorization
async function verifyAdmin(req: NextRequest) {
  const session = await getAuthenticatedSession(req)
  if (!session?.user) {
    return { ok: false, status: 401, error: "Unauthorized access" }
  }
  const user = session.user as any
  const isUserAdmin = user.role === "admin" || user.isAdmin === true
  if (!isUserAdmin) {
    return { ok: false, status: 403, error: "Forbidden: Admin privileges required" }
  }
  return { ok: true, user }
}

// GET: Retrieve all gallery photos
export async function GET(req: NextRequest) {
  try {
    await ensureTableExists()

    const { searchParams } = new URL(req.url)
    const rawCategory = searchParams.get("category")
    const category = rawCategory ? sanitizeString(rawCategory, 50) : null

    let query = db.select().from(galleryImage)

    const images = category && category !== "All"
      ? await query.where(
          category === "Arts & Music" || category === "Cultural & Arts"
            ? or(eq(galleryImage.category, "Arts & Music"), eq(galleryImage.category, "Cultural & Arts"))
            : category === "STEM & Robotics" || category === "Robotics & STEM"
            ? or(eq(galleryImage.category, "STEM & Robotics"), eq(galleryImage.category, "Robotics & STEM"))
            : eq(galleryImage.category, normalizeCategory(category))
        ).orderBy(asc(galleryImage.order), desc(galleryImage.createdAt))
      : await query.orderBy(asc(galleryImage.order), desc(galleryImage.createdAt))

    return NextResponse.json(
      {
        success: true,
        images,
        count: images.length,
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    )
  } catch (error: any) {
    console.error("Failed to fetch gallery images:", error)
    return NextResponse.json(
      { error: "Failed to retrieve gallery images" },
      { status: 500 }
    )
  }
}

// POST: Add new gallery photo(s)
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    await ensureTableExists()
    const body = await req.json()

    // Support single object or array of images
    const rawItems = Array.isArray(body) ? body : [body]

    if (rawItems.length === 0) {
      return NextResponse.json({ error: "No image items provided" }, { status: 400 })
    }

    if (rawItems.length > 50) {
      return NextResponse.json({ error: "Batch upload exceeds maximum limit (50 items per request)" }, { status: 400 })
    }

    const insertedList = []

    for (const item of rawItems) {
      const safeSrc = sanitizeUrl(item.src)
      if (!safeSrc) {
        continue
      }

      const id = sanitizeId(item.id)
      const title = sanitizeString(item.title, 150) || "Campus Photograph"
      const description = sanitizeString(item.description, 1000)
      const rawCategory = sanitizeString(item.category, 50)
      const category = normalizeCategory(rawCategory)
      const rawAspectRatio = sanitizeString(item.aspectRatio, 30)
      const aspectRatio = ALLOWED_ASPECT_RATIOS.includes(rawAspectRatio) ? rawAspectRatio : "aspect-[4/3]"
      const location = sanitizeString(item.location, 100) || "Main Campus, Gurugram"
      const dateStr = sanitizeString(item.date, 50) || new Date().getFullYear().toString()
      const rawOrder = Number(item.order)
      const order = Number.isFinite(rawOrder) ? Math.max(-10000, Math.min(10000, Math.floor(rawOrder))) : 0

      const [record] = await db
        .insert(galleryImage)
        .values({
          id,
          title,
          description,
          category,
          src: safeSrc,
          aspectRatio,
          location,
          date: dateStr,
          order,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      insertedList.push(record)
    }

    return NextResponse.json({
      success: true,
      insertedCount: insertedList.length,
      images: insertedList,
    })
  } catch (error: any) {
    console.error("Failed to insert gallery images:", error)
    return NextResponse.json(
      { error: "Failed to save gallery images" },
      { status: 500 }
    )
  }
}

// PUT: Update an existing gallery photo
export async function PUT(req: NextRequest) {
  const authCheck = await verifyAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    await ensureTableExists()
    const body = await req.json()
    const { id, title, description, category, aspectRatio, location, date: dateStr, order, src } = body

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Valid image ID is required for update" }, { status: 400 })
    }

    const cleanId = sanitizeId(id)

    const updateFields: any = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateFields.title = sanitizeString(title, 150) || "Campus Photograph"
    if (description !== undefined) updateFields.description = sanitizeString(description, 1000)
    if (category !== undefined) {
      const cat = sanitizeString(category, 50)
      updateFields.category = normalizeCategory(cat)
    }
    if (aspectRatio !== undefined) {
      const ar = sanitizeString(aspectRatio, 30)
      if (ALLOWED_ASPECT_RATIOS.includes(ar)) updateFields.aspectRatio = ar
    }
    if (location !== undefined) updateFields.location = sanitizeString(location, 100)
    if (dateStr !== undefined) updateFields.date = sanitizeString(dateStr, 50)
    if (order !== undefined) {
      const rawOrder = Number(order)
      if (Number.isFinite(rawOrder)) {
        updateFields.order = Math.max(-10000, Math.min(10000, Math.floor(rawOrder)))
      }
    }
    if (src !== undefined) {
      const safeSrc = sanitizeUrl(src)
      if (safeSrc) updateFields.src = safeSrc
    }

    const [updated] = await db
      .update(galleryImage)
      .set(updateFields)
      .where(eq(galleryImage.id, cleanId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      image: updated,
    })
  } catch (error: any) {
    console.error("Failed to update gallery image:", error)
    return NextResponse.json(
      { error: "Failed to update gallery image" },
      { status: 500 }
    )
  }
}

// DELETE: Remove photo from database & delete object from AWS S3
export async function DELETE(req: NextRequest) {
  const authCheck = await verifyAdmin(req)
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    await ensureTableExists()

    const { searchParams } = new URL(req.url)
    let rawId = searchParams.get("id")

    if (!rawId) {
      const body = await req.json().catch(() => ({}))
      rawId = body.id
    }

    if (!rawId || typeof rawId !== "string") {
      return NextResponse.json({ error: "Valid image ID is required for deletion" }, { status: 400 })
    }

    const id = sanitizeId(rawId)

    // Find image to retrieve src for S3 deletion
    const [existing] = await db.select().from(galleryImage).where(eq(galleryImage.id, id))

    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Delete from S3 if it's an S3 URL
    if (existing.src && existing.src.includes(".amazonaws.com")) {
      try {
        await deleteFromS3(existing.src)
      } catch (s3Err) {
        console.warn("Failed to delete object from S3 during gallery cleanup:", s3Err)
      }
    }

    // Delete record from DB
    await db.delete(galleryImage).where(eq(galleryImage.id, id))

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: "Image successfully deleted from gallery and cloud storage.",
    })
  } catch (error: any) {
    console.error("Failed to delete gallery image:", error)
    return NextResponse.json(
      { error: "Failed to delete gallery image" },
      { status: 500 }
    )
  }
}
