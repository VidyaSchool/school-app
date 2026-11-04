"use client"

import { useState, useRef, useEffect, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Play, X } from "lucide-react"
import Image from "next/image"

const emptySubscribe = () => () => {}

export default function VideoModal() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false)
    }
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isModalOpen])

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const clientX = e.clientX
    const clientY = e.clientY
    if (rafId.current) cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      if (!badgeRef.current || !imageContainerRef.current) return
      const rect = imageContainerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      badgeRef.current.style.transform = `translate3d(${x - 60}px, ${y - 20}px, 0)`
    })
  }

  return (
    <>
      <div 
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onClick={() => setIsModalOpen(true)}
        className="relative rounded-2xl overflow-hidden border border-border/80 bg-card/45 shadow-lg group aspect-video cursor-pointer select-none"
      >
        <Image
          className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105 will-change-transform"
          src="/assets/illustrations/thumbnail.webp"
          alt="VIDYA School Video Thumbnail"
          width={1366}
          height={768}
          quality={85}
          sizes="(max-width: 1024px) 100vw, 58vw"
        />
        <button
          type="button"
          className="absolute left-1/2 top-1/2 z-20 flex h-18 w-18 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-2xl backdrop-blur-md transition-transform hover:scale-110"
          aria-label="Play video"
        >
          <Play className="ml-1 h-7 w-7 fill-current" />
        </button>

        {/* Floating cursor badge — purely GPU accelerated, zero React re-renders */}
        <div 
          ref={badgeRef}
          className="hidden sm:flex absolute pointer-events-none z-20 items-center gap-2 bg-background/90 dark:bg-background/90 border border-border/80 text-foreground font-semibold rounded-xl shadow-2xl text-xs px-4 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 will-change-transform"
          style={{ 
            top: 0,
            left: 0,
            transform: "translate3d(-9999px, -9999px, 0)"
          }}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white animate-pulse">
            <Play className="h-2 w-2 fill-current ml-0.5" />
          </div>
          <span>Watch Video</span>
        </div>
      </div>

      {isModalOpen && mounted && createPortal(
        <div 
          onClick={() => setIsModalOpen(false)} 
          className="fixed inset-0 z-[9999] w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/95 shadow-2xl animate-zoom-in cursor-default"
          >
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2.5 transition-all hover:rotate-90 duration-300 shadow-lg" 
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/LxzeiY0BG1U?si=m2V7tJ-BuAWCP48f&autoplay=1"
              title="VIDYA Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>,
        document.body
      )}
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-zoom-in {
          animation: zoom-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  )
}

