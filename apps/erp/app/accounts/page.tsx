import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function AccountsRedirect() {
  const currentUser = await requireRole(['account', 'admin'])

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, currentUser.id)
  })

  if (profile?.username) {
    redirect(`/accounts/${profile.username}`)
  }

  redirect('/login')
}
