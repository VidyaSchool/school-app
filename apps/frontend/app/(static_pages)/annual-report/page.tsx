import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Annual Reports & Institutional Milestones"} | VidyaSchool`,
  description: "Annual Reports & Institutional Milestones - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function AnnualReportStaticPage() {
  const page = getStaticPage("annual-report")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
