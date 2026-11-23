import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Academic Subjects"} | VidyaSchool`,
  description: "Academic Subjects - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function SubjectsStaticPage() {
  const page = getStaticPage("subjects")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
