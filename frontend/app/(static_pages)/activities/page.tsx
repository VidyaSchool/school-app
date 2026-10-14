import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"Co-Curricular Activities"} | VidyaSchool`,
  description: "Co-Curricular Activities - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function ActivitiesStaticPage() {
  const page = getStaticPage("activities")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
      customHeader={
        <div className="space-y-3 pb-6 mb-6 border-b border-border/40">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Beyond Academics
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Co-Curricular Activities
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Nurturing talent, athletic vitality, creative expression, scientific innovation, and collaborative leadership across our student community.
          </p>
        </div>
      }
    />
  )
}
