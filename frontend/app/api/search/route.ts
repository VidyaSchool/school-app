import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userProfile, customPage } from "@/lib/schema"
import { eq, or, ilike, and } from "drizzle-orm"

function extractWidgetText(widgets: unknown): string {
  const texts: string[] = []
  function traverse(item: unknown) {
    if (!item) return
    if (typeof item === "object" && item !== null) {
      const rec = item as Record<string, unknown>
      const props = (typeof rec.props === "object" && rec.props !== null ? rec.props : rec) as Record<string, unknown>
      for (const key of [
        "text", "title", "description", "label", "label1", "label2", "label3",
        "stat1", "stat2", "stat3", "q1", "a1", "q2", "a2", "q3", "a3",
        "col1Title", "col1Body", "col2Title", "col2Body", "col3Title", "col3Body"
      ]) {
        if (typeof props[key] === "string" && (props[key] as string).trim()) {
          texts.push((props[key] as string).trim())
        }
      }
      for (const k of ["col1Widgets", "col2Widgets", "col3Widgets", "widgets", "children", "blocks", "items"]) {
        if (Array.isArray(rec[k])) traverse(rec[k])
      }
    } else if (Array.isArray(item)) {
      for (const sub of item) traverse(sub)
    }
  }
  traverse(widgets)
  return texts.join(" ")
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("query") || searchParams.get("q") || ""

    if (!query.trim()) {
      return NextResponse.json([])
    }

    const session = await auth.api.getSession({
      headers: req.headers
    })

    const role = session?.user?.role || ""
    let username = ""

    if (session?.user?.id) {
      try {
        const profile = await db.query.userProfile.findFirst({
          where: eq(userProfile.userId, session.user.id)
        })
        if (profile?.username) {
          username = profile.username
        }
      } catch (err) {
        console.error("Error fetching username in search:", err)
      }
    }

    // 1. Attempt to query the backend search engine (which includes static docs + custom pages)
    try {
      const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, '')
      const backendSearchUrl = `${backendUrl}/api/search?q=${encodeURIComponent(query)}&role=${role}&username=${username}`

      const res = await fetch(backendSearchUrl, { cache: "no-store" })
      if (res.ok) {
        const results = await res.json()
        if (Array.isArray(results) && results.length > 0) {
          return NextResponse.json(results)
        }
      }
    } catch {
      // Backend offline or unreachable -> proceed to direct database search
    }

    // 2. Direct PostgreSQL fallback: search page-builder customPage records
    try {
      const condition = role === "admin"
        ? or(
            ilike(customPage.title, `%${query}%`),
            ilike(customPage.slug, `%${query}%`),
            ilike(customPage.widgetsJson, `%${query}%`)
          )
        : and(
            eq(customPage.status, "published"),
            or(
              ilike(customPage.title, `%${query}%`),
              ilike(customPage.slug, `%${query}%`),
              ilike(customPage.widgetsJson, `%${query}%`)
            )
          )

      const pages = await db
        .select()
        .from(customPage)
        .where(condition)
        .limit(10)

      const fallbackResults: Array<{ id: string; title: string; content: string; url: string }> = []
      for (const p of pages) {
        let snippet = ""
        try {
          const widgets = JSON.parse(p.widgetsJson || "[]")
          const fullText = extractWidgetText(widgets)
          snippet = fullText.slice(0, 160).trim()
          if (fullText.length > 160) snippet += "..."
        } catch {}

        fallbackResults.push({
          id: `page-custom-${p.slug}`,
          title: p.title,
          content: snippet || `Custom page created via Page Builder: /${p.slug}`,
          url: `/p/${p.slug}`,
        })

        if (role === "admin" && username) {
          fallbackResults.push({
            id: `builder-edit-${p.id}`,
            title: `Edit ${p.title} (Page Builder)`,
            content: `Open Elementor Page Builder editor for /${p.slug}`,
            url: `/admin/${username}/page-builder/${p.id}`,
          })
        }
      }

      return NextResponse.json(fallbackResults)
    } catch (dbErr) {
      console.error("Local search fallback error:", dbErr)
      return NextResponse.json([])
    }
  } catch (err: unknown) {
    console.error("Search API route error:", err)
    return NextResponse.json([])
  }
}
