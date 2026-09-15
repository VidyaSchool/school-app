import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Frequently Asked Questions (FAQs)"} | VidyaSchool`,
  description: "Frequently Asked Questions (FAQs) - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function FaqsStaticPage() {
  const page = getStaticPage("faqs")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
