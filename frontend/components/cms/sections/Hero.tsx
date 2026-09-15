"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface HeroProps {
  badge?: string
  title: string
  subtitle?: string
  primaryButtonText?: string
  primaryButtonUrl?: string
  secondaryButtonText?: string
  secondaryButtonUrl?: string
  backgroundImageUrl?: string
  align?: "left" | "center"
}

export function HeroSection({
  badge,
  title,
  subtitle,
  primaryButtonText,
  primaryButtonUrl,
  secondaryButtonText,
  secondaryButtonUrl,
  backgroundImageUrl,
  align = "left",
}: HeroProps) {
  const isCenter = align === "center"

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 p-8 sm:p-14 shadow-sm backdrop-blur-xs">
      {backgroundImageUrl && (
        <div className="absolute inset-0 -z-10 opacity-15 overflow-hidden">
          <Image
            src={backgroundImageUrl}
            alt={title}
            fill
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col space-y-4 max-w-3xl",
          isCenter && "mx-auto text-center items-center"
        )}
      >
        {badge && (
          <div>
            <Badge
              variant="secondary"
              className="gap-1.5 px-3.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              <Sparkles className="size-3.5" />
              {badge}
            </Badge>
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
          {title}
        </h1>

        {subtitle && (
          <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl text-pretty">
            {subtitle}
          </p>
        )}

        {(primaryButtonText || secondaryButtonText) && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 pt-4",
              isCenter && "justify-center"
            )}
          >
            {primaryButtonText && primaryButtonUrl && (
              <Button asChild size="lg" className="rounded-xl font-semibold px-6 shadow-xs">
                <Link href={primaryButtonUrl}>
                  {primaryButtonText} <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            )}
            {secondaryButtonText && secondaryButtonUrl && (
              <Button asChild variant="outline" size="lg" className="rounded-xl font-medium px-5">
                <Link href={secondaryButtonUrl}>{secondaryButtonText}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
