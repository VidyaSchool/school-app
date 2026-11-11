"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  GraduationCap,
  Atom,
  BookOpen,
  ArrowRight,
} from "lucide-react"
import { BlurImg } from "@/components/blur-image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WingItem {
  id: string
  name: string
  stage: string
  classes: string
  badge: string
  image: string
  link: string
  shortTitle: string
  stageTag: string
  icon: React.ComponentType<{ className?: string }>
}

const wings: WingItem[] = [
  {
    id: "senior-wing",
    name: "Senior Wing",
    stage: "Secondary & Senior Secondary",
    classes: "Classes IX to XII · CBSE Curriculum",
    badge: "Classes IX – XII",
    image: "/assets/vidyaschool/vidyaschool_student-01.jpg",
    link: "/curriculum",
    shortTitle: "Senior Wing",
    stageTag: "Classes IX–XII",
    icon: GraduationCap,
  },
  {
    id: "middle-wing",
    name: "Middle Wing",
    stage: "Preparatory & Middle Stage",
    classes: "Classes VI to VIII · Experiential Pedagogy",
    badge: "Classes VI – VIII",
    image: "/assets/vidyaschool/vidyaschool_student-06.jpg",
    link: "/curriculum",
    shortTitle: "Middle Wing",
    stageTag: "Classes VI–VIII",
    icon: Atom,
  },
  {
    id: "junior-wing",
    name: "Junior Wing",
    stage: "Foundational & Primary Stage",
    classes: "Nursery to Class V · Activity-Based Learning",
    badge: "Nursery – Class V",
    image: "/assets/vidyaschool/vidyaschool_student-03.jpg",
    link: "/curriculum",
    shortTitle: "Junior Wing",
    stageTag: "Nursery–Class V",
    icon: BookOpen,
  },
]

export function OurWings() {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isHovered, setIsHovered] = useState<boolean>(false)

  // Section width slides automatically among Senior, Middle, and Junior wings
  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % wings.length)
    }, 3800)
    return () => clearInterval(interval)
  }, [isHovered])

  return (
    <section
      id="our-wings"
      className="w-full py-4 md:py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Separator — Matching VIDYA School brand design */}
      <div className="w-full flex flex-col items-center justify-center pt-6 sm:pt-10 pb-5 select-none overflow-hidden my-3 gap-2">
        <div className="flex flex-row w-full max-w-5xl">
          <div
            className="flex-1 h-7 opacity-80 dark:opacity-90 pointer-events-none dark:invert dark:hue-rotate-180"
            style={{
              backgroundImage: "url('/assets/illustrations/separator.svg')",
              backgroundSize: "200% 100%",
              backgroundPosition: "left center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div
            className="flex-1 h-7 opacity-80 dark:opacity-90 pointer-events-none dark:invert dark:hue-rotate-180"
            style={{
              backgroundImage: "url('/assets/illustrations/separator.svg')",
              backgroundSize: "200% 100%",
              backgroundPosition: "right center",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
        <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-foreground/80 py-1">
          Our Wings
        </span>
        <BlurImg
          src="/assets/illustrations/separator.svg"
          alt="Separator ornament"
          loading="lazy"
          decoding="async"
          className="w-full max-w-xs h-7 object-contain dark:invert dark:hue-rotate-180 opacity-80 dark:opacity-90 pointer-events-none rotate-180"
        />
      </div>

      {/* Horizontal Deck: The card width slides smoothly among Senior, Middle & Junior Wings */}
      <div
        className="flex flex-row gap-3 sm:gap-4 md:gap-5 w-full h-[400px] sm:h-[440px] md:h-[480px] lg:h-[520px] items-stretch overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none [contain:paint]"
        role="region"
        aria-label="Our Wings Deck"
      >
        {wings.map((wing, index) => {
          const isActive = activeIndex === index
          const Icon = wing.icon

          return (
            <div
              key={wing.id}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              aria-label={`${wing.name} - ${wing.classes}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setActiveIndex(index)
                }
              }}
              style={{
                flexGrow: isActive ? 3.4 : 1,
                flexShrink: 1,
                flexBasis: "0%",
              }}
              className={cn(
                "group relative h-full overflow-hidden select-none cursor-pointer transform-gpu [isolation:isolate]",
                "rounded-2xl sm:rounded-3xl lg:rounded-[28px] border shadow-md",
                "transition-[flex-grow,border-color,box-shadow,opacity] duration-750 ease-[cubic-bezier(0.25,1,0.5,1)]",
                isActive
                  ? "min-w-[260px] sm:min-w-[340px] md:min-w-[420px] border-transparent shadow-xl"
                  : "min-w-[85px] sm:min-w-[110px] md:min-w-[140px] border-border/70 dark:border-white/10 opacity-80 hover:opacity-100"
              )}
            >
              {/* Pure clean image with zero linear gradient */}
              <BlurImg
                src={wing.image}
                alt={wing.name}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-transform duration-700 ease-out"
              />

              {/* ── Collapsed State: Basic Title & Icon ── */}
              <div
                className={cn(
                  "absolute inset-0 p-3 sm:p-4 flex flex-col justify-between items-center pointer-events-none transition-[opacity,transform] duration-300 ease-out",
                  isActive ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                )}
              >
                {/* Top Frosted Icon */}
                <div className="p-2 sm:p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-md">
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>

                {/* Bottom Basic Title */}
                <div className="flex flex-col items-center justify-end pb-2">
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider text-white uppercase text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
                    {wing.shortTitle}
                  </span>
                  <span className="text-[9px] font-medium tracking-wide text-white/80 uppercase text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] whitespace-nowrap">
                    {wing.stageTag}
                  </span>
                </div>
              </div>

              {/* ── Expanded State: Basic Text Directly on Image (No whole bottom card) ── */}
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 p-5 sm:p-7 md:p-8 flex flex-col justify-end pointer-events-none transition-[opacity,transform] duration-500 ease-out",
                  isActive
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                )}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/25 w-fit mb-2 shadow-md">
                  <Icon className="w-3.5 h-3.5" />
                  {wing.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  {wing.name}
                </h3>

                <p className="text-xs sm:text-sm font-medium text-white/90 mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                  {wing.stage} · {wing.classes}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Link to Full Academic Curriculum */}
      <div className="flex items-center justify-center mt-6 sm:mt-8">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl font-semibold text-xs border-border/80 hover:bg-accent transition-colors shadow-sm"
        >
          <Link href="/curriculum">
            Explore Full Academic Curriculum
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

export default OurWings
