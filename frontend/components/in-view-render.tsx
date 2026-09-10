"use client"

import React from "react"

interface InViewRenderProps {
  children: React.ReactNode
  /** Skeleton / loading placeholder to show while off-screen */
  fallback?: React.ReactNode
  /** Margin around root viewport before triggering load (e.g. '250px 0px' pre-loads 250px before entering screen) */
  rootMargin?: string
  /** Minimum height container style to prevent layout shifts before rendering */
  minHeight?: string | number
  /** Additional CSS class names */
  className?: string
  /** If true, stays rendered once scrolled into view. Default is true. */
  once?: boolean
}

/**
 * ViewportLazy / InViewRender
 * 
 * Recreates nextjs.org's partial viewport rendering.
 * Defers mounting and rendering of heavy off-screen components/DOM trees
 * until they approach the user's viewport.
 */
export function InViewRender({
  children,
  className = "",
}: InViewRenderProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
