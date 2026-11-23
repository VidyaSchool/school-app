import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Academic Calendar"} | VidyaSchool`,
  description: "Academic Calendar - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function AcademicCalendarStaticPage() {
  const page = getStaticPage("academic-calendar")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
