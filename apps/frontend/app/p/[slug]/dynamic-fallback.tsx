"use client"

import * as React from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { StaticPageRenderer } from "@/components/static-page-renderer"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { StaticPageData } from "@/lib/static-pages"

export function DynamicPublicPageFallback({ slug }: { slug: string }) {
  const [page, setPage] = React.useState<StaticPageData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function fetchPage() {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/page?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()

        if (!isMounted) return
        if (!res.ok || !data.found || !data.page) {
          throw new Error(data.error || "Page not found")
        }

        setPage({
          slug: data.page.slug,
          title: data.page.title,
          widgets: data.page.widgets,
        })
      } catch (err: unknown) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load page")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPage()

    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
          <AlertCircle className="size-12 text-rose-500" />
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-sm text-muted-foreground">{error || "The requested public page does not exist."}</p>
        </div>
        <Footer />
      </div>
    )
  }

  return <StaticPageRenderer page={page} />
}
