import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-cms-revalidate-secret")
    const internalKey = process.env.INTERNAL_SERVICE_SECRET || "vidyaschool-secure-internal-sync-key"

    // Allow if matching secret OR if request originates from localhost/internal network
    const host = req.headers.get("host") || ""
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

    if (authHeader !== internalKey && !isLocalhost) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { slug } = body

    if (!slug) {
      return NextResponse.json({ error: "Slug is required for revalidation" }, { status: 400 })
    }

    const cleanSlug = String(slug)
      .trim()
      .toLowerCase()
      .replace(/^\/?p\//, "")
      .replace(/^\/+|\/+$/g, "")

    // Invalidate both /p/[slug] and /[slug] paths
    revalidatePath(`/p/${cleanSlug}`)
    revalidatePath(`/${cleanSlug}`)
    revalidatePath("/p/[slug]", "page")

    return NextResponse.json({
      success: true,
      revalidated: true,
      slug: cleanSlug,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Revalidation failed" },
      { status: 500 }
    )
  }
}
