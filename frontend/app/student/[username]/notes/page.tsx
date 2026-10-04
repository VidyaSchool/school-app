"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import StudentNotesSkeleton from "./skeleton"
import { getStudentCache, setStudentCache } from "@/lib/student-cache"
import {
  NotebookPenIcon,
  BookOpenIcon,
  SearchIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ExternalLinkIcon
} from "lucide-react"

interface NoteItem {
  id: string
  notebook: string
  timestamp: string
  title: string
  bullets: string[]
  body: string
  teacherName: string
  rawContent?: string
  className?: string
  sectionName?: string
  color?: string
  pdf_url?: string
  pdfUrl?: string | null
}

const COLOR_MAP: Record<string, { cardBg: string; border: string }> = {
  default: { cardBg: "bg-white dark:bg-[#18181b]",          border: "border-border/60" },
  yellow:  { cardBg: "bg-amber-50/70 dark:bg-amber-950/20", border: "border-amber-200/80 dark:border-amber-800/40" },
  blue:    { cardBg: "bg-sky-50/70 dark:bg-sky-950/20",     border: "border-sky-200/80 dark:border-sky-800/40" },
  green:   { cardBg: "bg-emerald-50/70 dark:bg-emerald-950/20", border: "border-emerald-200/80 dark:border-emerald-800/40" },
  pink:    { cardBg: "bg-rose-50/70 dark:bg-rose-950/20",   border: "border-rose-200/80 dark:border-rose-800/40" },
  purple:  { cardBg: "bg-violet-50/70 dark:bg-violet-950/20", border: "border-violet-200/80 dark:border-violet-800/40" },
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "recently"
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return "yesterday"
  return `${d}d ago`
}

export default function StudentNotesPage() {
  const router = useRouter()
  const params = useParams<{ username: string }>()
  const username = params?.username || ""

  const cachedNotes = React.useMemo(() => getStudentCache<NoteItem[]>("notes_parsed"), [])
  const [notes, setNotes] = React.useState<NoteItem[]>(() => cachedNotes || [])
  const [loading, setLoading] = React.useState(() => !cachedNotes)
  const [selectedTopic, setSelectedTopic] = React.useState<string>("All")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  const parseNotes = (dataNotes: any[]) => {
    return dataNotes.map((note: any) => {
      let bullets: string[] = []
      let body = ""
      let fullText = ""

      if (note.content) {
        if (note.content.startsWith("{")) {
          try {
            const parsed = JSON.parse(note.content)
            if (parsed && Array.isArray(parsed.pages)) {
              const allTexts: string[] = []
              parsed.pages.forEach((page: any, pageIdx: number) => {
                if (Array.isArray(page.texts) && page.texts.length > 0) {
                  allTexts.push(`--- Page ${pageIdx + 1} ---`)
                  page.texts.forEach((txt: any) => {
                    if (txt && typeof txt.text === "string" && txt.text.trim()) {
                      txt.text.split("\n").forEach((line: string) => {
                        if (line.trim()) allTexts.push(line.trim())
                      })
                    }
                  })
                }
              })

              fullText = allTexts.join("\n")

              const previewTexts = allTexts.filter(line => !line.startsWith("--- Page"))
              const bulletLines = previewTexts.filter(line => 
                line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)
              )
              
              if (bulletLines.length > 0) {
                bullets = bulletLines.map(line => line.replace(/^[•\-\*\s]+|^\d+\.\s*/, "").trim()).slice(0, 3)
                body = previewTexts.filter(line => !bulletLines.includes(line)).join(" ")
              } else {
                const shortLines = previewTexts.filter(line => line.length < 60)
                bullets = shortLines.slice(0, 3)
                body = previewTexts.filter(line => !bullets.includes(line)).join(" ")
              }
            }
          } catch (e) {
            body = note.content
            fullText = note.content
          }
        } else {
          fullText = note.content
          const lines = note.content.split("\n").map((l: string) => l.trim()).filter(Boolean)
          const bulletLines = lines.filter((line: string) => 
            line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)
          )
          if (bulletLines.length > 0) {
            bullets = bulletLines.map((line: string) => line.replace(/^[•\-\*\s]+|^\d+\.\s*/, "").trim()).slice(0, 3)
            body = lines.filter((line: string) => !bulletLines.includes(line)).join(" ")
          } else {
            bullets = lines.slice(0, 2)
            body = lines.slice(2).join(" ")
          }
        }
      }

      if (bullets.length === 0) {
        bullets = ["No text highlights found in this note", "Click to open full note content"]
      }
      if (!body) {
        body = "Interactive canvas note. Open to view text content details."
      }

      if (body.length > 120) {
        body = body.substring(0, 117) + "..."
      }

      return {
        id: note.id,
        notebook: note.subject || "General",
        timestamp: timeAgo(note.updated_at || note.created_at),
        title: note.title || "Untitled Note",
        bullets,
        body,
        teacherName: note.teacher_name || note.teacherName || "Unknown Teacher",
        rawContent: fullText || note.content,
        className: note.class || note.targetClass,
        sectionName: note.section || note.targetSection,
        color: note.color || "default",
      }
    })
  }

  React.useEffect(() => {
    fetch("/api/backend/api/student/notes")
      .then(res => {
        if (!res.ok) throw new Error("Backend notes endpoint failed")
        return res.json()
      })
      .then(data => {
        if (data.notes && Array.isArray(data.notes) && data.notes.length > 0) {
          const parsed = parseNotes(data.notes)
          setNotes(parsed)
          setStudentCache("notes_parsed", parsed)
        } else {
          return fetch("/api/student/notes")
            .then(res => res.json())
            .then(fallbackData => {
              if (fallbackData.notes && Array.isArray(fallbackData.notes)) {
                const parsed = parseNotes(fallbackData.notes)
                setNotes(parsed)
                setStudentCache("notes_parsed", parsed)
              }
            })
        }
      })
      .catch(() => {
        fetch("/api/student/notes")
          .then(res => res.json())
          .then(data => {
            if (data.notes && Array.isArray(data.notes)) {
              const parsed = parseNotes(data.notes)
              setNotes(parsed)
              setStudentCache("notes_parsed", parsed)
            }
          })
          .catch(() => {})
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const topics = React.useMemo(() => {
    const set = new Set<string>()
    notes.forEach(n => {
      if (n.notebook) set.add(n.notebook)
    })
    return ["All", ...Array.from(set)]
  }, [notes])

  const filteredNotes = React.useMemo(() => {
    return notes.filter(note => {
      const matchesTopic = selectedTopic === "All" || note.notebook.toLowerCase() === selectedTopic.toLowerCase()
      const matchesSearch = !searchQuery.trim() || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.notebook.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.rawContent && note.rawContent.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesTopic && matchesSearch
    })
  }, [notes, selectedTopic, searchQuery])

  if (loading) {
    return <StudentNotesSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/student/${username}`)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              <ArrowLeftIcon className="size-3.5" /> Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <BookOpenIcon className="size-8 text-primary" /> Class Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and read all notes published by your teachers.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, topics or teachers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* Topics Filter */}
      {topics.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <TagIcon className="size-4 text-muted-foreground shrink-0 mr-1" />
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedTopic === topic
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-3xl bg-muted/10 text-center">
          <NotebookPenIcon className="size-12 text-muted-foreground/30 mb-3" />
          <h3 className="font-bold text-base text-foreground">No notes available</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery || selectedTopic !== "All"
              ? "No notes matched your search or topic filter."
              : "No notes have been published for your class yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredNotes.map(note => {
            const colorStyle = COLOR_MAP[note.color || "default"] || COLOR_MAP.default
            return (
              <div
                key={note.id}
                onClick={() => router.push(`/student/${username}/notes/${note.id}`)}
                className={`h-56 ${colorStyle.cardBg} ${colorStyle.border} border
                           rounded-2xl p-5 flex flex-col gap-3
                           transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5
                           active:scale-[0.98] group overflow-hidden`}
              >
                {/* Badge + timestamp */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold truncate max-w-[150px]">
                    {note.notebook}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground/70 shrink-0">{note.timestamp}</span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {note.title}
                </h3>

                {/* Bullets */}
                <ul className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                  {note.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed">
                      <span className="mt-[5px] size-1.5 rounded-full bg-primary shrink-0" />
                      <span className="line-clamp-1">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="pt-2.5 border-t border-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 truncate">
                    <UserIcon className="size-3.5 text-primary shrink-0" />
                    <span className="truncate font-medium">{note.teacherName}</span>
                  </span>
                  <ExternalLinkIcon className="size-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
