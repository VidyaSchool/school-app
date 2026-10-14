import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"School Management Committee (SMC)"} | VidyaSchool`,
  description: "School Management Committee (SMC) - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function SchoolManagementCommitteeStaticPage() {
  const page = getStaticPage("school-management-committee")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
    />
  )
}
