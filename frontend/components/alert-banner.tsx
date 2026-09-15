"use client"

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"

export function AlertBanner() {
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem("dev_alert_dismissed") === "true") {
        setDismissed(true)
      }
    } catch {
      // Ignore if sessionStorage is not accessible
    }
  }, [])

  if (dismissed) return null

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
      aria-label="Development Warning Notice"
      className="relative z-[100] w-full border-b border-amber-500/30 bg-amber-500/15 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/30 px-4 py-2 text-xs sm:text-sm font-medium transition-colors"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Left spacer to keep text centered on desktop */}
        <div className="hidden sm:block w-6 shrink-0" />

        <div className="flex flex-1 items-center justify-center gap-2 text-center">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="leading-snug">
            <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mr-1.5">
              Notice:
            </span>
            This app is under development. Please don&apos;t trust this website content for now, and if you are putting any credentials or personal information, you are at your own risk.
          </p>
        </div>

        {/* Cut / Dismiss button at right */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss warning"
          className="shrink-0 p-1 rounded-md text-amber-800 hover:text-amber-950 hover:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  )
}
