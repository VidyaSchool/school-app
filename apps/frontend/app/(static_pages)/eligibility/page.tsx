import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Admission Eligibility Criteria"} | VidyaSchool`,
  description: "Admission Eligibility Criteria - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function EligibilityStaticPage() {
  const page = getStaticPage("eligibility")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
