import type { Metadata } from "next"
import { getAllStaticSlugs, getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"
import { DynamicPublicPageFallback } from "./dynamic-fallback"
import { StemChipHero } from "@/components/stem-chip-hero"

// Pre-render all static public pages at build time
export function generateStaticParams() {
  return getAllStaticSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const staticPage = getStaticPage(slug)
  if (staticPage) {
    return {
      title: `${staticPage.title} | VidyaSchool`,
      description: `${staticPage.title} - The VIDYA School, Sector 24, DLF Phase-3, Gurugram.`,
    }
  }
  return {
    title: "Public Page | VidyaSchool",
  }
}

export default async function PublicPageSlugRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const staticPage = getStaticPage(slug)

  if (staticPage) {
    if (slug === "stem" || slug === "robotics") {
      return <StaticPageRenderer page={staticPage} customHeader={<StemChipHero />} />
    }
    if (slug === "about-vidyaschool") {
      return (
        <StaticPageRenderer
          page={staticPage}
          enableSideGallery={true}
          galleryCategory="Campus & Life"
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
    return <StaticPageRenderer page={staticPage} />
  }

  // Fallback for runtime pages created in admin_frontend
  return <DynamicPublicPageFallback slug={slug} />
}
