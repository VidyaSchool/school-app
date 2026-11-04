"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Play, X } from "lucide-react"
import { BlurImage } from "@/components/blur-image"

const emptySubscribe = () => () => {}

export default function VideoModal() {
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  return (
    <>
      <div 
        role="button"
        tabIndex={0}
        aria-label="Play VIDYA School Video"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsModalOpen(true)
          }
        }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/80 bg-card/50 shadow-xl group aspect-video cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transform-gpu"
      >
        <BlurImage
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] will-change-transform"
          src="/assets/illustrations/thumbnail.webp"
          alt="VIDYA School Video Thumbnail"
          width={1366}
          height={768}
          quality={80}
          sizes="(max-width: 1024px) 100vw, 58vw"
        />

        {/* Ambient Dark Gradient for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/70 pointer-events-none" />

        {/* Center Play Button & Interactive Badge */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div
            className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-white/40 bg-black/45 text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary group-hover:shadow-primary/40 transform-gpu"
          >
            <Play className="ml-1 h-7 w-7 sm:h-8 sm:w-8 fill-current transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-black/70 border border-white/20 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-300 group-hover:bg-primary/95 group-hover:border-primary/50 group-hover:scale-105">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Watch Video</span>
          </div>
        </div>
      </div>

      {isModalOpen && mounted && createPortal(
        <div 
          onClick={() => setIsModalOpen(false)} 
          className="fixed inset-0 z-[9999] w-screen h-screen bg-black/85 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-fade-in"
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

