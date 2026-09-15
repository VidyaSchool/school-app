import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"

export const metadata: Metadata = {
  title: `${"About VidyaSchool"} | VidyaSchool`,
  description: "About VidyaSchool - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.",
}

export default function AboutVidyaschoolStaticPage() {
  const page = getStaticPage("about-vidyaschool")
  if (!page) notFound()

  return (
    <StaticPageRenderer
      page={page}
      customHeader={
        <div className="space-y-3 pb-6 mb-6 border-b border-border/40">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            About VidyaSchool
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Educating. Empowering. Transforming.
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Inaugurated in November 2009 in Sector 24, DLF Phase-3, Gurugram, VIDYA School is dedicated to providing transformative English-medium CBSE education.
          </p>
        </div>
      }
    />
  )
}
