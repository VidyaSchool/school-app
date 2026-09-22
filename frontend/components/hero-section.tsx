"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BlurImage } from "@/components/blur-image"
import { cn } from "@/lib/utils"

const LiquidMetalHero = dynamic(() => import("@/components/liquid-metal-hero"), {
  ssr: false,
})

const sections = [
  { id: "hero", name: "Home", num: "01" },
  { id: "about", name: "About Us", num: "02" },
  { id: "students", name: "Our School", num: "03" },
  { id: "mobile-app", name: "Mobile App", num: "04" },
]

export interface HeroSlide {
  id: string | number
  type: "default" | "image"
  badge?: string
  title: string
  description: string
  primaryCta: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
  imageUrl?: string
  targetAudienceLabel?: string
}

// Initial hero slide (Slide 0) — exact original content and layout
const DEFAULT_HERO_SLIDE: HeroSlide = {
  id: "hero-default",
  type: "default",
  title: "Empowering Minds, Shaping Futures",
  description:
    "Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.",
  primaryCta: {
    text: "Mandatory Public Disclosure",
    href: "/mandatory-public-disclosure",
  },
}

interface ApiSliderImage {
  id: number
  url: string
  title: string
  description?: string
  badge?: string
  link?: string
  cta_text?: string
  enabled?: boolean
  target_audience?: string
  target_classes?: string
}

// Preload image in memory before transitioning to it
function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !url) {
      resolve(false)
      return
    }
    const img = new Image()
    img.src = url
    if (img.complete && img.naturalWidth > 0) {
      resolve(true)
      return
    }
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
  })
}

const STATIC_FALLBACK_IMAGES: ApiSliderImage[] = [
  {
    id: 1,
    url: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/sliders/1785052947567-93b3e4d9-vidya-is-now-online.png",
    title: "Vidya is Now Online",
    description: "Access digital classroom resources, attendance, fee portals, and academic progress reports all in one connected platform.",
    cta_text: "Student Portal",
    link: "/login",
    enabled: true,
    target_audience: "all",
  },
  {
    id: 3,
    url: "https://vidya-india.org/wp-content/uploads/2024/09/Govt-school-partnership-1-.jpg",
    title: "Our Students",
    description: "Fostering academic excellence, creative expression, and collaborative growth in a nurturing learning community.",
    cta_text: "View Gallery",
    link: "/gallery",
    enabled: true,
    target_audience: "all",
  },
  {
    id: 5,
    url: "https://www.vidyaschool.com/wp-content/uploads/2020/12/IMG_9200-4-scaled.jpg",
    title: "Our Students",
    description: "Hands-on learning, modern science & computer labs, and passionate mentorship preparing students for global success.",
    cta_text: "Explore Academics",
    link: "#about",
    enabled: true,
    target_audience: "all",
  },
  {
    id: 6,
    url: "https://www.vidyaschool.com/wp-content/uploads/2020/12/IMG_9354-scaled.jpg",
    title: "Our Students",
    description: "Vibrant campus life with athletics, performing arts, robotics, and community initiatives shaping well-rounded individuals.",
    cta_text: "Our School",
    link: "#students",
    enabled: true,
    target_audience: "all",
  },
]

// Fetch slider images with proxy and direct API fallbacks
async function fetchSliderImages(): Promise<ApiSliderImage[]> {
  try {
    const res = await fetch("/api/backend/api/slider/images?role=all", {
      headers: { Accept: "application/json" },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const filtered = data.filter((item: ApiSliderImage) => item.enabled !== false && item.url)
        if (filtered.length > 0) return filtered
      }
    }
  } catch {
    // Local proxy offline, fallback to public endpoint
  }

  try {
    const res = await fetch("https://api.vidyaschool.com/api/slider/images?role=all", {
      headers: { Accept: "application/json" },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const filtered = data.filter((item: ApiSliderImage) => item.enabled !== false && item.url)
        if (filtered.length > 0) return filtered
      }
    }
  } catch {
    // Network offline, use built-in defaults
  }

  return STATIC_FALLBACK_IMAGES
}

function buildSlideFromApi(item: ApiSliderImage, index: number): HeroSlide {
  const lowerTitle = (item.title || "").toLowerCase()
  const target = item.target_audience || "all"

  let title = item.title?.trim() || "Excellence in Education"
  let description =
    "Empowering students with quality education, modern facilities, and a supportive community dedicated to excellence."
  let primaryCta = { text: "Explore Campus", href: "#students" }
  let secondaryCta = { text: "Mandatory Public Disclosure", href: "/mandatory-public-disclosure" }

  if (lowerTitle.includes("online")) {
    title = "Vidya is Now Online"
    description =
      "Access digital classroom resources, attendance, fee portals, and academic progress reports all in one connected platform."
    primaryCta = { text: "Student Portal", href: "/login" }
    secondaryCta = { text: "Mandatory Public Disclosure", href: "/mandatory-public-disclosure" }
  } else if (lowerTitle.includes("leader") || lowerTitle.includes("future")) {
    description =
      "Developing ethical leadership, creative thinking, and innovation in every child for tomorrow's challenges."
    primaryCta = { text: "About VidyaSchool", href: "#about" }
  } else if (lowerTitle.includes("excellence")) {
    description =
      "A rigorous, inspiring curriculum supported by modern laboratories, arts programs, and dedicated mentorship."
    primaryCta = { text: "Explore Academics", href: "#about" }
  } else if (target === "students" || lowerTitle.includes("student")) {
    const studentDescriptions = [
      "Fostering academic excellence, creative expression, and collaborative growth in a nurturing learning community.",
      "Hands-on learning, modern science & computer labs, and passionate mentorship preparing students for global success.",
      "Vibrant campus life with athletics, performing arts, robotics, and community initiatives shaping well-rounded individuals.",
    ]
    description = studentDescriptions[index % studentDescriptions.length]
    primaryCta = { text: "View Gallery", href: "/gallery" }
  } else if (target === "teachers") {
    description =
      "Passionate, highly qualified educators committed to guiding every child toward their fullest academic and personal potential."
    primaryCta = { text: "Meet Our Team", href: "#principal" }
  }

  const ctaText = item.cta_text || primaryCta.text
  const isGalleryCta = ctaText.toLowerCase().includes("gallery")
  const href = isGalleryCta ? "/gallery" : (item.link || primaryCta.href)

  return {
    id: item.id,
    type: "image",
    title: item.title?.trim() || title,
    description: item.description || description,
    primaryCta: {
      text: ctaText,
      href: href,
    },
    secondaryCta,
    imageUrl: item.url,
  }
}

const INITIAL_SLIDES: HeroSlide[] = [
  DEFAULT_HERO_SLIDE,
  ...STATIC_FALLBACK_IMAGES.map((item, idx) => buildSlideFromApi(item, idx)),
]

export function HeroSection() {
  const [activeSection, setActiveSection] = useState("hero")

  // Slider state
  const [slides, setSlides] = useState<HeroSlide[]>(INITIAL_SLIDES)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [, setIsAllLoaded] = useState(false)

  // Restore user autoplay preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("antigravity_hero_slider_playing")
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsPlaying(saved === "true")
      }
    } catch {
      // localStorage may be unavailable or restricted
    }
  }, [])

  // Toggle play/pause and persist user preference to localStorage
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev
      try {
        localStorage.setItem("antigravity_hero_slider_playing", String(next))
      } catch {
        // ignore errors if storage quota exceeded or disabled
      }
      return next
    })
  }, [])

  // Touch swipe tracking
  const touchStartRef = useRef<number | null>(null)
  const touchEndRef = useRef<number | null>(null)

  // Section observer for floating side navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // triggers when section is in the middle of the viewport
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Multi-step loading lifecycle:
  // Step 1: Initial mount displays main hero component with stationary navigation controls active right away.
  // Step 2: In background, preload the next dynamic slide's image.
  // Step 3: In background (idle callback), fetch fresh slider images from API.
  // Step 4: If new slides returned, seamlessly update slides and preload remaining images.
  useEffect(() => {
    let isCancelled = false

    // Preload next image in browser cache for instantaneous transition
    if (typeof window !== "undefined" && INITIAL_SLIDES.length > 1 && INITIAL_SLIDES[1].imageUrl) {
      preloadImage(INITIAL_SLIDES[1].imageUrl)
    }

    const scheduleBackground =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1200)

    const handle = scheduleBackground(async () => {
      if (isCancelled) return

      // Fetch live slider info in background from API
      const apiItems = await fetchSliderImages()
      if (isCancelled || !apiItems || apiItems.length === 0) return

      const candidateSlides = apiItems.map((item, idx) => buildSlideFromApi(item, idx))
      if (candidateSlides.length === 0 || isCancelled) return

      // Update slides with live dynamic images from backend API
      setSlides([DEFAULT_HERO_SLIDE, ...candidateSlides])

      // Preload next images in background
      for (const candidate of candidateSlides) {
        if (isCancelled) return
        if (candidate.imageUrl) {
          await preloadImage(candidate.imageUrl)
        }
      }

      if (!isCancelled) {
        setIsAllLoaded(true)
      }
    })

    return () => {
      isCancelled = true
      if (typeof window !== "undefined" && "cancelIdleCallback" in window && typeof handle === "number") {
        window.cancelIdleCallback(handle)
      }
    }
  }, [])

  // Right-to-left navigation: move to next slide
  const goToNext = useCallback(() => {
    if (slides.length <= 1) return
    setIsTransitioning(true)
    setDisplayIndex((prev) => {
      const next = prev + 1
      setCurrentSlideIndex(next % slides.length)
      return next
    })
  }, [slides.length])

  // Move to previous slide
  const goToPrev = useCallback(() => {
    if (slides.length <= 1) return
    setIsTransitioning(true)
    setDisplayIndex((prev) => {
      if (prev <= 0) {
        setCurrentSlideIndex(slides.length - 1)
        return slides.length - 1
      }
      const next = prev - 1
      setCurrentSlideIndex(next)
      return next
    })
  }, [slides.length])

  // Jump to specific slide
  const goToSlide = useCallback((idx: number) => {
    setIsTransitioning(true)
    setDisplayIndex(idx)
    setCurrentSlideIndex(idx)
  }, [])

  // Handle seamless infinite right-to-left loop on track transition end
  const handleTransitionEnd = () => {
    if (displayIndex >= slides.length) {
      // Instantly snap to slide 0 without reverse animation
      setIsTransitioning(false)
      setDisplayIndex(0)
      setCurrentSlideIndex(0)
    }
  }

  // Re-enable transitions on the frame after an instant reset
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [isTransitioning])

  // Right-to-left continuous autoplay loop
  useEffect(() => {
    if (slides.length <= 1 || !isPlaying || isHovered) return

    const interval = setInterval(() => {
      goToNext()
    }, 6000)

    return () => clearInterval(interval)
  }, [slides.length, isPlaying, isHovered, goToNext])

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slides.length <= 1) return
      if (e.key === "ArrowLeft") goToPrev()
      else if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [slides.length, goToPrev, goToNext])

  // Mobile swipe handling
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX
    touchEndRef.current = null
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (touchStartRef.current === null || touchEndRef.current === null) return
    const diff = touchStartRef.current - touchEndRef.current
    if (Math.abs(diff) > 40) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
    touchStartRef.current = null
    touchEndRef.current = null
  }

  // Build the track: append a clone of slide 0 at the end to create a seamless right-to-left loop
  const trackSlides = slides.length > 1 ? [...slides, slides[0]] : slides

  return (
    <section
      id="hero"
      aria-label="Welcome to VidyaSchool"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex min-h-screen lg:h-[100dvh] lg:min-h-[100dvh] w-full flex-col justify-center items-center overflow-x-clip -mt-[66px] md:-mt-[72px] pt-[76px] sm:pt-[82px] lg:pt-[72px] pb-4 sm:pb-6 lg:pb-0"
    >

      {/* Full Width Hero Carousel Track Container */}
      <div className="relative z-10 mx-auto max-w-[1480px] w-full px-2 sm:px-4 md:px-6 lg:px-8 h-full flex flex-col justify-center select-none">
        {/* Carousel Viewport: strictly overflow-hidden with zero horizontal padding so adjacent slides are 100% clipped */}
        <div
          className="relative w-full overflow-hidden flex items-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Sliding Track: moves right-to-left across all slides */}
          <div
            className="flex w-full h-full items-center"
            style={{
              transform: `translate3d(-${displayIndex * 100}%, 0, 0)`,
              transition: isTransitioning ? "transform 750ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {trackSlides.map((slide, idx) => {
              const isSlide0 = idx === 0
              const isClone0 = idx === slides.length && slides.length > 1

              return (
                <div
                  key={idx}
                  className="w-full min-w-full max-w-full h-full shrink-0 flex items-center justify-center relative overflow-hidden px-1 lg:px-0"
                  style={{ width: "100%", flex: "0 0 100%" }}
                >
                {/* ── Slide 0: The original hero section exactly as it was ── */}
                {isSlide0 ? (
                  <div className="grid w-full h-full grid-cols-1 items-center gap-8 py-6 sm:gap-10 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:py-16 max-w-[1380px] mx-auto pb-4 lg:pb-16">
                    <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-6">
                      <div className="space-y-3 text-center sm:space-y-5 lg:space-y-6 lg:text-left">
                        <h1 className="text-[clamp(1.75rem,5vw+0.75rem,4.5rem)] tracking-tight text-foreground leading-[1.08] text-balance">
                          Empowering Minds, Shaping Futures
                        </h1>

                        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0">
                          Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.
                        </p>

                        <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                          <Button asChild variant="default" size="md" className="w-full sm:w-auto px-6 py-2.5">
                            <Link href="/mandatory-public-disclosure">
                              <span>Mandatory Public Disclosure</span>
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* LiquidMetalHero right column */}
                    <div className="order-1 relative aspect-square sm:aspect-[4/3] min-h-[280px] sm:min-h-[380px] lg:order-2 lg:col-span-6 lg:aspect-auto lg:h-[75dvh] flex items-center justify-center">
                      <LiquidMetalHero active={currentSlideIndex === 0} />
                    </div>
                  </div>
                ) : isClone0 ? (
                  /* Clone of slide 0 at end of track for seamless right-to-left loop */
                  <div className="grid w-full h-full grid-cols-1 items-center gap-8 py-6 sm:gap-10 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:py-16 max-w-[1380px] mx-auto pb-4 lg:pb-16">
                    <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-6">
                      <div className="space-y-3 text-center sm:space-y-5 lg:space-y-6 lg:text-left">
                        <h1 className="text-[clamp(1.75rem,5vw+0.75rem,4.5rem)] tracking-tight text-foreground leading-[1.08] text-balance">
                          Empowering Minds, Shaping Futures
                        </h1>

                        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg lg:mx-0">
                          Welcome to VidyaSchool, where academic excellence meets holistic development. Discover our wings, modern labs, arts programs, and vibrant student community.
                        </p>

                        <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                          <Button asChild variant="default" size="md" className="w-full sm:w-auto px-6 py-2.5">
                            <Link href="/mandatory-public-disclosure">
                              <span>Mandatory Public Disclosure</span>
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="order-1 relative aspect-square sm:aspect-[4/3] min-h-[280px] sm:min-h-[380px] lg:order-2 lg:col-span-6 lg:aspect-auto lg:h-[75dvh] flex items-center justify-center translate-x-0 lg:translate-x-6">
                      <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
                        <BlurImage
                          src="/assets/illustrations/hero_section.png"
                          alt="Hero Illustration"
                          fill
                          className="object-contain p-2 sm:p-4"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Dynamic Slides: On mobile (< lg) matches hero main slider layout; on desktop (lg:) full-coverage card ── */
                  <div className="w-full h-full flex items-center justify-center">
                    {/* Mobile layout (< lg): Matches hero main slider layout exactly */}
                    <div className="grid lg:hidden w-full h-full grid-cols-1 items-center gap-8 py-6 sm:gap-10 sm:py-12 max-w-[1380px] mx-auto pb-4">
                      <div className="order-2 flex flex-col justify-center">
                        <div className="space-y-3 text-center sm:space-y-5">
                          <h2 className="text-[clamp(1.75rem,5vw+0.75rem,4.5rem)] tracking-tight text-foreground leading-[1.08] text-balance">
                            {slide.title}
                          </h2>

                          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                            {slide.description}
                          </p>

                          <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-center">
                            <Button asChild variant="default" size="md" className="w-full sm:w-auto px-6 py-2.5">
                              <Link href={slide.primaryCta.href}>
                                <span>{slide.primaryCta.text}</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                            {slide.secondaryCta && (
                              <Button asChild variant="outline" size="md" className="w-full sm:w-auto px-6 py-2.5">
                                <Link href={slide.secondaryCta.href}>
                                  <span>{slide.secondaryCta.text}</span>
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Image on top on mobile, matching Slide 0's aspect ratio and position */}
                      <div className="order-1 relative aspect-square sm:aspect-[4/3] min-h-[280px] sm:min-h-[380px] max-h-[420px] w-full flex items-center justify-center rounded-3xl overflow-hidden bg-muted/20">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                          loading="eager"
                          decoding="async"
                        />
                      </div>
                    </div>

                    {/* Desktop layout (lg and up): The full-coverage hero card */}
                    <div className="hidden lg:block relative w-full h-[540px] sm:h-[610px] lg:h-[78dvh] max-h-[730px] rounded-3xl overflow-hidden bg-black/40 group">
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        loading="eager"
                        decoding="async"
                      />

                      {/* Gentle dark scrim on left text area so the image behind stays crystal clear */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                      <div className="absolute inset-0 p-6 sm:p-10 md:p-14 lg:p-16 pb-20 sm:pb-24 lg:pb-16 flex flex-col justify-end lg:justify-center items-start z-10 max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-4 lg:space-y-5">
                        <h2 className="text-[clamp(1.75rem,5vw+0.75rem,4.5rem)] tracking-tight text-white leading-[1.08] text-balance drop-shadow-md">
                          {slide.title}
                        </h2>

                        <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg lg:mx-0 drop-shadow-sm">
                          {slide.description}
                        </p>

                        <div className="flex w-full flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center">
                          <Button asChild size="md" className="w-full sm:w-auto px-6 py-2.5 bg-white text-zinc-950 hover:bg-zinc-100 shadow-md transition-all border-0">
                            <Link href={slide.primaryCta.href}>
                              <span>{slide.primaryCta.text}</span>
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          {slide.secondaryCta && (
                            <Button asChild variant="outline" size="md" className="w-full sm:w-auto px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-md transition-all">
                              <Link href={slide.secondaryCta.href}>
                                <span>{slide.secondaryCta.text}</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

        {/* Mobile Navigation Controls: Positioned in normal flow BELOW the track - 100% CANNOT overlap text or buttons */}
        {slides.length > 1 && (
          <div className="w-full flex justify-center items-center pt-3 pb-2 z-20 lg:hidden shrink-0">
            <div
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/95 dark:bg-card/90 border border-border select-none text-foreground shadow-md"
              aria-label="Slider navigation"
            >
              {/* Prev Slide */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrev}
                className="h-8 w-8 rounded-full text-foreground hover:bg-muted cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5 px-1">
                {slides.map((s, dotIdx) => {
                  const isActive = currentSlideIndex === dotIdx
                  return (
                    <button
                      key={s.id || dotIdx}
                      onClick={() => goToSlide(dotIdx)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                        isActive
                          ? "w-5 bg-primary"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      )}
                      aria-label={`Go to slide ${dotIdx + 1}: ${s.title}`}
                      aria-current={isActive ? "true" : undefined}
                    />
                  )
                })}
              </div>

              {/* Next Slide */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="h-8 w-8 rounded-full text-foreground hover:bg-muted cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Play/Pause Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted ml-0.5 cursor-pointer"
                aria-label={isPlaying ? "Pause slider" : "Play slider"}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>

              {/* Slide Index Counter */}
              <span className="text-[11px] text-muted-foreground font-mono pl-1.5 border-l border-border">
                {String(currentSlideIndex + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        )}

      {/* Desktop Navigation Controls: Stationed bottom-left inside image on lg screens */}
      {slides.length > 1 && (
        <div className="hidden lg:flex absolute inset-0 pointer-events-none items-center justify-center z-20 px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="relative w-full h-[540px] sm:h-[610px] lg:h-[78dvh] max-h-[730px]">
            <div
              className={cn(
                "absolute bottom-8 sm:bottom-10 left-8 sm:left-10 pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl select-none shadow-xl transition-all duration-300",
                currentSlideIndex === 0
                  ? "bg-background/90 dark:bg-black/60 border border-border/80 dark:border-white/20 text-foreground dark:text-white"
                  : "bg-black/60 border border-white/20 text-white"
              )}
              aria-label="Slider navigation"
            >
              {/* Prev Slide */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrev}
                className={cn(
                  "h-7 w-7 rounded-full cursor-pointer",
                  currentSlideIndex === 0
                    ? "text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/20"
                    : "text-white hover:bg-white/20"
                )}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5 px-1">
                {slides.map((s, dotIdx) => {
                  const isActive = currentSlideIndex === dotIdx
                  return (
                    <button
                      key={s.id || dotIdx}
                      onClick={() => goToSlide(dotIdx)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300 outline-none cursor-pointer",
                        currentSlideIndex === 0
                          ? cn(
                              "focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-white",
                              isActive
                                ? "w-6 bg-primary dark:bg-white"
                                : "w-2 bg-muted-foreground/30 dark:bg-white/40 hover:bg-muted-foreground/60 dark:hover:bg-white/70"
                            )
                          : cn(
                              "focus-visible:ring-2 focus-visible:ring-white",
                              isActive
                                ? "w-6 bg-white"
                                : "w-2 bg-white/40 hover:bg-white/70"
                            )
                      )}
                      aria-label={`Go to slide ${dotIdx + 1}: ${s.title}`}
                      aria-current={isActive ? "true" : undefined}
                    />
                  )
                })}
              </div>

              {/* Next Slide */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className={cn(
                  "h-7 w-7 rounded-full cursor-pointer",
                  currentSlideIndex === 0
                    ? "text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/20"
                    : "text-white hover:bg-white/20"
                )}
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Play/Pause Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className={cn(
                  "h-7 w-7 rounded-full ml-0.5 cursor-pointer",
                  currentSlideIndex === 0
                    ? "text-muted-foreground dark:text-white/80 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/20"
                    : "text-white/80 hover:text-white hover:bg-white/20"
                )}
                aria-label={isPlaying ? "Pause slider" : "Play slider"}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>

              {/* Slide Index Counter */}
              <span
                className={cn(
                  "text-[11px] font-mono pl-1 border-l",
                  currentSlideIndex === 0
                    ? "text-muted-foreground dark:text-white/80 border-border dark:border-white/20"
                    : "text-white/80 border-white/20"
                )}
              >
                {String(currentSlideIndex + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Right Side Floating Page Content Scroller (Horizontal Lines) */}
      <nav
        aria-label="Page content navigation"
        className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-end gap-3 px-2.5 py-3 rounded-2xl border border-border/40 bg-background/65 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-border/70"
      >
        {sections.map((sec) => {
          const isActive = activeSection === sec.id
          return (
            <Tooltip key={sec.id}>
              <TooltipTrigger asChild>
                <a
                  href={`#${sec.id}`}
                  className="group py-1.5 outline-none flex items-center justify-end"
                >
                  <div
                    className={cn(
                      "rounded-full transition-all duration-300",
                      isActive
                        ? "h-[6px] w-6 bg-foreground shadow-2xs"
                        : "h-[3px] w-3.5 bg-muted-foreground/30 group-hover:h-[4px] group-hover:w-5 group-hover:bg-foreground/70"
                    )}
                  />
                </a>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-semibold text-xs shadow-xl px-3 py-1.5 rounded-lg">
                <p>{sec.name}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </section>
  )
}
