"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { BlurImage, BlurImg } from "@/components/blur-image"

interface ImageLightboxProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export default function ImageLightbox({ src, alt, width, height, priority }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="relative w-full h-full rounded-lg overflow-hidden border border-border/60 bg-muted/20 cursor-zoom-in group">
        <BlurImage 
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
          loading={priority ? "eager" : "lazy"}
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <p className="text-white text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{alt}</p>
        </div>
      </div>

      {isOpen && mounted && createPortal(
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-[9999] w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-border/10 bg-black/95 shadow-2xl animate-zoom-in cursor-default"
          >
            <BlurImg src={src} alt={alt} className="w-full h-auto max-h-[85vh] object-contain" />
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2.5 transition-all hover:rotate-90 duration-300 shadow-lg" 
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
              <p className="text-white text-sm font-semibold text-center">{alt}</p>
            </div>
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
