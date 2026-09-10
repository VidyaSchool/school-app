"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
import dynamic from "next/dynamic"
import { BlurImage } from "@/components/blur-image"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

const LOGO_SRC = "/assets/vidyaschool/Logo/restored_no_bg_with_title.png"

const LiquidMetal = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.LiquidMetal),
  { ssr: false }
)

export default function LiquidMetalHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isInView, setIsInView] = useState(true)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isReady, setIsReady] = useState(true)
  const [logoScale, setLogoScale] = useState(0.40)

  // Non-urgent transitions: these state updates are deprioritised so React
  // never blocks the next user input to process them.
  const [, startTransition] = useTransition()

  useEffect(() => {
    const saved = localStorage.getItem("antigravity_logo_playing")
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    setReducedMotion(prefersReducedMotion)
    if (prefersReducedMotion) {
      setIsPlaying(false)
    } else if (saved !== null) {
      setIsPlaying(saved === "true")
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
      if (event.matches) setIsPlaying(false)
    }
    motionQuery.addEventListener("change", onMotionChange)

    const onVisibilityChange = () =>
      startTransition(() => setIsTabVisible(!document.hidden))
    document.addEventListener("visibilitychange", onVisibilityChange)

    const el = containerRef.current
    const observer = el
      ? new IntersectionObserver(
          ([entry]) => startTransition(() => setIsInView(entry.isIntersecting)),
          { threshold: 0.15 }
        )
      : null
    if (el && observer) observer.observe(el)

    const frame = requestAnimationFrame(() => {
      setIsReady(true)
    })

    const updateScale = () => setLogoScale(window.innerWidth < 640 ? 0.30 : 0.40)
    updateScale()
    window.addEventListener("resize", updateScale)

    return () => {
      motionQuery.removeEventListener("change", onMotionChange)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      observer?.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateScale)
    }
  }, [])

  // Wrapped in startTransition: toggling play is non-urgent — the WebGL
  // re-render should never block the button's visual feedback or next input.
  const togglePlay = useCallback(() => {
    startTransition(() => {
      setIsPlaying((prev) => {
        const next = !prev
        localStorage.setItem("antigravity_logo_playing", String(next))
        return next
      })
    })
  }, [startTransition])

  const shouldAnimate = isReady && isPlaying && isInView && isTabVisible && !reducedMotion

  return (
    <div ref={containerRef} className="relative h-full w-full flex items-center justify-center translate-x-0 lg:translate-x-6">
      {/* Background Illustration behind logo */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
        <BlurImage
          src="/assets/illustrations/hero_section.png"
          alt="Hero Illustration"
          fill
          className="object-contain p-2 sm:p-4"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 50vw"
        />
      </div>

      {/* Animated shader — mounted at isReady */}
      {isReady && (
        <div className="absolute inset-0 z-10 translate-y-0 sm:translate-y-4 lg:translate-y-6">
          <LiquidMetal
            width="100%"
            height="100%"
            image={LOGO_SRC}
            colorBack="#00000000"
            colorTint="#e11d48"
            repetition={1.2}
            softness={0.12}
            shiftRed={0.6}
            shiftBlue={0.0}
            distortion={0.05}
            contour={0.55}
            angle={60}
            speed={shouldAnimate ? 0.35 : 0}
            scale={logoScale}
            fit="contain"
          />
        </div>
      )}

      {!reducedMotion && (
        <div className="absolute bottom-10 right-16 z-10">
          <Button
            variant="outline"
            size="default"
            onClick={togglePlay}
            className="h-8 w-8 rounded-full border-border bg-background/50 p-0 backdrop-blur-xs hover:bg-background"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-muted-foreground/30" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-muted-foreground/30" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
