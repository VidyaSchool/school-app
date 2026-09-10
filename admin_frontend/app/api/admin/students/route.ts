import { NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { user, userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export function isTransportUser(transportMode?: string | null): boolean {
  if (!transportMode) return false
  const mode = String(transportMode).trim().toLowerCase()
  const nonTransport = new Set([
    "none", "", "walking", "walk", "self", "self_transport",
    "self transport", "on_foot", "foot", "private", "no", "personal"
  ])
  return !nonTransport.has(mode)
}

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'account')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const students = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: userProfile.username,
        class: userProfile.class,
        section: userProfile.section,
        admission_number: userProfile.admissionNumber,
        transport_mode: userProfile.transportMode,
      })
      .from(user)
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .where(eq(user.role, "student"))

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      username: s.username || s.name.toLowerCase().replace(/\s+/g, "_"),
      class: s.class || "10",
      section: s.section || "A",
      admission_number: s.admission_number || "ADM-001",
      transport_mode: s.transport_mode || "walking",
      uses_transport: isTransportUser(s.transport_mode),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Failed to fetch students for accounts:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}
