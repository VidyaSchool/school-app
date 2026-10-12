import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  fetchSessionDeduplicated,
  resetGlobalSessionPromise,
  type UserSession,
} from "../contexts/session-context"

describe("Admin Frontend Centralized Session & Permission Client Tests", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    resetGlobalSessionPromise()
    globalThis.fetch = originalFetch
  })

  test("Deduplicates concurrent session fetches into a single network request", async () => {
    let fetchCallCount = 0

    globalThis.fetch = (async (url: string | URL | Request) => {
      fetchCallCount++
      await new Promise((r) => setTimeout(r, 20))
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: "admin_user_1", name: "Principal", email: "principal@vidyaschool.com", role: "admin" },
          role: "admin",
          permissions: ["*"],
          isAuthenticated: true,
        }),
      } as unknown as Response
    }) as typeof fetch

    const [res1, res2, res3] = await Promise.all([
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
    ])

    assert.strictEqual(fetchCallCount, 1, "Expected only 1 fetch call despite 3 concurrent callers")
    assert.ok(res1)
    assert.strictEqual(res1?.user?.email, "principal@vidyaschool.com")
    assert.strictEqual(res1?.role, "admin")
    assert.deepStrictEqual(res1?.permissions, ["*"])
    assert.strictEqual(res1?.isAuthenticated, true)
    assert.deepStrictEqual(res1, res2)
    assert.deepStrictEqual(res2, res3)
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

  test("Handles network errors gracefully", async () => {
    globalThis.fetch = (async () => {
      throw new Error("Connection failed")
    }) as typeof fetch

    const result = await fetchSessionDeduplicated()
    assert.strictEqual(result, null)
  })

  test("Simulates full admin browser lifecycle network waterfall", async () => {
    const networkLogs: { url: string; stage: string }[] = []
    let currentStage = "HYDRATION"

    globalThis.fetch = (async (url: string | URL | Request) => {
      networkLogs.push({ url: String(url), stage: currentStage })
      await new Promise((r) => setTimeout(r, 10))
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: "admin_wf", name: "Admin Lead", role: "admin" },
          role: "admin",
          permissions: ["*"],
          isAuthenticated: true,
        }),
      } as unknown as Response
    }) as typeof fetch

    // Stage 1: Hydration with concurrent callers
    const [s1, s2, s3] = await Promise.all([
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
      fetchSessionDeduplicated(),
    ])
    assert.strictEqual(networkLogs.filter((l) => l.stage === "HYDRATION").length, 1)

    // Stage 2: Navigation (0 requests)
    currentStage = "CLIENT_NAV"
    assert.strictEqual(networkLogs.filter((l) => l.stage === "CLIENT_NAV").length, 0)

    // Stage 3: Realtime push invalidation (1 refresh request)
    currentStage = "REALTIME_INVALIDATION"
    resetGlobalSessionPromise()
    const refreshed = await fetchSessionDeduplicated()
    assert.strictEqual(networkLogs.filter((l) => l.stage === "REALTIME_INVALIDATION").length, 1)
    assert.strictEqual(refreshed?.role, "admin")

    // Total requests across lifecycle: exactly 2
    assert.strictEqual(networkLogs.length, 2)
  })
})
