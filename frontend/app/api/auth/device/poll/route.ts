import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceAuthRequest } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function ensureDeviceAuthTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "device_auth_request" (
        "id" text PRIMARY KEY,
        "user_code" text NOT NULL UNIQUE,
        "device_token" text NOT NULL UNIQUE,
        "status" text NOT NULL DEFAULT 'pending',
        "user_id" text,
        "name" text,
        "email" text,
        "role" text,
        "session_token" text,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_device_auth_code" ON "device_auth_request" ("user_code");
      CREATE INDEX IF NOT EXISTS "idx_device_auth_token" ON "device_auth_request" ("device_token");
    `)
  } catch (err) {
    console.error("Failed to ensure device_auth_request table exists:", err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDeviceAuthTable()
    const body = await req.json().catch(() => ({}))
    const rawToken = body?.device_token

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json({ status: "expired", message: "Device token required" }, { status: 400 })
    }

    const token = rawToken.trim()

    const [record] = await db
      .select()
      .from(deviceAuthRequest)
      .where(eq(deviceAuthRequest.deviceToken, token))

    if (!record) {
      return NextResponse.json({ status: "expired", message: "Device token not found or expired." })
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(deviceAuthRequest).where(eq(deviceAuthRequest.id, record.id))
      return NextResponse.json({ status: "expired", message: "Device pairing code has expired." })
    }

    if (record.status === "approved") {
      // Consume record
      await db.delete(deviceAuthRequest).where(eq(deviceAuthRequest.id, record.id))

      return NextResponse.json({
        status: "approved",
        name: record.name || "Teacher User",
        email: record.email || "teacher@vidyaschool.com",
        role: record.role || "teacher",
        session_token: record.sessionToken || "",
      })
    }

    return NextResponse.json({ status: "pending" })
  } catch (err: any) {
    console.error("Device poll error:", err)
    return NextResponse.json({ status: "pending" })
  }
}
