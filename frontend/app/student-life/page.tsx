import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Student Life at Vidya"} | VidyaSchool`,
  description: "Student Life at Vidya - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function StudentLifeStaticPage() {
  const page = getStaticPage("student-life")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
