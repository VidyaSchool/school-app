import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Parents Teachers Association (PTA)"} | VidyaSchool`,
  description: "Parents Teachers Association (PTA) - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function PtaStaticPage() {
  const page = getStaticPage("pta")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
