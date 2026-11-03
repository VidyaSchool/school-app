import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"
import { PrincipalSection } from "@/components/principal-section"

export const metadata: Metadata = {
  title: `${"Principal's Message"} | VidyaSchool`,
  description: "Principal's Message - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function PrincipalsMessageStaticPage() {
  const page = getStaticPage("principals-message")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
      customHeader={
        <div className="space-y-4 pb-8 mb-8 border-b border-border/40 overflow-visible">
          <PrincipalSection />
        </div>
      }
    />
  )
}
