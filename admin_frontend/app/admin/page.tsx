import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export default async function AdminRootPage() {
  const currentUser = await requireRole(['admin'])

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, currentUser.id)
  })

  if (profile?.username) {
    redirect(`/admin/${profile.username}`)
  }

  redirect('/login')
}
