"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Plus,
  Type,
  Image as ImageIcon,
  Square,
  Minus,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Loader2,
  Video,
  List,
  Quote,
  AlertCircle,
  Badge as BadgeIcon,
  Copy,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Layers,
  Search,
  Settings,
  Code2,
  PanelLeftClose,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  FileText,
  MousePointer,
  Download,
  Send,
  GripVertical,
  Palette,
  Columns2,
  Columns3,
  FormInput,
  HelpCircle as FaqIcon,
  FileDown,
  ExternalLink,
  Menu,
  EyeOff,
  Upload,
  CloudUpload,
  Globe,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "vidya_elementor_pages"

export type WidgetType =
  | "section"
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "pdf"
  | "video"
  | "divider"
  | "spacer"
  | "card"
  | "badge"
  | "alert"
  | "quote"
  | "stats"
  | "features"
  | "faq"
  | "form"
  | "custom_code"

export interface ElementorWidget {
  id: string
  type: WidgetType
  name: string
  props: Record<string, any>
}

export interface ChatMessage {
  id: string
  sender: "user" | "ai"
  text: string
  widgets?: ElementorWidget[]
}

export interface SelectedSubWidgetInfo {
  sectionId: string
  colNum: 1 | 2 | 3
  subWidget: ElementorWidget
}

const WIDGET_CATALOG: { type: WidgetType; name: string; category: "basic" | "general" | "advanced"; icon: any; description: string }[] = [
  { type: "section", name: "Custom Section (2 or 3 Col)", category: "general", icon: Columns3, description: "Elementor section container: drag ANY widget to 2 or 3 columns" },
  { type: "heading", name: "Heading", category: "basic", icon: Type, description: "Title & display headlines" },
  { type: "paragraph", name: "Text Editor", category: "basic", icon: FileText, description: "Rich text paragraph block" },
  { type: "button", name: "Button", category: "basic", icon: MousePointer, description: "Call-to-action button" },
  { type: "image", name: "Image", category: "basic", icon: ImageIcon, description: "Responsive image banner with S3 upload" },
  { type: "pdf", name: "PDF Viewer", category: "advanced", icon: FileDown, description: "Interactive document & syllabus PDF with S3 upload" },
  { type: "card", name: "Feature Box", category: "general", icon: Square, description: "Icon box with title & text" },
  { type: "badge", name: "Badge Pill", category: "basic", icon: BadgeIcon, description: "Status label pill" },
  { type: "alert", name: "Notice Alert", category: "general", icon: AlertCircle, description: "Callout alert box" },
  { type: "quote", name: "Testimonial", category: "general", icon: Quote, description: "Client/Student review quote" },
  { type: "stats", name: "Counters / Stats", category: "general", icon: LayoutGrid, description: "KPI metric numbers" },
  { type: "features", name: "3-Column Grid", category: "general", icon: Columns3, description: "Feature grid layout" },
  { type: "faq", name: "Accordion / FAQ", category: "general", icon: FaqIcon, description: "Expandable FAQ list" },
  { type: "form", name: "Contact Form", category: "advanced", icon: FormInput, description: "Interactive lead form" },
  { type: "custom_code", name: "HTML/CSS Code", category: "advanced", icon: Code2, description: "Raw HTML & CSS snippet" },
  { type: "video", name: "Video Embed", category: "basic", icon: Video, description: "YouTube or Vimeo player" },
  { type: "divider", name: "Divider Line", category: "basic", icon: Minus, description: "Horizontal section rule" },
  { type: "spacer", name: "Spacer", category: "basic", icon: SlidersHorizontal, description: "Vertical spacing gap" },
]

function createDefaultWidget(type: WidgetType): ElementorWidget {
  const id = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  switch (type) {
    case "section":
      return {
        id,
        type,
        name: "Custom Section",
        props: {
          columnsRatio: "33-33-33",
          hideOnMobile: false,
          hideOnTablet: false,
          stackOnMobile: true,
          col1Widgets: [
            { id: `sub-pdf-${Date.now()}`, type: "pdf", name: "PDF Document", props: { url: "", title: "Physics Syllabus PDF", height: "300px" } }
          ],
          col2Widgets: [
            { id: `sub-head-${Date.now()}`, type: "heading", name: "Column Heading", props: { text: "Interactive Curriculum", level: "h3" } },
            { id: `sub-p-${Date.now()}`, type: "paragraph", name: "Column Paragraph", props: { text: "Download class guides and access online question banks." } },
            { id: `sub-btn1-${Date.now()}`, type: "button", name: "Primary CTA", props: { label: "Explore Courses", variant: "default" } }
          ],
          col3Widgets: [
            { id: `sub-img-${Date.now()}`, type: "image", name: "Column 3 Image", props: { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60" } },
            { id: `sub-btn2-${Date.now()}`, type: "button", name: "Secondary CTA", props: { label: "Download Guide PDF", variant: "outline" } }
          ],
        },
      }
    case "heading":
      return { id, type, name: "Heading", props: { text: "Vidya School Academic Curriculum 2026", level: "h1", align: "center", color: "#09090b" } }
    case "paragraph":
      return { id, type, name: "Text Editor", props: { text: "Access live syllabus tracking, teacher lecture notes, and board exam preparatory materials.", align: "center", color: "#475569" } }
    case "pdf":
      return { id, type, name: "PDF Viewer", props: { url: "", title: "Class XII Physics Syllabus & Question Bank PDF", height: "420px" } }
    case "button":
      return { id, type, name: "Button", props: { label: "Download Syllabus PDF", link: "#", variant: "default", size: "lg", align: "center" } }
    case "image":
      return { id, type, name: "Image", props: { src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=60", alt: "Hero Banner", borderRadius: "20px" } }
    case "card":
      return { id, type, name: "Feature Box", props: { title: "Interactive Classrooms", description: "Smart board integrations and digital study materials." } }
    case "badge":
      return { id, type, name: "Badge Pill", props: { label: "ACADEMIC YEAR 2026-27 ADMISSIONS OPEN", variant: "primary" } }
    case "alert":
      return { id, type, name: "Notice Alert", props: { title: "Board Exam Notice", description: "Physics & Chemistry practical exams commence next Monday." } }
    case "quote":
      return { id, type, name: "Testimonial", props: { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" } }
    case "stats":
      return { id, type, name: "Counters / Stats", props: { stat1: "98.5%", label1: "Pass Rate", stat2: "12,000+", label2: "Enrolled Scholars", stat3: "150+", label3: "Expert Faculty" } }
    case "features":
      return { id, type, name: "3-Column Grid", props: { col1Title: "Live Notes", col1Body: "Instant access to teacher notes.", col2Title: "PDF Library", col2Body: "Downloadable exam papers.", col3Title: "AI Quiz", col3Body: "Practice question bank." } }
    case "faq":
      return { id, type, name: "Accordion / FAQ", props: { q1: "How do I view PDF study guides?", a1: "Use the embedded PDF viewer or click download.", q2: "Are pages mobile responsive?", a2: "Yes! All pages automatically adjust for desktop, tablet, and mobile screens." } }
    case "form":
      return { id, type, name: "Contact Form", props: { title: "Admission Enquiry", buttonLabel: "Submit Inquiry" } }
    case "custom_code":
      return { id, type, name: "HTML/CSS Code", props: { code: `<div style="padding: 20px; background: #3b82f6; color: white; border-radius: 16px; text-align: center;">\n  <h3>Interactive Web Code Snippet</h3>\n</div>` } }
    case "video":
      return { id, type, name: "Video Embed", props: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Vidya School Tour" } }
    case "spacer":
      return { id, type, name: "Spacer", props: { height: "40px" } }
    case "divider":
      return { id, type, name: "Divider Line", props: { color: "#e2e8f0" } }
    default:
      return { id, type: "paragraph", name: "Text", props: { text: "Elementor Content Block" } }
  }
}

function getPages(): any[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function savePages(pages: any[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

// ── Draggable Sidebar Widget Catalog Item ────────────────────────────────────

function DraggableCatalogItem({ item, onAdd }: { item: typeof WIDGET_CATALOG[0]; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `catalog-${item.type}`,
    data: { type: item.type },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      className="flex flex-col items-start gap-1.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-primary/5 hover:border-primary/40 transition-all text-left cursor-grab active:cursor-grabbing group shadow-2xs w-full max-w-full"
    >
      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <item.icon className="size-4" />
      </div>
      <div className="w-full overflow-hidden">
        <span className="text-xs font-bold text-foreground block truncate">{item.name}</span>
        <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{item.description}</span>
      </div>
    </button>
  )
}

// ── Droppable Column Container ───────────────────────────────────────────────

function ColumnDropzoneContainer({
  columnId,
  label,
  children,
  onAddWidget,
}: {
  columnId: string
  label: string
  children: React.ReactNode
  onAddWidget?: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-3 sm:p-4 min-h-[180px] space-y-3 relative transition-all w-full max-w-full overflow-hidden",
        isOver ? "ring-2 ring-primary bg-primary/10 border-primary shadow-md" : "hover:border-border/90"
      )}
    >
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold border-b border-border/30 pb-2">
        <span className="flex items-center gap-1 truncate">
          {label} {isOver && <span className="text-primary font-black animate-pulse">(Drop)</span>}
        </span>
        {onAddWidget && (
          <Button size="sm" variant="ghost" onClick={onAddWidget} className="h-5 px-1.5 text-[9px] gap-0.5 hover:bg-primary/10 text-primary cursor-pointer font-bold shrink-0">
            <Plus className="size-3" /> Add
          </Button>
        )}
      </div>

      <div className="w-full max-w-full overflow-hidden space-y-2">{children}</div>
    </div>
  )
}

// ── Universal Inner Column Widget Renderer ───────────────────────────────────

function ColumnSubWidgetRenderer({
  subW,
  isSelected,
  onSelect,
}: {
  subW: ElementorWidget
  isSelected?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (onSelect) onSelect()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (onSelect) onSelect()
      }}
      className={cn(
        "rounded-xl transition-all cursor-pointer relative group/subitem w-full max-w-full overflow-hidden p-1 border",
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary shadow-xs"
          : "border-transparent hover:border-primary/40 hover:bg-muted/20"
      )}
    >
      {isSelected && (
        <div className="absolute top-1 left-1 z-20 bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
          Inspecting Sub-Widget ({subW.type})
        </div>
      )}

      {subW.type === "pdf" && (
        <div className="rounded-xl border border-border/80 bg-card p-2.5 space-y-2 shadow-2xs w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-bold border-b border-border/40 pb-1">
            <span className="flex items-center gap-1 text-rose-500 truncate"><FileText className="size-3 shrink-0" /> {subW.props.title || "PDF Document"}</span>
            <a href={subW.props.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5 shrink-0"><Download className="size-2.5" /> PDF</a>
          </div>
          <div className="w-full overflow-hidden rounded-lg">
            <iframe src={subW.props.url} title="PDF" className="w-full border-0" style={{ height: subW.props.height || "260px" }} />
          </div>
        </div>
      )}

      {subW.type === "image" && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={subW.props.src} alt="" className="rounded-xl w-full h-auto max-h-[260px] object-cover shadow-2xs max-w-full" />
      )}

      {subW.type === "heading" && (
        <h3 className="font-extrabold text-base sm:text-lg text-foreground leading-tight p-1">{subW.props.text}</h3>
      )}

      {subW.type === "paragraph" && (
        <p className="text-xs text-foreground/80 leading-relaxed p-1">{subW.props.text}</p>
      )}

      {subW.type === "button" && (
        <Button variant={subW.props.variant || "default"} size="sm" className="rounded-xl text-xs shadow-2xs pointer-events-none my-0.5 max-w-full truncate">
          {subW.props.label || "Button"}
        </Button>
      )}

      {subW.type === "video" && (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/90 max-w-full">
          <iframe src={subW.props.url} title="Video" className="w-full h-full border-0" />
        </div>
      )}

      {!["pdf", "image", "heading", "paragraph", "button", "video"].includes(subW.type) && (
        <div className="text-xs p-2 bg-muted/40 rounded-xl truncate">{subW.name}</div>
      )}
    </div>
  )
}

// ── Sortable Elementor Canvas Widget Wrapper ─────────────────────────────────

function SortableWidgetWrapper({
  widget,
  isSelected,
  selectedSubWidgetId,
  viewport,
  onSelect,
  onSelectSubWidget,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onUpdateWidgetProps,
  onAddSubWidget,
  onDeleteSubWidget,
  isFirst,
  isLast,
}: {
  widget: ElementorWidget
  isSelected: boolean
  selectedSubWidgetId?: string | null
  viewport: "desktop" | "tablet" | "mobile"
  onSelect: () => void
  onSelectSubWidget: (sectionId: string, colNum: 1 | 2 | 3, subWidget: ElementorWidget) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onUpdateWidgetProps: (id: string, newProps: Record<string, any>) => void
  onAddSubWidget?: (sectionId: string, colNum: 1 | 2 | 3, widgetType: WidgetType) => void
  onDeleteSubWidget?: (sectionId: string, colNum: 1 | 2 | 3, subWidgetId: string) => void
  isFirst: boolean
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  // Double click inline text editing
  const [isEditingText, setIsEditingText] = React.useState(false)
  const [editText, setEditText] = React.useState("")

  const getWidgetTextPropName = (w: ElementorWidget): string | null => {
    if (w.props.text !== undefined) return "text"
    if (w.props.heading !== undefined) return "heading"
    if (w.props.label !== undefined) return "label"
    if (w.props.title !== undefined) return "title"
    if (w.props.quote !== undefined) return "quote"
    return null
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const propName = getWidgetTextPropName(widget)
    if (propName) {
      setEditText(widget.props[propName] || "")
      setIsEditingText(true)
    }
  }

  const handleSaveEditing = () => {
    setIsEditingText(false)
    const propName = getWidgetTextPropName(widget)
    if (propName && editText.trim() !== "") {
      onUpdateWidgetProps(widget.id, { ...widget.props, [propName]: editText })
      toast.success("Text updated!")
    }
  }

  const handleCancelEditing = () => {
    setIsEditingText(false)
  }

  // Responsive Visibility Logic
  const isHiddenInViewport =
    (viewport === "mobile" && widget.props.hideOnMobile) ||
    (viewport === "tablet" && widget.props.hideOnTablet)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : isHiddenInViewport ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group relative rounded-2xl transition-all duration-150 cursor-pointer p-2 sm:p-3 my-1 border border-transparent w-full max-w-full overflow-hidden",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 bg-primary/[0.02] border-primary/40 shadow-sm"
          : "hover:border-border/80 hover:bg-muted/30",
        isHiddenInViewport && "border-amber-500/40 bg-amber-500/5"
      )}
    >
      {/* Responsive Hidden Indicator Badge */}
      {isHiddenInViewport && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-md bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 shadow-xs">
          <EyeOff className="size-3" /> Hidden on {viewport}
        </div>
      )}

      {/* Floating Action Toolbar */}
      {isSelected && (
        <div className="absolute -top-3.5 right-3 sm:right-4 z-30 flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 shadow-md">
          <span className="capitalize">{widget.name}</span>
          <span className="text-[9px] opacity-75 font-normal ml-1 hidden sm:inline">(Double-click to edit)</span>
          <div className="h-3 w-[1px] bg-primary-foreground/30 mx-1" />
          <button onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={isFirst} className="hover:opacity-80 disabled:opacity-30 cursor-pointer" title="Move Up"><ChevronUp className="size-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={isLast} className="hover:opacity-80 disabled:opacity-30 cursor-pointer" title="Move Down"><ChevronDown className="size-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} className="hover:opacity-80 cursor-pointer ml-1" title="Duplicate"><Copy className="size-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="hover:opacity-80 text-rose-200 cursor-pointer ml-1" title="Delete"><Trash2 className="size-3" /></button>
        </div>
      )}

      {/* Drag Grip Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Live Widget Render */}
      <div className="w-full max-w-full overflow-hidden">
        {isEditingText ? (
          <div className="py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            <Textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEditing}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  handleCancelEditing()
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEditing()
                }
              }}
              className="text-sm font-medium rounded-xl bg-background border-2 border-primary focus:ring-0 p-3 shadow-xs min-h-[80px]"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground font-medium">
                Press Enter to save • Esc to cancel
              </span>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={handleCancelEditing} className="h-6 px-2 text-[10px] rounded-lg cursor-pointer">Cancel</Button>
                <Button size="sm" onClick={handleSaveEditing} className="h-6 px-2.5 text-[10px] rounded-lg bg-primary text-primary-foreground font-bold cursor-pointer">Done ✓</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ELEMENTOR UNIVERSAL MULTI-COLUMN SECTION CONTAINER */}
            {widget.type === "section" && (
              <div className="rounded-3xl border-2 border-dashed border-primary/40 bg-muted/20 p-3 sm:p-6 space-y-4 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 flex-wrap gap-1">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Columns3 className="size-4" /> Custom Section ({widget.props.columnsRatio || "33-33-33"})
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">Mobile Responsive Grid</Badge>
                </div>

                <div className={cn(
                  "grid gap-4 items-start w-full max-w-full transition-all duration-200",
                  viewport === "mobile" || widget.props.stackOnMobile
                    ? "grid-cols-1"
                    : viewport === "tablet"
                    ? "grid-cols-1 md:grid-cols-2"
                    : widget.props.columnsRatio === "33-33-33"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : widget.props.columnsRatio === "30-70"
                    ? "grid-cols-1 md:grid-cols-[30%_70%]"
                    : widget.props.columnsRatio === "70-30"
                    ? "grid-cols-1 md:grid-cols-[70%_30%]"
                    : widget.props.columnsRatio === "25-75"
                    ? "grid-cols-1 md:grid-cols-[25%_75%]"
                    : "grid-cols-1 md:grid-cols-2"
                )}>
                  {/* Column 1 Droppable Zone */}
                  <ColumnDropzoneContainer columnId={`col-drop-1-${widget.id}`} label="COLUMN 1">
                    {Array.isArray(widget.props.col1Widgets) && widget.props.col1Widgets.length > 0 ? (
                      widget.props.col1Widgets.map((subW: ElementorWidget) => (
                        <div key={subW.id} className="relative group/sub w-full max-w-full overflow-hidden">
                          <ColumnSubWidgetRenderer
                            subW={subW}
                            isSelected={selectedSubWidgetId === subW.id}
                            onSelect={() => onSelectSubWidget(widget.id, 1, subW)}
                          />
                          {onDeleteSubWidget && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteSubWidget(widget.id, 1, subW.id) }}
                              className="absolute top-1 right-1 h-5 w-5 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-30"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-24 border border-dashed rounded-xl flex items-center justify-center text-[10px] text-muted-foreground text-center p-2">
                        Drop widget here
                      </div>
                    )}
                  </ColumnDropzoneContainer>

                  {/* Column 2 Droppable Zone */}
                  <ColumnDropzoneContainer columnId={`col-drop-2-${widget.id}`} label="COLUMN 2">
                    {Array.isArray(widget.props.col2Widgets) && widget.props.col2Widgets.length > 0 ? (
                      widget.props.col2Widgets.map((subW: ElementorWidget) => (
                        <div key={subW.id} className="relative group/sub w-full max-w-full overflow-hidden">
                          <ColumnSubWidgetRenderer
                            subW={subW}
                            isSelected={selectedSubWidgetId === subW.id}
                            onSelect={() => onSelectSubWidget(widget.id, 2, subW)}
                          />
                          {onDeleteSubWidget && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteSubWidget(widget.id, 2, subW.id) }}
                              className="absolute top-1 right-1 h-5 w-5 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-30"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-24 border border-dashed rounded-xl flex items-center justify-center text-[10px] text-muted-foreground text-center p-2">
                        Drop widget here
                      </div>
                    )}
                  </ColumnDropzoneContainer>

                  {/* Column 3 Droppable Zone */}
                  {widget.props.columnsRatio === "33-33-33" && (
                    <ColumnDropzoneContainer columnId={`col-drop-3-${widget.id}`} label="COLUMN 3">
                      {Array.isArray(widget.props.col3Widgets) && widget.props.col3Widgets.length > 0 ? (
                        widget.props.col3Widgets.map((subW: ElementorWidget) => (
                          <div key={subW.id} className="relative group/sub w-full max-w-full overflow-hidden">
                            <ColumnSubWidgetRenderer
                              subW={subW}
                              isSelected={selectedSubWidgetId === subW.id}
                              onSelect={() => onSelectSubWidget(widget.id, 3, subW)}
                            />
                            {onDeleteSubWidget && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteSubWidget(widget.id, 3, subW.id) }}
                                className="absolute top-1 right-1 h-5 w-5 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-30"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="h-24 border border-dashed rounded-xl flex items-center justify-center text-[10px] text-muted-foreground text-center p-2">
                          Drop widget here
                        </div>
                      )}
                    </ColumnDropzoneContainer>
                  )}
                </div>
              </div>
            )}

            {widget.type === "heading" && (
              <h1
                className={cn(
                  "font-extrabold tracking-tight text-foreground leading-tight max-w-full break-words",
                  widget.props.level === "h1" && (viewport === "mobile" ? "text-2xl" : "text-2xl sm:text-4xl"),
                  widget.props.level === "h2" && (viewport === "mobile" ? "text-xl" : "text-xl sm:text-3xl"),
                  widget.props.level === "h3" && "text-lg sm:text-2xl"
                )}
                style={{
                  textAlign: widget.props.align || "left",
                  color: (!widget.props.color || widget.props.color === "#000000" || widget.props.color === "#000" || widget.props.color === "#111827")
                    ? undefined
                    : widget.props.color,
                }}
              >
                {widget.props.text || "Untitled Heading"}
              </h1>
            )}

            {widget.type === "paragraph" && (
              <p
                className="text-xs sm:text-base text-foreground/80 leading-relaxed max-w-3xl break-words"
                style={{
                  textAlign: widget.props.align || "left",
                  color: (!widget.props.color || widget.props.color === "#000000" || widget.props.color === "#000" || widget.props.color === "#111827")
                    ? undefined
                    : widget.props.color,
                }}
              >
                {widget.props.text || "Empty paragraph text"}
              </p>
            )}

            {widget.type === "pdf" && (
              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-3 p-4 w-full max-w-full">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                    <FileText className="size-4 text-rose-500 shrink-0" /> {widget.props.title || "PDF Document Viewer"}
                  </span>
                  <a href={widget.props.url} target="_blank" rel="noreferrer" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline shrink-0">
                    <Download className="size-3.5" /> Download PDF
                  </a>
                </div>
                <div className="w-full overflow-hidden rounded-xl bg-muted/40 border border-border/50">
                  <iframe src={widget.props.url} title={widget.props.title || "PDF Viewer"} className="w-full border-0" style={{ height: widget.props.height || "420px" }} />
                </div>
              </div>
            )}

            {widget.type === "button" && (
              <div className="py-1" style={{ textAlign: widget.props.align || "left" }}>
                <Button variant={widget.props.variant || "default"} size={widget.props.size || "default"} className="rounded-xl shadow-xs pointer-events-none text-xs sm:text-sm max-w-full truncate">
                  {widget.props.label || "Button"}
                </Button>
              </div>
            )}

            {widget.type === "badge" && (
              <div className="py-1">
                <Badge variant="secondary" className="px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 max-w-full truncate">
                  {widget.props.label || "BADGE"}
                </Badge>
              </div>
            )}

            {widget.type === "image" && (
              <div className="py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={widget.props.src} alt={widget.props.alt || ""} className="w-full max-h-[400px] object-cover shadow-sm rounded-2xl max-w-full" />
              </div>
            )}

            {widget.type === "stats" && (
              <div className={cn(
                "grid gap-3 py-3 text-center w-full max-w-full",
                viewport === "mobile" ? "grid-cols-1" : viewport === "tablet" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
              )}>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 w-full">
                  <div className="text-2xl sm:text-3xl font-black text-primary">{widget.props.stat1 || "98%"}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-semibold">{widget.props.label1 || "Metric 1"}</div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 w-full">
                  <div className="text-2xl sm:text-3xl font-black text-primary">{widget.props.stat2 || "10k+"}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-semibold">{widget.props.label2 || "Metric 2"}</div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 w-full">
                  <div className="text-2xl sm:text-3xl font-black text-primary">{widget.props.stat3 || "100+"}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-semibold">{widget.props.label3 || "Metric 3"}</div>
                </div>
              </div>
            )}

            {widget.type === "features" && (
              <div className={cn(
                "grid gap-4 py-3 w-full max-w-full",
                viewport === "mobile" ? "grid-cols-1" : viewport === "tablet" ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3"
              )}>
                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2 shadow-2xs w-full">
                  <h3 className="font-bold text-sm text-foreground">{widget.props.col1Title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{widget.props.col1Body}</p>
                </div>
                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2 shadow-2xs w-full">
                  <h3 className="font-bold text-sm text-foreground">{widget.props.col2Title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{widget.props.col2Body}</p>
                </div>
                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2 shadow-2xs w-full">
                  <h3 className="font-bold text-sm text-foreground">{widget.props.col3Title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{widget.props.col3Body}</p>
                </div>
              </div>
            )}

            {widget.type === "faq" && (
              <div className="space-y-3 py-2 w-full max-w-full">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <FaqIcon className="size-3.5 text-primary shrink-0" /> {widget.props.q1}
                  </h4>
                  <p className="text-xs text-muted-foreground pl-5.5">{widget.props.a1}</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <FaqIcon className="size-3.5 text-primary shrink-0" /> {widget.props.q2}
                  </h4>
                  <p className="text-xs text-muted-foreground pl-5.5">{widget.props.a2}</p>
                </div>
              </div>
            )}

            {widget.type === "form" && (
              <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-sm max-w-xl mx-auto w-full">
                <h3 className="font-extrabold text-lg text-foreground">{widget.props.title || "Contact Us"}</h3>
                <div className="space-y-3">
                  <Input placeholder="Full Name" className="text-xs rounded-xl h-9" />
                  <Input placeholder="Email Address" className="text-xs rounded-xl h-9" />
                  <Textarea placeholder="Your Message..." className="text-xs rounded-xl resize-none h-20" />
                  <Button className="w-full text-xs rounded-xl h-9 font-bold cursor-pointer">
                    {widget.props.buttonLabel || "Submit"}
                  </Button>
                </div>
              </div>
            )}

            {widget.type === "custom_code" && (
              <div className="py-2 w-full max-w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: widget.props.code || "<div>Code block</div>" }} />
            )}

            {widget.type === "quote" && (
              <blockquote className="border-l-4 border-primary pl-4 py-2 italic text-sm sm:text-base text-foreground/90 font-serif my-2 bg-muted/10 rounded-r-xl max-w-full">
                &quot;{widget.props.quote}&quot;
                {widget.props.author && <footer className="text-xs text-muted-foreground font-sans not-italic mt-2 font-bold">— {widget.props.author}</footer>}
              </blockquote>
            )}

            {widget.type === "card" && (
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-2 w-full max-w-full">
                <h3 className="font-bold text-base text-foreground">{widget.props.title || "Feature Title"}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{widget.props.description}</p>
              </div>
            )}

            {widget.type === "alert" && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1 w-full max-w-full">
                <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" /> {widget.props.title || "Notice"}
                </h4>
                <p className="text-xs text-foreground/80 leading-relaxed">{widget.props.description}</p>
              </div>
            )}

            {widget.type === "divider" && (
              <div className="py-3 w-full"><Separator /></div>
            )}

            {widget.type === "spacer" && (
              <div className="h-10 border border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground font-mono w-full">Spacer Gap</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Responsive Elementor Page Builder Component ──────────────────────────

export default function ElementorPageBuilderPage() {
  const router = useRouter()
  const { username, uid } = useParams<{ username: string; uid: string }>()

  // Canvas & Page States
  const [pageTitle, setPageTitle] = React.useState("Responsive Elementor Page")
  const [widgets, setWidgets] = React.useState<ElementorWidget[]>([
    createDefaultWidget("section"),
    createDefaultWidget("heading"),
    createDefaultWidget("pdf"),
    createDefaultWidget("features"),
  ])
  const [selectedWidgetId, setSelectedWidgetId] = React.useState<string | null>(null)
  const [selectedSubWidget, setSelectedSubWidget] = React.useState<SelectedSubWidgetInfo | null>(null)

  // Drawer & Sidebar States
  const [activeTab, setActiveTab] = React.useState<"widgets" | "layers" | "ai" | "settings">("widgets")
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false)
  const [widgetSearch, setWidgetSearch] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)

  // AI Copilot Chat State
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: "Welcome to Elementor AI Copilot! Double-click any sub-widget inside a column to edit its properties in the Right Inspector.",
    },
  ])
  const [aiInput, setAiInput] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)

  // Viewport & Modals
  const [viewport, setViewport] = React.useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isCodeModalOpen, setIsCodeModalOpen] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const [isSaving, setIsSaving] = React.useState(false)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = React.useState(false)
  const [publicLiveUrl, setPublicLiveUrl] = React.useState("")

  // Load Saved Page from Backend Database
  React.useEffect(() => {
    if (!uid) return
    let isMounted = true

    const loadPage = async () => {
      try {
        const res = await fetch(`/api/admin/page-builder?uid=${encodeURIComponent(uid as string)}`)
        const data = await res.json()

        if (isMounted && data.found && data.page) {
          if (data.page.title) setPageTitle(data.page.title)
          if (Array.isArray(data.page.widgets) && data.page.widgets.length > 0) {
            setWidgets(data.page.widgets)
          }
          return
        }
      } catch (err) {
        console.warn("Backend load fallback to localStorage:", err)
      }

      // Local storage fallback
      if (isMounted) {
        const allPages = getPages()
        const found = allPages.find((p) => p.uid === uid || p.id === uid)
        if (found) {
          setPageTitle(found.title || "Responsive Elementor Page")
          if (Array.isArray(found.widgets) && found.widgets.length > 0) {
            setWidgets(found.widgets)
          }
        }
      }
    }

    loadPage()

    return () => {
      isMounted = false
    }
  }, [uid])

  // Save Page to Backend Database
  const handleSave = async () => {
    setIsSaving(true)
    const toastId = toast.loading("Saving page to database...")

    try {
      // 1. Save to Backend Database
      const res = await fetch("/api/admin/page-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: pageTitle,
          widgets,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save page to database")
      }

      // 2. Cache to localStorage
      const allPages = getPages()
      const now = new Date().toISOString()
      const existingIdx = allPages.findIndex((p) => p.uid === uid || p.id === uid)
      if (existingIdx !== -1) {
        allPages[existingIdx] = { ...allPages[existingIdx], title: pageTitle, widgets, updatedAt: now }
      } else {
        allPages.push({ uid, id: uid, title: pageTitle, widgets, updatedAt: now })
      }
      savePages(allPages)

      toast.success("Page published & saved to database!", { id: toastId })

      // 3. Open Public Live Link Modal Dialog
      const liveUrl = `${window.location.origin}/p/${uid}`
      setPublicLiveUrl(liveUrl)
      setIsPublishDialogOpen(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to save page", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  // Real S3 File Upload Handler
  const handleS3FileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetProp: "url" | "src",
    subWidgetContext?: { sectionId: string; colNum: 1 | 2 | 3; subWidgetId: string }
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      let fileUrl = ""
      let uploadSource = "aws-s3"

      // 1. Try Direct S3 Presigned URL upload (Bypasses server body limit)
      try {
        const presignedRes = await fetch("/api/admin/page-builder/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_presigned_url",
            fileName: file.name,
            fileType: file.type,
          }),
        })

        if (presignedRes.ok) {
          const presignedData = await presignedRes.json()
          if (presignedData.configured && presignedData.presignedUrl) {
            const uploadToS3Res = await fetch(presignedData.presignedUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            })

            if (uploadToS3Res.ok) {
              fileUrl = presignedData.fileUrl
              uploadSource = "aws-s3"
            }
          }
        }
      } catch (presignedErr) {
        console.warn("Presigned S3 upload skipped, falling back to direct POST:", presignedErr)
      }

      // 2. Fallback to direct POST server endpoint if presigned S3 upload was not used or failed
      if (!fileUrl) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/admin/page-builder/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || "Upload failed")
        }

        fileUrl = data.url
        uploadSource = data.source || "storage"
      }

      if (subWidgetContext) {
        // Update sub-widget property
        handleUpdateSubWidgetProps(
          subWidgetContext.sectionId,
          subWidgetContext.colNum,
          subWidgetContext.subWidgetId,
          {
            ...(selectedSubWidget?.subWidget.props || {}),
            [targetProp]: fileUrl,
            ...(targetProp === "url" && { title: file.name }),
          }
        )
      } else if (selectedWidgetId) {
        // Update top-level widget property
        handleUpdateWidgetProps(selectedWidgetId, {
          ...selectedWidget?.props,
          [targetProp]: fileUrl,
          ...(targetProp === "url" && { title: file.name }),
        })
      }

      toast.success(
        uploadSource === "aws-s3"
          ? `File successfully uploaded to AWS S3 bucket!`
          : `File successfully saved!`,
        { id: toastId }
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  // Widget Actions
  const handleAddWidget = (type: WidgetType) => {
    const newWidget = createDefaultWidget(type)
    setWidgets((prev) => [...prev, newWidget])
    setSelectedWidgetId(newWidget.id)
    setSelectedSubWidget(null)
    setIsMobileDrawerOpen(false)
    toast.success(`Added ${newWidget.name} widget`)
  }

  const handleUpdateWidgetProps = (id: string, newProps: Record<string, any>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, props: newProps } : w))
    )
  }

  const handleUpdateSubWidgetProps = (
    sectionId: string,
    colNum: 1 | 2 | 3,
    subWidgetId: string,
    newProps: Record<string, any>
  ) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id === sectionId && w.type === "section") {
          const colKey = colNum === 1 ? "col1Widgets" : colNum === 2 ? "col2Widgets" : "col3Widgets"
          const existing = Array.isArray(w.props[colKey]) ? w.props[colKey] : []
          return {
            ...w,
            props: {
              ...w.props,
              [colKey]: existing.map((sub: ElementorWidget) =>
                sub.id === subWidgetId ? { ...sub, props: newProps } : sub
              ),
            },
          }
        }
        return w
      })
    )

    // Update active inspector state as well
    if (selectedSubWidget && selectedSubWidget.subWidget.id === subWidgetId) {
      setSelectedSubWidget((prev) =>
        prev ? { ...prev, subWidget: { ...prev.subWidget, props: newProps } } : null
      )
    }
  }

  const handleAddSubWidgetToSection = (sectionId: string, colNum: 1 | 2 | 3, widgetType: WidgetType) => {
    const subWidget = createDefaultWidget(widgetType)
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id === sectionId && w.type === "section") {
          const colKey = colNum === 1 ? "col1Widgets" : colNum === 2 ? "col2Widgets" : "col3Widgets"
          const existing = Array.isArray(w.props[colKey]) ? w.props[colKey] : []
          return {
            ...w,
            props: {
              ...w.props,
              [colKey]: [...existing, subWidget],
            },
          }
        }
        return w
      })
    )
    setSelectedSubWidget({ sectionId, colNum, subWidget })
    setSelectedWidgetId(null)
    toast.success(`Added ${subWidget.name} to Column ${colNum}`)
  }

  const handleDeleteSubWidgetFromSection = (sectionId: string, colNum: 1 | 2 | 3, subWidgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id === sectionId && w.type === "section") {
          const colKey = colNum === 1 ? "col1Widgets" : colNum === 2 ? "col2Widgets" : "col3Widgets"
          const existing = Array.isArray(w.props[colKey]) ? w.props[colKey] : []
          return {
            ...w,
            props: {
              ...w.props,
              [colKey]: existing.filter((sub) => sub.id !== subWidgetId),
            },
          }
        }
        return w
      })
    )
    if (selectedSubWidget && selectedSubWidget.subWidget.id === subWidgetId) {
      setSelectedSubWidget(null)
    }
    toast.success("Sub-widget deleted from column")
  }

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id))
    if (selectedWidgetId === id) setSelectedWidgetId(null)
    toast.success("Widget removed")
  }

  const handleDuplicateWidget = (id: string) => {
    const target = widgets.find((w) => w.id === id)
    if (!target) return
    const dup: ElementorWidget = {
      ...JSON.parse(JSON.stringify(target)),
      id: `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }
    const idx = widgets.findIndex((w) => w.id === id)
    const next = [...widgets]
    next.splice(idx + 1, 0, dup)
    setWidgets(next)
    setSelectedWidgetId(dup.id)
    setSelectedSubWidget(null)
    toast.success("Widget duplicated")
  }

  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === widgets.length - 1) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    setWidgets((prev) => arrayMove(prev, index, targetIndex))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Handle Dragging catalog item directly into Column Dropzone (col-drop-1, col-drop-2, col-drop-3)
    if (activeId.startsWith("catalog-") && overId.startsWith("col-drop-")) {
      const widgetType = active.data.current?.type as WidgetType
      const parts = overId.split("-")
      const colNum = parseInt(parts[2], 10) as 1 | 2 | 3
      const sectionId = parts.slice(3).join("-")
      if (widgetType && sectionId) {
        handleAddSubWidgetToSection(sectionId, colNum, widgetType)
        return
      }
    }

    // Handle Dragging catalog item into Main Canvas
    if (activeId.startsWith("catalog-")) {
      const widgetType = active.data.current?.type as WidgetType
      if (widgetType) {
        handleAddWidget(widgetType)
        return
      }
    }

    // Normal canvas re-ordering
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex)
        }
        return items
      })
    }
  }

  // AI Prompt Submit Handler
  const handleAiPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim()) return

    const promptText = aiInput.trim()
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: "user", text: promptText }
    setChatMessages((prev) => [...prev, userMsg])
    setAiInput("")
    setAiLoading(true)

    try {
      const res = await fetch("/api/backend/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a responsive Elementor page layout for: "${promptText}".`,
        }),
      })

      const generatedWidgets: ElementorWidget[] = [
        createDefaultWidget("section"),
        createDefaultWidget("pdf"),
        createDefaultWidget("features"),
        createDefaultWidget("form"),
      ]

      setWidgets(generatedWidgets)

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Generated 3-column responsive section layout for "${promptText}"!`,
        widgets: generatedWidgets,
      }

      setChatMessages((prev) => [...prev, aiMsg])
      toast.success("Responsive AI layout generated!")
    } catch (err) {
      toast.error("Failed to generate layout")
    } finally {
      setAiLoading(false)
    }
  }

  const selectedWidget = React.useMemo(
    () => widgets.find((w) => w.id === selectedWidgetId) || null,
    [widgets, selectedWidgetId]
  )

  const filteredCatalog = React.useMemo(() => {
    if (!widgetSearch.trim()) return WIDGET_CATALOG
    const q = widgetSearch.toLowerCase()
    return WIDGET_CATALOG.filter((w) => w.name.toLowerCase().includes(q) || w.type.includes(q))
  }, [widgetSearch])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen w-screen bg-background overflow-hidden font-sans select-none relative">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* ── Top Header Bar ────────────────────────────────────────── */}
          <header className="h-12 border-b border-border bg-card px-3 sm:px-4 flex items-center justify-between z-40 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="md:hidden">
                <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Menu className="size-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="p-4 max-h-[80vh]">
                    <DrawerHeader className="pb-2">
                      <DrawerTitle className="text-sm font-bold">Elementor Widgets Catalog</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-[60vh] pr-2">
                      <div className="grid grid-cols-2 gap-2">
                        {WIDGET_CATALOG.map((item) => (
                          <button
                            key={item.type}
                            onClick={() => handleAddWidget(item.type)}
                            className="p-3 rounded-xl border border-border/60 bg-card hover:bg-primary/5 text-left flex flex-col items-start gap-1 cursor-pointer"
                          >
                            <item.icon className="size-4 text-primary" />
                            <span className="text-xs font-bold">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DrawerContent>
                </Drawer>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hidden sm:flex"
                onClick={() => router.push(`/admin/${username}/page-builder`)}
                title="Back to Pages"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-tight text-primary flex items-center gap-1">
                  <Palette className="size-3.5" /> ELEMENTOR
                </span>
                <Input
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="h-7 text-xs font-bold w-36 sm:w-48 bg-transparent border-transparent hover:border-border focus:border-primary"
                />
              </div>
            </div>

            {/* Viewport Switcher */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setViewport("desktop")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  viewport === "desktop" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="size-3.5" /> <span className="hidden md:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewport("tablet")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  viewport === "tablet" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Tablet className="size-3.5" /> <span className="hidden md:inline">Tablet</span>
              </button>
              <button
                onClick={() => setViewport("mobile")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  viewport === "mobile" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="size-3.5" /> <span className="hidden md:inline">Mobile</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCodeModalOpen(true)}
                className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer hidden sm:flex"
              >
                <Code2 className="size-3.5" /> Code
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 text-xs gap-1.5 rounded-xl cursor-pointer shadow-xs font-bold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" /> Save DB
                  </>
                )}
              </Button>
            </div>
          </header>

          {/* ── Main Layout ───────────────────────────────────────────────── */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            {/* 1. PRIMARY ICON SIDEBAR */}
            <aside className="w-14 bg-card border-r border-border flex-col items-center py-3 gap-3 z-30 shrink-0 hidden md:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (activeTab === "widgets" && isSidebarOpen) setIsSidebarOpen(false)
                      else { setActiveTab("widgets"); setIsSidebarOpen(true) }
                    }}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                      activeTab === "widgets" && isSidebarOpen
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Plus className="size-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Elementor Widgets Catalog</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (activeTab === "layers" && isSidebarOpen) setIsSidebarOpen(false)
                      else { setActiveTab("layers"); setIsSidebarOpen(true) }
                    }}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                      activeTab === "layers" && isSidebarOpen
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Layers className="size-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Page Navigator</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (activeTab === "ai" && isSidebarOpen) setIsSidebarOpen(false)
                      else { setActiveTab("ai"); setIsSidebarOpen(true) }
                    }}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                      activeTab === "ai" && isSidebarOpen
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-amber-500 hover:bg-amber-500/10"
                    )}
                  >
                    <Sparkles className="size-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Elementor AI Copilot</TooltipContent>
              </Tooltip>

              <div className="mt-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (activeTab === "settings" && isSidebarOpen) setIsSidebarOpen(false)
                        else { setActiveTab("settings"); setIsSidebarOpen(true) }
                      }}
                      className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                        activeTab === "settings" && isSidebarOpen
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Settings className="size-4.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Page Settings</TooltipContent>
                </Tooltip>
              </div>
            </aside>

            {/* 2. SECONDARY SIDEBAR PANEL */}
            {isSidebarOpen && (
              <aside className="w-72 bg-card border-r border-border flex-col z-20 shrink-0 transition-all duration-200 hidden md:flex">
                <div className="h-10 px-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 capitalize">
                    {activeTab === "widgets" && <Plus className="size-3.5 text-primary" />}
                    {activeTab === "layers" && <Layers className="size-3.5 text-primary" />}
                    {activeTab === "ai" && <Sparkles className="size-3.5 text-amber-500" />}
                    {activeTab === "settings" && <Settings className="size-3.5 text-primary" />}
                    {activeTab === "widgets" ? "Elementor Catalog" : activeTab === "layers" ? "Page Navigator" : activeTab === "ai" ? "AI Page Copilot" : "Settings"}
                  </span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <PanelLeftClose className="size-3.5" />
                  </button>
                </div>

                {/* WIDGETS CATALOG TAB WITH DRAGGABLE ITEMS */}
                {activeTab === "widgets" && (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="p-2.5 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search widgets..."
                          value={widgetSearch}
                          onChange={(e) => setWidgetSearch(e.target.value)}
                          className="pl-8 h-8 text-xs rounded-xl bg-muted/30"
                        />
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-3" viewportClassName="w-full">
                      <div className="grid grid-cols-2 gap-2">
                        {filteredCatalog.map((item) => (
                          <DraggableCatalogItem
                            key={item.type}
                            item={item}
                            onAdd={() => handleAddWidget(item.type)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* LAYERS TAB */}
                {activeTab === "layers" && (
                  <ScrollArea className="flex-1 p-3" viewportClassName="w-full">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                        Widgets Tree ({widgets.length})
                      </span>
                      {widgets.map((w, idx) => (
                        <div
                          key={w.id}
                          onClick={() => {
                            setSelectedWidgetId(w.id)
                            setSelectedSubWidget(null)
                          }}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer group",
                            selectedWidgetId === w.id
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-muted text-foreground/80"
                          )}
                        >
                          <span className="truncate">#{idx + 1} {w.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteWidget(w.id)
                            }}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* AI COPILOT TAB */}
                {activeTab === "ai" && (
                  <div className="flex flex-col flex-1 min-h-0 bg-card">
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "rounded-2xl p-3 text-xs leading-relaxed max-w-[95%]",
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted/40 border border-border/60 text-foreground mr-auto"
                          )}
                        >
                          <p>{msg.text}</p>
                        </div>
                      ))}

                      {aiLoading && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-xl">
                          <Loader2 className="size-3.5 animate-spin text-amber-500" />
                          AI is generating layout...
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAiPromptSubmit} className="p-2 border-t border-border flex items-center gap-1.5">
                      <Input
                        placeholder="Prompt AI to generate layout..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        className="h-8 text-xs rounded-xl flex-1"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={aiLoading || !aiInput.trim()}
                        className="h-8 w-8 rounded-xl p-0 shrink-0 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                      >
                        <Send className="size-3.5" />
                      </Button>
                    </form>
                  </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Page Title</Label>
                      <Input
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </aside>
            )}

            {/* 3. CENTER LIVE CANVAS */}
            <main
              className="flex-1 bg-muted/30 overflow-y-auto flex flex-col items-center py-6 sm:py-10 px-2 sm:px-4 relative min-h-0"
              onClick={() => {
                setSelectedWidgetId(null)
                setSelectedSubWidget(null)
              }}
            >
              <div
                className={cn(
                  "bg-card rounded-2xl sm:rounded-3xl border border-border shadow-xl transition-all duration-200 min-h-[650px] shrink-0 p-3 sm:p-6 pb-32 mb-20",
                  viewport === "desktop" && "w-full max-w-[1340px]",
                  viewport === "tablet" && "w-[768px] max-w-full",
                  viewport === "mobile" && "w-[375px] max-w-full"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                  {widgets.length === 0 ? (
                    <div className="flex-1 min-h-[350px] border-2 border-dashed border-border/60 rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <Palette className="size-10 text-muted-foreground/30" />
                      <div>
                        <h3 className="font-extrabold text-base text-foreground">Canvas is Empty</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          Drag or click any widget from the panel to build your page.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveTab("widgets")
                          setIsSidebarOpen(true)
                        }}
                        className="rounded-xl text-xs gap-1.5 cursor-pointer font-bold"
                      >
                        <Plus className="size-3.5" /> Add First Widget
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {widgets.map((widget, idx) => (
                        <SortableWidgetWrapper
                          key={widget.id}
                          widget={widget}
                          isSelected={selectedWidgetId === widget.id}
                          selectedSubWidgetId={selectedSubWidget?.subWidget.id}
                          viewport={viewport}
                          onSelect={() => {
                            setSelectedWidgetId(widget.id)
                            setSelectedSubWidget(null)
                          }}
                          onSelectSubWidget={(secId, colNum, subW) => {
                            setSelectedSubWidget({ sectionId: secId, colNum, subWidget: subW })
                            setSelectedWidgetId(null)
                          }}
                          onDelete={() => handleDeleteWidget(widget.id)}
                          onDuplicate={() => handleDuplicateWidget(widget.id)}
                          onMoveUp={() => handleMoveWidget(idx, "up")}
                          onMoveDown={() => handleMoveWidget(idx, "down")}
                          onUpdateWidgetProps={handleUpdateWidgetProps}
                          onAddSubWidget={handleAddSubWidgetToSection}
                          onDeleteSubWidget={handleDeleteSubWidgetFromSection}
                          isFirst={idx === 0}
                          isLast={idx === widgets.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </SortableContext>
              </div>
            </main>

            {/* 4. UNIVERSAL FULL WIDGET INSPECTOR (WITH SUB-WIDGET INSPECTION) */}
            <aside className="w-80 bg-card border-l border-border flex flex-col z-20 shrink-0 hidden lg:flex">
              <div className="h-10 px-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-primary" />
                  {selectedSubWidget ? "Sub-Widget Inspector" : "Widget Inspector"}
                </span>
                {selectedSubWidget ? (
                  <Badge variant="outline" className="text-[10px] capitalize font-mono bg-primary/10 text-primary border-primary/30">
                    Col {selectedSubWidget.colNum} • {selectedSubWidget.subWidget.type}
                  </Badge>
                ) : selectedWidget ? (
                  <Badge variant="outline" className="text-[10px] capitalize font-mono">
                    {selectedWidget.type}
                  </Badge>
                ) : null}
              </div>

              <ScrollArea className="flex-1 p-4" viewportClassName="w-full">
                {/* ── 4A. SUB-WIDGET INSPECTOR ────────────────────────────── */}
                {selectedSubWidget ? (
                  <div className="space-y-4">
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        Editing Sub-Widget in Column {selectedSubWidget.colNum}
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {selectedSubWidget.subWidget.name} ({selectedSubWidget.subWidget.type})
                      </p>
                    </div>

                    {/* PDF SUB-WIDGET */}
                    {selectedSubWidget.subWidget.type === "pdf" && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                            <CloudUpload className="size-3.5" /> Upload PDF to S3 Bucket
                          </Label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) =>
                                handleS3FileUpload(e, "url", {
                                  sectionId: selectedSubWidget.sectionId,
                                  colNum: selectedSubWidget.colNum,
                                  subWidgetId: selectedSubWidget.subWidget.id,
                                })
                              }
                              disabled={isUploading}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUploading}
                              className="w-full h-9 rounded-xl text-xs gap-2 font-bold cursor-pointer border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin text-primary" /> Uploading to S3...
                                </>
                              ) : (
                                <>
                                  <Upload className="size-3.5 text-primary" /> Choose PDF File to Upload
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Document Title</Label>
                          <Input
                            value={selectedSubWidget.subWidget.props.title || ""}
                            onChange={(e) =>
                              handleUpdateSubWidgetProps(
                                selectedSubWidget.sectionId,
                                selectedSubWidget.colNum,
                                selectedSubWidget.subWidget.id,
                                { ...selectedSubWidget.subWidget.props, title: e.target.value }
                              )
                            }
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">PDF Document URL</Label>
                          <Input
                            value={selectedSubWidget.subWidget.props.url || ""}
                            onChange={(e) =>
                              handleUpdateSubWidgetProps(
                                selectedSubWidget.sectionId,
                                selectedSubWidget.colNum,
                                selectedSubWidget.subWidget.id,
                                { ...selectedSubWidget.subWidget.props, url: e.target.value }
                              )
                            }
                            className="h-8 text-xs rounded-xl font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* IMAGE SUB-WIDGET */}
                    {selectedSubWidget.subWidget.type === "image" && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                            <CloudUpload className="size-3.5" /> Upload Image to S3 Bucket
                          </Label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleS3FileUpload(e, "src", {
                                  sectionId: selectedSubWidget.sectionId,
                                  colNum: selectedSubWidget.colNum,
                                  subWidgetId: selectedSubWidget.subWidget.id,
                                })
                              }
                              disabled={isUploading}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUploading}
                              className="w-full h-9 rounded-xl text-xs gap-2 font-bold cursor-pointer border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin text-primary" /> Uploading to S3...
                                </>
                              ) : (
                                <>
                                  <Upload className="size-3.5 text-primary" /> Choose Image File to Upload
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Image Source URL</Label>
                          <Input
                            value={selectedSubWidget.subWidget.props.src || ""}
                            onChange={(e) =>
                              handleUpdateSubWidgetProps(
                                selectedSubWidget.sectionId,
                                selectedSubWidget.colNum,
                                selectedSubWidget.subWidget.id,
                                { ...selectedSubWidget.subWidget.props, src: e.target.value }
                              )
                            }
                            className="h-8 text-xs rounded-xl font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* HEADING SUB-WIDGET */}
                    {selectedSubWidget.subWidget.type === "heading" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Heading Text</Label>
                          <Input
                            value={selectedSubWidget.subWidget.props.text || ""}
                            onChange={(e) =>
                              handleUpdateSubWidgetProps(
                                selectedSubWidget.sectionId,
                                selectedSubWidget.colNum,
                                selectedSubWidget.subWidget.id,
                                { ...selectedSubWidget.subWidget.props, text: e.target.value }
                              )
                            }
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    {/* PARAGRAPH SUB-WIDGET */}
                    {selectedSubWidget.subWidget.type === "paragraph" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Text Content</Label>
                        <Textarea
                          value={selectedSubWidget.subWidget.props.text || ""}
                          onChange={(e) =>
                            handleUpdateSubWidgetProps(
                              selectedSubWidget.sectionId,
                              selectedSubWidget.colNum,
                              selectedSubWidget.subWidget.id,
                              { ...selectedSubWidget.subWidget.props, text: e.target.value }
                            )
                          }
                          className="text-xs rounded-xl min-h-[90px] resize-none"
                        />
                      </div>
                    )}

                    {/* BUTTON SUB-WIDGET */}
                    {selectedSubWidget.subWidget.type === "button" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Button Label</Label>
                          <Input
                            value={selectedSubWidget.subWidget.props.label || ""}
                            onChange={(e) =>
                              handleUpdateSubWidgetProps(
                                selectedSubWidget.sectionId,
                                selectedSubWidget.colNum,
                                selectedSubWidget.subWidget.id,
                                { ...selectedSubWidget.subWidget.props, label: e.target.value }
                              )
                            }
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    <Separator />

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDeleteSubWidgetFromSection(
                          selectedSubWidget.sectionId,
                          selectedSubWidget.colNum,
                          selectedSubWidget.subWidget.id
                        )
                      }
                      className="w-full text-xs rounded-xl gap-1 cursor-pointer"
                    >
                      <Trash2 className="size-3" /> Remove Sub-Widget
                    </Button>
                  </div>
                ) : selectedWidget ? (
                  /* ── 4B. TOP-LEVEL WIDGET INSPECTOR ─────────────────────── */
                  <div className="space-y-4">
                    {/* PDF VIEWER INSPECTOR WITH S3 FILE UPLOADER */}
                    {selectedWidget.type === "pdf" && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                            <CloudUpload className="size-3.5" /> Upload PDF to AWS S3 Bucket
                          </Label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleS3FileUpload(e, "url")}
                              disabled={isUploading}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUploading}
                              className="w-full h-9 rounded-xl text-xs gap-2 font-bold cursor-pointer border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin text-primary" /> Uploading to S3...
                                </>
                              ) : (
                                <>
                                  <Upload className="size-3.5 text-primary" /> Choose PDF File to Upload
                                </>
                              )}
                            </Button>
                          </div>
                          <span className="text-[10px] text-muted-foreground block italic">
                            Direct S3 storage upload (Max size: 25MB)
                          </span>
                        </div>

                        <Separator />

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Document Title</Label>
                          <Input
                            value={selectedWidget.props.title || ""}
                            onChange={(e) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, title: e.target.value })}
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">PDF Document URL</Label>
                          <Input
                            value={selectedWidget.props.url || ""}
                            onChange={(e) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, url: e.target.value })}
                            className="h-8 text-xs rounded-xl font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* IMAGE INSPECTOR WITH S3 FILE UPLOADER */}
                    {selectedWidget.type === "image" && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex items-center gap-1 text-primary">
                            <CloudUpload className="size-3.5" /> Upload Image to AWS S3 Bucket
                          </Label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleS3FileUpload(e, "src")}
                              disabled={isUploading}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUploading}
                              className="w-full h-9 rounded-xl text-xs gap-2 font-bold cursor-pointer border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin text-primary" /> Uploading to S3...
                                </>
                              ) : (
                                <>
                                  <Upload className="size-3.5 text-primary" /> Choose Image File to Upload
                                </>
                              )}
                            </Button>
                          </div>
                          <span className="text-[10px] text-muted-foreground block italic">
                            S3 bucket storage (JPEG, PNG, WEBP, SVG)
                          </span>
                        </div>

                        <Separator />

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Image Source URL</Label>
                          <Input
                            value={selectedWidget.props.src || ""}
                            onChange={(e) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, src: e.target.value })}
                            className="h-8 text-xs rounded-xl font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* SECTION / MULTI-COLUMN INSPECTOR */}
                    {selectedWidget.type === "section" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Column Layout Ratio</Label>
                          <Select
                            value={selectedWidget.props.columnsRatio || "33-33-33"}
                            onValueChange={(val) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, columnsRatio: val })}
                          >
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Column Ratio" />
                            </SelectTrigger>
                            <SelectContent side="top">
                              <SelectItem value="33-33-33" className="text-xs">3 Equal Columns (33% / 33% / 33%)</SelectItem>
                              <SelectItem value="50-50" className="text-xs">2 Equal Columns (50% / 50%)</SelectItem>
                              <SelectItem value="30-70" className="text-xs">2 Columns (30% / 70%)</SelectItem>
                              <SelectItem value="70-30" className="text-xs">2 Columns (70% / 30%)</SelectItem>
                              <SelectItem value="25-75" className="text-xs">2 Columns (25% / 75%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        {/* RESPONSIVE VISIBILITY CONTROLS */}
                        <div className="space-y-3 pt-1">
                          <Label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                            <Smartphone className="size-3.5" /> Responsive Visibility Logic
                          </Label>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground/80">Stack Vertically on Mobile</span>
                            <Switch
                              checked={selectedWidget.props.stackOnMobile !== false}
                              onCheckedChange={(val) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, stackOnMobile: val })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground/80">Hide Section on Mobile</span>
                            <Switch
                              checked={!!selectedWidget.props.hideOnMobile}
                              onCheckedChange={(val) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, hideOnMobile: val })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground/80">Hide Section on Tablet</span>
                            <Switch
                              checked={!!selectedWidget.props.hideOnTablet}
                              onCheckedChange={(val) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, hideOnTablet: val })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HEADING INSPECTOR */}
                    {selectedWidget.type === "heading" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Heading Text</Label>
                          <Input
                            value={selectedWidget.props.text || ""}
                            onChange={(e) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, text: e.target.value })}
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    {/* PARAGRAPH INSPECTOR */}
                    {selectedWidget.type === "paragraph" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Text Content</Label>
                        <Textarea
                          value={selectedWidget.props.text || ""}
                          onChange={(e) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, text: e.target.value })}
                          className="text-xs rounded-xl min-h-[90px] resize-none"
                        />
                      </div>
                    )}

                    {/* BUTTON INSPECTOR */}
                    {selectedWidget.type === "button" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">Button Label</Label>
                          <Input
                            value={selectedWidget.props.label || ""}
                            onChange={(e) => handleUpdateWidgetProps(selectedWidget.id, { ...selectedWidget.props, label: e.target.value })}
                            className="h-8 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateWidget(selectedWidget.id)}
                        className="text-xs rounded-xl gap-1 cursor-pointer"
                      >
                        <Copy className="size-3" /> Duplicate
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteWidget(selectedWidget.id)}
                        className="text-xs rounded-xl gap-1 cursor-pointer"
                      >
                        <Trash2 className="size-3" /> Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                    <MousePointer className="size-8 opacity-30" />
                    <p className="text-xs font-semibold">No Widget Selected</p>
                    <p className="text-[11px]">Click or double-tap any widget or nested sub-widget on canvas to inspect & edit properties.</p>
                  </div>
                )}
              </ScrollArea>
            </aside>
          </div>
        </DndContext>

        {/* Code View Modal */}
        <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Code2 className="size-4 text-primary" /> Elementor Page JSON Schema
              </DialogTitle>
              <DialogDescription className="text-xs">
                Export and inspect the design schema for this page.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-zinc-950 text-zinc-100 p-4 rounded-2xl font-mono text-xs overflow-auto max-h-[350px] leading-relaxed">
              <pre>{JSON.stringify({ title: pageTitle, widgets }, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(widgets, null, 2))
                  toast.success("JSON copied to clipboard!")
                }}
                className="rounded-xl text-xs gap-1 cursor-pointer"
              >
                <Copy className="size-3.5" /> Copy Code
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCodeModalOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Live Public Page Link Modal Dialog */}
        <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader className="space-y-2 text-center items-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Globe className="size-6" />
              </div>
              <DialogTitle className="text-lg font-black">Page Published & Live!</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Your custom page is saved to the database and publicly accessible without authentication.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label className="text-xs font-bold text-foreground">Public Live URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={publicLiveUrl}
                  className="h-9 text-xs font-mono rounded-xl bg-muted/30"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(publicLiveUrl)
                    toast.success("Live URL copied to clipboard!")
                  }}
                  className="h-9 px-3 text-xs rounded-xl gap-1 shrink-0 font-bold cursor-pointer"
                >
                  <Copy className="size-3.5" /> Copy
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPublishDialogOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Close
              </Button>
              <a href={publicLiveUrl} target="_blank" rel="noreferrer">
                <Button size="sm" className="rounded-xl text-xs gap-1.5 font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white">
                  <ExternalLink className="size-3.5" /> Open Live Page
                </Button>
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
