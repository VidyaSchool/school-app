import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verification as verificationTable } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP code are required" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()

    const rec = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.identifier, cleanEmail))
      .then(res => res[0])

    if (!rec) {
      return NextResponse.json({ error: "Verification code not found or expired. Please request a new one." }, { status: 400 })
    }

    if (rec.value !== cleanOtp) {
      return NextResponse.json({ error: "Invalid verification code. Please check and try again." }, { status: 400 })
    }

    if (new Date(rec.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new code." }, { status: 400 })
    }

    // OTP is valid! Delete record
    await db.delete(verificationTable).where(eq(verificationTable.identifier, cleanEmail))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[verify-otp] Server error:", err)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
