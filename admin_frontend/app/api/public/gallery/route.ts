import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { galleryImage } from "@/lib/schema"
import { asc, desc, eq, sql, or } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const revalidate = 0

const ALLOWED_CATEGORIES = [
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

function normalizeCategory(cat: string): string {
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
  } catch {
    // Ignore table exists error
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTableExists()
    const { searchParams } = new URL(req.url)
    const rawCategory = searchParams.get("category")
    const category = rawCategory ? rawCategory.replace(/<[^>]*>?/gm, "").trim().slice(0, 50) : null

    let query = db.select().from(galleryImage)

    const images = category && category !== "All"
      ? await query.where(
          category === "Arts & Music" || category === "Cultural & Arts"
            ? or(eq(galleryImage.category, "Arts & Music"), eq(galleryImage.category, "Cultural & Arts"))
            : category === "STEM & Robotics" || category === "Robotics & STEM"
            ? or(eq(galleryImage.category, "STEM & Robotics"), eq(galleryImage.category, "Robotics & STEM"))
            : eq(galleryImage.category, normalizeCategory(category))
        ).orderBy(asc(galleryImage.order), desc(galleryImage.createdAt)).limit(100)
      : await query.orderBy(asc(galleryImage.order), desc(galleryImage.createdAt)).limit(100)

    return NextResponse.json(
      { success: true, images },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
        },
      }
    )
  } catch (error: any) {
    console.error("Public gallery fetch error in admin_frontend:", error)
    return NextResponse.json(
      { success: true, images: [] },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    )
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
