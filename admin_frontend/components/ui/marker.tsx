"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ── Marker (container) ──────────────────────────────────────────── */
interface MarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "separator"
}

function Marker({ variant = "default", className, ...props }: MarkerProps) {
  if (variant === "separator") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 w-full",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      {...props}
    />
  )
}

/* ── MarkerIcon ──────────────────────────────────────────────────── */
function MarkerIcon({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center",
        className
      )}
      {...props}
    />
  )
}

/* ── MarkerContent ───────────────────────────────────────────────── */
interface MarkerContentProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** When true, renders separator lines on both sides (used with variant="separator") */
  withLines?: boolean
}

function MarkerContent({ className, children, ...props }: MarkerContentProps) {
  return (
    <>
      <span className="h-px flex-1 bg-zinc-800/70" />
      <span
        className={cn("text-xs shrink-0 select-none", className)}
        {...props}
      >
        {children}
      </span>
      <span className="h-px flex-1 bg-zinc-800/70" />
    </>
  )
}

/* ── MarkerLabel (for default variant — no separator lines) ──────── */
function MarkerLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-xs select-none", className)}
      {...props}
    />
  )
}

export { Marker, MarkerContent, MarkerIcon, MarkerLabel }
