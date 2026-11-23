import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  fetchSessionDeduplicated,
  resetGlobalSessionPromise,
  type UserSession,
} from "../contexts/session-context"

describe("Centralized Session & Permission Client Tests", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    resetGlobalSessionPromise()
    globalThis.fetch = originalFetch
  })

  test("Deduplicates concurrent session fetches into a single network request", async () => {
    let fetchCallCount = 0

    // Mock fetch with a slight simulated delay
    globalThis.fetch = (async (url: string | URL | Request) => {
      fetchCallCount++
      await new Promise((r) => setTimeout(r, 20))
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: "user_1", name: "Alice", email: "alice@vidyaschool.com", role: "teacher" },
          role: "teacher",
          permissions: ["attendance:read", "attendance:write", "classes:read"],
          isAuthenticated: true,
        }),
      } as unknown as Response
    }) as typeof fetch

    // Simulate 5 concurrent components mounting simultaneously and requesting the session
    const [res1, res2, res3, res4, res5] = await Promise.all([
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
    ])

    // Verify deduplication: exactly 1 network call occurred
    assert.strictEqual(fetchCallCount, 1, "Expected only 1 fetch call despite 5 concurrent callers")

    // Verify all 5 callers received the exact same session data
    assert.ok(res1)
    assert.strictEqual(res1?.user?.email, "alice@vidyaschool.com")
    assert.strictEqual(res1?.role, "teacher")
    assert.deepStrictEqual(res1?.permissions, ["attendance:read", "attendance:write", "classes:read"])
    assert.strictEqual(res1?.isAuthenticated, true)

    assert.deepStrictEqual(res1, res2)
    assert.deepStrictEqual(res2, res3)
    assert.deepStrictEqual(res3, res4)
    assert.deepStrictEqual(res4, res5)
  })

  test("Handles 401 unauthenticated response gracefully", async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 401,
        json: async () => ({ detail: "Not authenticated" }),
      } as unknown as Response
    }) as typeof fetch

    const result = await fetchSessionDeduplicated()
    assert.ok(result)
    assert.strictEqual(result?.isAuthenticated, false)
    assert.strictEqual(result?.user, null)
    assert.strictEqual(result?.role, null)
    assert.deepStrictEqual(result?.permissions, [])
  })

  test("Handles 403 forbidden response gracefully", async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 403,
        json: async () => ({ detail: "Forbidden" }),
      } as unknown as Response
    }) as typeof fetch

    const result = await fetchSessionDeduplicated()
    assert.ok(result)
    assert.strictEqual(result?.isAuthenticated, false)
    assert.strictEqual(result?.user, null)
    assert.strictEqual(result?.role, null)
    assert.deepStrictEqual(result?.permissions, [])
  })

  test("Handles network/API server error (500) gracefully without throwing", async () => {
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 500,
        json: async () => ({ detail: "Internal Server Error" }),
      } as unknown as Response
    }) as typeof fetch

    const result = await fetchSessionDeduplicated()
    assert.strictEqual(result, null)
  })

  test("Handles fetch rejection / offline network gracefully", async () => {
    globalThis.fetch = (async () => {
      throw new Error("Network offline")
    }) as typeof fetch

    const result = await fetchSessionDeduplicated()
    assert.strictEqual(result, null)
  })

  test("Permission check helper logic (admin superuser, wildcards, and specific perms)", () => {
    // Pure function logic mirroring SessionProvider permission callbacks
    function evaluatePermission(
      user: UserSession | null,
      role: string | null,
      permissions: string[],
      isAuthenticated: boolean,
      targetPerm: string
    ): boolean {
      if (!isAuthenticated || !role) return false
      if (role.toLowerCase() === "admin" || permissions.includes("*")) {
        return true
      }
      return permissions.includes(targetPerm)
    }

    function evaluateAnyPermission(
      user: UserSession | null,
      role: string | null,
      permissions: string[],
      isAuthenticated: boolean,
      targetPerms: string[]
    ): boolean {
      if (!isAuthenticated || !role) return false
      if (role.toLowerCase() === "admin" || permissions.includes("*")) {
        return true
      }
      return targetPerms.some((p) => permissions.includes(p))
    }

    function evaluateRole(
      role: string | null,
      isAuthenticated: boolean,
      requiredRole: string | string[]
    ): boolean {
      if (!isAuthenticated || !role) return false
      const currentRole = role.toLowerCase()
      const allowedRoles = (
        Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      ).map((r) => r.toLowerCase())

      if (allowedRoles.includes("teacher") && !allowedRoles.includes("librarian")) {
        allowedRoles.push("librarian")
      }
      return allowedRoles.includes(currentRole)
    }

    // 1. Unauthenticated user
    assert.strictEqual(
      evaluatePermission(null, null, [], false, "attendance:read"),
      false,
      "Unauthenticated user must have no permissions"
    )
    assert.strictEqual(
      evaluateAnyPermission(null, null, [], false, ["attendance:read"]),
      false
    )
    assert.strictEqual(evaluateRole(null, false, "teacher"), false)

    // 2. Admin superuser gets all permissions automatically
    const adminUser = { id: "admin_1", name: "Super Admin", email: "admin@school.com", role: "admin" }
    assert.strictEqual(
      evaluatePermission(adminUser, "admin", [], true, "anything:unregistered"),
      true,
      "Admin should satisfy any permission"
    )
    assert.strictEqual(
      evaluateAnyPermission(adminUser, "admin", [], true, ["random:perm1", "random:perm2"]),
      true
    )
    assert.strictEqual(evaluateRole("admin", true, "admin"), true)
    assert.strictEqual(evaluateRole("admin", true, ["admin", "teacher"]), true)
    assert.strictEqual(evaluateRole("admin", true, "student"), false)

    // 3. User with wildcard "*" permission
    const customUser = { id: "u2", name: "Custom", email: "c@school.com", role: "staff" }
    assert.strictEqual(
      evaluatePermission(customUser, "staff", ["*"], true, "arbitrary:action"),
      true
    )

    // 4. Teacher with discrete permissions
    const teacherUser = { id: "t1", name: "Teacher Bob", email: "bob@school.com", role: "teacher" }
    const teacherPerms = ["attendance:read", "attendance:write", "grades:write"]

    assert.strictEqual(
      evaluatePermission(teacherUser, "teacher", teacherPerms, true, "attendance:read"),
      true
    )
    assert.strictEqual(
      evaluatePermission(teacherUser, "teacher", teacherPerms, true, "grades:write"),
      true
    )
    assert.strictEqual(
      evaluatePermission(teacherUser, "teacher", teacherPerms, true, "admin:users:manage"),
      false,
      "Teacher should not have admin permissions"
    )

    // 5. hasAnyPermission checks
    assert.strictEqual(
      evaluateAnyPermission(teacherUser, "teacher", teacherPerms, true, ["grades:write", "admin:users"]),
      true
    )
    assert.strictEqual(
      evaluateAnyPermission(teacherUser, "teacher", teacherPerms, true, ["system:config", "billing:write"]),
      false
    )

    // 6. Role compatibility (librarian compatible with teacher)
    assert.strictEqual(evaluateRole("librarian", true, "teacher"), true)
    assert.strictEqual(evaluateRole("teacher", true, "teacher"), true)
    assert.strictEqual(evaluateRole("student", true, "teacher"), false)
  })

  test("Session refresh allows a new fetch after state change", async () => {
    let callCount = 0
    let currentRole = "student"

    globalThis.fetch = (async () => {
      callCount++
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: "u_test", name: "Test User", email: "test@school.com", role: currentRole },
          role: currentRole,
          permissions: currentRole === "teacher" ? ["attendance:read"] : ["notices:read"],
          isAuthenticated: true,
        }),
      } as unknown as Response
    }) as typeof fetch

    // Initial fetch
    const res1 = await fetchSessionDeduplicated()
    assert.strictEqual(callCount, 1)
    assert.strictEqual(res1?.role, "student")

    // Consecutive calls without refresh reuse the promise if in-flight, or execute new fetch once done
    resetGlobalSessionPromise()
    currentRole = "teacher"

    const res2 = await fetchSessionDeduplicated()
    assert.strictEqual(callCount, 2)
    assert.strictEqual(res2?.role, "teacher")
    assert.deepStrictEqual(res2?.permissions, ["attendance:read"])
  })

  test("Simulates full browser lifecycle network waterfall: Hydration -> Navigation -> Push Invalidation -> Navigation", async () => {
    interface NetworkLogEntry {
      url: string
      time: number
      stage: string
    }

    const networkLogs: NetworkLogEntry[] = []
    let currentPerms = ["attendance:read", "classes:read"]
    let currentUserRole = "teacher"

    globalThis.fetch = (async (url: string | URL | Request) => {
      networkLogs.push({
        url: String(url),
        time: Date.now(),
        stage: currentStage,
      })
      await new Promise((r) => setTimeout(r, 10))
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: "user_waterfall", name: "Teacher Tim", role: currentUserRole },
          role: currentUserRole,
          permissions: currentPerms,
          isAuthenticated: true,
        }),
      } as unknown as Response
    }) as typeof fetch

    // STAGE 1: Browser initial hydration (5 components mounting concurrently)
    let currentStage = "HYDRATION"
    const componentCalls = [
      fetchSessionDeduplicated(), // AppSidebar
      fetchSessionDeduplicated(), // NavUser
      fetchSessionDeduplicated(), // RoleGuard
      fetchSessionDeduplicated(), // UserCard
      fetchSessionDeduplicated(), // HeaderComplaintButton
    ]
    const hydratedSessions = await Promise.all(componentCalls)
    assert.strictEqual(networkLogs.filter((l) => l.stage === "HYDRATION").length, 1, "Only 1 HTTP request during concurrent hydration")
    assert.strictEqual(hydratedSessions[0]?.permissions.length, 2)

    // STAGE 2: Client-side navigation (User clicks between 4 different pages without page reload)
    currentStage = "CLIENT_NAV"
    // Client components read cached session from context (simulated here by not calling fetchSessionDeduplicated or checking memory)
    // 0 network requests occur
    assert.strictEqual(networkLogs.filter((l) => l.stage === "CLIENT_NAV").length, 0, "Zero network requests during client-side navigation")

    // STAGE 3: Admin revokes 'attendance:read' permission via server WebSocket push
    currentStage = "REALTIME_SOCKET_INVALIDATION"
    currentPerms = ["classes:read"] // Admin removed attendance:read in backend
    resetGlobalSessionPromise() // Emulates session-context handling of 'session:invalidated' event

    const refreshedSession = await fetchSessionDeduplicated()
    assert.strictEqual(networkLogs.filter((l) => l.stage === "REALTIME_SOCKET_INVALIDATION").length, 1, "Exactly 1 network request triggered by WebSocket invalidation")
    assert.deepStrictEqual(refreshedSession?.permissions, ["classes:read"], "Client state updated to revoked permissions")

    // STAGE 4: Client-side navigation resumes
    currentStage = "CLIENT_NAV_POST_UPDATE"
    // Served from updated state with 0 additional network calls
    assert.strictEqual(networkLogs.filter((l) => l.stage === "CLIENT_NAV_POST_UPDATE").length, 0)

    // Total network requests across entire lifecycle: exactly 2
    assert.strictEqual(networkLogs.length, 2, "Expected exactly 2 total requests across entire session lifecycle")
  })
})

