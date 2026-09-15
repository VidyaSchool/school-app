import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Laboratories & Research Facilities"} | VidyaSchool`,
  description: "Laboratories & Research Facilities - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function LaboratoriesStaticPage() {
  const page = getStaticPage("laboratories")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
