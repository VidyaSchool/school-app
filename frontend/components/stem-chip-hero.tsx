"use client"

import React, { useRef } from "react"
import { AnimatedBeam } from "@/registry/magicui/animated-beam"

export function StemChipHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Direct references to the physical SVG pins on the microchip
  const pinTopLeftRef = useRef<SVGRectElement>(null)
  const pinTopRightRef = useRef<SVGRectElement>(null)
  const pinBottomCenterRef = useRef<SVGRectElement>(null)

  // Anchors on the cards
  const card1TargetRef = useRef<HTMLDivElement>(null)
  const card2TargetRef = useRef<HTMLDivElement>(null)
  const card3TargetRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative flex w-full flex-col items-center justify-center overflow-hidden py-10 sm:py-16"
    >
      {/* 1. Top: Two cards above the chip */}
      <div className="relative z-10 grid grid-cols-2 gap-8 sm:gap-28 w-full max-w-2xl px-4">
        {/* Card 1: Robotics (Top Left) */}
        <div className="relative flex items-center justify-center py-4 px-4 sm:py-5 sm:px-6 rounded-xl border border-border/80 bg-card text-center shadow-xs transition-colors hover:border-foreground/30">
          <div
            ref={card1TargetRef}
            className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-4 h-0 pointer-events-none"
          />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
            Robotics
          </h3>
        </div>

        {/* Card 2: AI & Coding (Top Right) */}
        <div className="relative flex items-center justify-center py-4 px-4 sm:py-5 sm:px-6 rounded-xl border border-border/80 bg-card text-center shadow-xs transition-colors hover:border-foreground/30">
          <div
            ref={card2TargetRef}
            className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-4 h-0 pointer-events-none"
          />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
            AI &amp; Coding
          </h3>
        </div>
      </div>

      {/* Spacing between top cards and chip */}
      <div className="h-20 sm:h-28 w-full" />

      {/* 2. Middle: Microchip with real physical IC pins */}
      <div className="relative z-10 flex flex-col items-center">
        <svg
          width="261"
          height="118"
          viewBox="0 0 261 118"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-56 sm:w-64 h-auto select-none pointer-events-none drop-shadow-sm overflow-visible"
        >
          {/* Top Metallic Pins (Pin 2 connects to Top Left Card, Pin 6 connects to Top Right Card) */}
          <rect x="54.5" y="0" width="8" height="14" rx="2" fill="#71717a" />
          <rect
            ref={pinTopLeftRef}
            x="78.5"
            y="0"
            width="8"
            height="14"
            rx="2"
            fill="#a1a1aa"
          />
          <rect x="102.5" y="0" width="8" height="14" rx="2" fill="#71717a" />
          <rect x="126.5" y="0" width="8" height="14" rx="2" fill="#71717a" />
          <rect x="150.5" y="0" width="8" height="14" rx="2" fill="#71717a" />
          <rect
            ref={pinTopRightRef}
            x="174.5"
            y="0"
            width="8"
            height="14"
            rx="2"
            fill="#a1a1aa"
          />
          <rect x="198.5" y="0" width="8" height="14" rx="2" fill="#71717a" />

          {/* Bottom Metallic Pins (Pin 4 connects to Bottom Center Card) */}
          <rect x="54.5" y="98" width="8" height="14" rx="2" fill="#8e8e93" />
          <rect x="78.5" y="98" width="8" height="14" rx="2" fill="#8e8e93" />
          <rect x="102.5" y="98" width="8" height="14" rx="2" fill="#8e8e93" />
          <rect
            ref={pinBottomCenterRef}
            x="126.5"
            y="98"
            width="8"
            height="14"
            rx="2"
            fill="#a1a1aa"
          />
          <rect x="150.5" y="98" width="8" height="14" rx="2" fill="#8e8e93" />
          <rect x="174.5" y="98" width="8" height="14" rx="2" fill="#8e8e93" />
          <rect x="198.5" y="98" width="8" height="14" rx="2" fill="#8e8e93" />

          {/* Left Side Pins */}
          <rect x="6" y="38" width="14" height="8" rx="2" fill="#71717a" />
          <rect x="6" y="66" width="14" height="8" rx="2" fill="#71717a" />

          {/* Right Side Pins */}
          <rect x="241" y="38" width="14" height="8" rx="2" fill="#71717a" />
          <rect x="241" y="66" width="14" height="8" rx="2" fill="#71717a" />

          {/* Chip IC Body */}
          <rect
            x="20"
            y="14"
            width="221"
            height="84"
            rx="10"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="1.5"
          />

          {/* Pin 1 Orientation Dot */}
          <circle cx="36" cy="30" r="3" fill="#3f3f46" />

          {/* Minimal Silicon Typography */}
          <text
            x="130.5"
            y="53"
            textAnchor="middle"
            fill="#f4f4f5"
            fontSize="12"
            fontWeight="700"
            letterSpacing="2.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            VIDYA
          </text>
          <text
            x="130.5"
            y="68"
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
            fontWeight="500"
            letterSpacing="1.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            ROBOTICS &amp; STEM
          </text>

          {/* Circuit Test Traces with Hollow Circular Terminals on remaining ports */}
          <g className="text-zinc-400 dark:text-zinc-500">
            {/* Top Pin 1: Steps up and bends left */}
            <path
              d="M 58.5,0 L 58.5,-18 L 34,-18"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="29"
              cy="-18"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Top Pin 4: Central test trace going straight up */}
            <path
              d="M 130.5,0 L 130.5,-26"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
            />
            <circle
              cx="130.5"
              cy="-32"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Top Pin 5: Steps up and bends right */}
            <path
              d="M 150.5,0 L 150.5,-14 L 164,-14"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="169"
              cy="-14"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Bottom Pin 2: Steps down and bends left */}
            <path
              d="M 82.5,112 L 82.5,130 L 58,130"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="52"
              cy="130"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Bottom Pin 6: Steps down and bends right */}
            <path
              d="M 178.5,112 L 178.5,130 L 202,130"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="208"
              cy="130"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Left Pin 1: Steps left much further and bends up */}
            <path
              d="M 6,42 L -85,42 L -85,20"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="-85"
              cy="14"
              r="4.5"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Left Pin 2: Steps left much further and bends down */}
            <path
              d="M 6,70 L -70,70 L -70,92"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="-70"
              cy="98"
              r="4.5"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Right Pin 1: Steps right much further and bends up */}
            <path
              d="M 255,42 L 346,42 L 346,20"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="346"
              cy="14"
              r="4.5"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />

            {/* Right Pin 2: Steps right much further and bends down */}
            <path
              d="M 255,70 L 331,70 L 331,92"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="331"
              cy="98"
              r="4.5"
              stroke="currentColor"
              strokeWidth="2"
              fill="hsl(var(--background))"
            />
          </g>
        </svg>
      </div>

      {/* Spacing between chip and bottom card (closer distance) */}
      <div className="h-12 sm:h-16 w-full" />

      {/* 3. Bottom: One card below the chip */}
      <div className="relative z-10 flex justify-center w-full max-w-xs px-4">
        {/* Card 3: IoT & Hardware (Bottom Center) */}
        <div className="w-full relative flex items-center justify-center py-4 px-4 sm:py-5 sm:px-6 rounded-xl border border-border/80 bg-card text-center shadow-xs transition-colors hover:border-foreground/30">
          <div
            ref={card3TargetRef}
            className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-4 h-0 pointer-events-none"
          />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
            IoT &amp; Hardware
          </h3>
        </div>
      </div>

      {/* Animated Bended Beams connecting the chip pins to the 3 cards (made slightly bigger/bolder) */}
      {/* 1. Chip Top Pin 2 -> Top Left Card */}
      <AnimatedBeam
        duration={3}
        curveType="bended"
        bendRadius={12}
        pathWidth={3}
        pathOpacity={0.25}
        containerRef={containerRef}
        fromRef={pinTopLeftRef}
        toRef={card1TargetRef}
        fromAnchor="top"
        toAnchor="bottom"
        gradientStartColor="#38bdf8"
        gradientStopColor="#0284c7"
      />

      {/* 2. Chip Top Pin 6 -> Top Right Card */}
      <AnimatedBeam
        duration={3}
        curveType="bended"
        bendRadius={12}
        pathWidth={3}
        pathOpacity={0.25}
        containerRef={containerRef}
        fromRef={pinTopRightRef}
        toRef={card2TargetRef}
        fromAnchor="top"
        toAnchor="bottom"
        gradientStartColor="#34d399"
        gradientStopColor="#059669"
        delay={0.25}
      />

      {/* 3. Chip Bottom Pin 4 -> Bottom Center Card */}
      <AnimatedBeam
        duration={3}
        curveType="bended"
        bendRadius={12}
        pathWidth={3}
        pathOpacity={0.25}
        containerRef={containerRef}
        fromRef={pinBottomCenterRef}
        toRef={card3TargetRef}
        fromAnchor="bottom"
        toAnchor="top"
        gradientStartColor="#fbbf24"
        gradientStopColor="#d97706"
        delay={0.5}
      />
    </div>
  )
}
