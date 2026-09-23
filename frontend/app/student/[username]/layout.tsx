import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import * as React from 'react'

export default async function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await requireRole(['student'])

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
    console.error('[StudentUsernameLayout DB query error]:', err)
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
      console.error('[StudentUsernameLayout DB retry failed]:', retryErr)
    }
  }

  // If the requested username doesn't exist, redirect everyone to their own profile
  if (!requestedProfile && currentProfile?.username) {
    redirect(`/student/${currentProfile.username}`)
  }

  // Students can only view their own profile; admins can view any
  if (user.role === 'student' && currentProfile?.username && currentProfile.username !== username) {
    redirect(`/student/${currentProfile.username}`)
  }

  return <>{children}</>
}
