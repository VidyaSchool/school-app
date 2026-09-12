"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  Download,
  AlertCircle,
  HelpCircle as FaqIcon,
  Loader2,
  Video,
  Play,
  Eye,
  ExternalLink,
  Sparkles,
  ArrowRight,
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

export interface ElementorWidget {
  id: string
  type: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>
}

// ── Security Helpers: URL Sanitization, Video Whitelisting & HTML Guard ─────

function getSafeUrl(url?: string, fallback = "#"): string {
  if (!url || typeof url !== "string") return fallback
  const trimmed = url.trim()
  if (!trimmed) return fallback

  // Strip invisible control characters & normalize
  const normalized = trimmed.replace(/[\x00-\x1F\x7F\s]+/g, "").toLowerCase()

  // Block dangerous pseudo-protocols (XSS)
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("vbscript:")
  ) {
    return fallback
  }

  // Allow safe relative paths, anchors, and standard web protocols
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

  // Allow relative paths without leading slash (e.g. "p/tech-fest" -> "/p/tech-fest")
  if (/^[a-zA-Z0-9_\-\/]+$/.test(trimmed) && !trimmed.includes("://")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  }

  return fallback
}

function getSafeVideoEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    const host = parsed.hostname.toLowerCase()

    // 1. YouTube validation
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

    // 2. Vimeo validation
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

function sanitizeHtml(rawHtml?: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return ""

  // Strip harmful tags (script, style, iframe, object, embed, form, input, button)
  let clean = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")

  // Strip all inline DOM event handlers (onload, onerror, onclick, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")

  // Defang javascript: and data: pseudo-protocols inside attributes
  clean = clean.replace(/(href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, '$1="#"')

  return clean
}

// ── SmartLink: Next.js Link for internal target routes (/p/...), regular <a> for external URLs ──

export function isInternalLink(url?: string): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed || trimmed === "#") return false

  // Relative internal paths (e.g. /p/tech-fest, /admissions, /about) or hash anchors (#...)
  if ((trimmed.startsWith("/") && !trimmed.startsWith("//")) || trimmed.startsWith("#")) {
    return true
  }

  // Check if someone pasted a full URL pointing to the local or primary domain
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
    // Ignore URL parse error
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

interface SmartLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
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

    // 1. Internal Link: e.g. /p/tech-fest, /admissions, /about
    // Uses Next.js client-side navigation (<Link>) without full page reload
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
            // Ensure client-side SPA navigation without hard refresh
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

    // 2. External Link: e.g. https://www.youtube.com/, https://google.com
    // Standard anchor tag with target="_blank" and rel="noopener noreferrer"
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

// ── Public Sub-Widget Renderer ───────────────────────────────────────────────

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
              style={{ height: (subW.props.height as string) || "280px" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center text-xs text-muted-foreground py-10">
              <FileText className="size-4 mr-2 opacity-40" /> No PDF uploaded yet
            </div>
          )}
        </div>
      </div>
    )
  }

  if (subW.type === "image") {
    const rawSrc = typeof subW.props.src === "string" ? subW.props.src : ""
    const safeSrc = rawSrc ? getSafeUrl(rawSrc) : ""
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={safeSrc} alt="" className="rounded-2xl w-full h-auto max-h-[300px] object-cover shadow-sm max-w-full" />
    )
  }

  if (subW.type === "heading") {
    return <h3 className="font-extrabold text-lg sm:text-xl text-foreground leading-tight">{typeof subW.props.text === "string" ? subW.props.text : ""}</h3>
  }

  if (subW.type === "paragraph") {
    return <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{typeof subW.props.text === "string" ? subW.props.text : ""}</p>
  }

  if (subW.type === "button") {
    const rawLink = typeof subW.props.link === "string" ? subW.props.link : "#"
    return (
      <Button
        asChild
        variant={(subW.props.variant as "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined) || "default"}
        size="sm"
        className="rounded-xl text-xs shadow-xs my-1 max-w-full truncate cursor-pointer font-bold inline-flex"
      >
        <SmartLink href={rawLink}>
          {typeof subW.props.label === "string" ? subW.props.label : "Button"}
        </SmartLink>
      </Button>
    )
  }

  if (subW.type === "video") {
    const safeEmbedUrl = getSafeVideoEmbedUrl(typeof subW.props.url === "string" ? subW.props.url : "")
    if (!safeEmbedUrl) {
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-muted/40 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground">Unsupported video source. Only verified YouTube and Vimeo videos are supported.</p>
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

// ── Public Top-Level Widget Renderer ─────────────────────────────────────────

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
          {/* Column 1 */}
          <div className="space-y-3 w-full max-w-full overflow-hidden">
            {Array.isArray(widget.props.col1Widgets) && widget.props.col1Widgets.map((subW: ElementorWidget) => (
              <PublicSubWidgetRenderer key={subW.id} subW={subW} />
            ))}
          </div>

          {/* Column 2 */}
          <div className="space-y-3 w-full max-w-full overflow-hidden">
            {Array.isArray(widget.props.col2Widgets) && widget.props.col2Widgets.map((subW: ElementorWidget) => (
              <PublicSubWidgetRenderer key={subW.id} subW={subW} />
            ))}
          </div>

          {/* Column 3 */}
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
    const isDarkDefault = !widget.props.color || widget.props.color === "#000000" || widget.props.color === "#000" || widget.props.color === "#111827"
    return (
      <h1
        className={cn(
          "font-extrabold tracking-tight text-foreground leading-tight max-w-full break-words my-3",
          widget.props.level === "h1" && "text-3xl sm:text-5xl",
          widget.props.level === "h2" && "text-2xl sm:text-4xl",
          widget.props.level === "h3" && "text-xl sm:text-3xl"
        )}
        style={{ textAlign: widget.props.align || "left", color: isDarkDefault ? undefined : widget.props.color }}
      >
        {widget.props.text}
      </h1>
    )
  }

  if (widget.type === "paragraph") {
    const isDarkDefault = !widget.props.color || widget.props.color === "#000000" || widget.props.color === "#000" || widget.props.color === "#111827"
    return (
      <p
        className="text-sm sm:text-lg text-foreground/80 leading-relaxed max-w-4xl break-words my-3"
        style={{ textAlign: widget.props.align || "left", color: isDarkDefault ? undefined : widget.props.color }}
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
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm space-y-3 p-5 my-4 w-full max-w-full">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <span className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
            <FileText className="size-4 text-rose-500 shrink-0" /> {typeof widget.props.title === "string" ? widget.props.title : "PDF Document Viewer"}
          </span>
          {hasUrl && (
            <a href={safeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline shrink-0">
              <Download className="size-3.5" /> Download PDF
            </a>
          )}
        </div>
        <div className="w-full overflow-hidden rounded-2xl bg-muted/40 border border-border/50">
          {hasUrl ? (
            <iframe
              src={safeUrl}
              title={(widget.props.title as string) || "PDF Viewer"}
              className="w-full border-0"
              style={{ height: (widget.props.height as string) || "480px" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center text-sm text-muted-foreground py-16">
              <FileText className="size-5 mr-2 opacity-40" /> No PDF has been uploaded for this widget
            </div>
          )}
        </div>
      </div>
    )
  }

  if (widget.type === "button") {
    const rawLink = typeof widget.props.link === "string" ? widget.props.link : "#"
    return (
      <div className="py-2" style={{ textAlign: (widget.props.align as "left" | "center" | "right") || "left" }}>
        <Button
          asChild
          variant={(widget.props.variant as "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined) || "default"}
          size={(widget.props.size as "default" | "sm" | "lg" | "icon" | null | undefined) || "lg"}
          className="rounded-2xl shadow-xs font-bold text-sm max-w-full truncate px-6 py-2.5 inline-flex"
        >
          <SmartLink href={rawLink}>
            {typeof widget.props.label === "string" ? widget.props.label : "Button"}
          </SmartLink>
        </Button>
      </div>
    )
  }

  if (widget.type === "badge") {
    return (
      <div className="py-2">
        <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 max-w-full truncate">
          {widget.props.label || "BADGE"}
        </Badge>
      </div>
    )
  }

  if (widget.type === "image") {
    return (
      <div className="py-3 my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={widget.props.src} alt={widget.props.alt || ""} className="w-full max-h-[500px] object-cover shadow-md rounded-3xl max-w-full" />
      </div>
    )
  }

  if (widget.type === "stats") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 text-center w-full max-w-full my-2">
        <div className="p-6 rounded-3xl bg-card border border-border/70 shadow-xs">
          <div className="text-3xl sm:text-4xl font-black text-primary">{widget.props.stat1 || "98%"}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-bold">{widget.props.label1 || "Metric 1"}</div>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/70 shadow-xs">
          <div className="text-3xl sm:text-4xl font-black text-primary">{widget.props.stat2 || "10k+"}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-bold">{widget.props.label2 || "Metric 2"}</div>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/70 shadow-xs">
          <div className="text-3xl sm:text-4xl font-black text-primary">{widget.props.stat3 || "100+"}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-bold">{widget.props.label3 || "Metric 3"}</div>
        </div>
      </div>
    )
  }

  if (widget.type === "features") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 w-full max-w-full my-2">
        <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-2 shadow-xs">
          <h3 className="font-extrabold text-base text-foreground">{widget.props.col1Title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{widget.props.col1Body}</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-2 shadow-xs">
          <h3 className="font-extrabold text-base text-foreground">{widget.props.col2Title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{widget.props.col2Body}</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-2 shadow-xs">
          <h3 className="font-extrabold text-base text-foreground">{widget.props.col3Title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{widget.props.col3Body}</p>
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

  if (widget.type === "form") {
    return (
      <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-md max-w-xl mx-auto w-full my-6">
        <h3 className="font-extrabold text-xl text-foreground">{widget.props.title || "Contact Us"}</h3>
        <div className="space-y-3">
          <Input placeholder="Full Name" className="text-xs sm:text-sm rounded-xl h-10" />
          <Input placeholder="Email Address" className="text-xs sm:text-sm rounded-xl h-10" />
          <Textarea placeholder="Your Message..." className="text-xs sm:text-sm rounded-xl resize-none h-24" />
          <Button className="w-full text-xs sm:text-sm rounded-xl h-10 font-bold cursor-pointer">
            {widget.props.buttonLabel || "Submit"}
          </Button>
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

// ── Editor.js Block Renderer using shadcn UI components ───────────────────────

interface EditorJsBlock {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

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



function PublicEditorJsBlockRenderer({
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
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground my-4 leading-tight"
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
            className="rounded-xl font-semibold px-6 shadow-xs text-sm inline-flex"
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
            <Button variant="outline" size="sm" className="gap-2">
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
    const items = block.data?.items || []
    return isOrdered ? (
      <ol className="list-decimal list-inside my-3 space-y-1.5 text-foreground/85 text-base sm:text-lg">
        {items.map((it: string, idx: number) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: sanitizeHtml(it) }} />
        ))}
      </ol>
    ) : (
      <ul className="list-disc list-inside my-3 space-y-1.5 text-foreground/85 text-base sm:text-lg">
        {items.map((it: string, idx: number) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: sanitizeHtml(it) }} />
        ))}
      </ul>
    )
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-primary pl-4 py-2.5 my-4 italic text-base sm:text-lg text-foreground/90 bg-muted/20 rounded-r-xl">
        <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.data?.text || "") }} />
        {block.data?.caption && <footer className="text-xs text-muted-foreground mt-1 not-italic">— {block.data.caption}</footer>}
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
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  {headerRow.map((cell, cIdx) => {
                    const parsed = parseTableCell(cell)
                    return (
                      <th
                        key={cIdx}
                        className="px-4 py-3 border-r border-border/40 last:border-r-0 whitespace-nowrap"
                      >
                        {parsed.text || parsed.btn?.label || "Header"}
                      </th>
                    )
                  })}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border/60">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, cIdx) => {
                    const parsed = parseTableCell(cell)
                    return (
                      <td
                        key={cIdx}
                        className="px-4 py-3 border-r border-border/40 last:border-r-0 align-middle"
                      >
                        {parsed.isButton && parsed.btn ? (
                          parsed.btn.actionType === "link" ? (
                            <Button
                              asChild
                              variant={parsed.btn.variant || "default"}
                              size="sm"
                              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs inline-flex"
                            >
                              <SmartLink href={parsed.btn.url || "#"}>
                                {renderTableCellIcon(parsed.btn.icon)}
                                <span>{parsed.btn.label || "Action"}</span>
                              </SmartLink>
                            </Button>
                          ) : parsed.btn.actionType === "download" ? (
                            <a
                              href={getSafeUrl(parsed.btn.url)}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block"
                            >
                              <Button
                                variant={parsed.btn.variant || "outline"}
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                              >
                                {renderTableCellIcon(parsed.btn.icon || "download")}
                                <span>{parsed.btn.label || "Download"}</span>
                              </Button>
                            </a>
                          ) : (
                            <Button
                              type="button"
                              variant={parsed.btn.variant || "default"}
                              size="sm"
                              onClick={() => {
                                if (onTriggerModal && parsed.btn) {
                                  onTriggerModal({
                                    type: parsed.btn.actionType === "view_video" ? "video" : "pdf",
                                    url: getSafeUrl(parsed.btn.url),
                                    title: parsed.btn.label,
                                  })
                                }
                              }}
                              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
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
              ))}
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

// ── Main Unauthenticated Public Page Renderer Component ────────────────────────

interface CachedPublicPage {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widgets: any
}
const publicPageCache = new Map<string, CachedPublicPage>()

function tryLoadFromLocalStorage(slug: string): { title: string; widgets: unknown } | null {
  if (typeof window === "undefined") return null
  const cleanSlug = slug.replace(/^\/?p\//, "").replace(/^\/+|\/+$/g, "").toLowerCase()
  for (const key of ["vidya_elementor_pages", "vidya_pages"]) {
    try {
      const localRaw = localStorage.getItem(key)
      if (localRaw) {
        const list = JSON.parse(localRaw)
        if (Array.isArray(list)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matched = list.find((p: any) => {
            const pSlug = (p.slug || "").replace(/^\/?p\//, "").replace(/^\/+|\/+$/g, "").toLowerCase()
            const pId = p.uid || p.id || ""
            return pSlug === cleanSlug || pId === slug || pSlug === slug.toLowerCase()
          })
          if (matched) {
            return {
              title: matched.title || matched.name || "Untitled Page",
              widgets: matched.widgets || matched.contentJson || [],
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }
  return null
}

export default function PublicLivePage() {
  const { slug } = useParams<{ slug: string }>()

  // Instant transition: if page was previously fetched or saved in browser, initialize immediately
  const cached = slug ? publicPageCache.get(slug) : undefined
  const localFallback = !cached && slug ? tryLoadFromLocalStorage(slug) : null
  const initialData = cached || localFallback

  const [pageTitle, setPageTitle] = React.useState<string>(initialData?.title || "")
  const [editorBlocks, setEditorBlocks] = React.useState<EditorJsBlock[] | null>(() => {
    if (initialData) {
      const raw = initialData.widgets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray((raw as any).blocks)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return deduplicateBlocks((raw as any).blocks as EditorJsBlock[])
      } else if (Array.isArray(raw) && raw.length > 0 && "data" in raw[0]) {
        return deduplicateBlocks(raw as EditorJsBlock[])
      }
    }
    return null
  })
  const [legacyWidgets, setLegacyWidgets] = React.useState<ElementorWidget[]>(() => {
    if (initialData && Array.isArray(initialData.widgets) && (initialData.widgets.length === 0 || !("data" in initialData.widgets[0]))) {
      return initialData.widgets as ElementorWidget[]
    }
    return []
  })
  const [loading, setLoading] = React.useState(!initialData)
  const [error, setError] = React.useState<string | null>(null)
  const [activeModal, setActiveModal] = React.useState<{
    type: "pdf" | "video"
    url: string
    title: string
  } | null>(null)

  // Keep browser document title synchronized with user-selected page title
  React.useEffect(() => {
    if (pageTitle && pageTitle !== "Page") {
      document.title = `${pageTitle} | Vidya School`
    }
  }, [pageTitle])

  React.useEffect(() => {
    if (!slug) return

    let isMounted = true

    // Only show loading pulse if not already cached
    const cachedData = publicPageCache.get(slug)
    const localData = tryLoadFromLocalStorage(slug)
    if (!cachedData && !localData) {
      setLoading(true)
    }

    const fetchPublicPage = async () => {
      try {
        const res = await fetch(`/api/public/page?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()

        if (!isMounted) return

        if (!res.ok || !data.found || !data.page) {
          const local = tryLoadFromLocalStorage(slug)
          if (local) {
            setPageTitle(local.title)
            const rawWidgets = local.widgets
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (rawWidgets && typeof rawWidgets === "object" && !Array.isArray(rawWidgets) && Array.isArray((rawWidgets as any).blocks)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setEditorBlocks(deduplicateBlocks((rawWidgets as any).blocks as EditorJsBlock[]))
              setLegacyWidgets([])
            } else if (Array.isArray(rawWidgets) && rawWidgets.length > 0 && "data" in rawWidgets[0]) {
              setEditorBlocks(deduplicateBlocks(rawWidgets as EditorJsBlock[]))
              setLegacyWidgets([])
            } else if (Array.isArray(rawWidgets)) {
              setEditorBlocks(null)
              setLegacyWidgets(rawWidgets as ElementorWidget[])
            }
            setError(null)
            return
          }
          throw new Error(data.error || "Page not found")
        }

        const title = data.page.title || "Untitled Page"
        setPageTitle(title)

        // Store in memory cache for subsequent instant navigations
        publicPageCache.set(slug, {
          title,
          widgets: data.page.widgets,
        })

        const raw = data.page.widgets
        if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.blocks)) {
          setEditorBlocks(deduplicateBlocks(raw.blocks as EditorJsBlock[]))
          setLegacyWidgets([])
        } else if (Array.isArray(raw) && raw.length > 0 && "data" in raw[0]) {
          setEditorBlocks(deduplicateBlocks(raw as EditorJsBlock[]))
          setLegacyWidgets([])
        } else if (Array.isArray(raw)) {
          setEditorBlocks(null)
          setLegacyWidgets(raw)
        }
        setError(null)
      } catch (err: unknown) {
        if (!isMounted) return
        const local = tryLoadFromLocalStorage(slug)
        if (local) {
          setPageTitle(local.title)
          const rawWidgets = local.widgets
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (rawWidgets && typeof rawWidgets === "object" && !Array.isArray(rawWidgets) && Array.isArray((rawWidgets as any).blocks)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setEditorBlocks(deduplicateBlocks((rawWidgets as any).blocks as EditorJsBlock[]))
            setLegacyWidgets([])
          } else if (Array.isArray(rawWidgets) && rawWidgets.length > 0 && "data" in rawWidgets[0]) {
            setEditorBlocks(deduplicateBlocks(rawWidgets as EditorJsBlock[]))
            setLegacyWidgets([])
          } else if (Array.isArray(rawWidgets)) {
            setEditorBlocks(null)
            setLegacyWidgets(rawWidgets as ElementorWidget[])
          }
          setError(null)
          return
        }
        const msg = err instanceof Error ? err.message : "Failed to load public page"
        setError(msg)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPublicPage()

    return () => {
      isMounted = false
    }
  }, [slug])

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col">
      {/* Dynamic Title hoisted into head */}
      <title>{pageTitle && pageTitle !== "Page" ? `${pageTitle} | Vidya School` : "Vidya School"}</title>

      {/* Shared site-wide Header — persistent, never unmounts or flashes */}
      <Header />

      {/* Main Public Page Content Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 sm:py-12 space-y-4">
        {loading ? (
          <div className="space-y-6 py-4 animate-pulse">
            <div className="h-10 bg-muted/60 rounded-xl w-3/4 mb-6" />
            <div className="space-y-2.5">
              <div className="h-4 bg-muted/40 rounded-md w-full" />
              <div className="h-4 bg-muted/40 rounded-md w-5/6" />
              <div className="h-4 bg-muted/40 rounded-md w-2/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="h-28 bg-muted/30 rounded-2xl border border-border/40" />
              <div className="h-28 bg-muted/30 rounded-2xl border border-border/40" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <AlertCircle className="size-12 text-rose-500" />
            <div>
              <h2 className="text-2xl font-black">Page Not Found</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {error || "The requested public page does not exist or has been unpublished."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Page Title — dynamically matches user-selected title from page builder */}
            {pageTitle && (
              <div className="pb-4 mb-4 border-b border-border/40">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                  {pageTitle}
                </h1>
              </div>
            )}

            {editorBlocks ? (
              editorBlocks
                .filter((block, idx) => {
                  // Avoid duplicate heading if block 0 repeats the page title
                  if (idx === 0 && block.type === "header") {
                    const headerText = typeof block.data?.text === "string" ? block.data.text.trim().toLowerCase() : ""
                    if (headerText === pageTitle.trim().toLowerCase()) {
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
          </>
        )}
      </main>

      {/* Modal Dialog for Table Button actions (View PDF / Watch Video) */}
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
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
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

      {/* Shared site-wide Footer */}
      <Footer />
    </div>
  )
}
