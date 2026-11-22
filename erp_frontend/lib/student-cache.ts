/**
 * High-performance, server-healthy client cache for the student portal.
 * 
 * Design Principles:
 * 1. Zero mass prefetching on login (prevents request storms on server).
 * 2. In-memory Stale-While-Revalidate with a 2-minute freshness window:
 *    switching between tabs uses local RAM (0ms latency, 0 server requests).
 * 3. In-flight request deduplication: concurrent requests for the same key are merged into 1.
 * 4. Intent-based hover prefetch: only fetches a single tab when the user intentionally
 *    hovers for >150ms, and only if that tab is not already cached fresh.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const DEFAULT_FRESH_TTL_MS = 2 * 60 * 1000 // 2 minutes fresh window
const _cache = new Map<string, CacheEntry<any>>()
const _inFlight = new Map<string, Promise<any>>()

/**
 * Retrieve cached data from memory.
 */
export function getStudentCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  const entry = _cache.get(key)
  if (!entry) return null
  return entry.data as T
}

/**
 * Store data in client memory with a fresh timestamp.
 */
export function setStudentCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  _cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

/**
 * Check if the cache entry exists and was updated within maxAgeMs (default 2 mins).
 */
export function isCacheFresh(key: string, maxAgeMs = DEFAULT_FRESH_TTL_MS): boolean {
  if (typeof window === "undefined") return false
  const entry = _cache.get(key)
  if (!entry) return false
  return Date.now() - entry.timestamp < maxAgeMs
}

/**
 * Clear cache for a specific key or all entries.
 */
export function clearStudentCache(key?: string): void {
  if (key) {
    _cache.delete(key)
    _inFlight.delete(key)
  } else {
    _cache.clear()
    _inFlight.clear()
  }
}

/**
 * Deduplicated fetch helper. If an identical request is already in-flight, returns the existing promise.
 */
function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = _inFlight.get(key)
  if (existing) return existing

  const promise = fetcher().finally(() => {
    _inFlight.delete(key)
  })

  _inFlight.set(key, promise)
  return promise
}

/**
 * Intent-based prefetcher for a single tab.
 * Only called on intentional hover/interaction, and skips completely if already fresh.
 */
export function prefetchTabOnIntent(url: string): void {
  if (typeof window === "undefined") return

  const cleanUrl = url.toLowerCase().split("?")[0]

  // 1. Notice Board
  if (cleanUrl.endsWith("/notice")) {
    if (isCacheFresh("notices")) return
    deduplicatedFetch("notices", () =>
      fetch("/api/notices")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("notices", data)
        })
        .catch(() => null)
    )
    return
  }

  // 2. Fees
  if (cleanUrl.endsWith("/fees")) {
    if (isCacheFresh("fees_data")) return
    deduplicatedFetch("fees_data", () =>
      Promise.all([
        fetch("/api/account").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/fees").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]).then(([accountData, feesData]) => {
        if (accountData || feesData) {
          const profile = accountData
            ? {
                name: accountData.user?.name || "Student",
                admissionNumber: accountData.profile?.admissionNumber || "N/A",
                class: accountData.profile?.class || "",
                section: accountData.profile?.section || "",
              }
            : null

          let months: any[] = []
          if (Array.isArray(feesData)) {
            months = feesData.map((inst: any) => ({
              id: inst.id,
              month: inst.month,
              year: inst.year,
              amount: inst.amount,
              dueDate: inst.due_date,
              status: inst.status,
              paidDate: inst.paid_date ?? undefined,
              receiptNo: inst.receipt_no ?? undefined,
              paymentMethod: inst.payment_method ?? undefined,
              qrDataUrl: inst.qr_data_url ?? undefined,
            }))
          }
          if (profile && months.length > 0) {
            setStudentCache("fees_data", { profile, months })
          }
        }
      }).catch(() => null)
    )
    return
  }

  // 3. Library
  if (cleanUrl.endsWith("/library")) {
    if (isCacheFresh("library")) return
    deduplicatedFetch("library", () =>
      fetch("/api/backend/api/student/borrowings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("library", data)
        })
        .catch(() => null)
    )
    return
  }

  // 4. Leaderboard
  if (cleanUrl.endsWith("/leaderboard")) {
    if (isCacheFresh("leaderboard")) return
    deduplicatedFetch("leaderboard", () =>
      fetch("/api/backend/api/student/leaderboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("leaderboard", data)
        })
        .catch(() => null)
    )
    return
  }

  // 5. Marks
  if (cleanUrl.endsWith("/marks")) {
    if (isCacheFresh("marks_parsed")) return
    deduplicatedFetch("marks_raw", () =>
      fetch("/api/backend/api/student/marks")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("marks_raw", data)
        })
        .catch(() => null)
    )
    return
  }

  // 6. Notes
  if (cleanUrl.endsWith("/notes")) {
    if (isCacheFresh("notes_parsed")) return
    deduplicatedFetch("notes", () =>
      fetch("/api/student/notes")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
    return
  }

  // 7. Account
  if (cleanUrl.endsWith("/account")) {
    if (isCacheFresh("account_full")) return
    deduplicatedFetch("account_full", () =>
      fetch("/api/account")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            setStudentCache("account_full", { user: data.user, profile: data.profile })
          }
        })
        .catch(() => null)
    )
    return
  }
}
