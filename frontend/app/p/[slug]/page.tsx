import type { Metadata } from "next"
import { getAllStaticSlugs, getStaticPage } from "@/lib/static-pages"
import { StaticPageRenderer } from "@/components/static-page-renderer"
import { DynamicPublicPageFallback } from "./dynamic-fallback"

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
    return <StaticPageRenderer page={staticPage} />
  }

  // Fallback for runtime pages created in admin_frontend
  return <DynamicPublicPageFallback slug={slug} />
}
