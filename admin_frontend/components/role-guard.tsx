"use client"

import { useCheckRole } from "@/lib/auth-hooks"
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
