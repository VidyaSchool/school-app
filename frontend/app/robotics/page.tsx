import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"
import { StemChipHero } from "@/components/stem-chip-hero"

export const metadata: Metadata = {
  title: `${"Robotics & STEM Hub"} | VidyaSchool`,
  description: "Robotics & STEM Hub - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function RoboticsStaticPage() {
  const page = getStaticPage("robotics") || getStaticPage("stem")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
      customHeader={<StemChipHero />}
    />
  )
}
