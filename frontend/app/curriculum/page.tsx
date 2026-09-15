import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Curriculum Overview"} | VidyaSchool`,
  description: "Curriculum Overview - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function CurriculumStaticPage() {
  const page = getStaticPage("curriculum")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
