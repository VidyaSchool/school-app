"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

export interface UserSession {
  id: string
  name: string
  email: string
  role?: string
  image?: string | null
  emailVerified?: boolean
  teacherApprovalStatus?: string
  preferredRole?: string
  username?: string | null
  admissionNumber?: string | null
  onboardingCompleted?: boolean
  class?: string | null
  section?: string | null
  createdAt?: string | null
  [key: string]: unknown
}

export interface SessionContextType {
  user: UserSession | null
  role: string | null
  permissions: string[]
  isLoading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (role: string | string[]) => boolean
  refreshSession: () => Promise<void>

  // Backward compatibility aliases for existing better-auth consumers
  data: { user: UserSession } | null
  isPending: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

// Module-level in-flight request tracker to guarantee that concurrent mounts
// or calls across the entire application share a single network request.
let globalInFlightPromise: Promise<{
  user: UserSession | null
  role: string | null
  permissions: string[]
  isAuthenticated: boolean
} | null> | null = null

export function resetGlobalSessionPromise() {
  globalInFlightPromise = null
}

export async function fetchSessionDeduplicated(): Promise<{
  user: UserSession | null
  role: string | null
  permissions: string[]
  isAuthenticated: boolean
} | null> {
  if (globalInFlightPromise) {
    return globalInFlightPromise
  }

  globalInFlightPromise = (async () => {
    try {
      const res = await fetch("/api/session", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      })

      if (res.status === 401 || res.status === 403) {
        return {
          user: null,
          role: null,
          permissions: [],
          isAuthenticated: false,
        }
      }

      if (!res.ok) {
        return null
      }

      const data = await res.json()
      const userData: UserSession | null = data.user || null
      const roleName: string | null = data.role || userData?.role || null
      const perms: string[] = Array.isArray(data.permissions) ? data.permissions : []
      const isAuth: boolean = Boolean(data.isAuthenticated ?? !!userData)

      return {
        user: userData,
        role: roleName,
        permissions: perms,
        isAuthenticated: isAuth,
      }
    } catch {
      return null
    } finally {
      globalInFlightPromise = null
    }
  })()

  return globalInFlightPromise
}

export interface SessionProviderProps {
  children: ReactNode
  initialSession?: {
    user: UserSession | null
    role?: string | null
    permissions?: string[]
    isAuthenticated?: boolean
  }
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [user, setUser] = useState<UserSession | null>(initialSession?.user || null)
  const [role, setRole] = useState<string | null>(
    initialSession?.role || initialSession?.user?.role || null
  )
  const [permissions, setPermissions] = useState<string[]>(
    initialSession?.permissions || []
  )
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(initialSession?.isAuthenticated ?? !!initialSession?.user)
  )
  const [isLoading, setIsLoading] = useState<boolean>(!initialSession)

  const hasLoadedRef = useRef(Boolean(initialSession))

  const loadSession = useCallback(async (isRefresh = false) => {
    if (!isRefresh && hasLoadedRef.current) {
      return
    }

    if (isRefresh) {
      globalInFlightPromise = null
    }

    setIsLoading(true)

    try {
      const result = await fetchSessionDeduplicated()
      if (result) {
        setUser(result.user)
        setRole(result.role)
        setPermissions(result.permissions)
        setIsAuthenticated(result.isAuthenticated)
      } else {
        setUser((prev) => prev)
      }
    } catch {
      // Keep existing state or mark unauthenticated
    } finally {
      setIsLoading(false)
      hasLoadedRef.current = true
    }
  }, [])

  const refreshSession = useCallback(async () => {
    await loadSession(true)
  }, [loadSession])

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadSession(false)
    }

    const handleAuthRefresh = () => {
      refreshSession()
    }

    const handleAuthLogout = () => {
      setUser(null)
      setRole(null)
      setPermissions([])
      setIsAuthenticated(false)
      setIsLoading(false)
    }

    window.addEventListener("auth:refresh", handleAuthRefresh)
    window.addEventListener("auth:logout", handleAuthLogout)

    // Real-time WebSocket push invalidation
    let socket: any = null
    if (typeof window !== "undefined" && user?.id) {
      import("socket.io-client")
        .then(({ io }) => {
          const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            (window.location.hostname !== "localhost"
              ? "https://api.vidyaschool.com"
              : "http://localhost:8000")
          socket = io(backendUrl, {
            transports: ["polling", "websocket"],
            reconnectionAttempts: 3,
          })

          socket.on("connect", () => {
            socket.emit("join", {
              userId: user.id,
              name: user.name,
              role: user.role,
            })
          })

          socket.on("session:invalidated", (payload: any) => {
            if (
              !payload?.userId ||
              payload.userId === user.id ||
              (payload.role && payload.role === role)
            ) {
              refreshSession()
            }
          })
        })
        .catch(() => {})
    }

    return () => {
      window.removeEventListener("auth:refresh", handleAuthRefresh)
      window.removeEventListener("auth:logout", handleAuthLogout)
      if (socket) {
        socket.disconnect()
      }
    }
  }, [loadSession, refreshSession, user?.id, role])

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!isAuthenticated || !role) return false
      if (role.toLowerCase() === "admin" || permissions.includes("*")) {
        return true
      }
      return permissions.includes(permission)
    },
    [isAuthenticated, role, permissions]
  )

  const hasAnyPermission = useCallback(
    (targetPermissions: string[]): boolean => {
      if (!isAuthenticated || !role) return false
      if (role.toLowerCase() === "admin" || permissions.includes("*")) {
        return true
      }
      return targetPermissions.some((perm) => permissions.includes(perm))
    },
    [isAuthenticated, role, permissions]
  )

  const hasRole = useCallback(
    (requiredRole: string | string[]): boolean => {
      if (!isAuthenticated || !role) return false
      const currentRole = role.toLowerCase()
      const allowedRoles = (
        Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      ).map((r) => r.toLowerCase())

      if (allowedRoles.includes("teacher") && !allowedRoles.includes("librarian")) {
        allowedRoles.push("librarian")
      }

      return allowedRoles.includes(currentRole)
    },
    [isAuthenticated, role]
  )

  const contextValue = useMemo<SessionContextType>(
    () => ({
      user,
      role,
      permissions,
      isLoading,
      isAuthenticated,
      hasPermission,
      hasAnyPermission,
      hasRole,
      refreshSession,
      data: user ? { user } : null,
      isPending: isLoading,
    }),
    [
      user,
      role,
      permissions,
      isLoading,
      isAuthenticated,
      hasPermission,
      hasAnyPermission,
      hasRole,
      refreshSession,
    ]
  )

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
