import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user, userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const admins = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: userProfile.username,
        designation: userProfile.designation,
        createdAt: user.createdAt,
      })
      .from(user)
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .where(eq(user.role, "admin"))

    return NextResponse.json(admins)
  } catch (error) {
    console.error("Failed to fetch admins:", error)
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    )
  }
}
