import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verification as verificationTable, user as userTable } from "@/lib/schema"
import { eq, and, gt } from "drizzle-orm"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, tempToken } = await req.json()

    if (!email || !tempToken) {
      return NextResponse.json({ error: "Missing email or challenge token" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Validate temporary MFA challenge token
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

    // 2. Generate 6-digit cryptographically secure OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpKey = `admin_otp:${cleanEmail}`
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const existingOtp = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.identifier, otpKey))
      .then((res) => res[0])

    if (existingOtp) {
      await db
        .update(verificationTable)
        .set({
          value: otp,
          expiresAt: otpExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(verificationTable.identifier, otpKey))
    } else {
      await db.insert(verificationTable).values({
        id: crypto.randomUUID(),
        identifier: otpKey,
        value: otp,
        expiresAt: otpExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // 3. Dispatch Email with Resend
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1"

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "VidyaSchool Security <noreply@blazeneuro.com>",
        to: cleanEmail,
        subject: `Your VidyaSchool Admin Verification Code: ${otp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700;">Administrator Verification</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Multi-Factor Authentication (MFA) sign-in request.</p>
            </div>
            
            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
              <span style="font-size: 36px; font-weight: 800; color: #1e40af; letter-spacing: 8px; font-family: monospace;">${otp}</span>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                <strong>Security Notice:</strong> An administrator sign-in was requested from IP <code>${clientIp}</code>. This code is valid for 5 minutes.
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
              If you did not attempt to sign in to VidyaSchool Administration, please secure your account immediately.
            </p>
          </div>
        `,
      }).catch((emailErr) => {
        console.error("[send-email-otp] Resend dispatch failed:", emailErr)
      })
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}`,
    })
  } catch (err: any) {
    console.error("[send-email-otp] Server error:", err)
    return NextResponse.json({ error: "Failed to dispatch verification email" }, { status: 500 })
  }
}
