import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Faculty Details (CBSE OASIS)"} | VidyaSchool`,
  description: "Faculty Details (CBSE OASIS) - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function FacultyDetailsStaticPage() {
  const page = getStaticPage("faculty-details")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
