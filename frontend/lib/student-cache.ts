/**
 * In-memory client cache for student portal routes to enable instant 0ms tab switching
 * with Stale-While-Revalidate (SWR) pattern.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const _cache = new Map<string, CacheEntry<any>>()
let _hasPrefetched = false

export function getStudentCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  const entry = _cache.get(key)
  if (!entry) return null
  // Return cached data even if slightly stale (stale-while-revalidate)
  return entry.data as T
}

export function setStudentCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  _cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function clearStudentCache(key?: string): void {
  if (key) {
    _cache.delete(key)
  } else {
    _cache.clear()
    _hasPrefetched = false
  }
}

/**
 * Background prefetcher for student portal data.
 * Runs during browser idle time once per session to warm up all student subpage caches.
 */
export function prefetchStudentPortalData(): void {
  if (typeof window === "undefined" || _hasPrefetched) return
  _hasPrefetched = true

  const runPrefetch = () => {
    // 1. Notices
    if (!_cache.has("notices")) {
      fetch("/api/notices")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("notices", data)
        })
        .catch(() => {})
    }

    // 2. Fees & Student Profile
    if (!_cache.has("fees_data")) {
      Promise.all([
        fetch("/api/account").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/fees").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]).then(([accountData, feesData]) => {
        if (accountData || feesData) {
          const profile = accountData ? {
            name: accountData.user?.name || "Student",
            admissionNumber: accountData.profile?.admissionNumber || "N/A",
            class: accountData.profile?.class || "",
            section: accountData.profile?.section || "",
          } : null

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
          if (accountData?.user) {
            setStudentCache("account_full", { user: accountData.user, profile: accountData.profile })
          }
        }
      }).catch(() => {})
    }

    // 3. Library Borrowings
    if (!_cache.has("library")) {
      fetch("/api/backend/api/student/borrowings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("library", data)
        })
        .catch(() => {})
    }

    // 4. Leaderboard
    if (!_cache.has("leaderboard")) {
      fetch("/api/backend/api/student/leaderboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("leaderboard", data)
        })
        .catch(() => {})
    }

    // 5. Marks
    if (!_cache.has("marks_parsed")) {
      fetch("/api/backend/api/student/marks")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setStudentCache("marks_raw", data)
        })
        .catch(() => {})
    }

    // 6. Notes
    if (!_cache.has("notes_parsed")) {
      fetch("/api/student/notes")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => {})
    }
  }

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runPrefetch, { timeout: 2000 })
  } else {
    setTimeout(runPrefetch, 200)
  }
}
