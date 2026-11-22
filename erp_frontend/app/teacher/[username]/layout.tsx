import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import * as React from 'react'

export default async function TeacherUsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<any>
}) {
  const { username } = (await params) as { username: string }
  const user = await requireRole(['teacher', 'librarian', 'admin'])

  // Fetch current user profile first to optimize connection pool and eliminate duplicate queries
  let currentProfile: any = null
  let requestedProfile: any = null

  try {
    currentProfile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, user.id),
    })

    if (currentProfile?.username === username) {
      requestedProfile = currentProfile
    } else {
      requestedProfile = await db.query.userProfile.findFirst({
        where: eq(userProfile.username, username),
      })
    }
  } catch (err) {
    console.error('[TeacherUsernameLayout DB query error]:', err)
    // Transient pool/network retry
    try {
      currentProfile = await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, user.id),
      })
      if (currentProfile?.username === username) {
        requestedProfile = currentProfile
      } else {
        requestedProfile = await db.query.userProfile.findFirst({
          where: eq(userProfile.username, username),
        })
      }
    } catch (retryErr) {
      console.error('[TeacherUsernameLayout DB retry failed]:', retryErr)
    }
  }



  // If the requested username doesn't exist, redirect everyone to their own profile
  if (!requestedProfile && currentProfile?.username) {
    redirect(`/teacher/${currentProfile.username}`)
  }

  // Teachers/librarians can only view their own profile/dashboard; admins can view any
  if ((user.role === 'teacher' || user.role === 'librarian') && currentProfile?.username && currentProfile.username !== username) {
    redirect(`/teacher/${currentProfile.username}`)
  }

  return <>{children}</>
}
