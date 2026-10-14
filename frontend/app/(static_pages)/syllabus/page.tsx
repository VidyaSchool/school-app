import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Curriculum Syllabus"} | VidyaSchool`,
  description: "Curriculum Syllabus - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function SyllabusStaticPage() {
  const page = getStaticPage("syllabus")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
