import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Tech Fest 2026 Updated"} | VidyaSchool`,
  description: "Tech Fest 2026 Updated - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function TechFestStaticPage() {
  const page = getStaticPage("tech-fest")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
