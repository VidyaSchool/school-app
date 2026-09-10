import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verification as verificationTable, user as userTable, userProfile, session as sessionTable } from "@/lib/schema"
import { eq, and, gt } from "drizzle-orm"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, tempToken, credentialId, deviceName } = await req.json()

    if (!email || !tempToken || !credentialId) {
      return NextResponse.json(
        { error: "Email, device credential ID, and challenge token are required" },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Verify challenge token
    const challengeKey = `admin_challenge:${cleanEmail}`
    const validChallenge = await db
      .select()
      .from(verificationTable)
      .where(
        and(
          eq(verificationTable.identifier, challengeKey),
          eq(verificationTable.value, tempToken),
          gt(verificationTable.expiresAt, new Date())
        )
      )
      .then((res) => res[0])

    if (!validChallenge) {
      return NextResponse.json(
        { error: "Authentication challenge expired. Please re-enter your credentials." },
        { status: 401 }
      )
    }

    // 2. Clear consumed challenge
    await db.delete(verificationTable).where(eq(verificationTable.identifier, challengeKey))

    // 3. Retrieve user & verify admin role
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, cleanEmail))
      .then((res) => res[0])

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied: Unauthorized role" }, { status: 403 })
    }

    // 4. Save/Update physical device registration in verification table
    const deviceKey = `admin_device:${user.id}`
    const deviceExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    const devicePayload = JSON.stringify({
      credentialId,
      deviceName: deviceName || "Physical Security Key / Biometric Sensor",
      verifiedAt: new Date().toISOString(),
    })

    const existingDevice = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.identifier, deviceKey))
      .then((res) => res[0])

    if (existingDevice) {
      await db
        .update(verificationTable)
        .set({
          value: devicePayload,
          expiresAt: deviceExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(verificationTable.identifier, deviceKey))
    } else {
      await db.insert(verificationTable).values({
        id: crypto.randomUUID(),
        identifier: deviceKey,
        value: devicePayload,
        expiresAt: deviceExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // 5. Retrieve destination username
    const profile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, user.id))
      .then((res) => res[0])

    const redirectUrl = profile?.username ? `/admin/${profile.username}` : "/admin"

    // 6. Create Better Auth session in PostgreSQL
    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1"
    const userAgent = req.headers.get("user-agent") || "VidyaSchool Admin Passkey Auth"

    await db.insert(sessionTable).values({
      id: crypto.randomUUID(),
      token: sessionToken,
      userId: user.id,
      expiresAt,
      ipAddress: clientIp,
      userAgent,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // 7. Return response with HttpOnly session cookies
    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      message: "Physical device authentication successful",
    })

    const isProd = process.env.NODE_ENV === "production"

    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    if (isProd) {
      response.cookies.set("__Secure-better-auth.session_token", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (err: any) {
    console.error("[verify-device] Device verification error:", err)
    return NextResponse.json({ error: "Failed to verify physical device" }, { status: 500 })
  }
}
