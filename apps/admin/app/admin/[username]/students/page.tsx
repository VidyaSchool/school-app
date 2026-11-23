import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { user, userProfile } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"
import { StudentList } from "./student-list"

export default async function AdminStudentsPage() {
  // Enforce admin permission
  await requireRole(['admin'])

  // Fetch all student users and their profiles
  const rawStudents = await db
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
      parentName: userProfile.parentName,
      parentPhone: userProfile.parentPhone,
      onboardingCompleted: userProfile.onboardingCompleted,
    })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(eq(user.role, 'student'))
    .orderBy(desc(user.createdAt))

  const students = rawStudents.map(s => ({
    ...s,
    onboardingCompleted: s.onboardingCompleted ?? false
  }))

  return <StudentList initialStudents={students} />
}
