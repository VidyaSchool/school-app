import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Get Involved – Volunteering & Mentorship"} | VidyaSchool`,
  description: "Get Involved – Volunteering & Mentorship - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function GetInvolvedStaticPage() {
  const page = getStaticPage("get-involved")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
