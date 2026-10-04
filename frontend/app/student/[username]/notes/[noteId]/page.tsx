"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { useTheme } from "@/components/theme-provider"

import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarIcon,
  GraduationCapIcon,
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  TagIcon,
  Share2Icon,
  ClockIcon,
  DownloadIcon,
  Maximize2Icon,
  Minimize2Icon,
  Volume2Icon,
  VolumeXIcon,
  TypeIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  PaletteIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import StudentNoteDetailLoading from "./loading"

interface NoteDetail {
  id: string
  title: string
  content: string
  color?: string
  class?: string
  section?: string
  subject?: string
  teacher_name?: string
  created_at?: string
  updated_at?: string
  pdf_url?: string
  pdfUrl?: string
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "T"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function calculateReadingStats(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const wordsPerMinute = 200
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute))
  return { words, minutes, timeStr: `${minutes} min read` }
}

function extractPlainContent(content: string): string {
  if (!content) return ""
  if (content.startsWith("{")) {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed?.pages)) {
        const parts: string[] = []
        parsed.pages.forEach((p: any, i: number) => {
          parts.push(`Page ${i + 1}.`)
          p.texts?.forEach((t: any) => {
            if (t?.text) parts.push(t.text)
          })
        })
        return parts.join(" ")
      }
    } catch {}
  }
  return content
}

/**
 * Adapt pen and stroke colors dynamically based on the active dark/sepia/light theme.
 * Dark/black pen strokes automatically invert to light tones on dark backgrounds,
 * while preserving vibrant colors (red, blue, green, etc.).
 */
function adaptStrokeColor(color: string | undefined, isDark: boolean, isSepia: boolean): string {
  if (!color || color === "transparent") {
    return isDark ? "#f4f4f5" : isSepia ? "#382818" : "#18181b"
  }
  const normalized = color.trim().toLowerCase()

  const isDarkColor =
    normalized === "#000000" ||
    normalized === "#000" ||
    normalized === "#18181b" ||
    normalized === "#09090b" ||
    normalized === "#111827" ||
    normalized === "#27272a" ||
    normalized === "black" ||
    normalized === "rgb(0,0,0)" ||
    normalized === "rgb(0, 0, 0)" ||
    normalized === "rgba(0,0,0,1)" ||
    normalized === "rgba(0, 0, 0, 1)" ||
    normalized === "rgba(24, 24, 27, 1)"

  const isWhiteColor =
    normalized === "#ffffff" ||
    normalized === "#fff" ||
    normalized === "#fafafa" ||
    normalized === "#f4f4f5" ||
    normalized === "white" ||
    normalized === "rgb(255,255,255)" ||
    normalized === "rgb(255, 255, 255)"

  if (isSepia) {
    if (isDarkColor) return "#382818"
    if (isWhiteColor) return "#ffffff"
    return color
  }

  if (isDark) {
    if (isDarkColor) return "#f4f4f5"
    return color
  } else {
    if (isWhiteColor) return "#18181b"
    return color
  }
}

function MarkdownMathRenderer({
  content,
  fontSizeClass,
  fontFamilyClass,
}: {
  content: string
  fontSizeClass: string
  fontFamilyClass: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        ;(window as any).MathJax.typesetPromise([containerRef.current]).catch(() => {})
      }
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      className={`prose prose-neutral dark:prose-invert max-w-none leading-relaxed transition-all duration-200 ${fontSizeClass} ${fontFamilyClass} prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[0.9em] prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/40 prose-img:rounded-2xl prose-table:border-collapse prose-th:border-b prose-th:border-border prose-th:pb-2 prose-td:py-2 prose-td:border-b prose-td:border-border/40`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

function CanvasPageRenderer({
  page,
  isDark,
  isSepia,
}: {
  page: any
  isDark: boolean
  isSepia: boolean
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // High DPI Canvas Scaling
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    const baseWidth = 800
    const baseHeight = 1100

    canvas.width = baseWidth * dpr
    canvas.height = baseHeight * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, baseWidth, baseHeight)

    // 1. Draw background pattern optimized for theme
    if (page.backgroundType === "grid") {
      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.12)"
        : isSepia
        ? "rgba(120, 90, 60, 0.15)"
        : "rgba(0, 0, 0, 0.08)"
      ctx.lineWidth = 1
      const step = 25
      for (let x = 0; x <= baseWidth; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, baseHeight)
        ctx.stroke()
      }
      for (let y = 0; y <= baseHeight; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(baseWidth, y)
        ctx.stroke()
      }
    } else if (page.backgroundType === "lines") {
      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.15)"
        : isSepia
        ? "rgba(120, 90, 60, 0.2)"
        : "rgba(0, 0, 0, 0.12)"
      ctx.lineWidth = 1
      const step = 30
      for (let y = step; y <= baseHeight; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(baseWidth, y)
        ctx.stroke()
      }
    } else if (page.backgroundType === "dots") {
      ctx.fillStyle = isDark
        ? "rgba(255, 255, 255, 0.25)"
        : isSepia
        ? "rgba(120, 90, 60, 0.3)"
        : "rgba(0, 0, 0, 0.2)"
      const step = 25
      for (let x = step; x < baseWidth; x += step) {
        for (let y = step; y < baseHeight; y += step) {
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // 2. Draw images
    if (Array.isArray(page.images)) {
      page.images.forEach((imgObj: any) => {
        if (imgObj.src) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            ctx.drawImage(img, imgObj.x || 0, imgObj.y || 0, imgObj.width || 200, imgObj.height || 150)
          }
          img.src = imgObj.src
        }
      })
    }

    // 3. Draw shapes with theme-adaptive stroke colors
    if (Array.isArray(page.shapes)) {
      page.shapes.forEach((shape: any) => {
        ctx.beginPath()
        ctx.lineWidth = shape.strokeWidth || 2
        ctx.strokeStyle = adaptStrokeColor(shape.stroke, isDark, isSepia)
        ctx.fillStyle = shape.fill || "transparent"

        if (shape.type === "rect") {
          ctx.rect(shape.x, shape.y, shape.width, shape.height)
          if (shape.fill && shape.fill !== "transparent") ctx.fill()
          ctx.stroke()
        } else if (shape.type === "circle") {
          const rx = (shape.width || 50) / 2
          const ry = (shape.height || 50) / 2
          const cx = (shape.x || 0) + rx
          const cy = (shape.y || 0) + ry
          ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI)
          if (shape.fill && shape.fill !== "transparent") ctx.fill()
          ctx.stroke()
        } else if (shape.type === "line") {
          ctx.moveTo(shape.x, shape.y)
          ctx.lineTo((shape.x || 0) + (shape.width || 0), (shape.y || 0) + (shape.height || 0))
          ctx.stroke()
        }
      })
    }

    // 4. Draw paint freehand strokes with theme-adaptive pen color
    if (Array.isArray(page.drawings)) {
      page.drawings.forEach((path: any) => {
        if (!path.points || path.points.length === 0) return
        ctx.beginPath()
        ctx.lineWidth = path.width || 3
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        if (path.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out"
          ctx.strokeStyle = "rgba(0,0,0,1)"
          ctx.globalAlpha = 1.0
        } else if (path.tool === "highlighter") {
          ctx.globalCompositeOperation = isDark ? "screen" : "multiply"
          ctx.strokeStyle = path.color || "#fef08a"
          ctx.globalAlpha = isDark ? 0.35 : 0.45
        } else {
          ctx.globalCompositeOperation = "source-over"
          ctx.strokeStyle = adaptStrokeColor(path.color, isDark, isSepia)
          ctx.globalAlpha = 1.0
        }

        ctx.moveTo(path.points[0].x, path.points[0].y)
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y)
        }
        ctx.stroke()
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = 1.0
      })
    }
  }, [page, isDark, isSepia])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border shadow-inner transition-colors duration-300 ${
        isSepia
          ? "bg-[#faf6ee] border-[#e8ddc9]"
          : isDark
          ? "bg-zinc-950 border-zinc-800"
          : "bg-white border-zinc-200"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto block max-w-full"
        style={{ aspectRatio: "800 / 1100" }}
      />
    </div>
  )
}

export default function StudentNoteDetailPage() {
  const router = useRouter()
  const params = useParams<{ username: string; noteId: string }>()
  const username = params?.username || ""
  const noteId = params?.noteId || ""

  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isAppDark = React.useMemo(() => {
    if (!mounted) return false
    if (theme === "dark") return true
    if (theme === "light") return false
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      )
    }
    return false
  }, [theme, mounted])

  const [note, setNote] = React.useState<NoteDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [readCompleted, setReadCompleted] = React.useState(false)

  // Reader Customization States
  const [scrollProgress, setScrollProgress] = React.useState(0)
  const [fontSize, setFontSize] = React.useState<"sm" | "base" | "lg">("base")
  const [fontFamily, setFontFamily] = React.useState<"sans" | "serif" | "mono">("sans")
  const [themeMode, setThemeMode] = React.useState<"default" | "sepia" | "contrast">("default")
  const [focusMode, setFocusMode] = React.useState(false)
  const [isSpeaking, setIsSpeaking] = React.useState(false)

  const isDark = themeMode === "contrast" || (themeMode === "default" && isAppDark)
  const isSepia = themeMode === "sepia"

  // Track scroll progress for reading bar
  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)))
        if (currentProgress > 85) {
          setReadCompleted(true)
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // MathJax v3 script injection
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!(window as any).MathJax) {
      ;(window as any).MathJax = {
        tex: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
          processEscapes: true,
        },
        options: {
          ignoreHtmlClass: "tex2jax_ignore",
          processHtmlClass: "tex2jax_process",
        },
      }
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  // Fetch Note Details
  React.useEffect(() => {
    if (!noteId) return

    fetch(`/api/backend/api/student/notes`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.notes?.find((n: any) => n.id === noteId)
        if (found) {
          setNote(found)
        } else {
          return fetch(`/api/student/notes`)
            .then((r) => r.json())
            .then((fallbackData) => {
              const fbFound = fallbackData.notes?.find((n: any) => n.id === noteId)
              if (fbFound) setNote(fbFound)
            })
        }
      })
      .catch((err) => {
        console.error("Failed to load note:", err)
      })
      .finally(() => setLoading(false))
  }, [noteId])

  // Stop speech when navigating away
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Text-To-Speech handler
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported by your browser.")
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      toast.info("Read aloud stopped")
    } else {
      if (!note) return
      const textToRead = `${note.title}. ${extractPlainContent(note.content)}`
      const utterance = new SpeechSynthesisUtterance(textToRead)
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      toast.success("Reading note aloud...")
    }
  }

  const handleCopy = () => {
    if (!note) return
    const plainText = extractPlainContent(note.content)
    navigator.clipboard.writeText(`${note.title}\n\n${plainText}`)
    setCopied(true)
    toast.success("Note content copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Note link copied to clipboard!")
    }
  }

  const handlePrint = () => {
    if (typeof window === "undefined" || !note) return

    // Find all canvas elements rendered on the page
    const canvasElements = Array.from(document.querySelectorAll("canvas"))

    // Create an isolated invisible iframe for printing only canvas or note contents
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    if (canvasElements.length > 0) {
      // Export all canvas pages as high-resolution PNG data URLs
      const pagesHtml = canvasElements
        .map((canvas, i) => {
          const imgData = canvas.toDataURL("image/png")
          return `
            <div class="canvas-sheet">
              <div class="sheet-header">
                <span class="note-title">${note.title || "Note"}</span>
                <span class="page-count">Page ${i + 1} of ${canvasElements.length}</span>
              </div>
              <div class="canvas-wrapper">
                <img src="${imgData}" alt="Note Canvas Page ${i + 1}" />
              </div>
            </div>
          `
        })
        .join("")

      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${note.title || "Note"} - Canvas Print</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .canvas-sheet {
                page-break-after: always;
                break-after: page;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 24px;
              }
              .canvas-sheet:last-child {
                page-break-after: auto;
                break-after: auto;
                margin-bottom: 0;
              }
              .sheet-header {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #555;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 6px;
                margin-bottom: 12px;
              }
              .note-title {
                font-weight: 700;
                font-size: 13px;
                color: #111;
              }
              .canvas-wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
              }
              img {
                width: 100%;
                max-width: 740px;
                height: auto;
                border-radius: 4px;
                border: 1px solid #d4d4d8;
                background: #ffffff;
                box-shadow: none;
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
          </body>
        </html>
      `)
      doc.close()
    } else {
      // Standard note print without web chrome
      const noteContentEl = document.getElementById("printable-note-body")
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${note.title || "Note"}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #fff;
                color: #000;
                line-height: 1.6;
              }
              h1 { font-size: 22px; margin-bottom: 6px; }
              .meta { font-size: 11px; color: #666; margin-bottom: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            </style>
          </head>
          <body>
            <h1>${note.title || "Untitled Note"}</h1>
            <div class="meta">${note.subject ? `${note.subject} • ` : ""}${note.teacher_name ? `By ${note.teacher_name}` : ""}</div>
            <div>${noteContentEl ? noteContentEl.innerHTML : note.content}</div>
          </body>
        </html>
      `)
      doc.close()
    }

    toast.info("Preparing canvas print...")
    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }, 400)
  }

  // Typography & Theme styles
  const fontSizeClass =
    fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg sm:text-xl" : "text-base"
  const fontFamilyClass =
    fontFamily === "serif"
      ? "font-serif tracking-normal"
      : fontFamily === "mono"
      ? "font-mono text-[0.95em]"
      : "font-sans"

  const themeContainerClass =
    themeMode === "sepia"
      ? "bg-[#faf6ee] text-[#433422] border-[#e8ddc9]"
      : themeMode === "contrast"
      ? "bg-zinc-950 text-zinc-50 border-zinc-800"
      : "bg-card text-card-foreground border-border/60"

  const renderNoteBody = () => {
    if (!note?.content) {
      return (
        <Card className={`rounded-3xl border p-12 text-center shadow-sm ${themeContainerClass}`}>
          <p className="text-sm text-muted-foreground italic">Empty note content.</p>
        </Card>
      )
    }

    if (note.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(note.content)
        if (parsed && Array.isArray(parsed.pages)) {
          return (
            <div className="space-y-8">
              {parsed.pages.map((page: any, idx: number) => {
                const hasDrawings = Array.isArray(page.drawings) && page.drawings.length > 0
                const hasImages = Array.isArray(page.images) && page.images.length > 0
                const hasShapes = Array.isArray(page.shapes) && page.shapes.length > 0
                const hasCanvasElements = hasDrawings || hasImages || hasShapes || page.backgroundType

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                  >
                    <Card
                      className={`rounded-3xl border p-6 sm:p-10 shadow-sm relative overflow-hidden transition-all duration-300 ${themeContainerClass}`}
                    >
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Page {idx + 1} of {parsed.pages.length}
                          </span>
                        </div>
                        {page.backgroundType && (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                          >
                            {page.backgroundType} grid
                          </Badge>
                        )}
                      </div>

                      {/* Canvas Elements (Drawing, Shapes, Board) with Theme-Adaptive Colors */}
                      {hasCanvasElements && (
                        <div className="mb-8 rounded-2xl overflow-hidden shadow-sm">
                          <CanvasPageRenderer page={page} isDark={isDark} isSepia={isSepia} />
                        </div>
                      )}

                      {/* Text / Markdown blocks */}
                      {Array.isArray(page.texts) && page.texts.length > 0 ? (
                        <div className="space-y-4">
                          {page.texts.map((txt: any, tIdx: number) => (
                            <div
                              key={tIdx}
                              className="bg-muted/15 p-5 sm:p-6 rounded-2xl border border-border/40 transition-colors"
                            >
                              <MarkdownMathRenderer
                                content={txt.text || ""}
                                fontSizeClass={fontSizeClass}
                                fontFamilyClass={fontFamilyClass}
                              />
                            </div>
                          ))}
                        </div>
                      ) : !hasCanvasElements ? (
                        <p className="text-xs text-muted-foreground italic py-6 text-center">
                          No notes written on this page.
                        </p>
                      ) : null}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )
        }
      } catch (e) {}
    }

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className={`rounded-3xl border p-6 sm:p-12 shadow-sm transition-all duration-300 ${themeContainerClass}`}>
          <MarkdownMathRenderer
            content={note.content}
            fontSizeClass={fontSizeClass}
            fontFamilyClass={fontFamilyClass}
          />
        </Card>
      </motion.div>
    )
  }

  const readingStats = note ? calculateReadingStats(note.content) : null
  const pdfLink = note?.pdf_url || note?.pdfUrl

  if (loading) {
    return <StudentNoteDetailLoading />
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 pb-20 ${
        themeMode === "sepia"
          ? "bg-[#f4efe4]"
          : themeMode === "contrast"
          ? "bg-black"
          : "bg-background"
      }`}
    >
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted/40 backdrop-blur-md">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Main Container */}
      <div
        className={`mx-auto px-4 sm:px-6 transition-all duration-300 ${
          focusMode ? "max-w-3xl pt-8" : "max-w-4xl pt-6 sm:pt-10"
        }`}
      >
        {/* Navigation & Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/student/${username}/notes`)}
            className="gap-2 text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors cursor-pointer group"
          >
            <ArrowLeftIcon className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Notes
          </Button>

          {/* Quick Reader Controls Bar */}
          <div className="flex items-center gap-1.5 bg-card/80 dark:bg-card/40 backdrop-blur-md border border-border/60 p-1 rounded-2xl shadow-xs">
            {/* Text Size toggle */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                const nextSize = fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : "sm"
                setFontSize(nextSize)
                toast.info(`Text size: ${nextSize.toUpperCase()}`)
              }}
              title="Change font size"
              className="rounded-xl h-8 w-8 text-xs font-bold"
            >
              <TypeIcon className="size-3.5" />
            </Button>

            {/* Font Family toggle */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                const nextFont = fontFamily === "sans" ? "serif" : fontFamily === "serif" ? "mono" : "sans"
                setFontFamily(nextFont)
                toast.info(`Typography: ${nextFont.toUpperCase()}`)
              }}
              title="Toggle font style"
              className="rounded-xl h-8 w-8 text-xs"
            >
              <span className="font-serif text-xs font-bold">Aa</span>
            </Button>

            {/* Reading Theme toggle */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                const nextTheme =
                  themeMode === "default" ? "sepia" : themeMode === "sepia" ? "contrast" : "default"
                setThemeMode(nextTheme)
                toast.info(`Reading Theme: ${nextTheme}`)
              }}
              title="Switch reading theme (Default / Sepia / Contrast)"
              className="rounded-xl h-8 w-8 text-xs"
            >
              <PaletteIcon className="size-3.5" />
            </Button>

            {/* Read Aloud Button */}
            <Button
              variant={isSpeaking ? "default" : "ghost"}
              size="icon-xs"
              onClick={handleToggleSpeech}
              title={isSpeaking ? "Stop read aloud" : "Read note aloud"}
              className={`rounded-xl h-8 w-8 text-xs transition-colors ${
                isSpeaking ? "bg-primary text-primary-foreground animate-pulse" : ""
              }`}
            >
              {isSpeaking ? <VolumeXIcon className="size-3.5" /> : <Volume2Icon className="size-3.5" />}
            </Button>

            {/* Focus Mode */}
            <Button
              variant={focusMode ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => {
                setFocusMode(!focusMode)
                toast.info(focusMode ? "Focus mode disabled" : "Focus mode enabled")
              }}
              title="Toggle Focus Mode"
              className="rounded-xl h-8 w-8 text-xs"
            >
              {focusMode ? <Minimize2Icon className="size-3.5" /> : <Maximize2Icon className="size-3.5" />}
            </Button>

            <div className="h-4 w-[1px] bg-border/60 mx-0.5" />

            {/* Copy Button */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              title="Copy note text"
              className="rounded-xl h-8 w-8 text-xs"
            >
              {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleShare}
              title="Share link"
              className="rounded-xl h-8 w-8 text-xs"
            >
              <Share2Icon className="size-3.5" />
            </Button>

            {/* Print */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrint}
              title="Print note"
              className="rounded-xl h-8 w-8 text-xs"
            >
              <PrinterIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Content Section */}
        {!note ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="rounded-3xl p-16 text-center border-border/60 bg-card/60 backdrop-blur-md">
              <div className="size-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <BookOpenIcon className="size-8 stroke-[1.5]" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Note not found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                This note might have been archived or removed by your instructor.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/student/${username}/notes`)}
                className="mt-6 rounded-xl text-xs gap-2"
              >
                <ArrowLeftIcon className="size-3.5" /> Return to Notes Library
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Hero Header Card */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card
                className={`rounded-3xl border overflow-hidden relative shadow-sm backdrop-blur-md transition-all duration-300 ${themeContainerClass}`}
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/40" />

                <div className="p-6 sm:p-10 pb-6">
                  {/* Meta Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 rounded-full text-xs font-bold tracking-wide gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors"
                    >
                      <TagIcon className="size-3" />
                      {note.subject || "Study Material"}
                    </Badge>

                    {note.class && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-full text-xs font-medium gap-1.5 border-border/80"
                      >
                        <GraduationCapIcon className="size-3.5 text-muted-foreground" />
                        Class {note.class}
                        {note.section ? ` - Sec ${note.section}` : ""}
                      </Badge>
                    )}

                    {readingStats && (
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-full text-xs font-medium gap-1.5 border-border/80 text-muted-foreground"
                      >
                        <ClockIcon className="size-3.5" />
                        {readingStats.timeStr} ({readingStats.words} words)
                      </Badge>
                    )}

                    {pdfLink && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(pdfLink, "_blank")}
                        className="gap-1.5 text-xs rounded-full px-3.5 h-7 ml-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer"
                      >
                        <DownloadIcon className="size-3.5" /> Attached PDF
                        <ExternalLinkIcon className="size-3 opacity-70" />
                      </Button>
                    )}
                  </div>

                  {/* Note Title */}
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.2] text-foreground mb-6">
                    {note.title || "Untitled Lecture Note"}
                  </h1>

                  {/* Author & Timestamp Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 rounded-2xl border border-border/60 shadow-xs">
                        <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-sm">
                          {getInitials(note.teacher_name || "Teacher")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {note.teacher_name || "Faculty Member"}
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-md font-medium">
                            Instructor
                          </Badge>
                        </span>
                        <span className="text-muted-foreground text-xs">Verified Teacher Notes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5" />
                        {note.updated_at
                          ? `Updated on ${new Date(note.updated_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : "Published recently"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Note Content Section */}
            {renderNoteBody()}

            {/* Completion & Footer Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="rounded-3xl border border-border/60 p-6 sm:p-8 bg-muted/20 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div
                    className={`size-10 rounded-2xl flex items-center justify-center transition-colors ${
                      readCompleted ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <CheckCircle2Icon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {readCompleted ? "Reading Completed" : "Studying Note"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {readCompleted
                        ? "You've scrolled through all materials in this note."
                        : "Take your time revising concepts and formulas."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    Back to Top
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/student/${username}/notes`)}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    Browse More Notes
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
