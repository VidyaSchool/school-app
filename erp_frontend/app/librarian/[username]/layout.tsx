import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import * as React from 'react'

export default async function LibrarianUsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<any>
}) {
  const { username } = (await params) as { username: string }
  const user = await requireRole(['librarian', 'admin'])

  // Fetch profiles concurrently to optimize latency
  const [currentProfile, requestedProfile] = await Promise.all([
    db.query.userProfile.findFirst({
      where: eq(userProfile.userId, user.id)
    }),
    db.query.userProfile.findFirst({
      where: eq(userProfile.username, username)
    })
  ])

  // If the requested username doesn't exist, redirect everyone to their own profile
  if (!requestedProfile && currentProfile?.username) {
    redirect(`/librarian/${currentProfile.username}`)
  }

  // Librarians can only view their own profile/dashboard; admins can view any
  if (user.role === 'librarian' && currentProfile?.username && currentProfile.username !== username) {
    redirect(`/librarian/${currentProfile.username}`)
  }

  return <>{children}</>
}
