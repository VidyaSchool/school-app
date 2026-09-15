import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Co-Curricular Activities"} | VidyaSchool`,
  description: "Co-Curricular Activities - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function ActivitiesStaticPage() {
  const page = getStaticPage("activities")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
