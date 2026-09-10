"use client"

import React, { useState, useEffect, useRef } from "react"

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
  fallback = null,
  rootMargin = "250px 0px",
  minHeight = "200px",
  className = "",
  once = true,
}: InViewRenderProps) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = ref.current
    if (!target) return
    if (isInView && once) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) observer.unobserve(target)
        } else if (!once) {
          setIsInView(false)
        }
      },
      { rootMargin }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [rootMargin, once, isInView])

  return (
    <div
      ref={ref}
      className={`${isInView ? "" : "content-visibility-auto"} ${className}`.trim()}
      style={{
        minHeight: !isInView && minHeight ? minHeight : undefined,
        contain: isInView ? "none" : undefined,
      }}
    >
      {isInView ? children : fallback}
    </div>
  )
}
