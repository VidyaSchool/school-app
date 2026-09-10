"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

export function HeroSection() {
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
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

  return (
    <section
      id="hero"
      aria-label="Welcome to VidyaSchool"
      className="relative flex h-[95dvh] min-h-[95dvh] w-full items-center overflow-x-clip py-6 sm:py-0"
    >
      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-[1380px] w-full px-4 sm:px-6 lg:px-8">
        <div
          className="grid w-full h-full grid-cols-1 items-center gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:py-16"
        >
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
                    <Link href="/signup">
                      <span>Continue</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile: -mx-4 px-2 breaks out of container padding for near-full-width with slight gap */}
            <div className="order-1 relative aspect-square -mx-4 px-2 sm:mx-0 sm:px-0 min-h-[340px] sm:aspect-[4/3] sm:min-h-[380px] lg:order-2 lg:col-span-6 lg:aspect-auto lg:h-[75dvh] flex items-center justify-center">
              <LiquidMetalHero />
            </div>
          </div>
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
                        ? "h-[6px] w-6 bg-foreground shadow-sm"
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
