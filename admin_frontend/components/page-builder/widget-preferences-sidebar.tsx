"use client"

import * as React from "react"
import {
  PanelRightClose,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  MousePointer,
  LayoutGrid,
  BarChart3,
  FileText,
  Video,
  Heading,
  List,
  Quote,
  Minus,
  Settings,
  Globe,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Upload,
  Play,
  Eye,
  ExternalLink,
  Download,
  Sparkles,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { TableCellButtonData, TableCellData, ButtonItem, CardItem } from "./editorjs-tools"

export interface SelectedBlock {
  id: string
  type: string
  data: Record<string, unknown>
  index: number
}

interface WidgetPreferencesSidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedBlock: SelectedBlock | null
  onUpdateData: (patch: Record<string, unknown>) => void
  onDeleteBlock: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  pageMeta: {
    title: string
    slug: string
    status: "published" | "draft"
  }
  onUpdatePageMeta: (patch: { title?: string; slug?: string; status?: "published" | "draft" }) => void
}

export function WidgetPreferencesSidebar({
  isOpen,
  onClose,
  selectedBlock,
  onUpdateData,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  canMoveUp,
  canMoveDown,
  pageMeta,
  onUpdatePageMeta,
}: WidgetPreferencesSidebarProps) {
  const [copiedUrl, setCopiedUrl] = React.useState(false)

  const getBlockMeta = (type: string) => {
    switch (type) {
      case "button":
        return { name: "CTA Button", icon: MousePointer, color: "text-primary bg-primary/10" }
      case "alert":
        return { name: "Notice / Alert", icon: AlertCircle, color: "text-amber-600 bg-amber-500/10" }
      case "card":
        return { name: "Feature Card", icon: LayoutGrid, color: "text-blue-600 bg-blue-500/10" }
      case "stats":
        return { name: "Stats Counter", icon: BarChart3, color: "text-emerald-600 bg-emerald-500/10" }
      case "pdf":
        return { name: "PDF Document", icon: FileText, color: "text-rose-600 bg-rose-500/10" }
      case "video":
        return { name: "YouTube Video", icon: Video, color: "text-purple-600 bg-purple-500/10" }
      case "header":
        return { name: "Heading", icon: Heading, color: "text-foreground bg-muted" }
      case "paragraph":
        return { name: "Paragraph", icon: FileText, color: "text-foreground bg-muted" }
      case "quote":
        return { name: "Testimonial Quote", icon: Quote, color: "text-foreground bg-muted" }
      case "list":
        return { name: "List", icon: List, color: "text-foreground bg-muted" }
      case "delimiter":
        return { name: "Divider", icon: Minus, color: "text-foreground bg-muted" }
      case "table":
        return { name: "Data Table & Actions", icon: TableIcon, color: "text-cyan-600 bg-cyan-500/10" }
      default:
        return { name: type, icon: Settings, color: "text-foreground bg-muted" }
    }
  }

  const blockMeta = selectedBlock ? getBlockMeta(selectedBlock.type) : null
  const IconComp = blockMeta?.icon || Settings

  return (
    <aside
      className={cn(
        "border-l bg-card/70 backdrop-blur-xs transition-all duration-200 flex flex-col shrink-0 z-20 overflow-hidden",
        isOpen ? "w-72 sm:w-80" : "w-0 border-l-0"
      )}
    >
      {/* Top Header */}
      <div className="h-14 px-4 border-b flex items-center justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("size-7 rounded-md flex items-center justify-center shrink-0 border", blockMeta?.color || "bg-muted")}>
            <IconComp className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-xs tracking-tight text-foreground truncate block">
              {selectedBlock ? blockMeta?.name : "Page Preferences"}
            </span>
            <span className="text-[10px] text-muted-foreground block truncate">
              {selectedBlock ? `Block #${selectedBlock.index + 1}` : "General Settings"}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Collapse preferences"
        >
          <PanelRightClose className="size-3.5" />
        </Button>
      </div>

      {/* Action Toolbar for Selected Block */}
      {selectedBlock && (
        <div className="px-3 py-2 border-b flex items-center justify-between bg-muted/10 text-xs">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="h-7 w-7"
              title="Move Up"
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="h-7 w-7"
              title="Move Down"
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDuplicate}
              className="h-7 w-7"
              title="Duplicate Block"
            >
              <Copy className="size-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteBlock}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            title="Delete Block"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {selectedBlock ? (
          <>
            {/* 1. CTA Button Properties */}
            {selectedBlock.type === "button" && (
              <ButtonBlockInspector data={selectedBlock.data} onUpdateData={onUpdateData} />
            )}

            {/* 2. Notice / Alert Properties */}
            {selectedBlock.type === "alert" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label>Alert Status Type</Label>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {(
                      [
                        { id: "warning", label: "Warning", color: "border-amber-500/40 text-amber-600 bg-amber-500/10" },
                        { id: "destructive", label: "Urgent", color: "border-destructive/40 text-destructive bg-destructive/10" },
                        { id: "success", label: "Success", color: "border-emerald-500/40 text-emerald-600 bg-emerald-500/10" },
                        { id: "default", label: "Info", color: "border-border text-foreground bg-muted" },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onUpdateData({ variant: st.id })}
                        className={cn(
                          "px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all text-center",
                          (selectedBlock.data.variant || "warning") === st.id
                            ? cn("ring-2 ring-primary ring-offset-1 font-semibold", st.color)
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alert-title">Notice Title</Label>
                  <Input
                    id="alert-title"
                    value={String(selectedBlock.data.title || "")}
                    onChange={(e) => onUpdateData({ title: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. Admissions Circular 2026-27"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alert-message">Notice Details & Message</Label>
                  <Textarea
                    id="alert-message"
                    value={String(selectedBlock.data.message || "")}
                    onChange={(e) => onUpdateData({ message: e.target.value })}
                    className="text-xs min-h-[90px] leading-relaxed"
                    placeholder="Enter detailed notice message..."
                  />
                </div>
              </div>
            )}

            {/* 3. Feature Card Properties */}
            {selectedBlock.type === "card" && (
              <CardBlockInspector data={selectedBlock.data} onUpdateData={onUpdateData} />
            )}

            {/* 4. Stats Counter Properties */}
            {selectedBlock.type === "stats" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="stat-val">Metric / Number</Label>
                  <Input
                    id="stat-val"
                    value={String(selectedBlock.data.stat || "")}
                    onChange={(e) => onUpdateData({ stat: e.target.value })}
                    className="h-8 text-xs font-bold text-primary"
                    placeholder="e.g. 100% or 1,500+"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stat-lbl">Metric Label</Label>
                  <Input
                    id="stat-lbl"
                    value={String(selectedBlock.data.label || "")}
                    onChange={(e) => onUpdateData({ label: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. CBSE Pass Percentage"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stat-sub">Subtext / Details</Label>
                  <Input
                    id="stat-sub"
                    value={String(selectedBlock.data.subtext || "")}
                    onChange={(e) => onUpdateData({ subtext: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. 5 consecutive academic batches"
                  />
                </div>
              </div>
            )}

            {/* 5. PDF Document Properties */}
            {selectedBlock.type === "pdf" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-title">Document Title</Label>
                  <Input
                    id="pdf-title"
                    value={String(selectedBlock.data.title || "")}
                    onChange={(e) => onUpdateData({ title: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. Mandatory Disclosure.pdf"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pdf-url">PDF File URL</Label>
                  <Input
                    id="pdf-url"
                    value={String(selectedBlock.data.url || "")}
                    onChange={(e) => onUpdateData({ url: e.target.value })}
                    className="h-8 text-xs font-mono"
                    placeholder="https://... file link"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pdf-size">File Size / Format</Label>
                  <Input
                    id="pdf-size"
                    value={String(selectedBlock.data.fileSize || "")}
                    onChange={(e) => onUpdateData({ fileSize: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. 2.4 MB PDF"
                  />
                </div>
              </div>
            )}

            {/* 6. Video Properties */}
            {selectedBlock.type === "video" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="video-url">YouTube Video URL</Label>
                  <Input
                    id="video-url"
                    value={String(selectedBlock.data.url || "")}
                    onChange={(e) => onUpdateData({ url: e.target.value })}
                    className="h-8 text-xs font-mono"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="video-cap">Video Caption</Label>
                  <Input
                    id="video-cap"
                    value={String(selectedBlock.data.caption || "")}
                    onChange={(e) => onUpdateData({ caption: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. School Annual Fest Highlights"
                  />
                </div>
              </div>
            )}

            {/* 7. Heading Properties */}
            {selectedBlock.type === "header" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label>Heading Level</Label>
                  <div className="flex gap-1 pt-1">
                    {([1, 2, 3, 4] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => onUpdateData({ level: lvl })}
                        className={cn(
                          "flex-1 h-8 rounded-md border text-xs font-bold transition-all",
                          Number(selectedBlock.data.level || 2) === lvl
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        H{lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="head-text">Heading Text</Label>
                  <Input
                    id="head-text"
                    value={String(selectedBlock.data.text || "")}
                    onChange={(e) => onUpdateData({ text: e.target.value })}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            {/* 8. Text Paragraph Properties */}
            {selectedBlock.type === "paragraph" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="para-text">Paragraph Content</Label>
                  <Textarea
                    id="para-text"
                    value={String(selectedBlock.data.text || "")}
                    onChange={(e) => onUpdateData({ text: e.target.value })}
                    className="text-xs min-h-[120px] leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 9. Quote Properties */}
            {selectedBlock.type === "quote" && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-text">Quote Text</Label>
                  <Textarea
                    id="quote-text"
                    value={String(selectedBlock.data.text || "")}
                    onChange={(e) => onUpdateData({ text: e.target.value })}
                    className="text-xs min-h-[90px] italic"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-caption">Author / Citation</Label>
                  <Input
                    id="quote-caption"
                    value={String(selectedBlock.data.caption || "")}
                    onChange={(e) => onUpdateData({ caption: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="e.g. Alumnus Parent"
                  />
                </div>
              </div>
            )}

            {/* 10. Smart Table & Action Buttons Inspector */}
            {selectedBlock.type === "table" && (
              <TableBlockInspector data={selectedBlock.data} onUpdateData={onUpdateData} />
            )}
          </>
        ) : (
          /* When no block is selected: show Page Settings */
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <span className="font-semibold text-xs text-foreground block">
                Select an Element
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click any widget or element on the canvas to customize its layout, styling, and content.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="meta-title">Page Title</Label>
                <Input
                  id="meta-title"
                  value={pageMeta.title}
                  onChange={(e) => onUpdatePageMeta({ title: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meta-slug">URL Slug</Label>
                <div className="flex items-center rounded-md border bg-muted/40 px-2.5">
                  <span className="text-[11px] text-muted-foreground select-none font-mono">/p/</span>
                  <Input
                    id="meta-slug"
                    value={pageMeta.slug}
                    onChange={(e) => onUpdatePageMeta({ slug: e.target.value })}
                    className="h-8 border-0 bg-transparent px-1 text-xs font-mono focus-visible:ring-0 shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Publishing Status</Label>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdatePageMeta({ status: "published" })}
                    className={cn(
                      "flex-1 h-8 rounded-md border text-xs font-medium transition-all text-center",
                      pageMeta.status === "published"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-semibold"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePageMeta({ status: "draft" })}
                    className={cn(
                      "flex-1 h-8 rounded-md border text-xs font-medium transition-all text-center",
                      pageMeta.status === "draft"
                        ? "border-border bg-secondary text-foreground font-semibold"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Draft
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Public URL:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const origin = typeof window !== "undefined" ? window.location.origin.replace(":3001", ":3000") : ""
                      navigator.clipboard.writeText(`${origin}/p/${pageMeta.slug}`)
                      setCopiedUrl(true)
                      setTimeout(() => setCopiedUrl(false), 2000)
                    }}
                    className="hover:text-foreground flex items-center gap-1 font-mono text-[10px]"
                  >
                    {copiedUrl ? <Check className="size-3 text-emerald-600" /> : <Globe className="size-3" />}
                    /p/{pageMeta.slug}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function ButtonBlockInspector({
  data,
  onUpdateData,
}: {
  data: Record<string, unknown>
  onUpdateData: (patch: Record<string, unknown>) => void
}) {
  const align = (data.align as "left" | "center" | "right") || "left"

  const rawItems: ButtonItem[] =
    Array.isArray(data.items) && data.items.length > 0
      ? (data.items as ButtonItem[])
      : [
          {
            id: "btn-1",
            text: (data.text as string) || "Apply for Admissions Online",
            url: (data.url as string) || "/admissions",
            variant: (data.variant as "default" | "secondary" | "outline" | "destructive") || "default",
          },
        ]

  const [activeIndex, setActiveIndex] = React.useState<number>(0)

  const handleSetAlign = (newAlign: "left" | "center" | "right") => {
    onUpdateData({ align: newAlign })
  }

  const handleAddButton = () => {
    const newItem: ButtonItem = {
      id: `btn-${Date.now()}`,
      text: "Learn More",
      url: "#",
      variant: "outline",
    }
    const updated = [...rawItems, newItem]
    onUpdateData({
      items: updated,
      align,
      text: updated[0].text,
      url: updated[0].url,
      variant: updated[0].variant,
    })
    setActiveIndex(updated.length - 1)
    toast.success("Added new button")
  }

  const handleUpdateItem = (index: number, patch: Partial<ButtonItem>) => {
    const updated = rawItems.map((btn, i) => (i === index ? { ...btn, ...patch } : btn))
    onUpdateData({
      items: updated,
      align,
      text: updated[0]?.text || "",
      url: updated[0]?.url || "",
      variant: updated[0]?.variant || "default",
    })
  }

  const handleRemoveItem = (index: number) => {
    if (rawItems.length <= 1) {
      toast.error("You must have at least one button")
      return
    }
    const updated = rawItems.filter((_, i) => i !== index)
    onUpdateData({
      items: updated,
      align,
      text: updated[0]?.text || "",
      url: updated[0]?.url || "",
      variant: updated[0]?.variant || "default",
    })
    if (activeIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1))
    }
    toast.success("Button removed")
  }

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= rawItems.length) return
    const updated = [...rawItems]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    onUpdateData({
      items: updated,
      align,
      text: updated[0]?.text || "",
      url: updated[0]?.url || "",
      variant: updated[0]?.variant || "default",
    })
    setActiveIndex(target)
  }

  return (
    <div className="space-y-4">
      {/* Container Alignment */}
      <div className="space-y-1.5">
        <Label>Row Alignment</Label>
        <div className="flex items-center gap-1 pt-1">
          {(
            [
              { id: "left", icon: AlignLeft, label: "Left" },
              { id: "center", icon: AlignCenter, label: "Center" },
              { id: "right", icon: AlignRight, label: "Right" },
            ] as const
          ).map((al) => {
            const AlignIcon = al.icon
            const isActive = align === al.id
            return (
              <button
                key={al.id}
                type="button"
                onClick={() => handleSetAlign(al.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 h-8 rounded-md border text-xs transition-all",
                  isActive
                    ? "bg-foreground text-background border-foreground font-semibold"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <AlignIcon className="size-3.5" />
                <span>{al.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Buttons List Header */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <Label className="font-semibold">Buttons</Label>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
            {rawItems.length}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddButton}
          className="h-7 text-xs px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10"
        >
          <Plus className="size-3.5" />
          <span>Add Button</span>
        </Button>
      </div>

      {/* Button Items */}
      <div className="space-y-2.5">
        {rawItems.map((btn, idx) => {
          const isExpanded = activeIndex === idx
          return (
            <div
              key={btn.id || idx}
              className={cn(
                "rounded-lg border bg-background overflow-hidden transition-all",
                isExpanded ? "border-primary/50 shadow-xs ring-1 ring-primary/20" : "border-border/80"
              )}
            >
              {/* Item Header */}
              <div
                onClick={() => setActiveIndex(isExpanded ? -1 : idx)}
                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-xs text-foreground truncate max-w-[110px]">
                    {btn.text || "Untitled"}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider bg-muted/60 text-muted-foreground">
                    {btn.variant === "default" ? "Primary" : btn.variant}
                  </span>
                </div>

                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => handleMoveItem(idx, "up")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === rawItems.length - 1}
                    onClick={() => handleMoveItem(idx, "down")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={rawItems.length <= 1}
                    onClick={() => handleRemoveItem(idx)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Delete button"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Item Body (When Expanded) */}
              {isExpanded && (
                <div className="p-3 border-t border-border/50 bg-muted/20 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`btn-text-${idx}`} className="text-[11px]">Button Label</Label>
                    <Input
                      id={`btn-text-${idx}`}
                      value={btn.text}
                      onChange={(e) => handleUpdateItem(idx, { text: e.target.value })}
                      className="h-7 text-xs bg-background"
                      placeholder="e.g. Apply Now"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`btn-url-${idx}`} className="text-[11px]">Target Link / URL</Label>
                    <Input
                      id={`btn-url-${idx}`}
                      value={btn.url}
                      onChange={(e) => handleUpdateItem(idx, { url: e.target.value })}
                      className="h-7 text-xs font-mono bg-background"
                      placeholder="/p/tech-fest or https://..."
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Use <span className="font-mono font-medium">/p/...</span> for fast Next.js page routing, or external <span className="font-mono font-medium">https://...</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Style Variant</Label>
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      {(["default", "secondary", "outline", "destructive"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleUpdateItem(idx, { variant: v })}
                          className={cn(
                            "px-2 py-1 rounded text-[11px] font-medium capitalize transition-all text-center border",
                            btn.variant === v
                              ? "bg-foreground text-background border-foreground font-semibold"
                              : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {v === "default" ? "Primary" : v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CardBlockInspector({
  data,
  onUpdateData,
}: {
  data: Record<string, unknown>
  onUpdateData: (patch: Record<string, unknown>) => void
}) {
  const columns = Number(data.columns) || 2

  const rawItems: CardItem[] =
    Array.isArray(data.items) && data.items.length > 0
      ? (data.items as CardItem[])
      : [
          {
            id: "card-1",
            badge: (data.badge as string) || "Academic Highlight",
            title: (data.title as string) || "Smart Robotics & AI Lab",
            description:
              (data.description as string) ||
              "Hands-on experiential learning facilities equipped with modern robotics kits.",
            linkUrl: (data.linkUrl as string) || "",
          },
        ]

  const [activeIndex, setActiveIndex] = React.useState<number>(0)

  const handleSetColumns = (cols: number) => {
    onUpdateData({ columns: cols })
  }

  const handleAddCard = () => {
    const newCard: CardItem = {
      id: `card-${Date.now()}`,
      badge: "Highlight",
      title: `Feature Card ${rawItems.length + 1}`,
      description: "Enter detailed description for this feature highlight.",
      linkUrl: "",
    }
    const updated = [...rawItems, newCard]
    const newCols = columns === 1 && updated.length >= 2 ? (updated.length >= 3 ? 3 : 2) : columns
    onUpdateData({
      columns: newCols,
      items: updated,
      badge: updated[0].badge,
      title: updated[0].title,
      description: updated[0].description,
      linkUrl: updated[0].linkUrl,
    })
    setActiveIndex(updated.length - 1)
    toast.success("Added new card")
  }

  const handleUpdateCard = (index: number, patch: Partial<CardItem>) => {
    const updated = rawItems.map((c, i) => (i === index ? { ...c, ...patch } : c))
    onUpdateData({
      items: updated,
      badge: updated[0]?.badge || "",
      title: updated[0]?.title || "",
      description: updated[0]?.description || "",
      linkUrl: updated[0]?.linkUrl || "",
    })
  }

  const handleRemoveCard = (index: number) => {
    if (rawItems.length <= 1) {
      toast.error("You must have at least one card")
      return
    }
    const updated = rawItems.filter((_, i) => i !== index)
    onUpdateData({
      items: updated,
      badge: updated[0]?.badge || "",
      title: updated[0]?.title || "",
      description: updated[0]?.description || "",
      linkUrl: updated[0]?.linkUrl || "",
    })
    if (activeIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1))
    }
    toast.success("Card removed")
  }

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= rawItems.length) return
    const updated = [...rawItems]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    onUpdateData({
      items: updated,
      badge: updated[0]?.badge || "",
      title: updated[0]?.title || "",
      description: updated[0]?.description || "",
      linkUrl: updated[0]?.linkUrl || "",
    })
    setActiveIndex(target)
  }

  return (
    <div className="space-y-4">
      {/* Grid Columns Layout */}
      <div className="space-y-1.5">
        <Label>Grid Columns</Label>
        <div className="grid grid-cols-4 gap-1 pt-1">
          {([1, 2, 3, 4] as const).map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => handleSetColumns(col)}
              className={cn(
                "h-8 rounded-md border text-xs font-semibold transition-all text-center",
                columns === col
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {col} {col === 1 ? "Col" : "Cols"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List Header */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <Label className="font-semibold">Cards</Label>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
            {rawItems.length}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddCard}
          className="h-7 text-xs px-2 gap-1 text-primary border-primary/30 hover:bg-primary/10"
        >
          <Plus className="size-3.5" />
          <span>Add Card</span>
        </Button>
      </div>

      {/* Card Items */}
      <div className="space-y-2.5">
        {rawItems.map((c, idx) => {
          const isExpanded = activeIndex === idx
          return (
            <div
              key={c.id || idx}
              className={cn(
                "rounded-lg border bg-background overflow-hidden transition-all",
                isExpanded ? "border-primary/50 shadow-xs ring-1 ring-primary/20" : "border-border/80"
              )}
            >
              {/* Card Header */}
              <div
                onClick={() => setActiveIndex(isExpanded ? -1 : idx)}
                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-xs text-foreground truncate max-w-[120px]">
                    {c.title || "Untitled Card"}
                  </span>
                </div>

                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => handleMoveCard(idx, "up")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === rawItems.length - 1}
                    onClick={() => handleMoveCard(idx, "down")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={rawItems.length <= 1}
                    onClick={() => handleRemoveCard(idx)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Delete card"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Card Body (When Expanded) */}
              {isExpanded && (
                <div className="p-3 border-t border-border/50 bg-muted/20 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`card-badge-${idx}`} className="text-[11px]">Category Badge</Label>
                    <Input
                      id={`card-badge-${idx}`}
                      value={c.badge}
                      onChange={(e) => handleUpdateCard(idx, { badge: e.target.value })}
                      className="h-7 text-xs bg-background"
                      placeholder="e.g. STEM Labs, Sports, Highlights"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`card-title-${idx}`} className="text-[11px]">Card Title</Label>
                    <Input
                      id={`card-title-${idx}`}
                      value={c.title}
                      onChange={(e) => handleUpdateCard(idx, { title: e.target.value })}
                      className="h-7 text-xs bg-background"
                      placeholder="e.g. Smart Robotics & AI Lab"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`card-desc-${idx}`} className="text-[11px]">Description</Label>
                    <Textarea
                      id={`card-desc-${idx}`}
                      value={c.description}
                      onChange={(e) => handleUpdateCard(idx, { description: e.target.value })}
                      className="text-xs min-h-[70px] leading-relaxed bg-background"
                      placeholder="Enter details explaining the feature..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`card-link-${idx}`} className="text-[11px]">Optional Target Link</Label>
                    <Input
                      id={`card-link-${idx}`}
                      value={c.linkUrl || ""}
                      onChange={(e) => handleUpdateCard(idx, { linkUrl: e.target.value })}
                      className="h-7 text-xs font-mono bg-background"
                      placeholder="/p/tech-fest or https://..."
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Use <span className="font-mono font-medium">/p/...</span> for Next.js internal link, or full URL for external
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TableBlockInspector({
  data,
  onUpdateData,
}: {
  data: Record<string, unknown>
  onUpdateData: (patch: Record<string, unknown>) => void
}) {
  const content: TableCellData[][] = Array.isArray(data.content)
    ? (data.content as TableCellData[][])
    : [["Col 1", "Col 2"], ["Data 1", "Data 2"]]
  const withHeadings = Boolean(data.withHeadings ?? true)

  const [selectedRow, setSelectedRow] = React.useState(1)
  const [selectedCol, setSelectedCol] = React.useState(0)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Sync with cell clicks from the canvas
  React.useEffect(() => {
    const handleTableCellSelect = (e: Event) => {
      const custom = e as CustomEvent<{ rowIndex: number; colIndex: number; cell: TableCellData }>
      if (custom.detail) {
        setSelectedRow(custom.detail.rowIndex)
        setSelectedCol(custom.detail.colIndex)
      }
    }
    window.addEventListener("pagebuilder:select-table-cell", handleTableCellSelect)
    return () => window.removeEventListener("pagebuilder:select-table-cell", handleTableCellSelect)
  }, [])

  const rowCount = content.length
  const colCount = content[0]?.length || 0
  const safeRow = Math.min(selectedRow, Math.max(0, rowCount - 1))
  const safeCol = Math.min(selectedCol, Math.max(0, colCount - 1))
  const currentCell = content[safeRow]?.[safeCol]
  const isButton = typeof currentCell === "object" && currentCell !== null && "isButton" in currentCell && currentCell.isButton

  const handleAddRow = () => {
    const newRow: TableCellData[] = Array(colCount || 2).fill("New Cell")
    const newContent = [...content, newRow]
    onUpdateData({ content: newContent })
    setSelectedRow(newContent.length - 1)
  }

  const handleRemoveRow = () => {
    if (content.length <= 1) return
    const newContent = content.slice(0, -1)
    onUpdateData({ content: newContent })
    if (safeRow >= newContent.length) setSelectedRow(newContent.length - 1)
  }

  const handleAddCol = () => {
    const newContent = content.map((r, idx) => [
      ...r,
      idx === 0 && withHeadings ? "New Column" : "New Cell",
    ])
    onUpdateData({ content: newContent })
    setSelectedCol(colCount)
  }

  const handleRemoveCol = () => {
    if (colCount <= 1) return
    const newContent = content.map((r) => r.slice(0, -1))
    onUpdateData({ content: newContent })
    if (safeCol >= colCount - 1) setSelectedCol(Math.max(0, colCount - 2))
  }

  const handleToggleHeadings = () => {
    onUpdateData({ withHeadings: !withHeadings })
  }

  const handleConvertToButton = () => {
    const prevText = typeof currentCell === "string" ? currentCell : ""
    const btnData: TableCellButtonData = {
      isButton: true,
      label: prevText || "View PDF",
      url: "",
      actionType: "view_pdf",
      icon: "file-text",
      variant: "default",
    }
    const newContent = content.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === safeRow && cIdx === safeCol ? btnData : c))
    )
    onUpdateData({ content: newContent })
  }

  const handleConvertToText = () => {
    const text =
      typeof currentCell === "object" && currentCell !== null && "label" in currentCell
        ? (currentCell as TableCellButtonData).label
        : ""
    const newContent = content.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === safeRow && cIdx === safeCol ? text : c))
    )
    onUpdateData({ content: newContent })
  }

  const handleUpdateButton = (patch: Partial<TableCellButtonData>) => {
    if (!isButton) return
    const updatedBtn: TableCellButtonData = {
      ...(currentCell as TableCellButtonData),
      ...patch,
      isButton: true,
    }
    const newContent = content.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === safeRow && cIdx === safeCol ? updatedBtn : c))
    )
    onUpdateData({ content: newContent })
  }

  const handleUpdateText = (val: string) => {
    const newContent = content.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === safeRow && cIdx === safeCol ? val : c))
    )
    onUpdateData({ content: newContent })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/page-builder/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to upload file to S3")
      }

      const resData = await res.json()
      const s3Url = resData.url || resData.fileUrl

      const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf")
      const isVideo =
        Boolean(file.name.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/)) || file.type.includes("video")

      const detectedAction: TableCellButtonData["actionType"] = isPdf
        ? "view_pdf"
        : isVideo
        ? "view_video"
        : "download"

      const detectedIcon = isPdf ? "file-text" : isVideo ? "video" : "download"

      handleUpdateButton({
        url: s3Url,
        actionType: detectedAction,
        icon: detectedIcon,
        label: (currentCell as TableCellButtonData)?.label || file.name.replace(/\.[^/.]+$/, ""),
      })

      toast.success(`Uploaded ${file.name} to AWS S3`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "S3 Upload failed"
      toast.error(msg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const btnData = isButton ? (currentCell as TableCellButtonData) : null

  return (
    <div className="space-y-4">
      {/* Table grid dimensions & actions */}
      <div className="rounded-lg border bg-muted/20 p-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Table Dimensions</span>
          <span className="text-muted-foreground">
            {rowCount} rows × {colCount} cols
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" onClick={handleAddRow} className="h-7 text-xs gap-1">
            <Plus className="size-3" /> Add Row
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveRow}
            disabled={rowCount <= 1}
            className="h-7 text-xs gap-1"
          >
            <Minus className="size-3" /> Remove Row
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddCol} className="h-7 text-xs gap-1">
            <Plus className="size-3" /> Add Column
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveCol}
            disabled={colCount <= 1}
            className="h-7 text-xs gap-1"
          >
            <Minus className="size-3" /> Remove Col
          </Button>
        </div>
        <div className="pt-1 flex items-center justify-between border-t border-border/40">
          <span className="text-xs text-muted-foreground">Header Row</span>
          <Button
            variant={withHeadings ? "default" : "outline"}
            size="sm"
            onClick={handleToggleHeadings}
            className="h-6 px-2 text-[11px]"
          >
            {withHeadings ? "Enabled" : "Disabled"}
          </Button>
        </div>
      </div>

      {/* Target Cell Selector */}
      <div className="rounded-lg border p-2.5 space-y-2 bg-card">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Select Cell to Edit</Label>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">
            R{safeRow + 1}:C{safeCol + 1}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Row</span>
            <select
              value={safeRow}
              onChange={(e) => setSelectedRow(Number(e.target.value))}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {content.map((_, rIdx) => (
                <option key={rIdx} value={rIdx}>
                  {rIdx === 0 && withHeadings ? `Row 1 (Header)` : `Row ${rIdx + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Column</span>
            <select
              value={safeCol}
              onChange={(e) => setSelectedCol(Number(e.target.value))}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {Array.from({ length: colCount }).map((_, cIdx) => (
                <option key={cIdx} value={cIdx}>
                  Col {cIdx + 1} ({String(content[0]?.[cIdx] || `Col ${cIdx + 1}`).slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cell Type Toggle */}
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <span className="text-[11px] font-medium text-foreground block">Cell Format</span>
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-muted">
            <button
              type="button"
              onClick={handleConvertToText}
              className={cn(
                "py-1 text-xs rounded font-medium transition-all cursor-pointer text-center",
                !isButton
                  ? "bg-background shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              📝 Text
            </button>
            <button
              type="button"
              onClick={handleConvertToButton}
              className={cn(
                "py-1 text-xs rounded font-medium transition-all cursor-pointer text-center",
                isButton
                  ? "bg-background shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              🔘 Button
            </button>
          </div>
        </div>

        {/* Text Cell Editor */}
        {!isButton && (
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="cell-text">Cell Text</Label>
            <Input
              id="cell-text"
              value={typeof currentCell === "string" ? currentCell : ""}
              onChange={(e) => handleUpdateText(e.target.value)}
              className="h-8 text-xs"
              placeholder="Enter cell text..."
            />
          </div>
        )}

        {/* Interactive Button Editor */}
        {isButton && btnData && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label htmlFor="tbl-btn-label">Button Label</Label>
              <Input
                id="tbl-btn-label"
                value={btnData.label || ""}
                onChange={(e) => handleUpdateButton({ label: e.target.value })}
                className="h-8 text-xs font-medium"
                placeholder="e.g. View PDF, Watch Video..."
              />
            </div>

            {/* Action Event / Type */}
            <div className="space-y-1.5">
              <Label>Action Event / Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "view_pdf", label: "View PDF", icon: FileText },
                  { id: "view_video", label: "Watch Video", icon: Video },
                  { id: "link", label: "Open Link", icon: ExternalLink },
                  { id: "download", label: "Download", icon: Download },
                ].map((act) => {
                  const ActIcon = act.icon
                  const active = (btnData.actionType || "view_pdf") === act.id
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() =>
                        handleUpdateButton({
                          actionType: act.id as TableCellButtonData["actionType"],
                        })
                      }
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs text-left transition-all cursor-pointer",
                        active
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <ActIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{act.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Button Icon Selector */}
            <div className="space-y-1.5">
              <Label>Select Button Icon</Label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "file-text", icon: FileText, label: "PDF" },
                  { id: "video", icon: Video, label: "Video" },
                  { id: "download", icon: Download, label: "Download" },
                  { id: "eye", icon: Eye, label: "Preview" },
                  { id: "play", icon: Play, label: "Play" },
                  { id: "external-link", icon: ExternalLink, label: "Link" },
                  { id: "arrow-right", icon: ArrowRight, label: "Arrow" },
                  { id: "sparkles", icon: Sparkles, label: "Star" },
                ].map((item) => {
                  const ItemIcon = item.icon
                  const active = (btnData.icon || "file-text") === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => handleUpdateButton({ icon: item.id })}
                      className={cn(
                        "h-8 flex flex-col items-center justify-center rounded border transition-all cursor-pointer",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <ItemIcon className="size-3.5" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Button Style Variant */}
            <div className="space-y-1.5">
              <Label>Button Style Variant</Label>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {(["default", "secondary", "outline", "destructive"] as const).map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant={v}
                    size="sm"
                    onClick={() => handleUpdateButton({ variant: v })}
                    className={cn(
                      "h-7 text-xs capitalize",
                      (btnData.variant || "default") === v && "ring-2 ring-primary ring-offset-1"
                    )}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* Button URL / Link */}
            <div className="space-y-1.5">
              <Label htmlFor="tbl-btn-url">Target URL / Document Link</Label>
              <Input
                id="tbl-btn-url"
                value={btnData.url || ""}
                onChange={(e) => handleUpdateButton({ url: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="/p/tech-fest or https://..."
              />
              <p className="text-[10px] text-muted-foreground">
                Internal routes (e.g. <span className="font-mono font-medium">/p/slug</span>) use Next.js Link; external links open in a new tab.
              </p>
            </div>

            {/* Upload to AWS S3 Bucket */}
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Upload className="size-3.5 text-primary" /> Upload to AWS S3
                </span>
                <span className="text-[10px] text-muted-foreground">PDF, Video, Docs</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Upload directly to your AWS S3 bucket. The URL and action type will be configured automatically.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.mp4,.webm,.mov,.png,.jpg,.jpeg"
                className="hidden"
              />

              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-8 text-xs gap-1.5 cursor-pointer font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Uploading to AWS S3...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    <span>Choose File & Upload to S3</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

