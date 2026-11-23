import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function LibrarianRootPage() {
  const currentUser = await requireRole(['librarian', 'admin'])

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, currentUser.id)
  })

  if (profile?.username) {
    redirect(`/librarian/${profile.username}`)
  }

  redirect('/login')
}
