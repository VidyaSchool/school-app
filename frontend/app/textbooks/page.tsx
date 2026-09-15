import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Prescribed Textbooks"} | VidyaSchool`,
  description: "Prescribed Textbooks - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function TextbooksStaticPage() {
  const page = getStaticPage("textbooks")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
