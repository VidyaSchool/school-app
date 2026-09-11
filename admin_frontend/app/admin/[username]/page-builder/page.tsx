"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  MoreHorizontal,
  FileText,
  RefreshCw,
  Check,
  Globe,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export interface PageEntry {
  uid: string
  title: string
  slug: string
  status: "published" | "draft"
  updatedAt: string
  createdAt?: string
}

const STORAGE_KEYS = ["vidya_elementor_pages", "vidya_pages"]

function getLocalPages(): PageEntry[] {
  if (typeof window === "undefined") return []
  const map = new Map<string, PageEntry>()

  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const uid = item.uid || item.id
            if (uid && !map.has(uid)) {
              map.set(uid, {
                uid,
                title: item.title || item.name || "Untitled Page",
                slug: item.slug || `page-${uid.slice(0, 6)}`,
                status: item.status === "draft" ? "draft" : "published",
                updatedAt: item.updatedAt || new Date().toISOString(),
                createdAt: item.createdAt || item.updatedAt || new Date().toISOString(),
              })
            }
          }
        }
      }
    } catch {
      // Ignore local storage parse error
    }
  }

  return Array.from(map.values())
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "Just now"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  } catch {
    return "Recently"
  }
}

export default function PageBuilderDashboard() {
  const router = useRouter()
  const params = useParams()
  const username = (params?.username as string) || "admin"

  const [pages, setPages] = React.useState<PageEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all")
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null)

  // Create page dialog
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newSlug, setNewSlug] = React.useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false)
  const [creating, setCreating] = React.useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = React.useState<PageEntry | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const loadAllPages = React.useCallback(async () => {
    const local = getLocalPages()
    let remote: PageEntry[] = []

    try {
      const res = await fetch("/api/admin/page-builder")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data?.pages)) {
          remote = data.pages.map((p: { uid?: string; id?: string; title?: string; name?: string; slug?: string; status?: string; updatedAt?: string; createdAt?: string }) => ({
            uid: p.uid || p.id || "",
            title: p.title || p.name || "Untitled Page",
            slug: p.slug || "",
            status: p.status === "draft" ? "draft" : "published",
            updatedAt: p.updatedAt || new Date().toISOString(),
            createdAt: p.createdAt || p.updatedAt || new Date().toISOString(),
          }))
        }
      }
    } catch {
      // Fallback to local storage
    }

    const merged = new Map<string, PageEntry>()
    for (const p of remote) {
      if (p.uid) merged.set(p.uid, p)
    }
    for (const p of local) {
      if (p.uid && !merged.has(p.uid)) {
        merged.set(p.uid, p)
      }
    }

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [])

  React.useEffect(() => {
    let mounted = true
    loadAllPages()
      .then((data) => {
        if (mounted) setPages(data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [loadAllPages])

  const refreshList = async () => {
    setLoading(true)
    try {
      const data = await loadAllPages()
      setPages(data)
      toast.success("Pages refreshed")
    } catch {
      toast.error("Failed to refresh pages")
    } finally {
      setLoading(false)
    }
  }

  // Handle title input change and auto-slug
  const handleTitleChange = (val: string) => {
    setNewTitle(val)
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setNewSlug(generated)
    }
  }

  // Create page
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = newTitle.trim()
    if (!trimmedTitle) {
      toast.error("Please enter a page title")
      return
    }

    const trimmedSlug = (
      newSlug.trim() ||
      trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    ).replace(/^-+|-+$/g, "")

    setCreating(true)

    const uid = crypto.randomUUID()
    const newPage: PageEntry = {
      uid,
      title: trimmedTitle,
      slug: trimmedSlug || `page-${uid.slice(0, 6)}`,
      status: "published",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    // Save locally
    try {
      const raw = localStorage.getItem("vidya_elementor_pages")
      const parsed = raw ? JSON.parse(raw) : []
      const updated = [
        {
          uid,
          id: uid,
          title: newPage.title,
          name: newPage.title,
          slug: newPage.slug,
          status: "published",
          widgets: [],
          updatedAt: newPage.updatedAt,
        },
        ...parsed,
      ]
      localStorage.setItem("vidya_elementor_pages", JSON.stringify(updated))
    } catch {
      // Ignore
    }

    // Save to PostgreSQL backend
    try {
      await fetch("/api/admin/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: newPage.title,
          slug: newPage.slug,
          widgets: [],
        }),
      })
    } catch {
      // Backend error fallback
    }

    setPages((prev) => [newPage, ...prev])
    setIsCreateOpen(false)
    setNewTitle("")
    setNewSlug("")
    setSlugManuallyEdited(false)
    setCreating(false)
    toast.success("Page created")

    router.push(`/admin/${username}/page-builder/${uid}`)
  }

  // Delete page
  const handleDeletePage = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      await fetch(`/api/admin/page-builder?uid=${deleteTarget.uid}`, {
        method: "DELETE",
      })
    } catch {
      // Ignore
    }

    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const list = JSON.parse(raw)
          const filtered = list.filter((p: { uid?: string; id?: string }) => (p.uid || p.id) !== deleteTarget.uid)
          localStorage.setItem(key, JSON.stringify(filtered))
        }
      } catch {
        // Ignore
      }
    }

    setPages((prev) => prev.filter((p) => p.uid !== deleteTarget.uid))
    toast.success("Page deleted")
    setDeleteTarget(null)
    setDeleting(false)
  }

  // Toggle status
  const handleToggleStatus = async (page: PageEntry) => {
    const nextStatus = page.status === "published" ? "draft" : "published"

    // Optimistic UI update
    setPages((prev) =>
      prev.map((p) => (p.uid === page.uid ? { ...p, status: nextStatus, updatedAt: new Date().toISOString() } : p))
    )

    try {
      await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: page.uid, status: nextStatus }),
      })
      toast.success(`Page marked as ${nextStatus}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  // Copy public URL
  const copyPublicUrl = (slug: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3001", ":3000")
        : ""
    const url = `${origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    toast.success("Public link copied to clipboard")
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || page.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 w-full space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Page Builder</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and publish landing pages for your school website.
          </p>
        </div>
        <Button
          onClick={() => {
            setNewTitle("")
            setNewSlug("")
            setSlugManuallyEdited(false)
            setIsCreateOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="size-4" />
          Create Page
        </Button>
      </div>

      {/* Toolbar: Search, Filter Tabs, Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "all" | "published" | "draft")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">
                All ({pages.length})
              </TabsTrigger>
              <TabsTrigger value="published" className="text-xs">
                Published ({pages.filter((p) => p.status === "published").length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs">
                Drafts ({pages.filter((p) => p.status === "draft").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshList}
          disabled={loading}
          className="h-9 gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Content Table or Empty State */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading pages...</span>
          </div>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">No pages found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
            {searchQuery
              ? "No pages match your search criteria. Try a different search."
              : "Get started by creating your first custom landing page."}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => {
                setNewTitle("")
                setNewSlug("")
                setSlugManuallyEdited(false)
                setIsCreateOpen(true)
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="size-4" />
              Create Page
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[42%] px-6 py-3.5">Page Title</TableHead>
                <TableHead className="w-[26%] px-6 py-3.5">Public URL</TableHead>
                <TableHead className="w-[12%] px-6 py-3.5">Status</TableHead>
                <TableHead className="w-[12%] px-6 py-3.5">Last Updated</TableHead>
                <TableHead className="w-[8%] px-6 py-3.5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.uid} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div
                      onClick={() => router.push(`/admin/${username}/page-builder/${page.uid}`)}
                      className="cursor-pointer group flex items-center gap-2.5"
                    >
                      <Globe className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {page.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px]">
                        /p/{page.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyPublicUrl(page.slug)}
                        title="Copy public link"
                      >
                        {copiedSlug === page.slug ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {page.status === "published" ? (
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                    {formatDate(page.updatedAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1"
                        onClick={() => router.push(`/admin/${username}/page-builder/${page.uid}`)}
                      >
                        <Edit3 className="size-3.5" />
                        Edit
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/${username}/page-builder/${page.uid}`)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit3 className="size-4" />
                            Open Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const origin =
                                typeof window !== "undefined"
                                  ? window.location.origin.replace(":3001", ":3000")
                                  : ""
                              window.open(`${origin}/p/${page.slug}`, "_blank")
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <ExternalLink className="size-4" />
                            View Live
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyPublicUrl(page.slug)}
                            className="gap-2 cursor-pointer"
                          >
                            <Copy className="size-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(page)}
                            className="gap-2 cursor-pointer"
                          >
                            {page.status === "published" ? "Mark as Draft" : "Mark as Published"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(page)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            Delete Page
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Page Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Enter a title for your new landing page. You can customize the content in the visual builder.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePage} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                placeholder="e.g. Annual Admissions 2026"
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-slug">URL Slug</Label>
              <div className="flex items-center rounded-md border bg-muted/40 px-3">
                <span className="text-xs text-muted-foreground select-none">/p/</span>
                <Input
                  id="page-slug"
                  placeholder="annual-admissions-2026"
                  value={newSlug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    setNewSlug(e.target.value)
                  }}
                  className="border-0 bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Public address will be: <span className="font-mono">/p/{newSlug || "your-slug"}</span>
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newTitle.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create & Open Builder"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeletePage}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Page"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
