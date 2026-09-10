"use client"

import { useSession } from "@/lib/auth-client"
import { Role } from "@/lib/auth-helpers"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useRequireAuth() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
    }
  }, [session, isPending, router])

  return { user: session?.user, isPending }
}

export function useRequireRole(allowedRoles: Role | Role[]) {
  const { user, isPending } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && user) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
      const rolesWithLibrarian = roles.includes('teacher') && !roles.includes('librarian')
        ? [...roles, 'librarian' as Role]
        : roles
      if (!rolesWithLibrarian.includes(user.role as Role)) {
        router.push('/unauthorized')
      }
    }
  }, [user, isPending, allowedRoles, router])

  return { user, isPending }
}

export function useCheckRole(allowedRoles: Role | Role[]): boolean {
  const { data: session } = useSession()
  
  if (!session?.user) return false
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const rolesWithLibrarian = roles.includes('teacher') && !roles.includes('librarian')
    ? [...roles, 'librarian' as Role]
    : roles
  return rolesWithLibrarian.includes(session.user.role as Role)
}
