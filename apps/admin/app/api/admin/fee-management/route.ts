import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getAuthenticatedSession } from "@/lib/auth-helpers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * GET /api/admin/fee-management
 *
 * Proxies the request to the FastAPI backend endpoint that returns all
 * student fee installments, joined with student name, class, and section.
 *
 * Requires the caller to be authenticated as admin or account role.
 */
export async function GET(req: NextRequest) {
  // Verify session on the Next.js layer first
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cookieHeader = (await headers()).get("cookie") || ""

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/fee-management`, {
      headers: {
        cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("[fee-management] Backend returned error:", errorText)
      return NextResponse.json(
        { error: "Failed to fetch fee management data from backend" },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[fee-management] Error proxying to backend:", err)
    return NextResponse.json(
      { error: "Internal server error while fetching fee management data" },
      { status: 500 }
    )
  }
}
