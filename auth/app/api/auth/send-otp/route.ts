import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verification as verificationTable, user as userTable } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, cleanEmail))
      .then(res => res[0])

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      )
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes validity

    // Upsert into verification table
    const existingVerification = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.identifier, cleanEmail))
      .then(res => res[0])

    if (existingVerification) {
      await db
        .update(verificationTable)
        .set({
          value: otp,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(verificationTable.identifier, cleanEmail))
    } else {
      await db.insert(verificationTable).values({
        id: crypto.randomUUID(),
        identifier: cleanEmail,
        value: otp,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "VidyaSchool Verification <noreply@blazeneuro.com>",
        to: cleanEmail,
        subject: `${otp} is your VidyaSchool verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">VidyaSchool Verification</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Use the 6-digit verification code below to complete your signup.</p>
            </div>
            <div style="background-color: #f8fafc; border: 1px border-dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; tracking: 6px; color: #2563eb; letter-spacing: 6px;">${otp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This code expires in 5 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `,
      }).catch(err => {
        console.error("[send-otp] Resend email dispatch error:", err)
      })
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    })
  } catch (err: any) {
    console.error("[send-otp] Server error:", err)
    return NextResponse.json({ error: "Failed to send verification OTP" }, { status: 500 })
  }
}
