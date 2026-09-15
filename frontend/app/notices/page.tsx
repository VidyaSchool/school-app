import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"School Notices & Circulars"} | VidyaSchool`,
  description: "School Notices & Circulars - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function NoticesStaticPage() {
  const page = getStaticPage("notices")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
