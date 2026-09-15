import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Leadership & Governance"} | VidyaSchool`,
  description: "Leadership & Governance - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function LeadershipStaticPage() {
  const page = getStaticPage("leadership")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
