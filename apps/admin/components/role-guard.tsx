"use client"

import { useCheckRole } from "@/lib/auth-hooks"
import { useSession } from "@/contexts/session-context"
import { Role } from "@/lib/auth-helpers"
import { ReactNode } from "react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: Role | Role[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const hasRole = useCheckRole(allowedRoles)

  if (!hasRole) {
    return fallback || null
  }

  return <>{children}</>
}

interface PermissionGuardProps {
  children: ReactNode
  permission: string
  fallback?: ReactNode
}

export function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const { hasPermission } = useSession()

  if (!hasPermission(permission)) {
    return fallback || null
  }

  return <>{children}</>
}
