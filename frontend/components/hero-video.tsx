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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Start autoplay immediately on mount (muted is required by browser autoplay policies)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false)
        })
    }
  }, [])

  // Automatically pause video when scrolled out of view to save battery/bandwidth/GPU
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

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
      { threshold: 0.1 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const nextMuted = !video.muted
    video.muted = nextMuted
    setIsMuted(nextMuted)
  }, [])

  const scrollToHero = useCallback(() => {
    const heroEl = document.getElementById("hero")
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  return (
    <section
      aria-label="Vidya School Showcase Video"
      className={cn(
        "relative w-full h-screen h-[100dvh] min-h-[100dvh] overflow-hidden bg-black select-none -mt-[66px] md:-mt-[72px]",
        className
      )}
    >
      {/* Full-bleed Background Video covering 100% width and height */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        onLoadedData={() => setIsLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Loading Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="size-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Subtle bottom gradient overlay for smooth transition to hero section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/40 to-transparent" />

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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center">
        <button
          type="button"
          onClick={scrollToHero}
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
