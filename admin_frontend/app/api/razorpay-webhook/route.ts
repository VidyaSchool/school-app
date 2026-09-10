import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-razorpay-signature") ?? ""
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(rawBody) as { event: string; payload?: { payment?: { entity?: { order_id?: string; id?: string; status?: string } } } }

  if (event.event === "payment.captured") {
    // Forward to backend to mark fees as paid
    const backendUrl = process.env.BACKEND_URL
    const orderId = event.payload?.payment?.entity?.order_id
    const paymentId = event.payload?.payment?.entity?.id

    if (backendUrl && orderId && paymentId) {
      await fetch(`${backendUrl}/api/razorpay/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": signature,
        },
        body: rawBody,
      }).catch(() => null) // best-effort
    }
  }

  return NextResponse.json({ received: true })
}
