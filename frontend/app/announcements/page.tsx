import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Official Announcements"} | VidyaSchool`,
  description: "Official Announcements - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function AnnouncementsStaticPage() {
  const page = getStaticPage("announcements")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
