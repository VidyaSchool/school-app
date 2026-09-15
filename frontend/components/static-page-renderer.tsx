"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  Download,
  AlertCircle,
  HelpCircle as FaqIcon,
  Video,
  Play,
  Eye,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Check,
  ChevronRight,
  Home,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { StaticPageData, EditorJsBlock, ElementorWidget } from "@/lib/static-pages"

// ── Security Helpers: URL Sanitization, Video Whitelisting & HTML Guard ─────

export function getSafeUrl(url?: string, fallback = "#"): string {
  if (!url || typeof url !== "string") return fallback
  const trimmed = url.trim()
  if (!trimmed) return fallback

  const normalized = trimmed.replace(/[\x00-\x1F\x7F\s]+/g, "").toLowerCase()

  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  ) {
    return fallback
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed
  }

  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`
  }

  if (/^[a-zA-Z0-9_\-\/]+$/.test(trimmed) && !trimmed.includes("://")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  }

  return fallback
}

export function getSafeVideoEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    const host = parsed.hostname.toLowerCase()

    if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      const v = parsed.searchParams.get("v")
      if (v && /^[a-zA-Z0-9_-]{6,15}$/.test(v)) {
        return `https://www.youtube-nocookie.com/embed/${v}`
      }
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.replace("/embed/", "").split("/")[0]
        if (/^[a-zA-Z0-9_-]{6,15}$/.test(id)) {
          return `https://www.youtube-nocookie.com/embed/${id}`
        }
      }
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("?")[0]
      if (id && /^[a-zA-Z0-9_-]{6,15}$/.test(id)) {
        return `https://www.youtube-nocookie.com/embed/${id}`
      }
    }

    if (host === "vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean)
      const id = parts[0]
      if (id && /^\d+$/.test(id)) {
        return `https://player.vimeo.com/video/${id}`
      }
    }

    if (host === "player.vimeo.com") {
      if (parsed.pathname.startsWith("/video/")) {
        const id = parsed.pathname.replace("/video/", "").split("/")[0]
        if (id && /^\d+$/.test(id)) {
          return `https://player.vimeo.com/video/${id}`
        }
      }
    }
  } catch {
    return null
  }

  return null
}

export function sanitizeHtml(rawHtml?: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return ""

  let clean = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")

  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
  clean = clean.replace(/(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, '$1="#"')

  return clean
}

export function isInternalLink(url?: string): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed || trimmed === "#") return false

  if ((trimmed.startsWith("/") && !trimmed.startsWith("//")) || trimmed.startsWith("#")) {
    return true
  }

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed)
      const isKnownHost =
        parsed.host === "localhost:3000" ||
        parsed.host === "localhost:3001" ||
        parsed.host === "vidyaschool.com" ||
        parsed.host === "www.vidyaschool.com" ||
        parsed.host.endsWith(".vercel.app")

      if (isKnownHost) return true

      if (typeof window !== "undefined") {
        if (parsed.host === window.location.host) {
          return true
        }
      }
    }
  } catch {
    // Ignore
  }

  return false
}

export function getInternalHref(url: string): string {
  const trimmed = url.trim()
  if ((trimmed.startsWith("/") && !trimmed.startsWith("//")) || trimmed.startsWith("#")) {
    return trimmed
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return trimmed
  }
}

export interface SmartLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

export const SmartLink = React.forwardRef<HTMLAnchorElement, SmartLinkProps>(
  function SmartLink({ href = "#", children, className, target, rel, onClick, ...rest }, ref) {
    const router = useRouter()
    const safeUrl = getSafeUrl(href)

    if (isInternalLink(safeUrl)) {
      const internalHref = getInternalHref(safeUrl)
      return (
        <Link
          ref={ref}
          href={internalHref}
          className={className}
          prefetch={true}
          onClick={(e) => {
            if (onClick) onClick(e)
            if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
              e.preventDefault()
              router.push(internalHref)
            }
          }}
          {...rest}
        >
          {children}
        </Link>
      )
    }

    const isExternal = safeUrl.startsWith("http://") || safeUrl.startsWith("https://")
    return (
      <a
        ref={ref}
        href={safeUrl}
        target={target ?? (isExternal ? "_blank" : undefined)}
        rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
        className={className}
        onClick={onClick}
        {...rest}
      >
        {children}
      </a>
    )
  }
)
SmartLink.displayName = "SmartLink"

// ── Helpers for Table Cells & Lists ──────────────────────────────────────────

interface TableCellButton {
  isButton: true
  label: string
  url: string
  actionType: "view_pdf" | "view_video" | "link" | "download"
  icon?: string
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost"
}

function parseTableCell(cell: unknown): { isButton: boolean; text?: string; btn?: TableCellButton } {
  if (typeof cell === "object" && cell !== null && "isButton" in cell && (cell as TableCellButton).isButton) {
    return { isButton: true, btn: cell as TableCellButton }
  }
  if (typeof cell === "string") {
    if (cell.trim().startsWith("{") && cell.includes('"isButton"')) {
      try {
        const parsed = JSON.parse(cell)
        if (parsed?.isButton) return { isButton: true, btn: parsed }
      } catch {
        // Not JSON
      }
    }
    return { isButton: false, text: cell }
  }
  return { isButton: false, text: String(cell ?? "") }
}

function renderTableCellIcon(iconName?: string) {
  switch (iconName) {
    case "video":
      return <Video className="size-3.5 shrink-0" />
    case "download":
      return <Download className="size-3.5 shrink-0" />
    case "eye":
      return <Eye className="size-3.5 shrink-0" />
    case "play":
      return <Play className="size-3.5 shrink-0" />
    case "external-link":
      return <ExternalLink className="size-3.5 shrink-0" />
    case "arrow-right":
      return <ArrowRight className="size-3.5 shrink-0" />
    case "sparkles":
      return <Sparkles className="size-3.5 shrink-0" />
    case "file-text":
    default:
      return <FileText className="size-3.5 shrink-0" />
  }
}

function getListItemText(item: unknown): string {
  if (typeof item === "string") return item
  if (typeof item === "number") return String(item)
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>
    if (typeof obj.content === "string") return obj.content
    if (typeof obj.text === "string") return obj.text
    if (typeof obj.value === "string") return obj.value
  }
  return ""
}

function getListItemChildren(item: unknown): unknown[] {
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items
  }
  return []
}

function RenderEditorJsList({
  items,
  isOrdered,
  depth = 0,
}: {
  items: unknown[]
  isOrdered: boolean
  depth?: number
}) {
  if (!Array.isArray(items) || items.length === 0) return null

  const ListTag = isOrdered ? "ol" : "ul"
  const listClass = isOrdered ? "list-decimal" : "list-disc"
  const spacingClass =
    depth === 0
      ? "my-4 space-y-2 text-base sm:text-lg text-foreground/85"
      : "mt-1.5 space-y-1.5 text-sm sm:text-base text-foreground/80"

  return (
    <ListTag className={cn(listClass, "pl-6 leading-relaxed marker:text-primary/70", spacingClass)}>
      {items.map((it, idx) => {
        const text = getListItemText(it)
        const subItems = getListItemChildren(it)
        const sanitized = sanitizeHtml(text)
        const subIsOrdered =
          it && typeof it === "object" && "style" in (it as Record<string, unknown>)
            ? (it as Record<string, unknown>).style === "ordered"
            : isOrdered

        return (
          <li key={idx} className="pl-1">
            {sanitized ? (
              <span dangerouslySetInnerHTML={{ __html: sanitized }} />
            ) : text ? (
              <span>{text}</span>
            ) : null}
            {subItems.length > 0 && (
              <RenderEditorJsList items={subItems} isOrdered={subIsOrdered} depth={depth + 1} />
            )}
          </li>
        )
      })}
    </ListTag>
  )
}

// ── Public Sub-Widget Renderer (for legacy widgets) ──────────────────────────

function PublicSubWidgetRenderer({ subW }: { subW: ElementorWidget }) {
  if (subW.type === "pdf") {
    const rawUrl = typeof subW.props.url === "string" ? subW.props.url : ""
    const safeUrl = rawUrl ? getSafeUrl(rawUrl) : ""
    const hasUrl = Boolean(safeUrl && safeUrl !== "#")
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2 shadow-xs w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold border-b border-border/40 pb-1.5">
          <span className="flex items-center gap-1.5 text-rose-500 truncate">
            <FileText className="size-3.5 shrink-0" /> {typeof subW.props.title === "string" ? subW.props.title : "PDF Document"}
          </span>
          {hasUrl && (
            <a href={safeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 shrink-0 font-semibold">
              <Download className="size-3" /> Download
            </a>
          )}
        </div>
        <div className="w-full overflow-hidden rounded-xl bg-muted/30 border border-border/50">
          {hasUrl ? (
            <iframe
              src={safeUrl}
              title="PDF"
              className="w-full border-0"
              style={{ height: `${subW.props.height || 300}px` }}
            />
          ) : (
            <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
              No PDF URL provided
            </div>
          )}
        </div>
      </div>
    )
  }

  if (subW.type === "heading") {
    return (
      <h3
        className="font-bold text-base sm:text-lg text-foreground tracking-tight"
        style={{ textAlign: subW.props.align || "left" }}
      >
        {subW.props.text}
      </h3>
    )
  }

  if (subW.type === "paragraph") {
    return (
      <p
        className="text-xs sm:text-sm text-foreground/80 leading-relaxed"
        style={{ textAlign: subW.props.align || "left" }}
      >
        {subW.props.text}
      </p>
    )
  }

  if (subW.type === "button") {
    return (
      <div style={{ textAlign: subW.props.align || "left" }}>
        <Button asChild size="sm" className="rounded-xl shadow-xs text-xs font-semibold cursor-pointer">
          <SmartLink href={getSafeUrl(subW.props.url)}>
            {subW.props.text || "Click Here"}
          </SmartLink>
        </Button>
      </div>
    )
  }

  if (subW.type === "video") {
    const safeEmbedUrl = getSafeVideoEmbedUrl(subW.props.url)
    if (!safeEmbedUrl) {
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-muted/40 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground">Unsupported video source.</p>
        </div>
      )
    }
    return (
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/90 max-w-full shadow-sm">
        <iframe
          src={safeEmbedUrl}
          title="Video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return <div className="text-xs p-3 bg-muted/30 rounded-xl">{subW.name}</div>
}

function PublicWidgetRenderer({ widget }: { widget: ElementorWidget }) {
  if (widget.type === "section") {
    const ratio = widget.props.columnsRatio || "33-33-33"
    return (
      <div className="rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xs p-4 sm:p-8 space-y-4 w-full max-w-full overflow-hidden shadow-xs my-4">
        <div className={cn(
          "grid gap-5 items-start w-full max-w-full",
          widget.props.stackOnMobile
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : ratio === "33-33-33"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : ratio === "30-70"
            ? "grid-cols-1 md:grid-cols-[30%_70%]"
            : ratio === "70-30"
            ? "grid-cols-1 md:grid-cols-[70%_30%]"
            : ratio === "25-75"
            ? "grid-cols-1 md:grid-cols-[25%_75%]"
            : "grid-cols-1 md:grid-cols-2"
        )}>
          <div className="space-y-3 w-full max-w-full overflow-hidden">
            {Array.isArray(widget.props.col1Widgets) && widget.props.col1Widgets.map((subW: ElementorWidget) => (
              <PublicSubWidgetRenderer key={subW.id} subW={subW} />
            ))}
          </div>
          <div className="space-y-3 w-full max-w-full overflow-hidden">
            {Array.isArray(widget.props.col2Widgets) && widget.props.col2Widgets.map((subW: ElementorWidget) => (
              <PublicSubWidgetRenderer key={subW.id} subW={subW} />
            ))}
          </div>
          {ratio === "33-33-33" && (
            <div className="space-y-3 w-full max-w-full overflow-hidden">
              {Array.isArray(widget.props.col3Widgets) && widget.props.col3Widgets.map((subW: ElementorWidget) => (
                <PublicSubWidgetRenderer key={subW.id} subW={subW} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (widget.type === "heading") {
    return (
      <h1
        className={cn(
          "font-extrabold tracking-tight text-foreground leading-tight max-w-full break-words my-3",
          widget.props.level === "h1" && "text-3xl sm:text-5xl",
          widget.props.level === "h2" && "text-2xl sm:text-4xl",
          widget.props.level === "h3" && "text-xl sm:text-3xl"
        )}
        style={{ textAlign: widget.props.align || "left" }}
      >
        {widget.props.text}
      </h1>
    )
  }

  if (widget.type === "paragraph") {
    return (
      <p
        className="text-sm sm:text-lg text-foreground/80 leading-relaxed max-w-4xl break-words my-3"
        style={{ textAlign: widget.props.align || "left" }}
      >
        {widget.props.text}
      </p>
    )
  }

  if (widget.type === "pdf") {
    const rawUrl = typeof widget.props.url === "string" ? widget.props.url : ""
    const safeUrl = rawUrl ? getSafeUrl(rawUrl) : ""
    const hasUrl = Boolean(safeUrl && safeUrl !== "#")
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-4 space-y-3 shadow-xs my-4">
        <div className="flex items-center justify-between text-sm font-bold border-b border-border/40 pb-2">
          <span className="flex items-center gap-2 text-rose-500">
            <FileText className="size-4 shrink-0" /> {typeof widget.props.title === "string" ? widget.props.title : "PDF Document"}
          </span>
          {hasUrl && (
            <a href={safeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-semibold text-xs">
              <Download className="size-3.5" /> Download
            </a>
          )}
        </div>
        <div className="w-full overflow-hidden rounded-2xl bg-muted/30 border border-border/50">
          {hasUrl ? (
            <iframe
              src={safeUrl}
              title="PDF"
              className="w-full border-0"
              style={{ height: `${widget.props.height || 500}px` }}
            />
          ) : (
            <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
              No PDF URL provided
            </div>
          )}
        </div>
      </div>
    )
  }

  if (widget.type === "faq") {
    return (
      <div className="space-y-4 py-4 w-full max-w-full my-2">
        <div className="p-5 rounded-3xl bg-card border border-border/70 space-y-1.5 shadow-xs">
          <h4 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
            <FaqIcon className="size-4 text-primary shrink-0" /> {widget.props.q1}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground pl-6 leading-relaxed">{widget.props.a1}</p>
        </div>
        <div className="p-5 rounded-3xl bg-card border border-border/70 space-y-1.5 shadow-xs">
          <h4 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
            <FaqIcon className="size-4 text-primary shrink-0" /> {widget.props.q2}
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground pl-6 leading-relaxed">{widget.props.a2}</p>
        </div>
      </div>
    )
  }

  if (widget.type === "quote") {
    return (
      <blockquote className="border-l-4 border-primary pl-6 py-4 italic text-base sm:text-xl text-foreground font-serif my-4 bg-muted/20 rounded-r-3xl max-w-full">
        &quot;{widget.props.quote}&quot;
        {widget.props.author && <footer className="text-xs sm:text-sm text-muted-foreground font-sans not-italic mt-2 font-bold">— {widget.props.author}</footer>}
      </blockquote>
    )
  }

  if (widget.type === "divider") {
    return <div className="py-4 w-full"><Separator /></div>
  }

  return <div className="py-2 text-xs text-muted-foreground">{widget.name}</div>
}

// ── Public Editor.js Block Renderer ──────────────────────────────────────────

export function PublicEditorJsBlockRenderer({
  block,
  onTriggerModal,
}: {
  block: EditorJsBlock
  onTriggerModal?: (modal: { type: "pdf" | "video"; url: string; title: string }) => void
}) {
  if (block.type === "header") {
    const level = block.data?.level || 2
    const text = sanitizeHtml(block.data?.text || "")
    if (level === 1) {
      return (
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground my-4 leading-tight"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )
    }
    if (level === 2) {
      return (
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground my-3"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )
    }
    if (level === 3) {
      return (
        <h3
          className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground my-2"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )
    }
    return (
      <h4
        className="text-lg font-semibold tracking-tight text-foreground my-2"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  }

  if (block.type === "paragraph") {
    return (
      <p
        className="text-base sm:text-lg text-foreground/85 leading-relaxed my-3"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data?.text || "") }}
      />
    )
  }

  if (block.type === "alert") {
    const variant = block.data?.variant || "default"
    const variantStyles: Record<string, string> = {
      default: "border-border bg-card text-card-foreground",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    }
    return (
      <Alert className={cn("my-4 p-5 rounded-xl shadow-xs", variantStyles[variant] || variantStyles.default)}>
        <AlertCircle className="size-5 shrink-0" />
        <div className="space-y-1 ml-2">
          {block.data?.title && (
            <AlertTitle className="text-base font-bold" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data.title) }} />
          )}
          {block.data?.message && (
            <AlertDescription
              className="text-sm leading-relaxed opacity-90"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data.message) }}
            />
          )}
        </div>
      </Alert>
    )
  }

  if (block.type === "button") {
    const align = block.data?.align || "left"
    const alignClass =
      align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"

    const rawItems: Array<{
      id?: string
      text?: string
      url?: string
      variant?: "default" | "secondary" | "outline" | "destructive"
    }> =
      Array.isArray(block.data?.items) && block.data.items.length > 0
        ? block.data.items
        : [
            {
              id: "btn-1",
              text: block.data?.text || "Click Here",
              url: block.data?.url || "#",
              variant: block.data?.variant || "default",
            },
          ]

    return (
      <div className={cn("flex flex-wrap items-center gap-3 my-4", alignClass)}>
        {rawItems.map((item, idx) => (
          <Button
            key={item.id || idx}
            asChild
            variant={item.variant || "default"}
            size="lg"
            className="rounded-xl font-semibold px-6 shadow-xs text-sm inline-flex cursor-pointer"
          >
            <SmartLink href={item.url || "#"}>
              {item.text || "Button"}
            </SmartLink>
          </Button>
        ))}
      </div>
    )
  }

  if (block.type === "card") {
    const rawItems: Array<{
      id?: string
      badge?: string
      title?: string
      description?: string
      linkUrl?: string
    }> =
      Array.isArray(block.data?.items) && block.data.items.length > 0
        ? block.data.items
        : [
            {
              id: "card-1",
              badge: block.data?.badge || "",
              title: block.data?.title || "",
              description: block.data?.description || "",
              linkUrl: block.data?.linkUrl || "",
            },
          ]

    const cols = Number(block.data?.columns) || Math.min(rawItems.length, 3) || 1
    const gridColsClass =
      cols === 1
        ? "grid-cols-1"
        : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : cols === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

    return (
      <div className={cn("grid gap-5 my-6", gridColsClass)}>
        {rawItems.map((item, idx) => {
          const safeLink = item.linkUrl ? getSafeUrl(item.linkUrl) : ""
          return (
            <Card
              key={item.id || idx}
              className="p-6 rounded-2xl shadow-xs border bg-card text-card-foreground flex flex-col justify-between h-full hover:shadow-md transition-shadow"
            >
              <div>
                {item.badge && (
                  <div className="mb-2.5">
                    <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {item.badge}
                    </Badge>
                  </div>
                )}
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">{item.title}</CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </CardDescription>
              </div>
              {safeLink && safeLink !== "#" && (
                <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-end">
                  <SmartLink
                    href={safeLink}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                  >
                    Learn More <ArrowRight className="size-3.5" />
                  </SmartLink>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    )
  }

  if (block.type === "stats") {
    return (
      <div className="my-6 rounded-2xl border bg-card/60 p-6 sm:p-8 text-center shadow-xs">
        <div className="text-4xl sm:text-5xl font-extrabold text-primary tracking-tight">{block.data?.stat}</div>
        <div className="text-base sm:text-lg font-semibold text-foreground mt-2">{block.data?.label}</div>
        {block.data?.subtext && <div className="text-xs sm:text-sm text-muted-foreground mt-1">{block.data.subtext}</div>}
      </div>
    )
  }

  if (block.type === "pdf") {
    const safePdfUrl = getSafeUrl(block.data?.url)
    return (
      <div className="my-4 rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <FileText className="size-6" />
          </div>
          <div>
            <div className="font-semibold text-sm sm:text-base text-foreground">{block.data?.title || "Document.pdf"}</div>
            <div className="text-xs text-muted-foreground">{block.data?.fileSize || "PDF Document"}</div>
          </div>
        </div>
        {safePdfUrl && safePdfUrl !== "#" && (
          <a href={safePdfUrl} target="_blank" rel="noreferrer" download>
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <Download className="size-4" /> Download PDF
            </Button>
          </a>
        )}
      </div>
    )
  }

  if (block.type === "video") {
    const safeEmbedUrl = getSafeVideoEmbedUrl(block.data?.url)
    if (!safeEmbedUrl) {
      return (
        <div className="my-6 aspect-video w-full rounded-2xl overflow-hidden border bg-muted/40 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <Video className="size-8 text-muted-foreground/60" />
          <p className="text-xs font-semibold text-muted-foreground">
            {block.data?.url ? "Invalid video provider. Only verified YouTube and Vimeo videos are supported." : "No video source configured."}
          </p>
        </div>
      )
    }
    return (
      <div className="my-6 aspect-video w-full rounded-2xl overflow-hidden border bg-black/90 shadow-md">
        <iframe
          src={safeEmbedUrl}
          title="Video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (block.type === "list") {
    const isOrdered = block.data?.style === "ordered"
    const items = Array.isArray(block.data?.items) ? block.data.items : []
    return <RenderEditorJsList items={items} isOrdered={isOrdered} />
  }

  if (block.type === "checklist") {
    const items = Array.isArray(block.data?.items) ? block.data.items : []
    return (
      <div className="my-4 space-y-2.5 text-foreground/85 text-base sm:text-lg">
        {items.map((it: unknown, idx: number) => {
          const text = getListItemText(it)
          const checked = it && typeof it === "object" ? Boolean((it as Record<string, unknown>).checked) : false
          const sanitized = sanitizeHtml(text)

          return (
            <div key={idx} className="flex items-start gap-3 pl-1">
              <div
                className={cn(
                  "size-5 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-colors",
                  checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-muted/20"
                )}
              >
                {checked && <Check className="size-3.5 stroke-[3]" />}
              </div>
              <span
                className={cn(
                  "leading-relaxed",
                  checked ? "line-through text-muted-foreground" : "text-foreground/85"
                )}
                dangerouslySetInnerHTML={{ __html: sanitized || text }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-primary pl-4 py-2.5 my-4 italic text-base sm:text-lg text-foreground/90 bg-muted/20 rounded-r-xl">
        <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data?.text || "") }} />
        {block.data?.caption && <footer className="text-xs text-muted-foreground mt-1 not-italic font-medium">— {block.data.caption}</footer>}
      </blockquote>
    )
  }

  if (block.type === "delimiter") {
    return <Separator className="my-8" />
  }

  if (block.type === "table") {
    const rawContent: unknown[][] = (block.data?.content as unknown[][]) || []
    const withHeadings = Boolean(block.data?.withHeadings ?? true)
    const hasHeadings = withHeadings && rawContent.length > 0
    const headerRow = hasHeadings ? rawContent[0] : []
    const bodyRows = hasHeadings ? rawContent.slice(1) : rawContent

    return (
      <div className="my-6 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            {hasHeadings && (
              <thead className="border-b border-border bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  {headerRow.map((cell, cIdx) => {
                    const parsed = parseTableCell(cell)
                    const isFirstCol = cIdx === 0
                    const isNumCol = cIdx > 1
                    return (
                      <th
                        key={cIdx}
                        className={cn(
                          "px-4 py-3 font-semibold text-foreground",
                          isFirstCol && "w-12 text-center",
                          isNumCol && "text-center whitespace-nowrap min-w-[105px]"
                        )}
                      >
                        {parsed.isButton && parsed.btn ? (
                          <span>{parsed.btn.label}</span>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed.text || "") }} />
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border/60">
              {bodyRows.map((row, rIdx) => {
                const rowText = row.map((c) => (typeof c === "string" ? c : "")).join(" ").toLowerCase()
                const isTotalRow = rowText.includes("total") || rowText.includes("sub-total")
                const isSectionHeader =
                  row.length > 1 &&
                  (rowText.includes("at the time of admission") ||
                    rowText.includes("once in a year") ||
                    rowText.includes("monthly charges") ||
                    rowText.includes("optional facility"))

                return (
                  <tr
                    key={rIdx}
                    className={cn(
                      "transition-colors",
                      isSectionHeader
                        ? "bg-muted/50 font-bold border-t-2 border-border text-foreground"
                        : isTotalRow
                        ? "bg-primary/5 font-semibold border-t-2 border-primary/20 text-foreground"
                        : "hover:bg-muted/20"
                    )}
                  >
                    {row.map((cell, cIdx) => {
                      const parsed = parseTableCell(cell)
                      const rawVal = String(parsed.text || "").replace(/<[^>]+>/g, "").trim()
                      const isNumericOrShort =
                        cIdx > 1 &&
                        (/^([—\-–]|₹?[\d,]+(\.\d+)?(\s*(\/|\*|per).*?)?)$/i.test(rawVal) || rawVal === "")

                      return (
                        <td
                          key={cIdx}
                          className={cn(
                            "px-4 py-3.5 align-middle text-foreground/90",
                            cIdx === 0 && "text-center font-medium",
                            isNumericOrShort && "text-center whitespace-nowrap font-medium",
                            isTotalRow && "font-semibold"
                          )}
                        >
                          {parsed.isButton && parsed.btn ? (
                            parsed.btn.actionType === "link" || parsed.btn.actionType === "download" ? (
                              <Button
                                asChild
                                size="sm"
                                variant={parsed.btn.variant || "outline"}
                                className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                              >
                                <SmartLink
                                  href={getSafeUrl(parsed.btn.url)}
                                  download={parsed.btn.actionType === "download" ? true : undefined}
                                >
                                  {renderTableCellIcon(parsed.btn.icon)}
                                  <span>{parsed.btn.label}</span>
                                </SmartLink>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant={parsed.btn.variant || "default"}
                                className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                                onClick={() => {
                                  if (parsed.btn && onTriggerModal) {
                                    onTriggerModal({
                                      type: parsed.btn.actionType === "view_video" ? "video" : "pdf",
                                      url: parsed.btn.url,
                                      title: parsed.btn.label,
                                    })
                                  }
                                }}
                              >
                                {renderTableCellIcon(parsed.btn.icon)}
                                <span>
                                  {parsed.btn.label ||
                                    (parsed.btn.actionType === "view_video"
                                      ? "Watch Video"
                                      : "View PDF")}
                                </span>
                              </Button>
                            )
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsed.text || "") }} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null
}

function deduplicateBlocks(blocks: EditorJsBlock[]): EditorJsBlock[] {
  if (!Array.isArray(blocks) || blocks.length < 2) return blocks

  if (blocks.length % 2 === 0) {
    const half = blocks.length / 2
    const firstHalf = JSON.stringify(blocks.slice(0, half).map((b) => ({ type: b.type, data: b.data })))
    const secondHalf = JSON.stringify(blocks.slice(half).map((b) => ({ type: b.type, data: b.data })))
    if (firstHalf === secondHalf) {
      return blocks.slice(0, half)
    }
  }

  return blocks
}

// ── Static Page Layout & Renderer ───────────────────────────────────────────

export interface StaticPageRendererProps {
  page: StaticPageData
  showBreadcrumbs?: boolean
  customHeader?: React.ReactNode
  containerClassName?: string
}

export function StaticPageRenderer({
  page,
  showBreadcrumbs = true,
  customHeader,
  containerClassName,
}: StaticPageRendererProps) {
  const [activeModal, setActiveModal] = React.useState<{
    type: "pdf" | "video"
    url: string
    title: string
  } | null>(null)

  const raw = page.widgets
  let editorBlocks: EditorJsBlock[] | null = null
  let legacyWidgets: ElementorWidget[] = []

  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.blocks)) {
    editorBlocks = deduplicateBlocks(raw.blocks)
  } else if (Array.isArray(raw) && raw.length > 0 && "data" in raw[0]) {
    editorBlocks = deduplicateBlocks(raw as unknown as EditorJsBlock[])
  } else if (Array.isArray(raw)) {
    legacyWidgets = raw as unknown as ElementorWidget[]
  }

  const hasTable = Boolean(editorBlocks?.some((b) => b.type === "table"))
  const defaultContainerWidth = hasTable ? "max-w-6xl" : "max-w-4xl"

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col">
      <Header />

      <main
        className={cn(
          "flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-4",
          containerClassName || defaultContainerWidth
        )}
      >
        {/* Breadcrumb Bar */}
        {showBreadcrumbs && (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
            <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="size-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-foreground font-medium truncate">{page.title}</span>
          </nav>
        )}

        {/* Custom Header if supplied, otherwise standard title heading */}
        {customHeader ? (
          customHeader
        ) : (
          <div className="pb-4 mb-4 border-b border-border/40">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {page.title}
            </h1>
          </div>
        )}

        {/* Blocks rendering */}
        {editorBlocks ? (
          editorBlocks
            .filter((block, idx) => {
              if (idx === 0 && block.type === "header") {
                const headerText = typeof block.data?.text === "string" ? block.data.text.trim().toLowerCase() : ""
                if (headerText === page.title.trim().toLowerCase()) {
                  return false
                }
              }
              return true
            })
            .map((block, idx) => (
              <PublicEditorJsBlockRenderer
                key={idx}
                block={block}
                onTriggerModal={(m) => setActiveModal(m)}
              />
            ))
        ) : (
          legacyWidgets.map((widget) => (
            <PublicWidgetRenderer key={widget.id} widget={widget} />
          ))
        )}
      </main>

      {/* Modal Dialog for Table Button actions */}
      <Dialog open={Boolean(activeModal)} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden sm:max-w-3xl">
          {activeModal && (
            <div className="flex flex-col h-full max-h-[85vh]">
              <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeModal.type === "pdf" ? (
                    <FileText className="size-5 text-rose-500" />
                  ) : (
                    <Video className="size-5 text-purple-500" />
                  )}
                  <DialogTitle className="text-base font-bold truncate">
                    {activeModal.title || (activeModal.type === "pdf" ? "PDF Document" : "Video Player")}
                  </DialogTitle>
                </div>
                {activeModal.type === "pdf" && activeModal.url && (
                  <a
                    href={getSafeUrl(activeModal.url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="mr-6"
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                      <Download className="size-3.5" /> Download
                    </Button>
                  </a>
                )}
              </DialogHeader>

              <div className="p-2 flex-1 min-h-[420px] bg-muted/20">
                {activeModal.type === "pdf" ? (
                  <iframe
                    src={
                      activeModal.url.includes("drive.google.com") || activeModal.url.endsWith(".pdf")
                        ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(getSafeUrl(activeModal.url))}`
                        : getSafeUrl(activeModal.url)
                    }
                    title={activeModal.title || "PDF Viewer"}
                    className="w-full h-[520px] rounded-lg border-0 bg-white"
                  />
                ) : (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    {(() => {
                      const safeEmbed = getSafeVideoEmbedUrl(activeModal.url)
                      if (safeEmbed) {
                        return (
                          <iframe
                            src={safeEmbed}
                            title={activeModal.title || "Video"}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )
                      }
                      const safeDirect = getSafeUrl(activeModal.url)
                      if (safeDirect.endsWith(".mp4") || safeDirect.endsWith(".webm")) {
                        return (
                          <video
                            src={safeDirect}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                          />
                        )
                      }
                      return (
                        <div className="text-center p-6 text-xs text-white/80">
                          Unsupported video source. Only verified YouTube, Vimeo, or direct MP4 videos can be played.
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
