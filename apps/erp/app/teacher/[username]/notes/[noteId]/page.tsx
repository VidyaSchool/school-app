"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  ArrowLeftIcon,
  CheckIcon,
  Loader2Icon,
  Undo2Icon,
  Redo2Icon,
  DownloadIcon,
  PlusIcon,
  Trash2Icon,
  GridIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PaintbrushIcon,
  HighlighterIcon,
  EraserIcon,
  MousePointerIcon,
  ImageIcon,
  RefreshCwIcon,
  Settings2Icon,
  ChevronsUpDownIcon,
  MoreHorizontalIcon,
  ZapIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import { createPortal } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Left slot: Back button + title input + save indicator
function NoteHeaderLeft({
  title, saveState,
  onBack, onTitleChange
}: {
  title: string
  saveState: SaveState
  onBack: () => void
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <>
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer">
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />

      {/* Title — takes remaining space */}
      <input
        value={title}
        onChange={onTitleChange}
        placeholder="Untitled Note"
        className="bg-transparent font-semibold text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-none min-w-0 flex-1 focus:ring-1 focus:ring-primary/30 rounded px-1"
      />

      {/* Save indicator */}
      <span className="flex items-center shrink-0 text-xs text-muted-foreground gap-1">
        {saveState === "saving" && <Loader2Icon className="h-3 w-3 animate-spin text-primary" />}
        {saveState === "saved" && <CheckIcon className="h-3 w-3 text-emerald-500" />}
        <span className="hidden sm:inline">{saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}</span>
      </span>
    </>
  )
}

// Right slot: PDF export + Settings (with mobile More menu)
function NoteHeaderRight({
  exporting, onExport, onSettings, mode, onToggle
}: {
  exporting: boolean
  onExport: () => void
  onSettings: () => void
  mode: "canvas" | "markdown"
  onToggle: () => void
}) {
  const [moreOpen, setMoreOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={onToggle}
        className="hidden sm:flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 text-foreground hover:bg-muted px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
      >
        {mode === "canvas" ? "Markdown Mode" : "Canvas Board"}
      </button>

      {/* PDF + Settings — visible sm+ */}
      <button
        onClick={onExport}
        disabled={exporting}
        className="hidden sm:flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
      >
        {exporting ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <DownloadIcon className="h-3.5 w-3.5" />}
        PDF
      </button>
      <button onClick={onSettings} className="hidden sm:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0">
        <Settings2Icon className="h-4 w-4" />
      </button>

      {/* More — mobile only */}
      <div className="relative sm:hidden shrink-0">
        <button onClick={() => setMoreOpen(o => !o)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
          <MoreHorizontalIcon className="h-4 w-4" />
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1 min-w-[150px] flex flex-col">
              <button onClick={() => { onToggle(); setMoreOpen(false) }} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors cursor-pointer">
                {mode === "canvas" ? "Markdown Mode" : "Canvas Board"}
              </button>
              <button onClick={() => { onExport(); setMoreOpen(false) }} disabled={exporting} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer">
                <DownloadIcon className="h-3.5 w-3.5" /> Export PDF
              </button>
              <button onClick={() => { onSettings(); setMoreOpen(false) }} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <Settings2Icon className="h-3.5 w-3.5" /> Settings
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Helper component to show Shadcn Tooltips for drawing tools
function ToolButton({
  title,
  shortcut,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  title: string
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button {...props}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        <span className="font-medium">{title}</span>
        {shortcut && (
          <kbd className="bg-zinc-800 text-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

// Shared toolbar button content — rendered in both mobile and desktop wrappers
function ToolbarContent({
  tool, setTool, activeColor, setActiveColor, activeWidth, setActiveWidth,
  historyIndex, history, handleUndo, handleRedo,
  triggerImageUpload, fileInputRef, handleImageUpload, addPage
}: {
  tool: CanvasTool
  setTool: (t: CanvasTool) => void
  activeColor: string
  setActiveColor: (c: string) => void
  activeWidth: number
  setActiveWidth: (w: number) => void
  historyIndex: number
  history: CanvasPage[][]
  handleUndo: () => void
  handleRedo: () => void
  triggerImageUpload: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  addPage: () => void
}) {
  return (
    <>
      <div className="flex flex-row lg:flex-col items-center gap-1.5 lg:gap-1 shrink-0 lg:w-auto">
        <ToolButton onClick={() => setTool("select")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "select" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Select & Move" shortcut="V">
          <MousePointerIcon className="h-4.5 w-4.5" />
        </ToolButton>

        <div className="h-6 w-px lg:h-px lg:w-6 bg-zinc-200 dark:bg-zinc-800 mx-1 lg:mx-0 lg:my-1" />

        <ToolButton onClick={() => setTool("pen")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "pen" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Pen" shortcut="P">
          <PaintbrushIcon className="h-4.5 w-4.5" />
        </ToolButton>
        <ToolButton onClick={() => setTool("highlighter")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "highlighter" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Highlighter" shortcut="H">
          <HighlighterIcon className="h-4.5 w-4.5" />
        </ToolButton>
        <ToolButton onClick={() => setTool("eraser")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "eraser" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Eraser" shortcut="E">
          <EraserIcon className="h-4.5 w-4.5" />
        </ToolButton>
        <ToolButton onClick={() => setTool("laser")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "laser" ? "bg-red-500 text-white shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Laser Pointer" shortcut="Z">
          <ZapIcon className="h-4.5 w-4.5" />
        </ToolButton>

        <div className="h-6 w-px lg:h-px lg:w-6 bg-zinc-200 dark:bg-zinc-800 mx-1 lg:mx-0 lg:my-1" />

        <ToolButton onClick={() => setTool("text")} className={cn("px-3.5 py-2 rounded-xl transition-all cursor-pointer text-sm font-bold font-serif leading-none", tool === "text" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Text Tool" shortcut="T">
          T
        </ToolButton>

        <div className="h-6 w-px lg:h-px lg:w-6 bg-zinc-200 dark:bg-zinc-800 mx-1 lg:mx-0 lg:my-1" />

        <ToolButton onClick={() => setTool("rectangle")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "rectangle" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Rectangle" shortcut="R">
          <div className="border-2 border-current w-4 h-3.5 rounded-xs" />
        </ToolButton>
        <ToolButton onClick={() => setTool("circle")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "circle" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Circle" shortcut="C">
          <div className="border-2 border-current w-4 h-4 rounded-full" />
        </ToolButton>
        <ToolButton onClick={() => setTool("arrow")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "arrow" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Arrow" shortcut="A">
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="12 5 19 5 19 12" /></svg>
        </ToolButton>
        <ToolButton onClick={() => setTool("line")} className={cn("p-2 rounded-xl transition-all cursor-pointer", tool === "line" ? "bg-primary text-primary-foreground shadow-xs scale-105" : "text-zinc-600 dark:text-zinc-300 hover:bg-muted")} title="Line" shortcut="L">
          <div className="bg-current w-4.5 h-0.5 rotate-[-45deg] my-2" />
        </ToolButton>

        <div className="h-6 w-px lg:h-px lg:w-6 bg-zinc-200 dark:bg-zinc-800 mx-1 lg:mx-0 lg:my-1" />

        <ToolButton onClick={triggerImageUpload} className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-muted cursor-pointer transition-colors" title="Insert Image">
          <ImageIcon className="h-4.5 w-4.5" />
        </ToolButton>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <ToolButton onClick={addPage} className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-muted cursor-pointer transition-colors" title="Add Page">
          <PlusIcon className="h-4.5 w-4.5" />
        </ToolButton>

        <div className="h-6 w-px lg:h-px lg:w-6 bg-zinc-200 dark:bg-zinc-800 mx-1 lg:mx-0 lg:my-1" />

        <ToolButton onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors" title="Undo" shortcut="Ctrl+Z">
          <Undo2Icon className="h-4.5 w-4.5" />
        </ToolButton>
        <ToolButton onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors" title="Redo" shortcut="Ctrl+Y">
          <Redo2Icon className="h-4.5 w-4.5" />
        </ToolButton>
      </div>

      {(tool === "pen" || tool === "highlighter" || tool === "eraser" || tool === "text" || tool === "rectangle" || tool === "circle" || tool === "arrow" || tool === "line") && (
        <div className="flex flex-row lg:flex-col items-center gap-3 border-l lg:border-l-0 lg:border-t border-zinc-200/60 dark:border-zinc-800 pl-3 ml-1.5 lg:pl-0 lg:ml-0 lg:pt-3 lg:mt-2 px-1.5 lg:w-full shrink-0">
          {tool !== "eraser" && (
            <div className="flex flex-row lg:flex-col items-center gap-1.5 p-1 bg-zinc-100/60 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
              {DRAWING_COLORS.map(col => (
                <button key={col.value} onClick={() => setActiveColor(col.value)}
                  className={cn("size-4 rounded-full border transition-all cursor-pointer relative flex items-center justify-center", activeColor === col.value ? "ring-2 ring-primary scale-110" : "hover:scale-105")}
                  style={{ backgroundColor: col.value, borderColor: col.value === "#ffffff" ? "#d4d4d8" : "transparent" }}
                  title={col.name} />
              ))}
            </div>
          )}
          {tool !== "text" && (
            <div className="flex flex-row lg:flex-col items-center gap-1 p-1 bg-zinc-100/60 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
              {STROKE_WIDTHS.map(sw => (
                <button key={sw.value} onClick={() => setActiveWidth(sw.value)}
                  className={cn("size-6 flex items-center justify-center rounded-lg transition-all cursor-pointer", activeWidth === sw.value ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
                  title={`${sw.label} (${sw.value}px)`}>
                  <div className="rounded-full bg-current" style={{ width: `${Math.min(14, Math.max(3, sw.value))}px`, height: `${Math.min(14, Math.max(3, sw.value))}px` }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

const CLASSES_LIST = ["All", "Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
const SECTIONS_LIST = ["All", "A", "B", "C", "D", "E", "F"]

function MetaCombobox({ value, onChange, options, placeholder }: {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs font-normal h-8 px-3 bg-background"
        >
          {value || placeholder}
          <ChevronsUpDownIcon className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Input
            placeholder={`Search...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full border-0 bg-transparent py-3 text-xs placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">No option found.</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item}
                type="button"
                className="w-full text-left flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-accent hover:text-accent-foreground"
                onClick={() => { onChange(item); setOpen(false); setSearch("") }}
              >
                {item}
                {value === item && <CheckIcon className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Custom color theme for note workspace
const COLORS = [
  { key: "default", dot: "bg-zinc-400",    bg: "bg-zinc-50 dark:bg-zinc-950" },
  { key: "yellow",  dot: "bg-amber-400",   bg: "bg-amber-50/60 dark:bg-amber-950/10" },
  { key: "blue",    dot: "bg-sky-400",     bg: "bg-sky-50/60 dark:bg-sky-950/10" },
  { key: "green",   dot: "bg-emerald-400", bg: "bg-emerald-50/60 dark:bg-emerald-950/10" },
  { key: "pink",    dot: "bg-rose-400",    bg: "bg-rose-50/60 dark:bg-rose-950/10" },
  { key: "purple",  dot: "bg-violet-400",  bg: "bg-violet-50/60 dark:bg-violet-950/10" },
]

// Canvas tools options
const DRAWING_COLORS = [
  { value: "#18181b", name: "Black" },
  { value: "#ef4444", name: "Red" },
  { value: "#3b82f6", name: "Blue" },
  { value: "#10b981", name: "Green" },
  { value: "#8b5cf6", name: "Purple" },
  { value: "#f97316", name: "Orange" },
  { value: "#ffffff", name: "White" },
]

const STROKE_WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 5, label: "Medium" },
  { value: 10, label: "Thick" },
  { value: 20, label: "X-Thick" },
]

type SaveState = "saved" | "saving" | "unsaved"
type CanvasTool = "select" | "pen" | "highlighter" | "eraser" | "laser" | "text" | "rectangle" | "circle" | "arrow" | "line"

interface CanvasImage {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}

interface DrawingPath {
  id: string
  tool: "pen" | "highlighter" | "eraser"
  color: string
  width: number
  points: { x: number; y: number }[]
}

interface CanvasText {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: "left" | "center" | "right"
  fontFamily?: string
}

interface CanvasShape {
  id: string
  type: "rectangle" | "circle" | "arrow" | "line"
  x: number
  y: number
  width: number
  height: number
  color: string
  strokeWidth: number
}

interface CanvasPage {
  id: string
  backgroundType: "blank" | "ruled" | "grid" | "dotted"
  drawings: DrawingPath[]
  images: CanvasImage[]
  texts: CanvasText[]
  shapes: CanvasShape[]
}

interface InteractionState {
  type: "drag" | "resize"
  elementId: string
  elementType: "image" | "text" | "shape" | "drawing"
  pageIndex: number
  startX: number
  startY: number
  startImgX: number
  startImgY: number
  startImgW: number
  startImgH: number
  startFontSize?: number
}

// ── Canvas Page Subcomponent ──────────────────────────────────────────────────
interface CanvasPageElementProps {
  page: CanvasPage
  pageIndex: number
  isActive: boolean
  activeTool: CanvasTool
  activeColor: string
  activeWidth: number
  onUpdatePage: (updatedPage: CanvasPage) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  selectedType: "image" | "text" | "shape" | "drawing" | null
  setSelectedType: (type: "image" | "text" | "shape" | "drawing" | null) => void
  selectedPage: number | null
  setSelectedPage: (idx: number | null) => void
  canvasRefSetter: (el: HTMLCanvasElement | null) => void
  onFocus: () => void
  setTool: (tool: CanvasTool) => void
}

function CanvasPageElement({
  page,
  pageIndex,
  isActive,
  activeTool,
  activeColor,
  activeWidth,
  onUpdatePage,
  selectedId,
  setSelectedId,
  selectedType,
  setSelectedType,
  selectedPage,
  setSelectedPage,
  canvasRefSetter,
  onFocus,
  setTool
}: CanvasPageElementProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = React.useRef(false)
  const isDrawingShapeRef = React.useRef(false)
  const activePathRef = React.useRef<DrawingPath | null>(null)
  const activeShapeRef = React.useRef<CanvasShape | null>(null)
  const imgCache = React.useRef<Record<string, HTMLImageElement>>({})
  const interactionRef = React.useRef<InteractionState | null>(null)
  // Multi-select marquee
  const marqueeRef = React.useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const isMarqueeRef = React.useRef(false)
  const [marquee, setMarquee] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  // Multi-drag
  const multiDragRef = React.useRef<{ startX: number; startY: number; origins: Record<string, { x: number; y: number }> } | null>(null)
  // Laser pointer
  const laserPointsRef = React.useRef<{ x: number; y: number; t: number }[]>([])
  const laserRafRef = React.useRef<number | null>(null)
  const isLaserRef = React.useRef(false)
  const laserCanvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const { theme } = useTheme()
  const isDark = React.useMemo(() => {
    if (theme === "dark") return true
    if (theme === "light") return false
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return false
  }, [theme])

  const getThemeColor = React.useCallback((col: string) => {
    if (isDark) {
      if (col === "#18181b" || col === "#000000") return "#ffffff"
    } else {
      if (col === "#ffffff") return "#18181b"
    }
    return col
  }, [isDark])

  const [canvasWidth, setCanvasWidth] = React.useState(800)
  
  // Text Editor States
  const [editingTextId, setEditingTextId] = React.useState<string | null>(null)
  const [editingTextValue, setEditingTextValue] = React.useState("")

  // Cache/expose raw canvas element to parent
  React.useEffect(() => {
    if (canvasRef.current) {
      canvasRefSetter(canvasRef.current)
      setCanvasWidth(canvasRef.current.clientWidth)
    }
  }, [canvasRefSetter])

  // Track canvas display width on resize for inline text editor size matching
  React.useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setCanvasWidth(canvasRef.current.clientWidth)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Helper background renderers
  const drawRuled = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = isDark ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.12)" // light blue horizontal lines
    ctx.lineWidth = 1
    const lineSpacing = 32
    for (let y = 80; y < h; y += lineSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    // Vertical margin line
    ctx.strokeStyle = isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.2)" // red margin
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(90, 0)
    ctx.lineTo(90, h)
    ctx.stroke()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)"
    ctx.lineWidth = 0.75
    const gridSize = 30
    for (let x = gridSize; x < w; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = gridSize; y < h; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }

  const drawDotted = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.18)"
    const dotSpacing = 30
    for (let x = dotSpacing; x < w; x += dotSpacing) {
      for (let y = dotSpacing; y < h; y += dotSpacing) {
        ctx.beginPath()
        ctx.arc(x, y, 1.25, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Draw single shape
  const drawSingleShape = React.useCallback((ctx: CanvasRenderingContext2D, shape: CanvasShape) => {
    ctx.strokeStyle = getThemeColor(shape.color)
    ctx.lineWidth = shape.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (shape.type === "rectangle") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
    } else if (shape.type === "circle") {
      ctx.beginPath()
      const radiusX = Math.abs(shape.width) / 2
      const radiusY = Math.abs(shape.height) / 2
      const centerX = shape.x + shape.width / 2
      const centerY = shape.y + shape.height / 2
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (shape.type === "line") {
      ctx.beginPath()
      ctx.moveTo(shape.x, shape.y)
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
      ctx.stroke()
    } else if (shape.type === "arrow") {
      const fromX = shape.x
      const fromY = shape.y
      const toX = shape.x + shape.width
      const toY = shape.y + shape.height

      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()

      const angle = Math.atan2(toY - fromY, toX - fromX)
      const headLength = 15
      ctx.fillStyle = getThemeColor(shape.color)
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fill()
    }
  }, [getThemeColor])

  // Draw single text
  const drawSingleText = React.useCallback((ctx: CanvasRenderingContext2D, text: CanvasText) => {
    // Skip if editing inline currently
    if (text.id === editingTextId) return

    const weight = text.bold ? "bold" : "normal"
    const style = text.italic ? "italic" : "normal"
    const family = text.fontFamily || "sans-serif"
    ctx.textBaseline = "top"
    ctx.font = `${style} ${weight} ${text.fontSize}px ${family}`
    ctx.fillStyle = getThemeColor(text.color)
    ctx.textAlign = text.align || "left"

    const lines = text.text.split("\n")
    const alignOffsetX = text.align === "center" ? 200 : text.align === "right" ? 400 : 0
    lines.forEach((line, index) => {
      ctx.fillText(line, text.x + alignOffsetX, text.y + index * (text.fontSize * 1.25))
      if (text.underline) {
        const metrics = ctx.measureText(line)
        const lineW = metrics.width
        const lx = text.align === "center" ? text.x + alignOffsetX - lineW / 2
          : text.align === "right" ? text.x + alignOffsetX - lineW
          : text.x
        const ly = text.y + index * (text.fontSize * 1.25) + text.fontSize + 2
        ctx.beginPath()
        ctx.strokeStyle = getThemeColor(text.color)
        ctx.lineWidth = Math.max(1, text.fontSize / 20)
        ctx.moveTo(lx, ly)
        ctx.lineTo(lx + lineW, ly)
        ctx.stroke()
      }
    })
    ctx.textAlign = "left"
  }, [editingTextId, getThemeColor])

  // Redraw entire canvas
  const renderCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Base background
    ctx.fillStyle = isDark ? "#000000" : "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Layout patterns
    if (page.backgroundType === "ruled") {
      drawRuled(ctx, canvas.width, canvas.height)
    } else if (page.backgroundType === "grid") {
      drawGrid(ctx, canvas.width, canvas.height)
    } else if (page.backgroundType === "dotted") {
      drawDotted(ctx, canvas.width, canvas.height)
    }

    const drawContent = () => {
      // Draw content on an off-screen canvas so destination-out (eraser)
      // only affects content, not the background/grid
      const offscreen = document.createElement("canvas")
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const octx = offscreen.getContext("2d")!

      // 1. Draw shapes
      if (page.shapes) {
        page.shapes.forEach(shape => drawSingleShape(octx as any, shape))
      }
      if (isDrawingShapeRef.current && activeShapeRef.current) {
        drawSingleShape(octx as any, activeShapeRef.current)
      }

      // 2. Draw texts
      if (page.texts) {
        page.texts.forEach(text => drawSingleText(octx as any, text))
      }

      // 3. Draw freehand path lines
      page.drawings.forEach((path) => {
        if (path.points.length === 0) return
        octx.beginPath()
        octx.lineWidth = path.width
        octx.lineCap = "round"
        octx.lineJoin = "round"

        if (path.tool === "eraser") {
          octx.globalCompositeOperation = "destination-out"
          octx.strokeStyle = "rgba(0,0,0,1)"
          octx.globalAlpha = 1.0
        } else if (path.tool === "highlighter") {
          octx.globalCompositeOperation = "multiply"
          octx.strokeStyle = getThemeColor(path.color)
          octx.globalAlpha = 0.45
        } else {
          octx.globalCompositeOperation = "source-over"
          octx.strokeStyle = getThemeColor(path.color)
          octx.globalAlpha = 1.0
        }

        octx.moveTo(path.points[0].x, path.points[0].y)
        for (let i = 1; i < path.points.length; i++) {
          octx.lineTo(path.points[i].x, path.points[i].y)
        }
        octx.stroke()
      })

      // Also apply active eraser stroke (not yet committed to page.drawings)
      const activePath = activePathRef.current
      if (activePath && activePath.tool === "eraser" && activePath.points.length > 1) {
        octx.beginPath()
        octx.lineWidth = activePath.width
        octx.lineCap = "round"
        octx.lineJoin = "round"
        octx.globalCompositeOperation = "destination-out"
        octx.strokeStyle = "rgba(0,0,0,1)"
        octx.globalAlpha = 1.0
        octx.moveTo(activePath.points[0].x, activePath.points[0].y)
        for (let i = 1; i < activePath.points.length; i++) {
          octx.lineTo(activePath.points[i].x, activePath.points[i].y)
        }
        octx.stroke()
      }

      // Composite content layer onto main canvas (background+grid already drawn)
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1.0
      ctx.drawImage(offscreen, 0, 0)
    }

    // Draw images, loading async if not in cache
    let loadedCount = 0
    if (page.images.length === 0) {
      drawContent()
    } else {
      page.images.forEach((imgData) => {
        const cached = imgCache.current[imgData.id]
        if (cached) {
          ctx.drawImage(cached, imgData.x, imgData.y, imgData.width, imgData.height)
          loadedCount++
          if (loadedCount === page.images.length) {
            drawContent()
          }
        } else {
          const img = new Image()
          img.src = imgData.src
          img.onload = () => {
            imgCache.current[imgData.id] = img
            renderCanvas()
          }
        }
      })
    }
  }, [page.drawings, page.images, page.backgroundType, page.texts, page.shapes, drawSingleShape, drawSingleText, isDark, getThemeColor])

  React.useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Laser: draw fading trail on top of canvas, then schedule fade
  const drawLaserTrail = React.useCallback(() => {
    const overlay = laserCanvasRef.current
    console.log("[laser] RAF tick, overlay=", overlay, "pts=", laserPointsRef.current.length)
    if (!overlay) return
    const ctx = overlay.getContext("2d")
    if (!ctx) return
    const now = Date.now()
    const FADE_MS = 600
    laserPointsRef.current = laserPointsRef.current.filter(p => now - p.t < FADE_MS)
    const pts = laserPointsRef.current
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    if (pts.length === 0) return
    for (let i = 1; i < pts.length; i++) {
      const age = now - pts[i].t
      const alpha = Math.max(0, 1 - age / FADE_MS)
      ctx.beginPath()
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
      ctx.lineTo(pts[i].x, pts[i].y)
      ctx.strokeStyle = `rgba(239,68,68,${alpha})`
      ctx.lineWidth = 4
      ctx.lineCap = "round"
      ctx.stroke()
    }
    const last = pts[pts.length - 1]
    const lastAge = now - last.t
    const lastAlpha = Math.max(0, 1 - lastAge / FADE_MS)
    ctx.beginPath()
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(239,68,68,${lastAlpha * 0.5})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${lastAlpha})`
    ctx.fill()
    laserRafRef.current = requestAnimationFrame(drawLaserTrail)
  }, [])

  // Display coordinates mapping to 800x1100 standard
  const getScaledCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 800
    const y = ((e.clientY - rect.top) / rect.height) * 1100
    return { x, y }
  }

  // Get boundaries of any selected element
  const getSelectedElementBounds = () => {
    if (selectedId === null || selectedPage !== pageIndex || !selectedType) return null

    if (selectedType === "image") {
      const el = page.images.find(img => img.id === selectedId)
      return el ? { x: el.x, y: el.y, w: el.width, h: el.height } : null
    }

    if (selectedType === "shape") {
      const el = page.shapes.find(s => s.id === selectedId)
      return el ? {
        x: Math.min(el.x, el.x + el.width),
        y: Math.min(el.y, el.y + el.height),
        w: Math.abs(el.width),
        h: Math.abs(el.height)
      } : null
    }

    if (selectedType === "text") {
      const el = page.texts.find(t => t.id === selectedId)
      if (!el) return null
      const lines = el.text.split("\n")
      const maxLen = lines.reduce((max, line) => Math.max(max, line.length), 0)
      return {
        x: el.x,
        y: el.y,
        w: Math.max(80, maxLen * (el.fontSize * 0.6)),
        h: lines.length * (el.fontSize * 1.25)
      }
    }

    if (selectedType === "drawing") {
      const el = page.drawings.find(d => d.id === selectedId)
      if (!el || el.points.length === 0) return null
      const xs = el.points.map(p => p.x), ys = el.points.map(p => p.y)
      return {
        x: Math.min(...xs) - el.width,
        y: Math.min(...ys) - el.width,
        w: Math.max(...xs) - Math.min(...xs) + el.width * 2,
        h: Math.max(...ys) - Math.min(...ys) + el.width * 2
      }
    }

    return null
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    onFocus()
    const { x, y } = getScaledCoords(e)

    // 1. Text Tool mode: Create textbox
    if (activeTool === "text") {
      const newText: CanvasText = {
        id: `text-${Date.now()}`,
        text: "Double click to edit",
        x,
        y,
        fontSize: 24,
        color: activeColor,
        bold: false,
        italic: false,
        underline: false,
        align: "left",
        fontFamily: "sans-serif"
      }
      onUpdatePage({
        ...page,
        texts: [...(page.texts || []), newText]
      })
      setSelectedId(newText.id)
      setSelectedType("text")
      setSelectedPage(pageIndex)
      setTool("select")
      toast.success("Textbox added. Double click to type text.")
      return
    }

    // 2. Shape Tool modes: Drag-to-Draw shape
    if (activeTool === "rectangle" || activeTool === "circle" || activeTool === "arrow" || activeTool === "line") {
      isDrawingShapeRef.current = true
      activeShapeRef.current = {
        id: `shape-${Date.now()}`,
        type: activeTool,
        x,
        y,
        width: 0,
        height: 0,
        color: activeColor,
        strokeWidth: activeWidth
      }
      canvasRef.current?.setPointerCapture(e.pointerId)
      return
    }

    // 3. Selection mode: Drag / Resize elements
    if (activeTool === "select") {
      const bounds = getSelectedElementBounds()

      // A. Check if clicked near bottom-right resize handle
      if (bounds) {
        const handleX = bounds.x + bounds.w
        const handleY = bounds.y + bounds.h
        if (Math.hypot(x - handleX, y - handleY) < 22) {
          interactionRef.current = {
            type: "resize",
            elementId: selectedId!,
            elementType: selectedType!,
            pageIndex,
            startX: x,
            startY: y,
            startImgX: bounds.x,
            startImgY: bounds.y,
            startImgW: bounds.w,
            startImgH: bounds.h,
            startFontSize: selectedType === "text" ? page.texts.find(t => t.id === selectedId)?.fontSize : undefined
          }
          canvasRef.current?.setPointerCapture(e.pointerId)
          return
        }
      }

      // B. Check collision with elements: Texts -> Shapes -> Images
      // Text collision check
      console.log("[select] click at", x, y, "texts:", page.texts?.length, "shapes:", page.shapes?.length, "drawings:", page.drawings?.length)
      if (page.texts) {
        for (let i = page.texts.length - 1; i >= 0; i--) {
          const txt = page.texts[i]
          const lines = txt.text.split("\n")
          const maxLen = lines.reduce((max, line) => Math.max(max, line.length), 0)
          const w = Math.max(80, maxLen * (txt.fontSize * 0.6))
          const h = lines.length * (txt.fontSize * 1.25)
          if (x >= txt.x && x <= txt.x + w && y >= txt.y && y <= txt.y + h) {
            setSelectedId(txt.id)
            setSelectedType("text")
            setSelectedPage(pageIndex)
            interactionRef.current = {
              type: "drag",
              elementId: txt.id,
              elementType: "text",
              pageIndex,
              startX: x,
              startY: y,
              startImgX: txt.x,
              startImgY: txt.y,
              startImgW: 0,
              startImgH: 0
            }
            canvasRef.current?.setPointerCapture(e.pointerId)
            return
          }
        }
      }

      // Shape collision check
      if (page.shapes) {
        for (let i = page.shapes.length - 1; i >= 0; i--) {
          const s = page.shapes[i]
          const sx = Math.min(s.x, s.x + s.width)
          const sy = Math.min(s.y, s.y + s.height)
          const sw = Math.abs(s.width)
          const sh = Math.abs(s.height)
          if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
            setSelectedId(s.id)
            setSelectedType("shape")
            setSelectedPage(pageIndex)
            interactionRef.current = {
              type: "drag",
              elementId: s.id,
              elementType: "shape",
              pageIndex,
              startX: x,
              startY: y,
              startImgX: s.x,
              startImgY: s.y,
              startImgW: s.width,
              startImgH: s.height
            }
            canvasRef.current?.setPointerCapture(e.pointerId)
            return
          }
        }
      }

      // Image collision check
      if (page.images) {
        for (let i = page.images.length - 1; i >= 0; i--) {
          const img = page.images[i]
          if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
            setSelectedId(img.id)
            setSelectedType("image")
            setSelectedPage(pageIndex)
            interactionRef.current = {
              type: "drag",
              elementId: img.id,
              elementType: "image",
              pageIndex,
              startX: x,
              startY: y,
              startImgX: img.x,
              startImgY: img.y,
              startImgW: img.width,
              startImgH: img.height
            }
            canvasRef.current?.setPointerCapture(e.pointerId)
            return
          }
        }
      }

      // Drawing (pen/highlighter) collision check — hit-test each stroke's bounding box
      for (let i = page.drawings.length - 1; i >= 0; i--) {
        const path = page.drawings[i]
        if (path.tool === "eraser" || path.points.length === 0) continue
        const xs = path.points.map(p => p.x), ys = path.points.map(p => p.y)
        const bx = Math.min(...xs) - path.width, by = Math.min(...ys) - path.width
        const bw = Math.max(...xs) - bx + path.width, bh = Math.max(...ys) - by + path.width
        if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
          setSelectedId(path.id)
          setSelectedType("drawing")
          setSelectedPage(pageIndex)
          interactionRef.current = {
            type: "drag",
            elementId: path.id,
            elementType: "drawing",
            pageIndex,
            startX: x,
            startY: y,
            startImgX: 0,
            startImgY: 0,
            startImgW: 0,
            startImgH: 0
          }
          canvasRef.current?.setPointerCapture(e.pointerId)
          return
        }
      }

      // Check if clicked inside an already-selected multi-selection → start multi-drag
      if (selectedIds.length > 1) {
        const allEls = [
          ...(page.texts || []).filter(t => selectedIds.includes(t.id)).map(t => ({ id: t.id, x: t.x, y: t.y })),
          ...(page.shapes || []).filter(s => selectedIds.includes(s.id)).map(s => ({ id: s.id, x: s.x, y: s.y })),
          ...(page.images || []).filter(i => selectedIds.includes(i.id)).map(i => ({ id: i.id, x: i.x, y: i.y })),
        ]
        const origins: Record<string, { x: number; y: number }> = {}
        allEls.forEach(el => { origins[el.id] = { x: el.x, y: el.y } })
        // Check if click is inside bounding box of selection
        const xs = allEls.map(e => e.x), ys = allEls.map(e => e.y)
        const minX = Math.min(...xs), minY = Math.min(...ys)
        const maxX = Math.max(...xs) + 200, maxY = Math.max(...ys) + 100
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          multiDragRef.current = { startX: x, startY: y, origins }
          canvasRef.current?.setPointerCapture(e.pointerId)
          return
        }
      }

      // Empty click: start marquee selection
      setSelectedId(null)
      setSelectedType(null)
      setSelectedPage(null)
      setSelectedIds([])
      isMarqueeRef.current = true
      marqueeRef.current = { x, y, w: 0, h: 0 }
      setMarquee({ x, y, w: 0, h: 0 })
      canvasRef.current?.setPointerCapture(e.pointerId)
    } else if (activeTool === "laser") {
      isLaserRef.current = true
      laserPointsRef.current = [{ x, y, t: Date.now() }]
      if (laserRafRef.current) cancelAnimationFrame(laserRafRef.current)
      console.log("[laser] pointerdown, overlay=", laserCanvasRef.current, "pts=", laserPointsRef.current.length)
      laserRafRef.current = requestAnimationFrame(drawLaserTrail)
      canvasRef.current?.setPointerCapture(e.pointerId)
    } else {
      // 4. Drawing strokes mode: Pen, Highlighter, Eraser
      isDrawingRef.current = true
      activePathRef.current = {
        id: `path-${Date.now()}`,
        tool: activeTool as any,
        color: activeColor,
        width: activeWidth,
        points: [{ x, y }]
      }
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getScaledCoords(e)

    if (isDrawingRef.current && activePathRef.current) {
      // Dynamic rendering of current pen stroke segment
      activePathRef.current.points.push({ x, y })
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          const pts = activePathRef.current.points
          const len = pts.length
          if (len > 1) {
            ctx.beginPath()
            ctx.moveTo(pts[len - 2].x, pts[len - 2].y)
            ctx.lineTo(pts[len - 1].x, pts[len - 1].y)
            ctx.lineWidth = activePathRef.current.width
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            if (activePathRef.current.tool === "eraser") {
              // Re-render fully so eraser uses the offscreen layer (preserves grid)
              renderCanvas()
              return
            } else if (activePathRef.current.tool === "highlighter") {
              ctx.globalCompositeOperation = "multiply"
              ctx.strokeStyle = getThemeColor(activePathRef.current.color)
              ctx.globalAlpha = 0.45
            } else {
              ctx.globalCompositeOperation = "source-over"
              ctx.strokeStyle = getThemeColor(activePathRef.current.color)
              ctx.globalAlpha = 1.0
            }
            ctx.stroke()
            ctx.globalCompositeOperation = "source-over"
            ctx.globalAlpha = 1.0
          }
        }
      }
    } else if (isLaserRef.current) {
      laserPointsRef.current.push({ x, y, t: Date.now() })
    } else if (isDrawingShapeRef.current && activeShapeRef.current) {
      // Dynamic shape rendering
      activeShapeRef.current.width = x - activeShapeRef.current.x
      activeShapeRef.current.height = y - activeShapeRef.current.y
      renderCanvas()
    } else if (interactionRef.current) {
      // Element dragging or resizing
      const dx = x - interactionRef.current.startX
      const dy = y - interactionRef.current.startY

      if (interactionRef.current.type === "drag") {
        const { elementId, elementType } = interactionRef.current

        if (elementType === "image") {
          const nextImages = page.images.map(img =>
            img.id === elementId ? { ...img, x: interactionRef.current!.startImgX + dx, y: interactionRef.current!.startImgY + dy } : img
          )
          onUpdatePage({ ...page, images: nextImages })
        } else if (elementType === "shape") {
          const nextShapes = page.shapes.map(s =>
            s.id === elementId ? { ...s, x: interactionRef.current!.startImgX + dx, y: interactionRef.current!.startImgY + dy } : s
          )
          onUpdatePage({ ...page, shapes: nextShapes })
        } else if (elementType === "text") {
          const nextTexts = page.texts.map(t =>
            t.id === elementId ? { ...t, x: interactionRef.current!.startImgX + dx, y: interactionRef.current!.startImgY + dy } : t
          )
          onUpdatePage({ ...page, texts: nextTexts })
        } else if (elementType === "drawing") {
          const ddx = x - interactionRef.current.startX
          const ddy = y - interactionRef.current.startY
          interactionRef.current.startX = x
          interactionRef.current.startY = y
          const nextDrawings = page.drawings.map(p =>
            p.id === elementId ? { ...p, points: p.points.map(pt => ({ x: pt.x + ddx, y: pt.y + ddy })) } : p
          )
          onUpdatePage({ ...page, drawings: nextDrawings })
        }
      } else if (interactionRef.current.type === "resize") {
        const { elementId, elementType } = interactionRef.current

        if (elementType === "image") {
          const ratio = interactionRef.current.startImgH / interactionRef.current.startImgW
          const nextW = Math.max(30, interactionRef.current.startImgW + dx)
          const nextH = nextW * ratio
          const nextImages = page.images.map(img =>
            img.id === elementId ? { ...img, width: nextW, height: nextH } : img
          )
          onUpdatePage({ ...page, images: nextImages })
        } else if (elementType === "shape") {
          const nextW = interactionRef.current.startImgW + dx
          const nextH = interactionRef.current.startImgH + dy
          const nextShapes = page.shapes.map(s =>
            s.id === elementId ? { ...s, width: nextW, height: nextH } : s
          )
          onUpdatePage({ ...page, shapes: nextShapes })
        } else if (elementType === "text") {
          const nextSize = Math.max(12, (interactionRef.current.startFontSize || 24) + dx / 5)
          const nextTexts = page.texts.map(t =>
            t.id === elementId ? { ...t, fontSize: nextSize } : t
          )
          onUpdatePage({ ...page, texts: nextTexts })
        }
      }
    } else if (isMarqueeRef.current && marqueeRef.current) {
      const m = marqueeRef.current
      const newMarquee = { x: Math.min(m.x, x), y: Math.min(m.y, y), w: Math.abs(x - m.x), h: Math.abs(y - m.y) }
      marqueeRef.current = { ...marqueeRef.current, w: x - marqueeRef.current.x, h: y - marqueeRef.current.y }
      setMarquee(newMarquee)
    } else if (multiDragRef.current) {
      const dx = x - multiDragRef.current.startX
      const dy = y - multiDragRef.current.startY
      const origins = multiDragRef.current.origins
      onUpdatePage({
        ...page,
        texts: page.texts.map(t => origins[t.id] ? { ...t, x: origins[t.id].x + dx, y: origins[t.id].y + dy } : t),
        shapes: page.shapes.map(s => origins[s.id] ? { ...s, x: origins[s.id].x + dx, y: origins[s.id].y + dy } : s),
        images: page.images.map(i => origins[i.id] ? { ...i, x: origins[i.id].x + dx, y: origins[i.id].y + dy } : i),
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current && activePathRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId)
      onUpdatePage({
        ...page,
        drawings: [...page.drawings, activePathRef.current]
      })
      isDrawingRef.current = false
      activePathRef.current = null
    } else if (isLaserRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId)
      isLaserRef.current = false
      // Let the fade animation finish naturally, then clear overlay
      setTimeout(() => {
        laserPointsRef.current = []
        if (laserRafRef.current) cancelAnimationFrame(laserRafRef.current)
        const overlay = laserCanvasRef.current
        if (overlay) overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height)
      }, 650)
    } else if (isDrawingShapeRef.current && activeShapeRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId)
      // Save shape
      onUpdatePage({
        ...page,
        shapes: [...(page.shapes || []), activeShapeRef.current]
      })
      isDrawingShapeRef.current = false
      activeShapeRef.current = null
    } else if (interactionRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId)
      // Commit update
      onUpdatePage(page)
      interactionRef.current = null
    } else if (isMarqueeRef.current && marqueeRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId)
      isMarqueeRef.current = false
      const m = marquee
      if (m && m.w > 5 && m.h > 5) {
        // Collect all elements inside marquee rect
        const ids: string[] = []
        ;(page.texts || []).forEach(t => {
          if (t.x >= m.x && t.y >= m.y && t.x <= m.x + m.w && t.y <= m.y + m.h) ids.push(t.id)
        })
        ;(page.shapes || []).forEach(s => {
          const cx = s.x + s.width / 2, cy = s.y + s.height / 2
          if (cx >= m.x && cy >= m.y && cx <= m.x + m.w && cy <= m.y + m.h) ids.push(s.id)
        })
        ;(page.images || []).forEach(i => {
          const cx = i.x + i.width / 2, cy = i.y + i.height / 2
          if (cx >= m.x && cy >= m.y && cx <= m.x + m.w && cy <= m.y + m.h) ids.push(i.id)
        })
        setSelectedIds(ids)
      }
      marqueeRef.current = null
      setMarquee(null)
    } else if (multiDragRef.current) {
      canvasRef.current?.releasePointerCapture(e.pointerId)
      onUpdatePage(page)
      multiDragRef.current = null
    }
  }

  // Handle double clicks for text box editing
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "select") return
    const { x, y } = getScaledCoords(e as any)

    if (page.texts) {
      for (let i = page.texts.length - 1; i >= 0; i--) {
        const txt = page.texts[i]
        const lines = txt.text.split("\n")
        const maxLen = lines.reduce((max, line) => Math.max(max, line.length), 0)
        const w = Math.max(80, maxLen * (txt.fontSize * 0.6))
        const h = lines.length * (txt.fontSize * 1.25)

        if (x >= txt.x && x <= txt.x + w && y >= txt.y && y <= txt.y + h) {
          setEditingTextId(txt.id)
          setEditingTextValue(txt.text)
          return
        }
      }
    }
  }

  const bounds = getSelectedElementBounds()
  const isCurrentPageSelected = selectedId !== null && selectedPage === pageIndex

  return (
    <div
      className={cn(
        "relative w-full border shadow-md rounded-lg overflow-hidden bg-white dark:bg-black select-none transition-all",
        isActive ? "ring-2 ring-primary/60 border-primary/20 scale-[1.002]" : "border-zinc-200 dark:border-zinc-700"
      )}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={1100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-auto aspect-[800/1100] block touch-none"
        style={{
          cursor: activeTool === "select" ? "default" : "crosshair"
        }}
      />
      <canvas
        ref={laserCanvasRef}
        width={800}
        height={1100}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Inline Text Area Editor */}
      {page.texts && page.texts.map(text => {
        if (text.id !== editingTextId) return null

        return (
          <textarea
            key={text.id}
            autoFocus
            value={editingTextValue}
            onChange={(e) => setEditingTextValue(e.target.value)}
            onBlur={() => {
              const nextTexts = page.texts.map(t =>
                t.id === editingTextId ? { ...t, text: editingTextValue } : t
              ).filter(t => t.text.trim().length > 0)

              onUpdatePage({ ...page, texts: nextTexts })
              setEditingTextId(null)
              setEditingTextValue("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.currentTarget.blur()
              }
            }}
            className="absolute bg-white dark:bg-zinc-900 border border-primary p-1 shadow-md leading-tight rounded-sm outline-none resize-none z-30"
            style={{
              left: `${(text.x / 800) * 100}%`,
              top: `${(text.y / 1100) * 100}%`,
              fontSize: `${(text.fontSize / 800) * canvasWidth}px`,
              color: text.color,
              fontFamily: text.fontFamily || "sans-serif",
              fontWeight: text.bold ? "bold" : "normal",
              fontStyle: text.italic ? "italic" : "normal",
              textDecoration: text.underline ? "underline" : "none",
              textAlign: text.align || "left",
              minWidth: "160px",
              minHeight: "45px"
            }}
          />
        )
      })}

      {/* Selected Element Bounding Outline and Actions */}
      {isCurrentPageSelected && bounds && (
        <div
          className="absolute border-2 border-dashed border-blue-500 pointer-events-none z-10"
          style={{
            left: `${(bounds.x / 800) * 100}%`,
            top: `${(bounds.y / 1100) * 100}%`,
            width: `${(bounds.w / 800) * 100}%`,
            height: `${(bounds.h / 1100) * 100}%`,
          }}
        >
          {/* Delete active element */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()

              if (selectedType === "image") {
                const nextImages = page.images.filter(img => img.id !== selectedId)
                onUpdatePage({ ...page, images: nextImages })
              } else if (selectedType === "shape") {
                const nextShapes = page.shapes.filter(s => s.id !== selectedId)
                onUpdatePage({ ...page, shapes: nextShapes })
              } else if (selectedType === "text") {
                const nextTexts = page.texts.filter(t => t.id !== selectedId)
                onUpdatePage({ ...page, texts: nextTexts })
              } else if (selectedType === "drawing") {
                const nextDrawings = page.drawings.filter(d => d.id !== selectedId)
                onUpdatePage({ ...page, drawings: nextDrawings })
              }

              setSelectedId(null)
              setSelectedType(null)
              setSelectedPage(null)
              toast.success("Element removed")
            }}
            className="absolute -top-3.5 -right-3.5 pointer-events-auto bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
            title="Delete"
          >
            <Trash2Icon className="h-3 w-3" />
          </button>

          {/* Corner resize handle */}
          <div
            className="absolute -bottom-2 -right-2 w-4.5 h-4.5 bg-blue-600 border-2 border-white rounded-full pointer-events-auto cursor-se-resize shadow-md hover:scale-120 transition-transform"
            title="Resize"
          />
        </div>
      )}

      {/* Marquee selection overlay */}
      {marquee && marquee.w > 2 && marquee.h > 2 && (
        <div
          className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-20"
          style={{
            left: `${(marquee.x / 800) * 100}%`,
            top: `${(marquee.y / 1100) * 100}%`,
            width: `${(marquee.w / 800) * 100}%`,
            height: `${(marquee.h / 1100) * 100}%`,
          }}
        />
      )}

      {/* Multi-select bounding box */}
      {selectedIds.length > 1 && (() => {
        const allEls = [
          ...(page.texts || []).filter(t => selectedIds.includes(t.id)).map(t => ({ x: t.x, y: t.y, w: 200, h: 40 })),
          ...(page.shapes || []).filter(s => selectedIds.includes(s.id)).map(s => ({ x: Math.min(s.x, s.x + s.width), y: Math.min(s.y, s.y + s.height), w: Math.abs(s.width), h: Math.abs(s.height) })),
          ...(page.images || []).filter(i => selectedIds.includes(i.id)).map(i => ({ x: i.x, y: i.y, w: i.width, h: i.height })),
        ]
        if (allEls.length === 0) return null
        const minX = Math.min(...allEls.map(e => e.x))
        const minY = Math.min(...allEls.map(e => e.y))
        const maxX = Math.max(...allEls.map(e => e.x + e.w))
        const maxY = Math.max(...allEls.map(e => e.y + e.h))
        return (
          <div
            className="absolute border-2 border-dashed border-blue-400 pointer-events-none z-10"
            style={{
              left: `${(minX / 800) * 100}%`,
              top: `${(minY / 1100) * 100}%`,
              width: `${((maxX - minX) / 800) * 100}%`,
              height: `${((maxY - minY) / 1100) * 100}%`,
            }}
          >
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onUpdatePage({
                  ...page,
                  texts: page.texts.filter(t => !selectedIds.includes(t.id)),
                  shapes: page.shapes.filter(s => !selectedIds.includes(s.id)),
                  images: page.images.filter(i => !selectedIds.includes(i.id)),
                })
                setSelectedIds([])
                toast.success("Elements removed")
              }}
              className="absolute -top-3.5 -right-3.5 pointer-events-auto bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
              title="Delete selected"
            >
              <Trash2Icon className="h-3 w-3" />
            </button>
          </div>
        )
      })()}
    </div>
  )
}

// ── Text Settings Panel ───────────────────────────────────────────────────────
const FONT_FAMILIES = ["sans-serif", "serif", "monospace", "cursive", "Georgia", "Arial", "Times New Roman", "Courier New"]

function TextSettingsPanel({ text, onChange }: { text: CanvasText; onChange: (updated: CanvasText) => void }) {
  return (
    <div className="hidden lg:flex flex-col gap-3 sticky top-6 self-start shrink-0 w-48 bg-white/95 dark:bg-zinc-900/95 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Text Settings</p>

      {/* Font size */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground font-medium">Size</label>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onChange({ ...text, fontSize: Math.max(8, text.fontSize - 2) })} className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center cursor-pointer">−</button>
          <span className="flex-1 text-center text-xs font-semibold">{Math.round(text.fontSize)}</span>
          <button onClick={() => onChange({ ...text, fontSize: Math.min(200, text.fontSize + 2) })} className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center cursor-pointer">+</button>
        </div>
        <input type="range" min={8} max={200} value={text.fontSize} onChange={e => onChange({ ...text, fontSize: Number(e.target.value) })} className="w-full accent-primary" />
      </div>

      {/* Style toggles */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground font-medium">Style</label>
        <div className="flex gap-1">
          {([
            { key: "bold", label: "B", cls: "font-bold" },
            { key: "italic", label: "I", cls: "italic" },
            { key: "underline", label: "U", cls: "underline" },
          ] as const).map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() => onChange({ ...text, [key]: !text[key as keyof CanvasText] })}
              className={cn("flex-1 h-7 rounded-md text-xs transition-all cursor-pointer", cls,
                text[key as keyof CanvasText] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground font-medium">Align</label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map(a => (
            <button
              key={a}
              onClick={() => onChange({ ...text, align: a })}
              className={cn("flex-1 h-7 rounded-md text-xs transition-all cursor-pointer flex items-center justify-center",
                (text.align || "left") === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={a}
            >
              {a === "left" && <svg className="w-3.5 h-3.5" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="0" y="4" width="9" height="2"/><rect x="0" y="8" width="11" height="2"/></svg>}
              {a === "center" && <svg className="w-3.5 h-3.5" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="2.5" y="4" width="9" height="2"/><rect x="1.5" y="8" width="11" height="2"/></svg>}
              {a === "right" && <svg className="w-3.5 h-3.5" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="5" y="4" width="9" height="2"/><rect x="3" y="8" width="11" height="2"/></svg>}
            </button>
          ))}
        </div>
      </div>

      {/* Font family */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground font-medium">Font</label>
        <select
          value={text.fontFamily || "sans-serif"}
          onChange={e => onChange({ ...text, fontFamily: e.target.value })}
          className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-background px-2 py-1 cursor-pointer"
        >
          {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground font-medium">Color</label>
        <div className="flex flex-wrap gap-1">
          {DRAWING_COLORS.map(col => (
            <button
              key={col.value}
              onClick={() => onChange({ ...text, color: col.value })}
              className={cn("size-5 rounded-full border-2 transition-all cursor-pointer",
                text.color === col.value ? "border-primary scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: col.value, outline: col.value === "#ffffff" ? "1px solid #d4d4d8" : undefined }}
              title={col.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Note Page Editor ────────────────────────────────────────────────────
export default function NoteEditorPage() {
  const { username, noteId } = useParams<{ username: string; noteId: string }>()
  const router = useRouter()

  const [title, setTitle] = React.useState("")
  const [pages, setPages] = React.useState<CanvasPage[]>([])
  const [activePageIndex, setActivePageIndex] = React.useState(0)
  const [color, setColor] = React.useState("default")
  const [saveState, setSaveState] = React.useState<SaveState>("saved")
  const [loading, setLoading] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [noteMeta, setNoteMeta] = React.useState({ className: "", section: "", subject: "" })
  const [draftMeta, setDraftMeta] = React.useState({ className: "", section: "", subject: "" })
  const [mode, setMode] = React.useState<"canvas" | "markdown">("canvas")
  const [markdownText, setMarkdownText] = React.useState<string>("")
  const [markdownViewMode, setMarkdownViewMode] = React.useState<"preview" | "edit">("preview")

  React.useEffect(() => { setMounted(true) }, [])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return
      if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        setCanvasZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(1))))
      } else if (e.key === "-") {
        e.preventDefault()
        setCanvasZoom(z => Math.max(0.3, parseFloat((z - 0.1).toFixed(1))))
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Unified Drawing / Selection State
  const [tool, setTool] = React.useState<CanvasTool>("pen")
  const [canvasZoom, setCanvasZoom] = React.useState(1)
  const [activeColor, setActiveColor] = React.useState("#18181b")
  const [activeWidth, setActiveWidth] = React.useState(5)

  const { theme } = useTheme()
  const isDark = React.useMemo(() => {
    if (theme === "dark") return true
    if (theme === "light") return false
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return false
  }, [theme])

  // Automatically adjust default pen color based on theme
  React.useEffect(() => {
    if (isDark) {
      if (activeColor === "#18181b") {
        setActiveColor("#ffffff")
      }
    } else {
      if (activeColor === "#ffffff") {
        setActiveColor("#18181b")
      }
    }
  }, [isDark])

  // Unified selection variables
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedType, setSelectedType] = React.useState<"image" | "text" | "shape" | "drawing" | null>(null)
  const [selectedPage, setSelectedPage] = React.useState<number | null>(null)

  // Undo/Redo histories
  const [history, setHistory] = React.useState<CanvasPage[][]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)

  // DOM refs cache
  const canvasRefs = React.useRef<Record<number, HTMLCanvasElement | null>>({})
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const existingPdfUrlRef = React.useRef<string | null>(null)
  const pendingFlushRef = React.useRef<{ t: string; currentPages: CanvasPage[]; col: string; meta: { className: string; section: string; subject: string } } | null>(null)

  // localStorage key unique per note
  const lsKey = `note_draft_${noteId}`

  // Fetch / Init notes
  React.useEffect(() => {
    fetch(`/api/backend/teacher/notes/${noteId}`)
      .then(r => r.json())
      .then(d => {
        setTitle(d.note?.title ?? "")
        setColor(d.note?.color ?? "default")
        existingPdfUrlRef.current = d.note?.pdf_url || d.note?.pdfUrl || null

        const serverMeta = {
          className: d.note?.class || d.note?.class_ || "",
          section: d.note?.section || "",
          subject: d.note?.subject || ""
        }
        setNoteMeta(serverMeta)
        setDraftMeta(serverMeta)

        let initialPages: CanvasPage[] = []

        // Prefer localStorage draft if it exists (faster & survives offline edits)
        const lsDraft = typeof window !== "undefined" ? localStorage.getItem(lsKey) : null
        if (lsDraft) {
          try {
            const parsed = JSON.parse(lsDraft)
            if (parsed.isMd) {
              setMode("markdown")
              setMarkdownText(parsed.mdVal || "")
            } else {
              setMode("canvas")
              setMarkdownText("")
            }
            if (parsed && Array.isArray(parsed.pages)) {
              initialPages = parsed.pages.map((p: any) => ({
                id: p.id || `page-${Date.now()}`,
                backgroundType: p.backgroundType || "blank",
                drawings: p.drawings || [],
                images: p.images || [],
                texts: p.texts || [],
                shapes: p.shapes || []
              }))
              if (parsed.title) setTitle(parsed.title)
              if (parsed.color) setColor(parsed.color)
              if (parsed.meta) {
                setNoteMeta(parsed.meta)
                setDraftMeta(parsed.meta)
              }
            }
          } catch (e) { /* bad draft, fall through to server content */ }
        }

        // Fallback to server content if no local draft
        if (initialPages.length === 0 && d.note?.content) {
          try {
            const parsed = JSON.parse(d.note.content)
            if (parsed && Array.isArray(parsed.pages)) {
              setMode("canvas")
              setMarkdownText("")
              initialPages = parsed.pages.map((p: any) => ({
                id: p.id || `page-${Date.now()}`,
                backgroundType: p.backgroundType || "blank",
                drawings: p.drawings || [],
                images: p.images || [],
                texts: p.texts || [],
                shapes: p.shapes || []
              }))
            }
          } catch (e) {
            // Content is plain/markdown text instead of coordinates JSON. Convert to a text box!
            setMode("markdown")
            setMarkdownText(d.note.content)
            initialPages = [{
              id: `page-${Date.now()}`,
              backgroundType: "blank",
              drawings: [],
              images: [],
              texts: [],
              shapes: []
            }]
          }
        }

        if (initialPages.length === 0) {
          initialPages = [{
            id: `page-${Date.now()}`,
            backgroundType: "blank",
            drawings: [],
            images: [],
            texts: [],
            shapes: []
          }]
        }

        setPages(initialPages)
        setHistory([initialPages])
        setHistoryIndex(0)
      })
      .catch(() => toast.error("Failed to load note"))
      .finally(() => setLoading(false))
  }, [noteId])

  // Flush pending save to server (called by debounce & on unmount)
  const flushToServer = React.useCallback(async (t: string, currentPages: CanvasPage[], col: string, meta: { className: string; section: string; subject: string }) => {
    setSaveState("saving")
    const contentPayload = JSON.stringify({ version: 1, pages: currentPages })

    let uploadedPdfUrl: string | null = null
    const hasPenStrokes = currentPages.some(p => p.drawings && p.drawings.length > 0)
    if (hasPenStrokes) {
      try {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [800, 1100]
        })

        let addedPages = 0
        for (let i = 0; i < currentPages.length; i++) {
          const canvas = canvasRefs.current[i]
          if (!canvas) continue

          if (addedPages > 0) {
            doc.addPage([800, 1100])
          }

          const dataUrl = canvas.toDataURL("image/jpeg", 0.90)
          doc.addImage(dataUrl, "JPEG", 0, 0, 800, 1100)
          addedPages++
        }

        if (addedPages > 0) {
          const pdfBlob = doc.output("blob")
          const formData = new FormData()
          formData.append("file", pdfBlob, `${t || "Note"}.pdf`)
          formData.append("noteId", noteId as string)
          if (existingPdfUrlRef.current) {
            formData.append("oldPdfUrl", existingPdfUrlRef.current)
          }

          const uploadRes = await fetch("/api/teacher/notes/upload-pdf", {
            method: "POST",
            body: formData,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            if (uploadData.pdfUrl) {
              uploadedPdfUrl = uploadData.pdfUrl
              existingPdfUrlRef.current = uploadData.pdfUrl
            }
          }
        }
      } catch (err) {
        console.error("PDF generation/upload error on save:", err)
      }
    }

    try {
      const patchBody: any = {
        title: t || "Untitled",
        content: contentPayload,
        color: col,
        class: meta.className || null,
        section: meta.section || null,
        subject: meta.subject || null
      }
      if (uploadedPdfUrl) {
        patchBody.pdf_url = uploadedPdfUrl
      }

      const res = await fetch(`/api/backend/teacher/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      })

      if (res.ok) {
        setSaveState("saved")
        if (typeof window !== "undefined") localStorage.removeItem(lsKey)
      } else {
        setSaveState("unsaved")
      }
    } catch {
      setSaveState("unsaved")
    }
  }, [noteId, lsKey])

  // Unmount flush: send any queued data before leaving
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (pendingFlushRef.current) {
        const { t, currentPages, col, meta } = pendingFlushRef.current
        flushToServer(t, currentPages, col, meta)
      }
    }
  }, [flushToServer])

  // Warn if user closes tab with unsynced changes
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pendingFlushRef.current) {
        e.preventDefault()
        return (e.returnValue = "You have unsaved changes. Leave?")
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  function scheduleAutosave(t: string, currentPages: CanvasPage[], col: string, meta = noteMeta) {
    setSaveState("unsaved")

    // 1. Immediately persist draft to localStorage (zero network cost)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(lsKey, JSON.stringify({ version: 1, title: t, color: col, meta, pages: currentPages }))
      } catch (e) { /* quota exceeded — ignore */ }
    }

    // 2. Keep reference for unmount flush
    pendingFlushRef.current = { t, currentPages, col, meta }

    // 3. Debounce actual server PATCH to 10 s of inactivity
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pendingFlushRef.current = null
      flushToServer(t, currentPages, col, meta)
    }, 10000)
  }

  // Update states and save history
  const updatePagesState = (newPages: CanvasPage[]) => {
    const cleanHistory = history.slice(0, historyIndex + 1)
    setHistory([...cleanHistory, newPages])
    setHistoryIndex(cleanHistory.length)
    setPages(newPages)
    scheduleAutosave(title, newPages, color)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleAutosave(e.target.value, pages, color)
  }

  const handleColorChange = (key: string) => {
    setColor(key)
    scheduleAutosave(title, pages, key)
  }

  // Page level actions
  const addPage = () => {
    const newPage: CanvasPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      backgroundType: "blank",
      drawings: [],
      images: [],
      texts: [],
      shapes: []
    }
    const nextPages = [...pages, newPage]
    updatePagesState(nextPages)
    setActivePageIndex(nextPages.length - 1)
    toast.success("Page added")
  }

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      clearPage(index)
      return
    }
    const nextPages = pages.filter((_, idx) => idx !== index)
    updatePagesState(nextPages)
    setActivePageIndex(Math.max(0, index - 1))
    toast.success("Page deleted")
  }

  const clearPage = (index: number) => {
    const nextPages = pages.map((p, idx) => {
      if (idx === index) {
        return { ...p, drawings: [], images: [], texts: [], shapes: [] }
      }
      return p
    })
    updatePagesState(nextPages)
    toast.success("Page cleared")
  }

  const movePage = (index: number, dir: "up" | "down") => {
    if (dir === "up" && index === 0) return
    if (dir === "down" && index === pages.length - 1) return
    const swapTarget = dir === "up" ? index - 1 : index + 1
    const nextPages = [...pages]
    const temp = nextPages[index]
    nextPages[index] = nextPages[swapTarget]
    nextPages[swapTarget] = temp
    updatePagesState(nextPages)
    setActivePageIndex(swapTarget)
  }

  const changePageBackground = (index: number, bgType: CanvasPage["backgroundType"]) => {
    const nextPages = pages.map((p, idx) => {
      if (idx === index) {
        return { ...p, backgroundType: bgType }
      }
      return p
    })
    updatePagesState(nextPages)
  }

  // Image upload insertion with client-side JPEG compression
  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        const img = new Image()
        img.src = dataUrl
        img.onload = () => {
          let width = img.width
          let height = img.height
          const maxDim = 600
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (maxDim / width) * height
              width = maxDim
            } else {
              width = (maxDim / height) * width
              height = maxDim
            }
          }

          // Render image onto a small offscreen canvas to scale and compress it to jpeg
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const oCtx = canvas.getContext("2d")
          if (oCtx) {
            oCtx.drawImage(img, 0, 0, width, height)
            const compressedUrl = canvas.toDataURL("image/jpeg", 0.75) // 75% quality compresses highly with clean display

            const newImage: CanvasImage = {
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              src: compressedUrl,
              x: (800 - width) / 2,
              y: (1100 - height) / 2,
              width,
              height
            }

            const targetIdx = activePageIndex >= 0 && activePageIndex < pages.length ? activePageIndex : 0
            const nextPages = pages.map((p, idx) => {
              if (idx === targetIdx) {
                return { ...p, images: [...(p.images || []), newImage] }
              }
              return p
            })

            updatePagesState(nextPages)
            setSelectedId(newImage.id)
            setSelectedType("image")
            setSelectedPage(targetIdx)
            setTool("select") // Switch to select to scale/re-align
            toast.success("Image placed. Drag/resize to adjust position.")
          }
        }
      }
    }
    reader.readAsDataURL(file)
    e.target.value = "" // clear file input
  }

  // Export note pages to PDF
  const handleExportPDF = async () => {
    setExporting(true)
    toast.info("Generating PDF, please wait...")
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [800, 1100]
      })

      for (let i = 0; i < pages.length; i++) {
        const canvas = canvasRefs.current[i]
        if (!canvas) continue

        if (i > 0) {
          doc.addPage([800, 1100])
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.95)
        doc.addImage(dataUrl, "JPEG", 0, 0, 800, 1100)
      }

      doc.save(`${title || "Note"}.pdf`)
      toast.success("Note exported as PDF successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF")
    } finally {
      setExporting(false)
    }
  }

  // Undo/Redo logic
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1
      setHistoryIndex(prevIdx)
      setPages(history[prevIdx])
      scheduleAutosave(title, history[prevIdx], color)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1
      setHistoryIndex(nextIdx)
      setPages(history[nextIdx])
      scheduleAutosave(title, history[nextIdx], color)
    }
  }

  // Keyboard Shortcuts for Undo, Redo and Canvas Tools
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in inputs or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.contentEditable === "true"
      ) {
        return;
      }

      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleRedo();
        }
      } else if (!e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "v") { e.preventDefault(); setTool("select"); }
        else if (key === "p") { e.preventDefault(); setTool("pen"); }
        else if (key === "h") { e.preventDefault(); setTool("highlighter"); }
        else if (key === "e") { e.preventDefault(); setTool("eraser"); }
        else if (key === "z" && !e.ctrlKey) { e.preventDefault(); setTool("laser"); }
        else if (key === "t") { e.preventDefault(); setTool("text"); }
        else if (key === "r") { e.preventDefault(); setTool("rectangle"); }
        else if (key === "c") { e.preventDefault(); setTool("circle"); }
        else if (key === "a") { e.preventDefault(); setTool("arrow"); }
        else if (key === "l") { e.preventDefault(); setTool("line"); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, historyIndex, history, setTool]);

  const bgTheme = COLORS.find(c => c.key === color)?.bg ?? COLORS[0].bg

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen pb-24">
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={(o) => { setSettingsOpen(o); if (o) setDraftMeta(noteMeta) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2Icon className="h-4 w-4 text-primary" /> Note Settings
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach class, section, and subject to this note for easy reference.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-class" className="text-xs font-semibold">Class</Label>
              <MetaCombobox
                value={draftMeta.className}
                onChange={val => setDraftMeta(prev => ({ ...prev, className: val }))}
                options={CLASSES_LIST}
                placeholder="Select class..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-section" className="text-xs font-semibold">Section</Label>
              <MetaCombobox
                value={draftMeta.section}
                onChange={val => setDraftMeta(prev => ({ ...prev, section: val }))}
                options={SECTIONS_LIST}
                placeholder="Select section..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-subject" className="text-xs font-semibold">Subject</Label>
              <Input
                id="note-subject"
                placeholder="e.g. Mathematics, Physics"
                value={draftMeta.subject}
                onChange={e => setDraftMeta(prev => ({ ...prev, subject: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                setNoteMeta(draftMeta)
                setSettingsOpen(false)
                scheduleAutosave(title, pages, color, draftMeta)
                toast.success("Note settings saved")
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Portal: inject Back+title into the left title slot */}
      {mounted && typeof document !== "undefined" && document.getElementById("site-header-title") &&
        createPortal(
          <NoteHeaderLeft
            title={title}
            saveState={saveState}
            onBack={() => router.push(`/teacher/${username}/notes`)}
            onTitleChange={handleTitleChange}
          />,
          document.getElementById("site-header-title")!
        )
      }
      {/* Portal: inject PDF+Settings into the right actions slot */}
      {mounted && typeof document !== "undefined" && document.getElementById("site-header-actions") &&
        createPortal(
          <NoteHeaderRight
            exporting={exporting}
            onExport={handleExportPDF}
            onSettings={() => setSettingsOpen(true)}
            mode={mode}
            onToggle={() => setMode(m => m === "canvas" ? "markdown" : "canvas")}
          />,
          document.getElementById("site-header-actions")!
        )
      }

      {/* Pages Canvas Workspace */}
      <main className="flex-1 flex flex-row items-start py-6 gap-4 px-4 lg:px-6 w-full select-none pb-24 lg:pb-6">

        {/* ── Mobile toolbar: fixed bottom bar, hidden on lg ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden flex flex-row items-center gap-2 bg-white/95 dark:bg-zinc-900/95 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 overflow-x-auto select-none backdrop-blur-md">
          <ToolbarContent
            tool={tool} setTool={setTool}
            activeColor={activeColor} setActiveColor={setActiveColor}
            activeWidth={activeWidth} setActiveWidth={setActiveWidth}
            historyIndex={historyIndex} history={history}
            handleUndo={handleUndo} handleRedo={handleRedo}
            triggerImageUpload={triggerImageUpload}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            addPage={addPage}
          />
        </div>

        {/* ── Desktop toolbar: sticky left column, hidden below lg ── */}
        <div className="hidden lg:flex flex-col items-center gap-0 sticky top-6 self-start shrink-0 w-14 bg-white/95 dark:bg-zinc-900/95 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl px-2 py-3 overflow-y-auto">
          <ToolbarContent
            tool={tool} setTool={setTool}
            activeColor={activeColor} setActiveColor={setActiveColor}
            activeWidth={activeWidth} setActiveWidth={setActiveWidth}
            historyIndex={historyIndex} history={history}
            handleUndo={handleUndo} handleRedo={handleRedo}
            triggerImageUpload={triggerImageUpload}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            addPage={addPage}
          />
        </div>

        {/* Canvas Pages List Wrapper */}
        <div className="flex-1 flex flex-col gap-8 w-full max-w-[800px] mx-auto" style={{ transform: `scale(${canvasZoom})`, transformOrigin: "top center" }}>
          {pages.map((page, index) => (
            <div
              key={page.id}
              onClick={() => setActivePageIndex(index)}
              className="w-full flex flex-col gap-2"
            >
              {/* Page header controls */}
              <div className="flex flex-wrap items-center justify-between px-3 py-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xs rounded-lg border border-border/40 text-xs text-muted-foreground shadow-2xs">
                {/* Left: page number + background type selector */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Page {index + 1}</span>
                  <div className="h-3.5 w-px bg-border/60" />
                  {(["blank", "ruled", "grid", "dotted"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => changePageBackground(index, type)}
                      className={cn(
                        "px-2 py-0.5 rounded cursor-pointer transition-colors uppercase text-[9px] font-bold",
                        page.backgroundType === type
                          ? "bg-zinc-200 dark:bg-zinc-800 text-foreground"
                          : "hover:text-foreground"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Right: move / clear / delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => movePage(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Move Page Up"
                  >
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => movePage(index, "down")}
                    disabled={index === pages.length - 1}
                    className="p-1 rounded hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Move Page Down"
                  >
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => clearPage(index)}
                    className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Clear Page"
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deletePage(index)}
                    disabled={pages.length <= 1}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Delete Page"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-canvas component */}
              <CanvasPageElement
                page={page}
                pageIndex={index}
                isActive={activePageIndex === index}
                activeTool={tool}
                activeColor={activeColor}
                activeWidth={activeWidth}
                onUpdatePage={(updatedPage) => {
                  const nextPages = pages.map((p, idx) => (idx === index ? updatedPage : p))
                  updatePagesState(nextPages)
                }}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedPage={selectedPage}
                setSelectedPage={setSelectedPage}
                canvasRefSetter={(el) => {
                  canvasRefs.current[index] = el
                }}
                onFocus={() => setActivePageIndex(index)}
                setTool={setTool}
              />
            </div>
          ))}
        </div>

        {/* Text Settings Right Panel */}
        {(() => {
          const selText = selectedType === "text" && selectedPage !== null
            ? pages[selectedPage]?.texts?.find(t => t.id === selectedId)
            : null
          if (!selText && tool !== "text") return null
          const textToShow = selText ?? { id: "", text: "", x: 0, y: 0, fontSize: 24, color: activeColor }
          return (
            <TextSettingsPanel
              text={textToShow}
              onChange={(updated) => {
                if (!selText || selectedPage === null) {
                  setActiveColor(updated.color)
                  return
                }
                const nextPages = pages.map((p, idx) =>
                  idx === selectedPage
                    ? { ...p, texts: p.texts.map(t => t.id === updated.id ? updated : t) }
                    : p
                )
                updatePagesState(nextPages)
              }}
            />
          )
        })()}
      </main>
    </div>
    </TooltipProvider>
  )
}

