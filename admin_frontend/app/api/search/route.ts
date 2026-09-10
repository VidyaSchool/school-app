import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

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

    const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, '')
    const backendSearchUrl = `${backendUrl}/api/search?q=${encodeURIComponent(query)}&role=${role}&username=${username}`

    const res = await fetch(backendSearchUrl)
    if (!res.ok) {
      throw new Error(`Backend search failed with status: ${res.status}`)
    }

    const results = await res.json()
    return NextResponse.json(results)
  } catch (err: any) {
    console.error("Search API route error:", err)
    // Fallback empty array on error instead of throwing a blank 500 to keep UI functional
    return NextResponse.json([])
  }
}
