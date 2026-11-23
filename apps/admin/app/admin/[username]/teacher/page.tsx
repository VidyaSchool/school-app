import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { user, userProfile } from "@/lib/schema"
import { eq, desc, or } from "drizzle-orm"
import { headers } from "next/headers"
import { TeacherList } from "./teacher-list"

export default async function AdminTeachersPage() {
  // Enforce admin permission
  await requireRole(['admin'])

  const cookieHeader = (await headers()).get("cookie") || ""
  const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, '')

  let teachers: any[] = []

  // 1. Primary: Fetch from FastAPI Backend Server
  try {
    const res = await fetch(`${backendUrl}/api/admin/teachers`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    })

    if (res.ok) {
      const data = await res.json()
      teachers = data.map((t: any) => ({
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      }))
    } else {
      throw new Error(`FastAPI responded with status: ${res.status}`)
    }
  } catch (err) {
    console.warn("[AdminTeachersPage] Backend fetch failed or timed out, falling back to direct DB query:", err)
    // 2. Resilient Fallback: Direct DB query via Drizzle ORM
    const rawTeachers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        role: user.role,
        admissionNumber: userProfile.admissionNumber,
        username: userProfile.username,
        class: userProfile.class,
        section: userProfile.section,
        phoneNumber: userProfile.phoneNumber,
        teacherCategory: userProfile.teacherCategory,
        activitySkills: userProfile.activitySkills,
        isAvailableForSubstitution: userProfile.isAvailableForSubstitution,
        onboardingCompleted: userProfile.onboardingCompleted,
      })
      .from(user)
      .leftJoin(userProfile, eq(user.id, userProfile.userId))
      .where(or(eq(user.role, 'teacher'), eq(user.role, 'librarian')))
      .orderBy(desc(user.createdAt))

    teachers = rawTeachers.map(t => ({
      ...t,
      onboardingCompleted: t.onboardingCompleted ?? false,
      isAvailableForSubstitution: t.isAvailableForSubstitution ?? true,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
    }))
  }

  return <TeacherList initialTeachers={teachers} />
}
