import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { teacherRequest, user } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const { userId, preferredRole } = await request.json()
    
    if (preferredRole === "teacher" || preferredRole === "librarian") {
      const requestId = crypto.randomUUID()
      
      await db.insert(teacherRequest).values({
        id: requestId,
        userId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const userData = await db.update(user)
        .set({ 
          preferredRole: preferredRole,
          teacherApprovalStatus: "pending"
        })
        .where(eq(user.id, userId))
        .returning()
      
      // Notify backend to broadcast to admins
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/notify-teacher-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          userId,
          userName: userData[0]?.name || "",
          userEmail: userData[0]?.email || "",
          status: "pending",
          createdAt: new Date().toISOString()
        })
      }).catch(err => console.error("Failed to notify backend:", err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to create teacher request:", error)
    return NextResponse.json(
      { error: "Failed to create teacher request" },
      { status: 500 }
    )
  }
}
