"use client"

import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  ImageIcon,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Download,
  CheckCircle2,
  Search,
  RefreshCw,
} from "lucide-react"

export interface GalleryItem {
  id: string
  title: string
  category: string
  src: string
  aspectRatio?: string
  description?: string
  location?: string
  date?: string
}

export const CATEGORIES = [
  "All",
  "Campus & Life",
  "Academics & Labs",
  "Arts & Music",
  "STEM & Robotics",
  "Sports & Athletics",
  "Leadership",
  "Events & Celebrations",
] as const

const CHUNK_SIZE = 9 // Batch size per chunk load

function matchesCategory(itemCat: string, selectedCat: string): boolean {
  if (selectedCat === "All") return true
  const itemLower = (itemCat || "").trim().toLowerCase()
  const selLower = selectedCat.trim().toLowerCase()

  if (selLower === "arts & music" || selLower === "cultural & arts") {
    return itemLower === "arts & music" || itemLower === "cultural & arts" || itemLower === "arts and music"
  }
  if (selLower === "stem & robotics" || selLower === "robotics & stem") {
    return itemLower === "stem & robotics" || itemLower === "robotics & stem" || itemLower === "stem and robotics"
  }
  return itemLower === selLower
}

export function GalleryClient({ initialItems }: { initialItems: GalleryItem[] }) {
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [visibleCount, setVisibleCount] = useState<number>(CHUNK_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())

  // Background fetch to sync any newly added images without hard page reload
  const refreshFromApi = async (isManual = false) => {
    if (isManual) setIsRefreshing(true)
    try {
      const res = await fetch("/api/public/gallery", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (data?.success && Array.isArray(data.images) && data.images.length > 0) {
        const dbItems: GalleryItem[] = data.images
          .filter((img: any) => {
            if (!img?.src || typeof img.src !== "string") return false
            const s = img.src.trim()
            if (/^(javascript|data|vbscript):/i.test(s)) return false
            return s.startsWith("/") || s.startsWith("https://") || s.startsWith("http://")
          })
          .map((img: any) => ({
            id: String(img.id).replace(/[^a-zA-Z0-9_-]/g, ""),
            title: String(img.title || "Campus Photograph").replace(/<[^>]*>?/gm, "").slice(0, 150),
            category: img.category || "Campus & Life",
            src: img.src.trim(),
            aspectRatio: img.aspectRatio || "aspect-[4/3]",
            description: String(img.description || "").replace(/<[^>]*>?/gm, "").slice(0, 1000),
            location: String(img.location || "Main Campus, Gurugram").replace(/<[^>]*>?/gm, "").slice(0, 100),
            date: String(img.date || "2026").replace(/<[^>]*>?/gm, "").slice(0, 50),
          }))

        const dbSrcs = new Set(dbItems.map((i) => i.src))
        const remainingInitial = initialItems.filter((i) => !dbSrcs.has(i.src))
        setGalleryList([...dbItems, ...remainingInitial])
      }
    } catch (err) {
      console.warn("Background gallery refresh error:", err)
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    // Run an initial fresh check on mount
    refreshFromApi(false)
  }, [])

  // Filter items based on active category and search query
  const filteredItems = useMemo(() => {
    return galleryList.filter((item) => {
      // Don't show permanently broken images
      if (brokenImages.has(item.src)) return false

      const inCategory = matchesCategory(item.category, activeCategory)
      if (!inCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const titleMatch = (item.title || "").toLowerCase().includes(q)
      const descMatch = (item.description || "").toLowerCase().includes(q)
      const locMatch = (item.location || "").toLowerCase().includes(q)
      const catMatch = (item.category || "").toLowerCase().includes(q)
      return titleMatch || descMatch || locMatch || catMatch
    })
  }, [activeCategory, galleryList, searchQuery, brokenImages])

  // Reset chunk count when switching category or search
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setVisibleCount(CHUNK_SIZE)
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setVisibleCount(CHUNK_SIZE)
  }

  // Chunk loading handler
  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredItems.length))
      setIsLoadingMore(false)
    }, 300)
  }

  // Slice items to current chunk count
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount)
  }, [filteredItems, visibleCount])

  const hasMore = visibleCount < filteredItems.length

  // Keyboard navigation for Lightbox Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return
      if (e.key === "Escape") setSelectedIndex(null)
      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1))
      }
      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, filteredItems.length])

  const handleImageError = (src: string) => {
    setBrokenImages((prev) => {
      const next = new Set(prev)
      next.add(src)
      return next
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden font-sans">
      {/* ── Background Glow ── */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-primary/10 via-indigo-500/5 to-transparent blur-3xl opacity-70" />

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-10 sm:pt-28 sm:pb-14 px-4 sm:px-6 lg:px-8 text-center space-y-5 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Life at VidyaSchool · Photo Gallery</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight">
          Moments &{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Memories
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
          Explore our vibrant student community, science labs, performing arts, robotics workshops, and institutional achievements.
        </p>

        {/* Stats Bar & Live Refresh */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 shadow-2xs">
            <ImageIcon className="h-3.5 w-3.5 text-primary" />
            {galleryList.length} High-Res Photos
          </span>

          <span className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Showing {filteredItems.length} {activeCategory !== "All" ? `in ${activeCategory}` : "Total"}
          </span>

          <button
            type="button"
            onClick={() => refreshFromApi(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 shadow-2xs hover:bg-card hover:text-foreground transition-colors cursor-pointer"
            title="Refresh gallery from server"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </section>

      {/* ── Search & Filter Tabs Section ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 space-y-5">
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, location, or keyword..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-border/80 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-border/60 pb-6">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/60"
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Photo Grid Section ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        {visibleItems.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-card/40 rounded-2xl border border-dashed border-border/80 max-w-lg mx-auto">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">No photos found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              No photos match your current category or search criteria.
            </p>
            {(activeCategory !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All")
                  setSearchQuery("")
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Gallery Masonry Layout — Zero Extra Space, Exact Image Dimensions */
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {visibleItems.map((item, index) => (
              <div
                key={item.id || item.src}
                onClick={() => setSelectedIndex(index)}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden border border-border/80 bg-card shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1"
              >
                {/* Image Container — adapts 100% to natural image dimensions */}
                <div className="relative w-full overflow-hidden bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    onError={() => handleImageError(item.src)}
                    className="w-full h-auto block object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Sleek Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4 sm:p-5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Top Tag & Zoom Icon */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        {item.category}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 transform scale-90 group-hover:scale-100 transition-transform">
                        <Maximize2 className="h-4 w-4" />
                      </span>
                    </div>

                    {/* Bottom Title & Location Overlay */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white leading-snug drop-shadow-sm">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/85 font-medium flex items-center justify-between">
                        <span>📍 {item.location || "Main Campus, Gurugram"}</span>
                        <span className="text-primary font-semibold text-[11px]">View Photo →</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Chunk Loading Trigger / Controls ── */}
        {visibleItems.length > 0 && (
          <div className="mt-12 flex flex-col items-center justify-center space-y-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Showing {visibleItems.length} of {filteredItems.length} photos
            </p>

            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    <span>Load Next Batch ({Math.min(CHUNK_SIZE, filteredItems.length - visibleCount)} More)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>All photos loaded smoothly</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Lightbox Fullscreen Modal ── */}
      {selectedIndex !== null && visibleItems[selectedIndex] && mounted && createPortal(
        <div
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 z-[9999] w-screen h-screen bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-zoom-out animate-fade-in"
        >
          {/* Modal Box — snug fit to image dimensions with no extra space */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-fit max-h-[90vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-white/10 bg-black/95 shadow-2xl animate-zoom-in cursor-default"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-30 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white p-2.5 transition-all duration-300 hover:rotate-90 shadow-lg cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev Button */}
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/60 hover:bg-black border border-white/20 text-white p-3 transition-all hover:scale-110 shadow-lg cursor-pointer hidden sm:flex"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/60 hover:bg-black border border-white/20 text-white p-3 transition-all hover:scale-110 shadow-lg cursor-pointer hidden sm:flex"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Full Image — Snug Dimensions */}
            <div className="relative max-w-full flex items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={filteredItems[selectedIndex].src}
                alt={filteredItems[selectedIndex].title}
                className="w-auto h-auto max-w-full max-h-[75vh] object-contain block"
              />
            </div>

            {/* Caption Overlay Bar */}
            <div className="w-full border-t border-white/10 bg-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {filteredItems[selectedIndex].category}
                  </span>
                  <span className="text-xs text-white/60">
                    Photo {selectedIndex + 1} of {filteredItems.length}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {filteredItems[selectedIndex].title}
                </h3>
                <p className="text-xs text-white/75">
                  {filteredItems[selectedIndex].description ? `${filteredItems[selectedIndex].description} · ` : ""}
                  📍 {filteredItems[selectedIndex].location || "Main Campus, Gurugram"} · {filteredItems[selectedIndex].date || "2026"}
                </p>
              </div>

              <a
                href={filteredItems[selectedIndex].src}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
