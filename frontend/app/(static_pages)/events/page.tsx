import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"School Events & Celebrations"} | VidyaSchool`,
  description: "School Events & Celebrations - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function EventsStaticPage() {
  const page = getStaticPage("events")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
