import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { db } from "@/lib/db"
import { galleryImage } from "@/lib/schema"
import { asc, desc } from "drizzle-orm"
import { GalleryClient, GalleryItem } from "./gallery-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Photo Gallery | The VIDYA School",
  description: "Campus Photo Gallery at The VIDYA School.",
}

async function getDbGalleryImages(): Promise<GalleryItem[]> {
  try {
    const rows = await db
      .select()
      .from(galleryImage)
      .orderBy(asc(galleryImage.order), desc(galleryImage.createdAt))

    return rows
      .filter((img) => {
        if (!img?.src || typeof img.src !== "string") return false
        const s = img.src.trim()
        if (/^(javascript|data|vbscript):/i.test(s)) return false
        return s.startsWith("/") || s.startsWith("https://") || s.startsWith("http://")
      })
      .map((img) => ({
        id: String(img.id).replace(/[^a-zA-Z0-9_-]/g, ""),
        title: String(img.title || "Campus Photograph").replace(/<[^>]*>?/gm, "").slice(0, 150),
        category: img.category || "Campus & Life",
        src: img.src.trim(),
        aspectRatio: img.aspectRatio || "aspect-[4/3]",
        description: String(img.description || "").replace(/<[^>]*>?/gm, "").slice(0, 1000),
        location: String(img.location || "Main Campus, Gurugram").replace(/<[^>]*>?/gm, "").slice(0, 100),
        date: String(img.date || "2026").replace(/<[^>]*>?/gm, "").slice(0, 50),
      }))
  } catch (err) {
    console.error("Failed to load gallery images from DB:", err)
    return []
  }
}

export default async function GalleryPage() {
  const dbItems = await getDbGalleryImages()

  return (
    <>
      <Header />
      <GalleryClient initialItems={dbItems} />
      <Footer />
    </>
  )
}
