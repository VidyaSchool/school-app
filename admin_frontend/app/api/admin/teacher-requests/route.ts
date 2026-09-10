import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { teacherRequest, user } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const requests = await db
      .select({
        id: teacherRequest.id,
        userId: teacherRequest.userId,
        status: teacherRequest.status,
        createdAt: teacherRequest.createdAt,
        userName: user.name,
        userEmail: user.email,
        preferredRole: user.preferredRole,
      })
      .from(teacherRequest)
      .leftJoin(user, eq(teacherRequest.userId, user.id))
      .orderBy(teacherRequest.createdAt)

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Failed to fetch teacher requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch teacher requests" },
      { status: 500 }
    )
  }
}
