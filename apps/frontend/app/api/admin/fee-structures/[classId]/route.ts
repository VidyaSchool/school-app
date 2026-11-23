import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getAuthenticatedSession } from "@/lib/auth-helpers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'account')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { classId } = await params
  const cookieHeader = (await headers()).get("cookie") || ""
  const body = await req.json()

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/fee-structures/${classId}`, {
      method: "PUT",
      headers: {
        cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("[fee-structures PUT] Backend error:", errorText)
      return NextResponse.json({ error: "Failed to save fee structure" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[fee-structures PUT] Proxy error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
