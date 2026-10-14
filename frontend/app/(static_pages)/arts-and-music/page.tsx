import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Arts, Dance & Music"} | VidyaSchool`,
  description: "Arts, Dance & Music - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function ArtsAndMusicStaticPage() {
  const page = getStaticPage("arts-and-music")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
