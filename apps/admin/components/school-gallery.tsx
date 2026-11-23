"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { BlurImg } from "@/components/blur-image"

interface SchoolImage {
  src: string
  alt: string
  style: React.CSSProperties
}

const images: SchoolImage[] = [
  {
    src: "/assets/vidyaschool/school.jpg",
    alt: "Our School Campus",
    style: { left: "0%", top: "0%", width: "32%", height: "48%", borderRadius: 20, rotate: "-2deg", zIndex: 2 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-03.jpg",
    alt: "Student Mentorship & Assembly",
    style: { left: "26%", top: "4%", width: "24%", height: "48%", borderRadius: 20, rotate: "1.5deg", zIndex: 3 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-05.jpg",
    alt: "Choral Singing & Music",
    style: { left: "48%", top: "0%", width: "24%", height: "50%", borderRadius: 20, rotate: "-1.5deg", zIndex: 2 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-07.jpg",
    alt: "Sports & Playground Activities",
    style: { right: "0%", top: "2%", width: "30%", height: "50%", borderRadius: 20, rotate: "2deg", zIndex: 3 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-06.jpg",
    alt: "Lego STEM Robotics",
    style: { left: "3%", bottom: "0%", width: "28%", height: "46%", borderRadius: 20, rotate: "2deg", zIndex: 3 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-01.jpg",
    alt: "Library & Collaborative Study",
    style: { left: "28%", bottom: "2%", width: "24%", height: "46%", borderRadius: 20, rotate: "-2deg", zIndex: 4 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-04.jpg",
    alt: "Focused Reading & Academic Learning",
    style: { left: "50%", bottom: "0%", width: "22%", height: "46%", borderRadius: 20, rotate: "1.5deg", zIndex: 3 },
  },
  {
    src: "/assets/vidyaschool/vidyaschool_student-02.jpg",
    alt: "Classical Dance Ensemble",
    style: { right: "0%", bottom: "2%", width: "30%", height: "46%", borderRadius: 20, rotate: "-1.5deg", zIndex: 4 },
  },
]

export default function SchoolGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (activeIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveIndex(null)
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex])

  const active = activeIndex !== null ? images[activeIndex] : null

  return (
    <>
      {/* Mobile Layout (< 640px) — responsive 2-column collage grid */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:hidden">
        {images.map((img, i) => {
          const isWide = i === 0 || i === images.length - 1
          return (
            <div
              key={img.src}
              className={`relative overflow-hidden rounded-2xl cursor-zoom-in group ${
                isWide ? "col-span-2 aspect-[16/9]" : "col-span-1 aspect-[4/3]"
              }`}
              onClick={() => setActiveIndex(i)}
            >
              <BlurImg
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }}
              />
              <span className="absolute bottom-2.5 left-3 text-white text-xs font-semibold tracking-wide drop-shadow">
                {img.alt}
              </span>
            </div>
          )
        })}
      </div>

      {/* Desktop/Tablet Layout (>= 640px) — asymmetric overlapping collage */}
      <div className="hidden sm:block relative w-full h-[480px] md:h-[540px] lg:h-[600px] xl:h-[640px]">
        {images.map((img, i) => (
          <div
            key={img.src}
            className="absolute overflow-hidden cursor-zoom-in group transition-transform duration-300 hover:scale-[1.03] hover:z-20"
            style={img.style}
            onClick={() => setActiveIndex(i)}
          >
            <BlurImg
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }}
            />
            <span className="absolute bottom-3 left-4 text-white text-xs font-semibold tracking-wide drop-shadow">
              {img.alt}
            </span>
          </div>
        ))}
      </div>

      {/* Lightbox dialog — portaled to body for true viewport centering */}
      {active && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-fade-in"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-white/10 bg-black/95 animate-zoom-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <BlurImg
              src={active.src}
              alt={active.alt}
              className="w-full h-auto max-h-[85vh] object-contain"
            />

            {/* Bottom Caption & Index */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 py-4 flex items-center justify-between">
              <p className="text-white text-sm font-semibold tracking-wide">{active.alt}</p>
              <span className="text-white/70 text-xs font-medium">
                {activeIndex! + 1} / {images.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2.5 transition-colors shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2.5 transition-colors shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => setActiveIndex(null)}
              className="absolute top-4 right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 hover:border-white/30 text-white p-2.5 transition-all duration-300 hover:rotate-90 shadow-lg"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes zoom-in {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-zoom-in { animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </>
  )
}
