"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  FileText,
  Download,
  MousePointer,
  AlertCircle,
  Quote,
  LayoutGrid,
  Columns3,
  HelpCircle as FaqIcon,
  Video,
  Loader2,
  FileDown,
  Globe,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export interface ElementorWidget {
  id: string
  type: string
  name: string
  props: Record<string, any>
}

// ── Public Sub-Widget Renderer ───────────────────────────────────────────────

function PublicSubWidgetRenderer({ subW }: { subW: ElementorWidget }) {
  if (subW.type === "pdf") {
    const hasUrl = Boolean(subW.props.url)
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2 shadow-xs w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold border-b border-border/40 pb-1.5">
          <span className="flex items-center gap-1.5 text-rose-500 truncate">
            <FileText className="size-3.5 shrink-0" /> {subW.props.title || "PDF Document"}
          </span>
          {hasUrl && (
            <a href={subW.props.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 shrink-0 font-semibold">
              <Download className="size-3" /> Download
            </a>
          )}
        </div>
        <div className="w-full overflow-hidden rounded-xl bg-muted/30 border border-border/50">
          {hasUrl ? (
            <iframe
              src={subW.props.url}
              title="PDF"
              className="w-full border-0"
              style={{ height: subW.props.height || "280px" }}
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
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={subW.props.src} alt="" className="rounded-2xl w-full h-auto max-h-[300px] object-cover shadow-sm max-w-full" />
    )
  }

  if (subW.type === "heading") {
    return <h3 className="font-extrabold text-lg sm:text-xl text-foreground leading-tight">{subW.props.text}</h3>
  }

  if (subW.type === "paragraph") {
    return <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{subW.props.text}</p>
  }

  if (subW.type === "button") {
    return (
      <a href={subW.props.link || "#"} target="_blank" rel="noreferrer">
        <Button variant={subW.props.variant || "default"} size="sm" className="rounded-xl text-xs shadow-xs my-1 max-w-full truncate cursor-pointer font-bold">
          {subW.props.label || "Button"}
        </Button>
      </a>
    )
  }

  if (subW.type === "video") {
    return (
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/90 max-w-full shadow-sm">
        <iframe src={subW.props.url} title="Video" className="w-full h-full border-0" />
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
    const hasUrl = Boolean(widget.props.url)
    return (
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm space-y-3 p-5 my-4 w-full max-w-full">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <span className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
            <FileText className="size-4 text-rose-500 shrink-0" /> {widget.props.title || "PDF Document Viewer"}
          </span>
          {hasUrl && (
            <a href={widget.props.url} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline shrink-0">
              <Download className="size-3.5" /> Download PDF
            </a>
          )}
        </div>
        <div className="w-full overflow-hidden rounded-2xl bg-muted/40 border border-border/50">
          {hasUrl ? (
            <iframe
              src={widget.props.url}
              title={widget.props.title || "PDF Viewer"}
              className="w-full border-0"
              style={{ height: widget.props.height || "480px" }}
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
    return (
      <div className="py-2" style={{ textAlign: widget.props.align || "left" }}>
        <a href={widget.props.link || "#"} target="_blank" rel="noreferrer">
          <Button variant={widget.props.variant || "default"} size={widget.props.size || "lg"} className="rounded-2xl shadow-xs font-bold text-sm max-w-full truncate px-6 py-2.5">
            {widget.props.label || "Button"}
          </Button>
        </a>
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

// ── Main Unauthenticated Public Page Renderer Component ────────────────────────

export default function PublicLivePage() {
  const { slug } = useParams<{ slug: string }>()

  const [page, setPage] = React.useState<{ title: string; widgets: ElementorWidget[] } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!slug) return

    const fetchPublicPage = async () => {
      try {
        const res = await fetch(`/api/public/page?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()

        if (!res.ok || !data.found || !data.page) {
          throw new Error(data.error || "Page not found")
        }

        setPage({
          title: data.page.title,
          widgets: Array.isArray(data.page.widgets) ? data.page.widgets : [],
        })
      } catch (err: any) {
        setError(err.message || "Failed to load public page")
      } finally {
        setLoading(false)
      }
    }

    fetchPublicPage()
  }, [slug])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-3 p-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Loading public page...</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4 p-4 text-center">
        <AlertCircle className="size-12 text-rose-500" />
        <div>
          <h1 className="text-2xl font-black">Page Not Found</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {error || "The requested public page does not exist or has been unpublished."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col">
      {/* Shared site-wide Header */}
      <Header />

      {/* Main Public Page Content Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 space-y-4">
        {page.widgets.map((widget) => (
          <PublicWidgetRenderer key={widget.id} widget={widget} />
        ))}
      </main>

      {/* Shared site-wide Footer */}
      <Footer />
    </div>
  )
}
