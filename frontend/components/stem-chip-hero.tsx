"use client"

import React, { forwardRef, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Bot, Code2, Cpu, Sparkles, Zap, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/registry/magicui/animated-beam"
import { Badge } from "@/components/ui/badge"

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)] transition-transform duration-300 hover:scale-110",
        className
      )}
    >
      {children}
    </div>
  )
})

Circle.displayName = "Circle"

export function StemChipHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Chip port node refs (top)
  const chipNodeLeftRef = useRef<HTMLDivElement>(null)
  const chipNodeCenterRef = useRef<HTMLDivElement>(null)
  const chipNodeRightRef = useRef<HTMLDivElement>(null)

  // Three card target refs (bottom)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const card3Ref = useRef<HTMLDivElement>(null)

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-zinc-50/50 via-background to-muted/20 dark:from-zinc-950 dark:via-background dark:to-zinc-900/40 p-4 sm:p-8 md:p-10 mb-10 shadow-sm">
      {/* Background ambient decorative glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-10 size-72 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-10 size-72 rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-3xl" />

      {/* Header title */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
          <Sparkles className="size-3.5 text-primary animate-pulse" />
          <span>Atal Tinkering Lab • Innovation Matrix</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Robotics &amp; STEM Architecture
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Powered by hands-on engineering, autonomous computation, and rapid prototyping. Explore the central neural processor feeding our core innovation tracks.
        </p>
      </div>

      {/* Main Animated Beam Interactive Canvas */}
      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-between w-full max-w-5xl mx-auto pt-2 pb-6"
      >
        {/* TOP SECTION: Central Microchip (chip.svg) with Chip Nodes */}
        <div className="relative z-10 flex flex-col items-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative group p-4 sm:p-5 rounded-2xl border border-border/80 bg-zinc-900/90 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-md"
          >
            {/* Top decorative chip badge */}
            <div className="flex items-center justify-between gap-3 mb-2 px-1">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                VIDYA-MCU 2026 // SOC-V1
              </span>
              <span className="text-[10px] font-mono text-zinc-500">64-BIT DUAL CORE</span>
            </div>

            {/* Chip SVG Graphic */}
            <div className="relative flex items-center justify-center py-2 px-4">
              <Image
                src="/assets/illustrations/chip.svg"
                alt="Vidya STEM Neural Microchip"
                width={261}
                height={118}
                className="w-48 sm:w-64 h-auto drop-shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-transform duration-500 group-hover:scale-[1.02]"
                priority
              />
            </div>

            {/* Chip Connection Nodes directly under bottom pins */}
            <div className="flex items-center justify-around gap-6 sm:gap-12 mt-3 pt-2 border-t border-zinc-800">
              <div className="flex flex-col items-center gap-1.5">
                <Circle
                  ref={chipNodeLeftRef}
                  className="size-11 sm:size-12 border-sky-400/80 bg-sky-500/15 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                >
                  <Bot className="size-5" />
                </Circle>
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold">BUS-01</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <Circle
                  ref={chipNodeCenterRef}
                  className="size-11 sm:size-12 border-emerald-400/80 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <Code2 className="size-5" />
                </Circle>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">BUS-02</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <Circle
                  ref={chipNodeRightRef}
                  className="size-11 sm:size-12 border-amber-400/80 bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <Cpu className="size-5" />
                </Circle>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">BUS-03</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM SECTION: Three Innovation Cards connected to the chip */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
          {/* Card 1: Robotics & Mechatronics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-sky-500/50 dark:hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.2)]"
          >
            <div className="space-y-4">
              {/* Receiver Node Circle */}
              <div className="flex items-center justify-between">
                <Circle
                  ref={card1Ref}
                  className="size-12 border-sky-500/60 bg-sky-500/10 text-sky-500 dark:text-sky-400"
                >
                  <Bot className="size-5" />
                </Circle>
                <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs">
                  Robotics Lab
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-sky-500 transition-colors">
                  Autonomous Robotics
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Assembly of autonomous rovers, sensor telemetry, Arduino microcontrollers, and competitive national robotic challenges.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-sky-500 shrink-0" />
                  <span>Obstacle avoidance &amp; line followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-sky-500 shrink-0" />
                  <span>Motor drivers &amp; PWM servo control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-sky-500 shrink-0" />
                  <span>Drone telemetry &amp; flight dynamics</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
              <span>Track 01 • ATL Lab</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </motion.div>

          {/* Card 2: AI & Computational Thinking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-emerald-500/50 dark:hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.2)]"
          >
            <div className="space-y-4">
              {/* Receiver Node Circle */}
              <div className="flex items-center justify-between">
                <Circle
                  ref={card2Ref}
                  className="size-12 border-emerald-500/60 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                >
                  <Code2 className="size-5" />
                </Circle>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                  AI &amp; Coding
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                  AI &amp; Computational Logic
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Python 3 algorithmic thinking, machine learning model training, edge computer vision, and ethical AI architecture.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Python data structures &amp; loops</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>OpenCV object recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Decision trees &amp; neural modeling</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Track 02 • Coding Lab</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </motion.div>

          {/* Card 3: IoT & Rapid Prototyping */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-amber-500/50 dark:hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.2)]"
          >
            <div className="space-y-4">
              {/* Receiver Node Circle */}
              <div className="flex items-center justify-between">
                <Circle
                  ref={card3Ref}
                  className="size-12 border-amber-500/60 bg-amber-500/10 text-amber-500 dark:text-amber-400"
                >
                  <Cpu className="size-5" />
                </Circle>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  Hardware &amp; IoT
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors">
                  IoT &amp; Rapid Prototyping
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  3D CAD drafting, rapid 3D printer slicing, breadboard circuitry, and cloud-connected campus sensor networks.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />
                  <span>3D CAD modeling &amp; additive printing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />
                  <span>PCB breadboarding &amp; soldering safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />
                  <span>ESP32 Wi-Fi &amp; MQTT telemetry</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Track 03 • Maker Lab</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </motion.div>
        </div>

        {/* ANIMATED BEAMS (Framer Motion) connecting chip nodes to cards */}
        <AnimatedBeam
          duration={3}
          curvature={-30}
          containerRef={containerRef}
          fromRef={chipNodeLeftRef}
          toRef={card1Ref}
          gradientStartColor="#0284c7"
          gradientStopColor="#38bdf8"
          pathColor="#0284c7"
          pathOpacity={0.2}
          pathWidth={2.5}
        />

        <AnimatedBeam
          duration={3.2}
          curvature={0}
          containerRef={containerRef}
          fromRef={chipNodeCenterRef}
          toRef={card2Ref}
          gradientStartColor="#059669"
          gradientStopColor="#34d399"
          pathColor="#059669"
          pathOpacity={0.2}
          pathWidth={2.5}
          delay={0.4}
        />

        <AnimatedBeam
          duration={3.4}
          curvature={30}
          containerRef={containerRef}
          fromRef={chipNodeRightRef}
          toRef={card3Ref}
          gradientStartColor="#d97706"
          gradientStopColor="#fbbf24"
          pathColor="#d97706"
          pathOpacity={0.2}
          pathWidth={2.5}
          delay={0.8}
        />
      </div>
    </section>
  )
}
