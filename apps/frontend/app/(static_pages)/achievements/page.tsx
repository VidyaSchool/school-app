import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Student Achievements & Honors"} | VidyaSchool`,
  description: "Student Achievements & Honors - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function AchievementsStaticPage() {
  const page = getStaticPage("achievements")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
