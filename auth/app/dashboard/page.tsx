import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function AuthDashboardRedirect() {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null)

  const ERP_URL = process.env.NEXT_PUBLIC_ERP_URL || 'http://localhost:3003'
  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as any
  if (user.role === 'admin') {
    redirect(`${ADMIN_URL}/admin`)
  }

  try {
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, user.id)
    })

    if (!profile?.onboardingCompleted || !profile?.username) {
      redirect('/signup/onboarding')
    }

    const roleMap: Record<string, string> = {
      teacher: '/teacher',
      librarian: '/librarian',
      account: '/accounts',
      student: '/student',
    }

    const prefix = roleMap[user.role] || '/student'
    redirect(`${ERP_URL}${prefix}/${profile.username}`)
  } catch {
    redirect(`${ERP_URL}/dashboard`)
  }
}
