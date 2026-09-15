import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Student Clubs & Societies"} | VidyaSchool`,
  description: "Student Clubs & Societies - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function ClubsStaticPage() {
  const page = getStaticPage("clubs")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
