import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Sports & Physical Education"} | VidyaSchool`,
  description: "Sports & Physical Education - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function SportsStaticPage() {
  const page = getStaticPage("sports")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
