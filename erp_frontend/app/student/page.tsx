import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function StudentRootPage() {
  const currentUser = await requireRole(['student'])

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, currentUser.id)
  })

  if (profile?.username) {
    redirect(`/student/${profile.username}`)
  }

  redirect('/login')
}
