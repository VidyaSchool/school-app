"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import { MapPin, Mail, Check, Copy, Globe } from "lucide-react"

/* ── SVG Helper Icons ─────────────────────────────────────────────────── */
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export default function DevelopersPage() {
  const [copiedEmail1, setCopiedEmail1] = useState(false)
  const [copiedEmail2, setCopiedEmail2] = useState(false)
  const developerEmail = "work.ankit.mail@gmail.com"
  const avatarUrl = "https://avatars.githubusercontent.com/u/167751294?v=4"

  const handleCopyEmail1 = () => {
    navigator.clipboard.writeText(developerEmail)
    setCopiedEmail1(true)
    setTimeout(() => setCopiedEmail1(false), 2500)
  }

  const handleCopyEmail2 = () => {
    navigator.clipboard.writeText("ss0331984@gmail.com")
    setCopiedEmail2(true)
    setTimeout(() => setCopiedEmail2(false), 2500)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-black text-foreground transition-colors duration-300 relative overflow-hidden font-sans">
        
        {/* ── Background Typography Text Flood Layer ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-[0.035] dark:opacity-[0.06] flex flex-col justify-between -rotate-6 scale-110 z-0 py-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="whitespace-nowrap text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white leading-none"
              style={{
                transform: i % 2 === 0 ? "translateX(-2%)" : "translateX(-12%)",
              }}
            >
              DEVELOPER CREATOR DESIGNER ARCHITECT CODE FULLSTACK DEVELOPER CREATOR DESIGNER ARCHITECT CODE FULLSTACK
            </div>
          ))}
        </div>

        {/* ── Main Container ── */}
        <div className="relative w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col gap-16 lg:gap-24">
          
          {/* ──────────────────────────────────────────────────────────
              CARD 1: Standard Profile Layout
             ────────────────────────────────────────────────────────── */}
          <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* ── Left Typography: DEVELOPERS / CREATORS (4 Cols) ── */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-0 tracking-tighter select-none z-10">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black uppercase text-zinc-900 dark:text-white leading-none transition-colors">
                DEVELOPERS
              </h1>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black uppercase text-zinc-200 dark:text-zinc-800 leading-none transition-colors">
                CREATORS
              </h2>
            </div>

            {/* ── Center Profile Card 1 (7 Cols) ── */}
            <div className="lg:col-span-7 z-20 relative">
              <div className="relative rounded-none bg-white/75 dark:bg-[#111111]/75 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 group">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
                  
                  {/* Photo with Location Tag (Left 5 Cols) */}
                  <div className="md:col-span-5 relative">
                    <div className="relative aspect-square w-full rounded-none overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md">
                      <Image
                        src={avatarUrl}
                        alt="Ankit K. Mandal in Gurgaon"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 320px"
                        priority
                        unoptimized
                      />
                      
                      {/* Location Tag */}
                      <div className="absolute bottom-3 left-3 bg-black/80 dark:bg-black/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-none flex items-center gap-1.5 text-xs font-semibold text-white tracking-wide shadow-md">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Gurgaon</span>
                      </div>
                    </div>
                  </div>

                  {/* Name & Bio Content (Right 7 Cols) */}
                  <div className="md:col-span-7 space-y-5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-2.5 py-1 rounded-none">
                        LEAD FULL-STACK ARCHITECT
                      </span>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-zinc-900 dark:text-white mt-2.5 leading-tight">
                        ANKIT K. MANDAL
                      </h3>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide mt-1">
                        CREATOR & ARCHITECT OF VIDYASCHOOL
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                      Full-stack software architect specializing in Next.js 16, React 19, TypeScript, and interactive web animation systems. Passionate about building minimal, performant, and high-impact digital experiences.
                    </p>

                    {/* Skill Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["NEXT.JS 16", "REACT 19", "TYPESCRIPT", "TAILWIND CSS", "CANVAS 2D"].map((tech) => (
                        <span key={tech} className="text-[10px] font-bold uppercase tracking-wider bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-none border border-zinc-300 dark:border-zinc-700/60">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Contact & Social Links Bar */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Email Copy Pill */}
                      <button
                        type="button"
                        onClick={handleCopyEmail1}
                        className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/80 px-3.5 py-2 rounded-none text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors text-left"
                        title="Click to copy email"
                      >
                        <Mail className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-[200px]">{developerEmail}</span>
                        {copiedEmail1 ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-auto" />
                        )}
                      </button>

                      {/* Social Icons */}
                      <div className="flex items-center gap-2">
                        <a
                          href="https://github.com/ankit-blazeneuro"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 dark:bg-zinc-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          aria-label="GitHub Profile"
                          title="GitHub"
                        >
                          <GithubIcon />
                        </a>
                        <a
                          href="https://www.linkedin.com/in/iamankitkm"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 dark:bg-zinc-900 hover:bg-[#0A66C2] hover:text-white border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          aria-label="LinkedIn Profile"
                          title="LinkedIn"
                        >
                          <LinkedinIcon />
                        </a>
                        <a
                          href="https://ankit.blazeneuro.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-600 hover:text-white border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          aria-label="Portfolio Website"
                          title="Portfolio Website"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* ── Right Vertical Text: DESIGNERS (1 Col) ── */}
            <div className="hidden lg:flex lg:col-span-1 justify-end items-center select-none">
              <span className="text-7xl xl:text-8xl font-black uppercase text-zinc-200 dark:text-zinc-800 tracking-tighter [writing-mode:vertical-rl] rotate-180 transition-colors opacity-80">
                DESIGNERS
              </span>
            </div>

          </div>

          {/* ──────────────────────────────────────────────────────────
              CARD 2: Mirrored Profile Layout Below
             ────────────────────────────────────────────────────────── */}
          <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* ── Mirrored Left Vertical Text: DESIGNERS (1 Col) ── */}
            <div className="hidden lg:flex lg:col-span-1 justify-start items-center select-none order-1">
              <span className="text-7xl xl:text-8xl font-black uppercase text-zinc-200 dark:text-zinc-800 tracking-tighter [writing-mode:vertical-rl] transition-colors opacity-80">
                DESIGNERS
              </span>
            </div>

            {/* ── Mirrored Center Profile Card 2 (7 Cols) ── */}
            <div className="lg:col-span-7 z-20 relative order-2">
              <div className="relative rounded-none bg-white/75 dark:bg-[#111111]/75 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 group">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
                  
                  {/* Mirrored Text Content (Left 7 Cols on desktop) */}
                  <div className="md:col-span-7 space-y-5 order-2 md:order-1">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800/50 px-2.5 py-1 rounded-none">
                        LEAD UI/UX DEVELOPER
                      </span>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-zinc-900 dark:text-white mt-2.5 leading-tight">
                        SURAJ GOLA
                      </h3>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide mt-1">
                        CO-CREATOR & DESIGNER OF VIDYASCHOOL
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                      Full-stack developer and UI/UX engineer specializing in Next.js, React, Tailwind CSS, and crafting intuitive, responsive digital portal experiences.
                    </p>

                    {/* Skill Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["UI/UX DESIGN", "NEXT.JS", "TAILWIND CSS", "REACT", "ANIMATIONS"].map((tech) => (
                        <span key={tech} className="text-[10px] font-bold uppercase tracking-wider bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-none border border-zinc-300 dark:border-zinc-700/60">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Contact & Social Links Bar */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleCopyEmail2}
                        className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/80 px-3.5 py-2 rounded-none text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors text-left"
                        title="Click to copy email"
                      >
                        <Mail className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-[200px]">ss0331984@gmail.com</span>
                        {copiedEmail2 ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-auto" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href="https://github.com/surajgola00"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 dark:bg-zinc-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          aria-label="GitHub Profile"
                          title="GitHub"
                        >
                          <GithubIcon />
                        </a>
                        <a
                          href="https://www.linkedin.com/in/surajgola/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 dark:bg-zinc-900 hover:bg-[#0A66C2] hover:text-white border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          aria-label="LinkedIn Profile"
                          title="LinkedIn"
                        >
                          <LinkedinIcon />
                        </a>
                        <a
                          href="https://todfodcoders.vercel.app/surajgola"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-none bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-600 hover:text-white border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors"
                          aria-label="Portfolio Website"
                          title="Portfolio Website"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                  </div>

                  {/* Mirrored Photo (Right 5 Cols on desktop) */}
                  <div className="md:col-span-5 relative order-1 md:order-2">
                    <div className="relative aspect-square w-full rounded-none overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md">
                      <Image
                        src="https://avatars.githubusercontent.com/u/142398597?v=4"
                        alt="Suraj Gola"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 320px"
                        unoptimized
                      />
                      <div className="absolute bottom-3 right-3 bg-black/80 dark:bg-black/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-none flex items-center gap-1.5 text-xs font-semibold text-white tracking-wide shadow-md">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Gurgaon</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ── Mirrored Right Typography: CREATORS / DEVELOPERS (4 Cols) ── */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-0 tracking-tighter select-none z-10 order-3 text-right overflow-hidden">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black uppercase text-zinc-200 dark:text-zinc-800 leading-none transition-colors truncate">
                CREATORS
              </h2>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black uppercase text-zinc-900 dark:text-white leading-none transition-colors truncate">
                DEVELOPERS
              </h1>
            </div>

          </div>

          {/* Mobile Rotated Text Fallback */}
          <div className="lg:hidden text-center pt-4 select-none">
            <span className="text-4xl sm:text-5xl font-black uppercase text-zinc-200 dark:text-zinc-800 tracking-tighter transition-colors">
              DESIGNERS
            </span>
          </div>

        </div>

      </main>
      <Footer />
    </>
  )
}
