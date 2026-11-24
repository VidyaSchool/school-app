"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import Lenis from "lenis"
import { usePathname } from "next/navigation"

interface SmoothScrollProps {
  children: React.ReactNode
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Respect user's preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    // Documentation and dashboard pages have independent nested scroll areas (sidebar, TOC, content)
    // Lenis should not run on /docs routes to ensure smooth native scrolling compatibility
    const isDocs = pathname?.startsWith("/docs")
    if (isDocs) {
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      return
    }

    if (lenisRef.current) return

    // Initialize Lenis for smooth momentum scrolling
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.2,
      autoResize: true,
      prevent: (node) => {
        if (!node || typeof (node as HTMLElement).closest !== "function") return false
        return Boolean(
          (node as HTMLElement).closest("[data-lenis-prevent]") ||
          (node as HTMLElement).closest("#nd-sidebar") ||
          (node as HTMLElement).closest("#nd-sidebar-mobile") ||
          (node as HTMLElement).closest("#nd-toc") ||
          (node as HTMLElement).closest("[data-radix-scroll-area-viewport]")
        )
      },
    })

    lenisRef.current = lenis

    let animationFrameId: number

    function raf(time: number) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(animationFrameId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [pathname])

  // Reset scroll position on route changes
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    }
  }, [pathname])

  return <>{children}</>
}

export default SmoothScroll
