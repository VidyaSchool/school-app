import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Library & Learning Resource Centre"} | VidyaSchool`,
  description: "Library & Learning Resource Centre - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function LibraryStaticPage() {
  const page = getStaticPage("library")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
