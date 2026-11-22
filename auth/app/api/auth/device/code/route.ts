import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function ensureDeviceAuthTable() {
  try {
    // Run each DDL statement separately for neon-http compatibility
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
      )
    `)
  } catch (err: any) {
    // Table might already exist, that's fine
    console.log("Device auth table creation note:", err?.message || "unknown")
  }

  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_device_auth_code" ON "device_auth_request" ("user_code")`)
  } catch {}
  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_device_auth_token" ON "device_auth_request" ("device_token")`)
  } catch {}
}

function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let p1 = ""
  let p2 = ""
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length))
    p2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${p1}-${p2}`
}

export async function POST(req: NextRequest) {
  try {
    await ensureDeviceAuthTable()

    const userCode = generateUserCode()
    const deviceToken = crypto.randomBytes(32).toString('hex')
    const id = `dev_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://beta.vidyaschool.com" : "http://localhost:3000")
    const verificationUri = `${configuredUrl.replace(/\/+$/, "")}/auth/device?code=${userCode}`

    // Use raw SQL insert for maximum compatibility with neon-http
    await db.execute(sql`
      INSERT INTO "device_auth_request" ("id", "user_code", "device_token", "status", "expires_at", "created_at", "updated_at")
      VALUES (${id}, ${userCode}, ${deviceToken}, 'pending', ${expiresAt.toISOString()}::timestamp, NOW(), NOW())
    `)

    return NextResponse.json(
      {
        user_code: userCode,
        device_token: deviceToken,
        verification_uri: verificationUri,
        expires_in: 600,
        interval: 3,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (err: any) {
    console.error("Failed to generate device auth code:", err?.message, err?.stack)
    const errorMsg = process.env.NODE_ENV !== 'production' ? err?.message : 'Internal error'
    return NextResponse.json(
      { error: `Failed to generate device pairing code: ${errorMsg}` },
      { status: 500 }
    )
  }
}
