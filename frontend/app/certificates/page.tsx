import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"School Certificates & Regulatory Compliance"} | VidyaSchool`,
  description: "School Certificates & Regulatory Compliance - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function CertificatesStaticPage() {
  const page = getStaticPage("certificates")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
