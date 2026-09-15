import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Admission Process"} | VidyaSchool`,
  description: "Admission Process - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function AdmissionProcessStaticPage() {
  const page = getStaticPage("admission-process")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
