import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: "Fee Structure (2025-26) | VidyaSchool",
  description: "Official Fee Structure for the academic year 2025-26 - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function FeeStructureStaticPage() {
  const page = getStaticPage("fee-structure")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
