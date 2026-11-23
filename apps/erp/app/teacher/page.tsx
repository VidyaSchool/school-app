import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function TeacherRootPage() {
  const currentUser = await requireRole(['teacher', 'admin', 'librarian'])

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, currentUser.id)
  })

  if (profile?.username) {
    redirect(`/teacher/${profile.username}`)
  }

  redirect('/login')
}
