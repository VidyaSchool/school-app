import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { user as userTable, session as sessionTable } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawCode = body?.user_code
    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json({ error: "Device code is required" }, { status: 400 })
    }

    const code = rawCode.trim().toUpperCase()

    // 1. Find device auth record using raw SQL for neon-http compatibility
    const records = await db.execute(sql`
      SELECT * FROM "device_auth_request" WHERE "user_code" = ${code} LIMIT 1
    `)

    const record = (records as any)?.rows?.[0] || (Array.isArray(records) ? records[0] : null)

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired device pairing code." }, { status: 404 })
    }

    if (new Date() > new Date(record.expires_at)) {
      await db.execute(sql`DELETE FROM "device_auth_request" WHERE "id" = ${record.id}`)
      return NextResponse.json({ error: "Device pairing code has expired. Please try again." }, { status: 410 })
    }

    // 2. Identify logged-in user — NO FALLBACK CREDENTIALS ALLOWED
    let userObj: any = null

    try {
      const session = await auth.api.getSession({ headers: req.headers })
      if (session?.user) {
        userObj = session.user
      }
    } catch {}

    // Fallback: Direct database cookie lookup
    if (!userObj) {
      const rawCookie =
        req.cookies.get("better-auth.session_token")?.value ||
        req.cookies.get("__Secure-better-auth.session_token")?.value

      if (rawCookie) {
        const cleanToken = rawCookie.split(".")[0]
        const [dbSession] = await db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.token, cleanToken))

        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const [dbUser] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, dbSession.userId))

          if (dbUser) {
            userObj = dbUser
          }
        }
      }
    }

    // SECURITY: Reject if no authenticated user found
    if (!userObj) {
      return NextResponse.json({ error: "You must be logged in to approve a device." }, { status: 401 })
    }

    // SECURITY: Only use DB-sourced values — never from request body
    const userId = userObj.id
    const name = userObj.name || ""
    const email = userObj.email || ""
    const role = userObj.role || ""

    // SECURITY: Generate a dedicated desktop session token (not shared with browser)
    const desktopToken = crypto.randomBytes(32).toString("hex")
    const desktopSessionId = `desktop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
    const desktopExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Insert a new dedicated session for the desktop app
    await db.execute(sql`
      INSERT INTO "session" ("id", "token", "user_id", "expires_at", "created_at", "updated_at", "user_agent", "ip_address")
      VALUES (${desktopSessionId}, ${desktopToken}, ${userId}, ${desktopExpiry.toISOString()}::timestamp, NOW(), NOW(), 'VidyaSchool Desktop App', 'device-auth')
    `)

    // 3. Mark device auth request as approved
    await db.execute(sql`
      UPDATE "device_auth_request"
      SET "status" = 'approved',
          "user_id" = ${userId},
          "name" = ${name},
          "email" = ${email},
          "role" = ${role},
          "session_token" = ${desktopToken},
          "updated_at" = NOW()
      WHERE "id" = ${record.id}
    `)

    return NextResponse.json({
      success: true,
      message: `Device authorized successfully for ${name}!`,
      user_code: code,
      role,
    })
  } catch (err: any) {
    console.error("Device approval error:", err?.message, err?.stack)
    const errorMsg = process.env.NODE_ENV !== "production" ? err?.message : "Internal error"
    return NextResponse.json(
      { error: `Failed to approve device code: ${errorMsg}` },
      { status: 500 }
    )
  }
}
