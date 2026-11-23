import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Infrastructure Details"} | VidyaSchool`,
  description: "Infrastructure Details - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function InfrastructureDetailsStaticPage() {
  const page = getStaticPage("infrastructure-details")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
