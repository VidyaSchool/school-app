"use client"

import { useSession } from "@/contexts/session-context"
import { Role } from "@/lib/auth-helpers"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { user, isPending: isLoading }
}

export function useRequireRole(allowedRoles: Role | Role[]) {
  const { user, isLoading, hasRole } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (!hasRole(allowedRoles)) {
        router.push('/unauthorized')
      }
    }
  }, [user, isLoading, allowedRoles, hasRole, router])

  return { user, isPending: isLoading }
}

export function useCheckRole(allowedRoles: Role | Role[]): boolean {
  const { hasRole } = useSession()
  return hasRole(allowedRoles)
}

export function useRequirePermission(requiredPermission: string) {
  const { user, isLoading, hasPermission } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (!hasPermission(requiredPermission)) {
        router.push('/unauthorized')
      }
    }
  }, [user, isLoading, requiredPermission, hasPermission, router])

  return { user, isPending: isLoading }
}

export function useCheckPermission(permission: string): boolean {
  const { hasPermission } = useSession()
  return hasPermission(permission)
}
