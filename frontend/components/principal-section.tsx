"use client"

import * as React from "react"
import Link from "next/link"
import { BlurImg } from "@/components/blur-image"
import { cn } from "@/lib/utils"
import {
  Atom,
  FlaskConical,
  FlaskRound,
  TestTube,
  TestTubeDiagonal,
  TestTubes,
  Microscope,
  Dna,
  Beaker,
  Pipette,
  Flame,
  Orbit,
} from "lucide-react"

function ChemistryBackgroundIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
      {/* ── Top Left Cluster ── */}
      <Atom className="absolute top-2 left-3 sm:left-6 w-8 h-8 sm:w-11 sm:h-11 text-white/25 -rotate-12 stroke-[1.5]" />
      <FlaskConical className="absolute top-12 sm:top-14 left-14 sm:left-22 w-8 h-8 sm:w-11 sm:h-11 text-white/25 rotate-12 stroke-[1.5]" />
      <Flame className="absolute top-24 sm:top-28 left-20 sm:left-28 w-5 h-5 sm:w-7 sm:h-7 text-white/20 stroke-[1.5]" />
      <Pipette className="absolute top-4 left-32 sm:left-44 w-7 h-7 sm:w-10 sm:h-10 text-white/20 -rotate-45 stroke-[1.5]" />
      <span className="absolute top-3 left-24 sm:left-34 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-white/30">
        H₂O
      </span>
      {/* Periodic tile: Carbon */}
      <div className="absolute top-12 left-36 sm:left-52 border border-white/20 bg-white/5 rounded-md px-1.5 py-0.5 text-center font-mono text-white/25 scale-75 sm:scale-90">
        <span className="text-[8px] block leading-none">6</span>
        <span className="text-xs sm:text-sm font-bold block leading-tight">C</span>
        <span className="text-[7px] block leading-none">12.01</span>
      </div>

      {/* ── Mid-Left Cluster ── */}
      <TestTubeDiagonal className="absolute top-28 sm:top-36 left-4 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 text-white/22 rotate-12 stroke-[1.5]" />
      <span className="absolute top-24 sm:top-30 left-14 sm:left-24 text-[10px] sm:text-[11px] font-mono text-white/25">
        pH = -log[H⁺]
      </span>
      {/* Hydrocarbon chain SVG */}
      <svg
        viewBox="0 0 120 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute top-36 sm:top-44 left-20 sm:left-36 w-16 sm:w-24 h-6 sm:h-8 text-white/20 -rotate-6"
      >
        <polyline points="10,30 35,10 60,30 85,10 110,30" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="35" y1="10" x2="35" y2="0" strokeLinecap="round" />
        <circle cx="35" cy="0" r="2.5" fill="currentColor" />
        <circle cx="60" cy="30" r="2.5" fill="currentColor" />
      </svg>

      {/* ── Bottom Left Cluster ── */}
      <TestTubes className="absolute bottom-3 left-4 sm:left-8 w-12 h-12 sm:w-18 sm:h-18 text-white/25 rotate-6 stroke-[1.5]" />
      {/* Aromatic Benzene Ring */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="absolute bottom-10 sm:bottom-14 left-18 sm:left-28 w-12 h-12 sm:w-18 sm:h-18 text-white/22 rotate-45"
      >
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="24" strokeWidth="2" strokeDasharray="6 4" />
      </svg>
      {/* Fused secondary ring */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute bottom-4 sm:bottom-6 left-32 sm:left-48 hidden sm:block w-10 h-10 sm:w-14 sm:h-14 text-white/18 rotate-12"
      >
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" strokeLinejoin="round" />
        <line x1="50" y1="20" x2="78" y2="36" />
        <line x1="78" y1="64" x2="50" y2="80" />
        <line x1="22" y1="64" x2="22" y2="36" />
      </svg>
      <span className="absolute bottom-2 left-20 sm:left-32 text-[10px] sm:text-xs font-mono font-bold tracking-wider text-white/25">
        CH₃COOH
      </span>
      {/* Periodic tile: Hydrogen */}
      <div className="absolute bottom-14 left-36 sm:left-56 hidden md:block border border-white/20 bg-white/5 rounded-md px-1.5 py-0.5 text-center font-mono text-white/20 scale-75">
        <span className="text-[8px] block leading-none">1</span>
        <span className="text-xs font-bold block leading-tight">H</span>
        <span className="text-[7px] block leading-none">1.008</span>
      </div>

      {/* ── Top Right Cluster ── */}
      <Microscope className="absolute top-3 right-4 sm:right-8 w-14 h-14 sm:w-20 sm:h-20 text-white/25 rotate-6 stroke-[1.5]" />
      <FlaskRound className="absolute top-14 sm:top-18 right-16 sm:right-28 w-10 h-10 sm:w-14 sm:h-14 text-white/22 -rotate-12 stroke-[1.5]" />
      <TestTube className="absolute top-4 right-28 sm:right-44 w-7 h-7 sm:w-10 sm:h-10 text-white/22 rotate-45 stroke-[1.5]" />
      <span className="absolute top-4 right-20 sm:right-32 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-white/30">
        NaCl
      </span>
      {/* Periodic tile: Oxygen */}
      <div className="absolute top-14 right-34 sm:right-50 border border-white/20 bg-white/5 rounded-md px-1.5 py-0.5 text-center font-mono text-white/25 scale-75 sm:scale-90">
        <span className="text-[8px] block leading-none">8</span>
        <span className="text-xs sm:text-sm font-bold block leading-tight">O</span>
        <span className="text-[7px] block leading-none">15.99</span>
      </div>
      <span className="absolute top-26 sm:top-32 right-12 sm:right-20 text-[9px] sm:text-[11px] font-mono text-white/25">
        PV = nRT
      </span>

      {/* ── Mid-Right Cluster ── */}
      {/* Water molecule bent angle H-O-H */}
      <svg
        viewBox="0 0 80 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute top-32 sm:top-38 right-24 sm:right-38 w-12 sm:w-16 h-9 sm:h-12 text-white/22"
      >
        <circle cx="40" cy="20" r="10" fill="currentColor" fillOpacity="0.2" />
        <line x1="33" y1="26" x2="18" y2="44" strokeWidth="2.5" />
        <circle cx="15" cy="48" r="6" fill="currentColor" fillOpacity="0.3" />
        <line x1="47" y1="26" x2="62" y2="44" strokeWidth="2.5" />
        <circle cx="65" cy="48" r="6" fill="currentColor" fillOpacity="0.3" />
        <text x="36" y="24" fontSize="10" fill="currentColor" stroke="none" fontWeight="bold">O</text>
        <text x="12" y="52" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">H</text>
        <text x="62" y="52" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">H</text>
      </svg>
      <span className="absolute top-44 sm:top-48 right-8 sm:right-16 text-[9px] sm:text-[10px] font-mono text-white/22">
        ΔG = ΔH - TΔS
      </span>

      {/* ── Bottom Right Cluster ── */}
      <Beaker className="absolute bottom-3 right-4 sm:right-8 w-14 h-14 sm:w-20 sm:h-20 text-white/25 -rotate-6 stroke-[1.5]" />
      <Dna className="absolute bottom-14 sm:bottom-18 right-16 sm:right-28 w-10 h-10 sm:w-14 sm:h-14 text-white/22 rotate-12 stroke-[1.5]" />
      {/* Hexagon aromatic ring with internal double lines */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="absolute bottom-8 right-28 sm:right-44 w-12 h-12 sm:w-16 sm:h-16 text-white/20 -rotate-15"
      >
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="22" strokeWidth="2" strokeDasharray="5 3" />
      </svg>
      <span className="absolute bottom-3 right-20 sm:right-32 text-[10px] sm:text-xs font-mono font-bold tracking-wider text-white/25">
        C₆H₁₂O₆
      </span>
      {/* Periodic tile: Nitrogen */}
      <div className="absolute bottom-16 right-36 sm:right-56 hidden md:block border border-white/20 bg-white/5 rounded-md px-1.5 py-0.5 text-center font-mono text-white/20 scale-75">
        <span className="text-[8px] block leading-none">7</span>
        <span className="text-xs font-bold block leading-tight">N</span>
        <span className="text-[7px] block leading-none">14.00</span>
      </div>

      {/* ── Reaction Equation Bar across bottom ── */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-4 text-[10px] font-mono font-semibold tracking-wider text-white/20 whitespace-nowrap">
        <span>2H₂ + O₂ → 2H₂O</span>
        <span>•</span>
        <span>CH₄ + 2O₂ → CO₂ + 2H₂O</span>
        <span>•</span>
        <span>H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O</span>
      </div>
    </div>
  )
}

export function PrincipalSection({ className }: { className?: string }) {
  return (
    <section id="principal" className={cn("w-full py-4 overflow-visible", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-16 md:pt-24 lg:pt-36">

        {/* Left — text content */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-5 order-2 lg:order-1">
          <div>
            <p className="text-lg sm:text-xl font-semibold text-foreground leading-snug">Ms. Ila Sarin</p>
            <p className="text-sm text-muted-foreground mt-0.5">Principal, VIDYA School · MSc Chemistry · B.Ed</p>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            A highly recognized educator deeply committed to empowering underprivileged youth through modern, practical education.
          </p>
          <div className="space-y-2.5 pt-1 text-sm text-muted-foreground">
            <p>✓ <span className="font-medium text-foreground">National Award Winner</span> — Conferred the Institutional Leadership in Entrepreneurship Award at the Youth Ideathon National Awards at IIT Delhi.</p>
            <p>✓ <span className="font-medium text-foreground">Innovation &amp; Mentorship</span> — Guided student innovators whose project &ldquo;Park2Land&rdquo; (smart urban parking system) earned National Top-125 finalist honors at the CBSE &amp; MEPSC Youth Ideathon hosted at IIT Delhi. <Link href="/p/achievements" className="text-primary hover:underline font-medium inline-flex items-center">View verified awards &rarr;</Link></p>
          </div>
        </div>

        {/* Right — principal placeholder */}
        <div className="lg:col-span-7 order-1 lg:order-2 mt-16 sm:mt-20 lg:mt-6">
          <div
            className="relative rounded-3xl border border-border/80 h-48 sm:h-64 md:h-80 lg:h-96 overflow-visible"
          >
            {/* Clipped bg layer — gradient + grain stay within rounded corners */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #2a3bbf 0%, #4556d4 35%, #5D6EE2 65%, #6e7fe8 100%)",
              }}
            >
              {/* SVG grain filter */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.35] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain-filter">
                  <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain-filter)" />
              </svg>
              {/* Radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_25%,rgba(255,255,255,0.15)_0%,transparent_65%)] pointer-events-none" />

              {/* Chemistry background icons */}
              <ChemistryBackgroundIcons />
            </div>
            {/* Principal image — overflows above card responsively */}
            <BlurImg
              src="/assets/illustrations/principle.png"
              alt="VIDYA School Principal"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] sm:h-[400px] md:h-[480px] lg:h-[530px] w-auto max-w-none object-contain"
            />
          </div>
        </div>

      </div>
    </section>
  )
}
