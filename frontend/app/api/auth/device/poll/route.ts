import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawToken = body?.device_token

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json(
        { status: "expired", message: "Device token required" },
        { status: 400 }
      )
    }

    const token = rawToken.trim()

    // Use raw SQL for neon-http compatibility
    const records = await db.execute(sql`
      SELECT * FROM "device_auth_request" WHERE "device_token" = ${token} LIMIT 1
    `)

    const record = (records as any)?.rows?.[0] || (Array.isArray(records) ? records[0] : null)

    if (!record) {
      return NextResponse.json({ status: "expired", message: "Device token not found or expired." })
    }

    if (new Date() > new Date(record.expires_at)) {
      await db.execute(sql`DELETE FROM "device_auth_request" WHERE "id" = ${record.id}`)
      return NextResponse.json({ status: "expired", message: "Device pairing code has expired." })
    }

    if (record.status === "approved") {
      // Consume record (one-time use)
      await db.execute(sql`DELETE FROM "device_auth_request" WHERE "id" = ${record.id}`)

      return NextResponse.json({
        status: "approved",
        name: record.name || "",
        email: record.email || "",
        role: record.role || "",
        session_token: record.session_token || "",
      })
    }

    return NextResponse.json({ status: "pending" })
  } catch (err: any) {
    console.error("Device poll error:", err?.message, err?.stack)
    return NextResponse.json({ status: "pending" })
  }
}
