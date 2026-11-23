import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Teachers & Staff Faculty"} | VidyaSchool`,
  description: "Teachers & Staff Faculty - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function TeachersAndStaffStaticPage() {
  const page = getStaticPage("teachers-and-staff")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
