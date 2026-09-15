"use client"

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"

/**
 * Development / Beta banner.
 * Gated behind NEXT_PUBLIC_SHOW_DEV_BANNER env flag.
 * Kept disabled by default for public releases per audit recommendation.
 */
export function AlertBanner() {
  const [dismissed, setDismissed] = React.useState(false)

  // Banner is disabled unless explicitly enabled via environment variable for internal staging
  const isEnabled = process.env.NEXT_PUBLIC_SHOW_DEV_BANNER === "true"

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem("dev_alert_dismissed") === "true") {
        setDismissed(true)
      }
    } catch {
      // Ignore if sessionStorage is not accessible
    }
  }, [])

  if (!isEnabled || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem("dev_alert_dismissed", "true")
    } catch {
      // Ignore
    }
  }

  return (
    <aside
      aria-label="Development Notice"
      className="relative z-[100] w-full border-b border-amber-500/30 bg-amber-500/15 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/30 px-4 py-2 text-xs sm:text-sm font-medium transition-colors"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="hidden sm:block w-6 shrink-0" />

        <div className="flex flex-1 items-center justify-center gap-2 text-center">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="leading-snug">
            <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mr-1.5">
              Staging Notice:
            </span>
            You are viewing the staging environment for VIDYA School. Official records are accessible at vidyaschool.com.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notice"
          className="shrink-0 p-1 rounded-md text-amber-800 hover:text-amber-950 hover:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  )
}
