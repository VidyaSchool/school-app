"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, LayoutTemplate, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageEntry {
  uid: string
  name: string
  slug: string
  updatedAt: string
}

const STORAGE_KEY = "vidya_pages"

function getPages(): PageEntry[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function savePages(pages: PageEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

export default function PageBuilderListPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const [pages, setPages] = React.useState<PageEntry[]>([])

  React.useEffect(() => {
    setPages(getPages())
  }, [])

  const createPage = () => {
    const uid = crypto.randomUUID()
    const newPage: PageEntry = {
      uid,
      name: "Untitled Page",
      slug: `page-${uid.slice(0, 6)}`,
      updatedAt: new Date().toISOString(),
    }
    const updated = [...pages, newPage]
    savePages(updated)
    router.push(`/admin/${username}/page-builder/${uid}`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Page Builder</h1>
        </div>
        <Button size="sm" onClick={createPage} className="gap-1.5 h-8 text-xs">
          <Plus className="size-3.5" /> New Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl text-muted-foreground/40 gap-3">
          <LayoutTemplate className="size-10" />
          <p className="text-sm">No pages yet. Create your first page.</p>
          <Button variant="outline" size="sm" onClick={createPage} className="gap-1.5 text-xs">
            <Plus className="size-3.5" /> Create Page
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Page Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Last Updated</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {pages.map(page => (
                <tr
                  key={page.uid}
                  onClick={() => router.push(`/admin/${username}/page-builder/${page.uid}`)}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{page.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">/{page.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(page.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ExternalLink className="size-3.5 text-muted-foreground/40 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
