import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { verification as verificationTable, user as userTable } from "@/lib/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Verify user exists in database and has 'admin' role
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, cleanEmail))
      .then((res) => res[0])

    if (!existingUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (existingUser.role !== "admin") {
      return NextResponse.json(
        { error: "Access Denied: This console is strictly reserved for School Administrators." },
        { status: 403 }
      )
    }

    // 2. Validate password using Better-Auth
    try {
      const signInResult = await auth.api.signInEmail({
        body: {
          email: cleanEmail,
          password: password,
        },
      })

      if (!signInResult || !signInResult.user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }
    } catch (authErr: any) {
      return NextResponse.json(
        { error: authErr?.message || "Invalid email or password" },
        { status: 401 }
      )
    }

    // 3. Credentials verified! Generate temporary MFA challenge token (10 minute validity)
    const tempToken = crypto.randomUUID()
    const challengeKey = `admin_challenge:${cleanEmail}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const existingChallenge = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.identifier, challengeKey))
      .then((res) => res[0])

    if (existingChallenge) {
      await db
        .update(verificationTable)
        .set({
          value: tempToken,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(verificationTable.identifier, challengeKey))
    } else {
      await db.insert(verificationTable).values({
        id: crypto.randomUUID(),
        identifier: challengeKey,
        value: tempToken,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Check if user has previously registered a physical device / passkey
    const registeredDevices = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.identifier, `admin_device:${existingUser.id}`))

    return NextResponse.json({
      success: true,
      requiresMfa: true,
      tempToken,
      email: existingUser.email,
      name: existingUser.name,
      hasPasskey: registeredDevices.length > 0,
    })
  } catch (err: any) {
    console.error("[verify-credentials] Internal error:", err)
    return NextResponse.json({ error: "Authentication verification failed" }, { status: 500 })
  }
}
