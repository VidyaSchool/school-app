import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { user, userProfile } from "@/lib/schema"
import { eq, desc, or } from "drizzle-orm"
import { TeacherList } from "./teacher-list"

export default async function AdminTeachersPage() {
  // Enforce admin permission
  await requireRole(['admin'])

  // Fetch all teacher users and their profiles
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
      onboardingCompleted: userProfile.onboardingCompleted,
    })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(or(eq(user.role, 'teacher'), eq(user.role, 'librarian')))
    .orderBy(desc(user.createdAt))

  const teachers = rawTeachers.map(t => ({
    ...t,
    onboardingCompleted: t.onboardingCompleted ?? false
  }))

  return <TeacherList initialTeachers={teachers} />
}
