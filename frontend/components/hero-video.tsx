"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Volume2, VolumeX, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeroVideoProps {
  src?: string
  className?: string
}

export function HeroVideo({
  src = "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/hero-video/vidya_hero_video.mp4",
  className,
}: HeroVideoProps) {
  const containerRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  // Autoplay initialization with explicit DOM property assignment (essential for Safari & Chrome)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true

    const attemptPlay = () => {
      video.play().catch(() => {
        // Autoplay may be blocked by user-agent policy until interaction
      })
    }

    attemptPlay()
    video.addEventListener("canplay", attemptPlay, { once: true })
    video.addEventListener("loadeddata", attemptPlay, { once: true })

    return () => {
      video.removeEventListener("canplay", attemptPlay)
      video.removeEventListener("loadeddata", attemptPlay)
    }
  }, [src])

  // Pause video only when container is 100% out of viewport to save resources
  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return

    const nextMuted = !video.muted
    video.muted = nextMuted
    setIsMuted(nextMuted)
    if (video.paused) {
      video.play().catch(() => {})
    }
  }, [])

  const scrollToHero = useCallback(() => {
    const heroEl = document.getElementById("hero")
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  // Clicking the video resumes playback if autoplay was delayed or blocked
  const handleContainerClick = useCallback(() => {
    const video = videoRef.current
    if (video && video.paused) {
      video.play().catch(() => {})
    }
  }, [])

  return (
    <section
      ref={containerRef}
      aria-label="Vidya School Showcase Video"
      onClick={handleContainerClick}
      className={cn(
        "relative w-full h-screen h-[100dvh] min-h-[100dvh] overflow-hidden bg-black select-none -mt-[66px] md:-mt-[72px] z-0",
        className
      )}
    >
      {/* Full-screen Video Player */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Subtle bottom gradient overlay for smooth transition to hero section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />

      {/* Floating Monochrome Mute / Unmute Button (Icon only, Black & White) */}
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-30">
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            "flex size-11 sm:size-12 items-center justify-center rounded-full cursor-pointer select-none",
            "bg-black/70 hover:bg-black text-white backdrop-blur-md",
            "border border-white/30 shadow-2xl transition-all duration-200",
            "hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          )}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          title={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="size-5 text-white" />
          ) : (
            <Volume2 className="size-5 text-white" />
          )}
        </button>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            scrollToHero()
          }}
          aria-label="Scroll to main content"
          className="group flex flex-col items-center text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-medium tracking-wider uppercase drop-shadow">Scroll</span>
          <ChevronDown className="size-4 animate-bounce mt-1 text-white/70 group-hover:text-white transition-colors" />
        </button>
      </div>
    </section>
  )
}
