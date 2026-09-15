import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"STEM & Robotics Innovation"} | VidyaSchool`,
  description: "STEM & Robotics Innovation - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function StemStaticPage() {
  const page = getStaticPage("stem")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
