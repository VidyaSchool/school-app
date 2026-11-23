"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import {
  Camera,
  Sparkles,
  MapPin,
  ImageIcon,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface GalleryImageItem {
  id: string
  title: string
  category: string
  src: string
  aspectRatio?: string
  description?: string
  location?: string
  date?: string
}

const FALLBACK_CAMPUS_IMAGES: GalleryImageItem[] = [
  {
    id: "gal_1789724360242_8c6a0f5c",
    title: "Campus & Student Life",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724322977-33b1805b-d064-4ac7-9a69-34a8b19875f1-img_9224-1-scaled.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
  {
    id: "gal_1789724360482_75c8e3dd",
    title: "VIDYA School Campus Building",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724327872-3ed1cffb-15b0-47a4-8ef4-f8c669beae5c-vidya-school-scaled.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Sector 24, DLF Phase-3, Gurugram",
    date: "2026",
  },
  {
    id: "gal_1789724360718_e69ef7cd",
    title: "Classroom Learning Environment",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724332943-cbe30c3f-c012-4032-b07c-8907ec84b822-img_9344-scaled.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
  {
    id: "gal_1789724360958_4f0fe047",
    title: "Campus Community & Vibrancy",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724336863-5b09d6b7-d0e8-4797-afdc-d20452f1e031-images.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
  {
    id: "gal_1789724361194_392f4f9d",
    title: "Student Gatherings & Celebrations",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724340001-7c2327d3-2aa6-4d0f-9a72-0bdf07587ae0-img-20220815-wa0007-300x300.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
  {
    id: "gal_1789724361433_4efa077c",
    title: "Park2Land Green Campus Team",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724344658-80aa55e0-6fc2-48b4-8b19-8f2af4de17a1-park2land-team-scaled.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "DLF Phase-3 Campus",
    date: "2026",
  },
  {
    id: "gal_1789724361670_eee1d176",
    title: "Sports & Campus Grounds",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724350755-f6ab9f20-b9a2-490e-90f0-aa7a30384640-img_9182-scaled.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus Grounds",
    date: "2026",
  },
  {
    id: "gal_1789724361910_1fe5fe9d",
    title: "Campus Independence Day Gathering",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724355038-e2bda24d-8810-4099-bd17-e14628e95f6e-img-20220815-wa0004-300x300.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
  {
    id: "gal_1789724362148_1fa04edc",
    title: "Daily Life at VidyaSchool",
    category: "Campus & Life",
    src: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/gallery/1789724358247-08efb9bc-d30d-4a10-9354-8bf379f18b71-images-1.jpg",
    aspectRatio: "aspect-[4/3]",
    location: "Main Campus, Gurugram",
    date: "2026",
  },
]

function formatCleanTitle(rawTitle: string, index: number): string {
  if (!rawTitle) return `Campus Moment #${index + 1}`
  const clean = rawTitle.replace(/Scaled/gi, "").replace(/[-_]+/g, " ").trim()
  const lower = clean.toLowerCase()
  if (lower.startsWith("img") || lower.startsWith("image") || clean.length < 4) {
    const titles = [
      "Campus & Student Life",
      "VIDYA School Campus Building",
      "Classroom Learning",
      "Campus Community",
      "Student Gatherings",
      "Park2Land Green Campus Team",
      "Sports & Play Grounds",
      "Independence Day Gathering",
      "Daily Life at VidyaSchool",
    ]
    return titles[index % titles.length]
  }
  return clean
}

export function useGalleryImages(category = "Campus & Life") {
  const [images, setImages] = React.useState<GalleryImageItem[]>(FALLBACK_CAMPUS_IMAGES)
  const [loading, setLoading] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isMounted = true
    const fetchImages = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/gallery?category=${encodeURIComponent(category)}`, {
          cache: "no-store",
        })
        if (!res.ok) return
        const data = await res.json()
        if (isMounted && data?.success && Array.isArray(data.images) && data.images.length > 0) {
          const formatted: GalleryImageItem[] = data.images
            .filter((img: any) => typeof img?.src === "string" && img.src.startsWith("http"))
            .map((img: any, idx: number) => ({
              id: img.id || `img-${idx}`,
              title: formatCleanTitle(img.title || "", idx),
              category: img.category || category,
              src: img.src,
              aspectRatio: img.aspectRatio || "aspect-[4/3]",
              description: img.description || "",
              location: img.location || "Main Campus, Gurugram",
              date: img.date || "2026",
            }))

          if (formatted.length > 0) {
            setImages(formatted)
          }
        }
      } catch (err) {
        console.warn("Failed to fetch gallery images for side column:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchImages()

    return () => {
      isMounted = false
    }
  }, [category])

  return { images, loading }
}

interface SideGalleryColumnProps {
  side: "left" | "right"
  images: Array<GalleryImageItem & { originalIndex: number }>
  onSelectImage: (index: number) => void
}

export function SideGalleryColumn({ side, images, onSelectImage }: SideGalleryColumnProps) {
  return (
    <aside className="hidden xl:flex flex-col gap-6 w-56 2xl:w-64 shrink-0 pt-1">
      {/* Top Header Label */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          {side === "left" ? (
            <>
              <Camera className="size-3.5 shrink-0" />
              <span>Campus & Life</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 shrink-0" />
              <span>Campus Moments</span>
            </>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {images.length} photos
        </span>
      </div>

      {/* Image Cards Stream */}
      <div className="flex flex-col gap-5">
        {images.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectImage(item.originalIndex)}
            className="group relative rounded-2xl overflow-hidden border border-border/80 bg-card shadow-xs hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
          >
            {/* Image Box */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Tag and Zoom Icon */}
              <div className="absolute top-2 left-2 z-10">
                <span className="rounded-md bg-black/60 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                  {item.category}
                </span>
              </div>

              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="flex size-6 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">
                  <Maximize2 className="size-3" />
                </span>
              </div>
            </div>

            {/* Polaroid / Card Footnote */}
            <div className="p-3 bg-card/90 space-y-1">
              <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span className="truncate flex items-center gap-1">
                  <MapPin className="size-2.5 shrink-0 text-muted-foreground/80" />
                  {item.location || "Campus, Gurugram"}
                </span>
                <span className="text-[10px] text-primary/90 font-medium shrink-0 group-hover:underline">
                  View ↗
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Anchor Card at Bottom */}
      {side === "left" ? (
        <div className="sticky top-28 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-sm space-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span>VIDYA School Campus</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Inaugurated November 2009 in Sector 24, DLF Phase-3, Gurugram. English-medium CBSE education.
          </p>
          <div className="pt-1">
            <Link
              href="/gallery"
              className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              <span>Explore full campus gallery</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="sticky top-28 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-sm space-y-2.5 mt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <ImageIcon className="size-3.5 text-primary shrink-0" />
            <span>Campus Gallery</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Discover student projects, science & robotics labs, cultural events, and sports.
          </p>
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <span>View All Photos</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      )}
    </aside>
  )
}

interface MobileGalleryStripProps {
  images: GalleryImageItem[]
  onSelectImage: (index: number) => void
}

export function MobileGalleryStrip({ images, onSelectImage }: MobileGalleryStripProps) {
  if (images.length === 0) return null

  return (
    <section className="xl:hidden mt-12 pt-8 border-t border-border/60 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
            <Camera className="size-3.5 shrink-0" />
            <span>Campus & Life</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Life at VIDYA School
          </h3>
        </div>
        <Link
          href="/gallery"
          className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
        >
          <span>All Photos</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onSelectImage(index)}
            className="group relative rounded-2xl overflow-hidden border border-border/80 bg-card shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2">
                <span className="rounded-md bg-black/60 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                  {item.category}
                </span>
              </div>
            </div>
            <div className="p-3 bg-card/90 space-y-1">
              <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span className="truncate flex items-center gap-1">
                  <MapPin className="size-2.5 shrink-0 text-muted-foreground/80" />
                  {item.location || "Campus, Gurugram"}
                </span>
                <span className="text-[10px] text-primary font-medium shrink-0">Zoom ↗</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

interface GalleryLightboxModalProps {
  images: GalleryImageItem[]
  selectedIndex: number | null
  onClose: () => void
  onSelectIndex: (index: number) => void
}

export function GalleryLightboxModal({
  images,
  selectedIndex,
  onClose,
  onSelectIndex,
}: GalleryLightboxModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") {
        onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1)
      }
      if (e.key === "ArrowRight") {
        onSelectIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, images.length, onClose, onSelectIndex])

  if (!mounted || selectedIndex === null || !images[selectedIndex]) {
    return null
  }

  const current = images[selectedIndex]

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] w-screen h-screen bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-fit max-h-[92vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-white/10 bg-black/95 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white p-2.5 transition-all duration-300 hover:rotate-90 shadow-lg cursor-pointer"
          aria-label="Close photo viewer"
        >
          <X className="size-5" />
        </button>

        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/60 hover:bg-black border border-white/20 text-white p-3 transition-all hover:scale-110 shadow-lg cursor-pointer hidden sm:flex"
          aria-label="Previous photo"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onSelectIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/60 hover:bg-black border border-white/20 text-white p-3 transition-all hover:scale-110 shadow-lg cursor-pointer hidden sm:flex"
          aria-label="Next photo"
        >
          <ChevronRight className="size-6" />
        </button>

        {/* Main Image Container */}
        <div className="relative max-w-full flex items-center justify-center bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt={current.title}
            className="w-auto h-auto max-w-full max-h-[75vh] object-contain block"
          />
        </div>

        {/* Caption Footbar */}
        <div className="w-full bg-black/90 border-t border-white/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {current.category}
              </span>
              <span className="text-xs text-white/60">
                Photo {selectedIndex + 1} of {images.length}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              {current.title}
            </h3>
            {current.location && (
              <p className="text-xs text-white/70 flex items-center gap-1">
                <MapPin className="size-3" />
                <span>{current.location}</span>
                {current.date && <span>• {current.date}</span>}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/gallery"
              onClick={onClose}
              className="text-xs font-semibold text-primary-foreground/90 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
            >
              Open Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
