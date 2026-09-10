interface RateLimitRecord {
  timestamps: number[]
}

const tracker = new Map<string, RateLimitRecord>()

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of tracker.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < 60000)
      if (record.timestamps.length === 0) {
        tracker.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now()
  let record = tracker.get(identifier)

  if (!record) {
    record = { timestamps: [] }
    tracker.set(identifier, record)
  }

  // Filter out timestamps outside the sliding window
  record.timestamps = record.timestamps.filter(ts => now - ts < windowMs)

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0]
    const reset = Math.ceil((oldest + windowMs - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      reset: reset > 0 ? reset : 1,
    }
  }

  record.timestamps.push(now)
  const remaining = limit - record.timestamps.length
  const reset = Math.ceil(windowMs / 1000)

  return {
    allowed: true,
    remaining,
    reset,
  }
}
