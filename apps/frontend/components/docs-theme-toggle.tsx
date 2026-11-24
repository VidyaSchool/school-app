"use client"

import * as React from "react"
import { useTheme } from "@/components/theme-provider"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function DocsThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          "ms-auto inline-flex h-8 items-center rounded-full border border-border/60 bg-muted/20 p-0.5 gap-1",
          className
        )}
      >
        <div className="size-6 rounded-full" />
        <div className="size-6 rounded-full" />
      </div>
    )
  }

  const isDark = (resolvedTheme || theme) === "dark"

  return (
    <div
      className={cn(
        "ms-auto inline-flex items-center rounded-full border border-border/80 bg-muted/40 p-0.5 text-muted-foreground",
        className
      )}
      data-slot="theme-switch"
      role="group"
      aria-label="Theme switch"
    >
      <button
        type="button"
        aria-label="Switch to light mode"
        title="Light mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "inline-flex size-6.5 items-center justify-center rounded-full transition-all cursor-pointer",
          !isDark
            ? "bg-background text-foreground shadow-xs font-medium"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Switch to dark mode"
        title="Dark mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "inline-flex size-6.5 items-center justify-center rounded-full transition-all cursor-pointer",
          isDark
            ? "bg-background text-foreground shadow-xs font-medium"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="size-3.5" />
      </button>
    </div>
  )
}
