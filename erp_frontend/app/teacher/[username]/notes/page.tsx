"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { PlusIcon, Trash2Icon, NotebookPenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  title: string
  content: string
  color: string
  updated_at: string
  pdf_url?: string
  pdfUrl?: string
}

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  default: { bg: "bg-white dark:bg-zinc-900",          border: "border-zinc-200 dark:border-zinc-800" },
  yellow:  { bg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-800/50" },
  blue:    { bg: "bg-sky-50 dark:bg-sky-950/30",       border: "border-sky-200 dark:border-sky-800/50" },
  green:   { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/50" },
  pink:    { bg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-200 dark:border-rose-800/50" },
  purple:  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800/50" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function TeacherNotesPage() {
  const router = useRouter()
  const { username } = useParams<{ username: string }>()
  const [notes, setNotes] = React.useState<Note[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/backend/teacher/notes")
      .then(r => r.json())
      .then(d => setNotes(d.notes ?? []))
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setLoading(false))
  }, [])

  async function handleNew() {
    setCreating(true)
    const res = await fetch("/api/backend/teacher/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (!res.ok) { toast.error("Failed to create note"); setCreating(false); return }
    const { id } = await res.json()
    router.push(`/teacher/${username}/notes/${id}`)
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await fetch(`/api/backend/teacher/notes/${id}`, { method: "DELETE" })
    setNotes(prev => prev.filter(n => n.id !== id))
    toast.success("Note deleted")
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <NotebookPenIcon className="h-7 w-7 text-primary" /> My Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Personal notes and reminders.</p>
        </div>
        <Button onClick={handleNew} disabled={creating} className="shrink-0">
          <PlusIcon className="h-4 w-4 mr-1.5" /> New Note
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-zinc-100 dark:bg-zinc-900 h-40 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-border rounded-2xl bg-muted/10">
          <NotebookPenIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No notes yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "New Note" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => {
            const c = COLOR_MAP[note.color] ?? COLOR_MAP.default
            return (
              <div
                key={note.id}
                onClick={() => router.push(`/teacher/${username}/notes/${note.id}`)}
                className={cn(
                  "group relative rounded-2xl border p-5 flex flex-col gap-2 shadow-xs cursor-pointer transition-shadow hover:shadow-md",
                  c.bg, c.border
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-1">
                    {note.title || "Untitled"}
                  </h3>
                  <button
                    onClick={e => handleDelete(e, note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
                {note.content && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">
                    {note.content.startsWith("{") ? (
                      (() => {
                        try {
                          const parsed = JSON.parse(note.content)
                          if (parsed && Array.isArray(parsed.pages)) {
                            return `Canvas Note • ${parsed.pages.length} Page${parsed.pages.length > 1 ? "s" : ""}`
                          }
                        } catch (e) {}
                        return note.content
                      })()
                    ) : (
                      note.content
                    )}
                  </p>
                )}
                <span className="text-[10px] text-muted-foreground/60 mt-auto pt-1">{timeAgo(note.updated_at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
