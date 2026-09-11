"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type EditorJS from "@editorjs/editorjs"
import type { OutputData } from "@editorjs/editorjs"
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Settings,
  Copy,
  Check,
  Loader2,
  Globe,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  GripVertical,
  AlertCircle,
  MousePointer,
  LayoutGrid,
  BarChart3,
  FileText,
  Video,
  Heading,
  List,
  CheckSquare,
  Table,
  Quote,
  Minus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { EditorCanvas } from "@/components/page-builder/editor-canvas"
import {
  WidgetPreferencesSidebar,
  type SelectedBlock,
} from "@/components/page-builder/widget-preferences-sidebar"

const STORAGE_KEYS = ["vidya_elementor_pages", "vidya_pages"]

// ── Widget Catalog Definition ──────────────────────────────────────────────────

interface WidgetItem {
  id: string
  type: string
  name: string
  description: string
  category: "custom" | "standard"
  icon: React.ComponentType<{ className?: string }>
  badgeColor?: string
  defaultData: Record<string, unknown>
}

const WIDGET_CATALOG: WidgetItem[] = [
  // ── Custom Shadcn Blocks ──
  {
    id: "alert",
    type: "alert",
    name: "Notice / Alert",
    description: "Official bulletins, urgent alerts, and notifications",
    category: "custom",
    icon: AlertCircle,
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    defaultData: {
      title: "School Announcement",
      message: "Important notice and instructions for parents, students, and staff.",
      variant: "warning",
    },
  },
  {
    id: "button",
    type: "button",
    name: "CTA Buttons",
    description: "Call-to-action buttons side-by-side with custom links and styles",
    category: "custom",
    icon: MousePointer,
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    defaultData: {
      align: "left",
      items: [
        {
          id: "btn-1",
          text: "Apply for Admissions Online",
          url: "/admissions",
          variant: "default",
        },
      ],
      text: "Apply for Admissions Online",
      url: "/admissions",
      variant: "default",
    },
  },
  {
    id: "card",
    type: "card",
    name: "Feature Cards",
    description: "Multi-card responsive grid with badges, titles, and links",
    category: "custom",
    icon: LayoutGrid,
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    defaultData: {
      columns: 2,
      items: [
        {
          id: "card-1",
          badge: "Academic Highlight",
          title: "Smart Robotics & AI Lab",
          description: "Hands-on experiential learning facilities equipped with modern robotics kits.",
          linkUrl: "",
        },
        {
          id: "card-2",
          badge: "Sports & Athletics",
          title: "Olympic Sports Complex",
          description: "State-of-the-art athletics ground, indoor badminton courts, and swimming pool.",
          linkUrl: "",
        },
      ],
      badge: "Academic Highlight",
      title: "Smart Robotics & AI Lab",
      description: "Hands-on experiential learning facilities equipped with modern robotics kits.",
      linkUrl: "",
    },
  },
  {
    id: "stats",
    type: "stats",
    name: "Stats Counter",
    description: "Metric card displaying achievements and numbers",
    category: "custom",
    icon: BarChart3,
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    defaultData: {
      stat: "100%",
      label: "CBSE Board Pass Rate",
      subtext: "Consistently across 5 consecutive academic years",
    },
  },
  {
    id: "pdf",
    type: "pdf",
    name: "PDF Document",
    description: "Document download card for brochures and circulars",
    category: "custom",
    icon: FileText,
    badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    defaultData: {
      title: "CBSE Mandatory Public Disclosure.pdf",
      url: "",
      fileSize: "2.4 MB PDF",
    },
  },
  {
    id: "video",
    type: "video",
    name: "YouTube Video",
    description: "Responsive embedded video player",
    category: "custom",
    icon: Video,
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    defaultData: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      caption: "Campus Tour & Annual Celebrations",
    },
  },

  // ── Standard Content Elements ──
  {
    id: "header",
    type: "header",
    name: "Heading",
    description: "Section titles and headlines (H1 - H4)",
    category: "standard",
    icon: Heading,
    defaultData: {
      text: "New Section Headline",
      level: 2,
    },
  },
  {
    id: "paragraph",
    type: "paragraph",
    name: "Text Paragraph",
    description: "Formatted rich text and narrative description",
    category: "standard",
    icon: FileText,
    defaultData: {
      text: "Enter your paragraph content here...",
    },
  },
  {
    id: "list",
    type: "list",
    name: "Bullet List",
    description: "Organized unordered or numbered bullet points",
    category: "standard",
    icon: List,
    defaultData: {
      style: "unordered",
      items: [
        "Qualified and dedicated teaching faculty",
        "Extensive library with 10,000+ volumes",
        "Indoor sports complex and athletics arena",
      ],
    },
  },
  {
    id: "checklist",
    type: "checklist",
    name: "Task Checklist",
    description: "Checkable list for admissions or requirements",
    category: "standard",
    icon: CheckSquare,
    defaultData: {
      items: [
        { text: "Filled Application Form", checked: true },
        { text: "Birth Certificate & Transfer Certificate", checked: false },
        { text: "Previous Term Grade Sheet", checked: false },
      ],
    },
  },
  {
    id: "table",
    type: "table",
    name: "Interactive Table",
    description: "Data grid with action buttons (View PDF, Video, S3 Upload)",
    category: "custom",
    icon: Table,
    badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    defaultData: {
      withHeadings: true,
      content: [
        ["Document / Subject", "Category / Class", "Action"],
        [
          "Academic Syllabus 2026-27",
          "Class 10 CBSE",
          {
            isButton: true,
            label: "View PDF",
            url: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/page-builder/pdfs/sample-syllabus.pdf",
            actionType: "view_pdf",
            icon: "file-text",
            variant: "default",
          },
        ],
        [
          "Annual Sports Highlights",
          "School Media",
          {
            isButton: true,
            label: "Watch Video",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            actionType: "view_video",
            icon: "video",
            variant: "secondary",
          },
        ],
        [
          "Fee Schedule & Guidelines",
          "Notice Circular",
          {
            isButton: true,
            label: "Download Circular",
            url: "https://vidyaschool-886563671776-ap-south-1-an.s3.ap-south-1.amazonaws.com/page-builder/pdfs/fee-structure.pdf",
            actionType: "download",
            icon: "download",
            variant: "outline",
          },
        ],
      ],
    },
  },
  {
    id: "quote",
    type: "quote",
    name: "Testimonial Quote",
    description: "Featured quote or student review block",
    category: "standard",
    icon: Quote,
    defaultData: {
      text: "Vidya School provided the nurturing environment where our children discovered their passion for science and leadership.",
      caption: "Alumni Parent Association",
    },
  },
  {
    id: "delimiter",
    type: "delimiter",
    name: "Divider Line",
    description: "Clean horizontal separator between sections",
    category: "standard",
    icon: Minus,
    defaultData: {},
  },
]

interface LegacyWidget {
  type?: string
  props?: {
    text?: string
    title?: string
    level?: string
    label?: string
    link?: string
    variant?: string
    stat1?: string
    label1?: string
    url?: string
    [key: string]: unknown
  }
}

interface StoredPage {
  uid?: string
  id?: string
  title?: string
  name?: string
  slug?: string
  status?: string
  widgets?: unknown
  contentJson?: unknown
  updatedAt?: string
}

function deduplicateBlocks(blocks: Array<{ type: string; data: Record<string, unknown> }>): Array<{ type: string; data: Record<string, unknown> }> {
  if (!Array.isArray(blocks) || blocks.length < 2) return blocks

  // Check if exactly repeated in two equal halves
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

function convertToEditorJsData(rawWidgets: unknown, defaultTitle: string): OutputData {
  if (
    rawWidgets &&
    typeof rawWidgets === "object" &&
    "blocks" in rawWidgets &&
    Array.isArray((rawWidgets as { blocks: unknown[] }).blocks)
  ) {
    const obj = rawWidgets as OutputData
    return {
      ...obj,
      blocks: deduplicateBlocks(obj.blocks as Array<{ type: string; data: Record<string, unknown> }>),
    }
  }

  // Convert legacy widgets array if present
  if (Array.isArray(rawWidgets) && rawWidgets.length > 0) {
    const blocks: Array<{ type: string; data: Record<string, unknown> }> = []
    for (const item of rawWidgets) {
      const w = item as LegacyWidget
      if (w.type === "heading") {
        blocks.push({
          type: "header",
          data: {
            text: w.props?.text || "Heading",
            level: w.props?.level === "h1" ? 1 : w.props?.level === "h3" ? 3 : 2,
          },
        })
      } else if (w.type === "paragraph") {
        blocks.push({
          type: "paragraph",
          data: { text: w.props?.text || "" },
        })
      } else if (w.type === "button") {
        blocks.push({
          type: "button",
          data: {
            text: w.props?.label || "Button",
            url: w.props?.link || "#",
            variant: w.props?.variant || "default",
            align: "left",
          },
        })
      } else if (w.type === "alert") {
        blocks.push({
          type: "alert",
          data: {
            title: w.props?.title || "School Notice",
            message: w.props?.text || "",
            variant: "warning",
          },
        })
      } else if (w.type === "stats") {
        blocks.push({
          type: "stats",
          data: {
            stat: w.props?.stat1 || "100%",
            label: w.props?.label1 || "Pass Rate",
            subtext: "CBSE Board Examinations",
          },
        })
      } else if (w.type === "pdf") {
        blocks.push({
          type: "pdf",
          data: {
            title: w.props?.title || "Document Download.pdf",
            url: w.props?.url || "",
            fileSize: "PDF Document",
          },
        })
      }
    }
    if (blocks.length > 0) {
      return { time: Date.now(), blocks }
    }
  }

  // Fresh page template
  return {
    time: Date.now(),
    blocks: [
      {
        type: "header",
        data: {
          text: defaultTitle || "Welcome to Vidya School",
          level: 1,
        },
      },
      {
        type: "paragraph",
        data: {
          text: "We provide an enriching learning environment combining CBSE curriculum excellence with modern digital learning.",
        },
      },
      {
        type: "alert",
        data: {
          title: "Admissions Open for 2026-27",
          message: "Registrations are now open for Pre-KG to Grade 11. Limited seats available per section.",
          variant: "warning",
        },
      },
      {
        type: "button",
        data: {
          text: "Apply for Admissions Online",
          url: "/admissions",
          variant: "default",
          align: "left",
        },
      },
    ],
  }
}

export default function PageBuilderEditor() {
  const router = useRouter()
  const params = useParams()
  const username = (params?.username as string) || "admin"
  const uid = params?.uid as string

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [copiedSlug, setCopiedSlug] = React.useState(false)

  // Sidebars state
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(true)
  const [widgetSearch, setWidgetSearch] = React.useState("")
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)

  // Selected Block for Right Preferences Sidebar
  const [selectedBlock, setSelectedBlock] = React.useState<SelectedBlock | null>(null)
  const [totalBlocksCount, setTotalBlocksCount] = React.useState(0)

  // Page metadata
  const [pageTitle, setPageTitle] = React.useState("Untitled Page")
  const [pageSlug, setPageSlug] = React.useState("")
  const [pageStatus, setPageStatus] = React.useState<"published" | "draft">("published")

  // Editor.js data & instance
  const [editorData, setEditorData] = React.useState<OutputData | null>(null)
  const editorInstanceRef = React.useRef<EditorJS | null>(null)

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [settingsTitle, setSettingsTitle] = React.useState("")
  const [settingsSlug, setSettingsSlug] = React.useState("")

  // Load page on mount
  React.useEffect(() => {
    if (!uid) return

    let isMounted = true

    const loadPage = async () => {
      let foundTitle = "Untitled Page"
      let foundSlug = `page-${uid.slice(0, 6)}`
      let foundStatus: "published" | "draft" = "published"
      let foundWidgets: unknown = null

      // 1. Try local storage first
      for (const key of STORAGE_KEYS) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const list = JSON.parse(raw) as StoredPage[]
            if (Array.isArray(list)) {
              const matched = list.find((p) => (p.uid || p.id) === uid)
              if (matched) {
                foundTitle = matched.title || matched.name || foundTitle
                foundSlug = matched.slug || foundSlug
                foundStatus = matched.status === "draft" ? "draft" : "published"
                foundWidgets = matched.widgets || matched.contentJson || null
                break
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      // 2. Query PostgreSQL API
      try {
        const res = await fetch(`/api/admin/page-builder?uid=${encodeURIComponent(uid)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.found && data.page) {
            foundTitle = data.page.title || foundTitle
            foundSlug = data.page.slug || foundSlug
            foundStatus = data.page.status === "draft" ? "draft" : "published"
            if (data.page.widgets) {
              foundWidgets = data.page.widgets
            }
          }
        }
      } catch {
        // Fallback to local storage
      }

      if (!isMounted) return

      setPageTitle(foundTitle)
      setPageSlug(foundSlug)
      setPageStatus(foundStatus)
      setSettingsTitle(foundTitle)
      setSettingsSlug(foundSlug)

      const initialOutput = convertToEditorJsData(foundWidgets, foundTitle)
      setEditorData(initialOutput)
      setLoading(false)
    }

    loadPage()

    return () => {
      isMounted = false
    }
  }, [uid])

  // Save changes to database and local storage
  const handleSave = async () => {
    if (!editorInstanceRef.current) return
    setSaving(true)

    try {
      const output = await editorInstanceRef.current.save()

      // 1. Save locally
      for (const key of STORAGE_KEYS) {
        try {
          const raw = localStorage.getItem(key)
          const list = raw ? (JSON.parse(raw) as StoredPage[]) : []
          const existingIndex = list.findIndex((p) => (p.uid || p.id) === uid)
          const pageRecord: StoredPage = {
            uid,
            id: uid,
            title: pageTitle,
            name: pageTitle,
            slug: pageSlug,
            status: pageStatus,
            widgets: output,
            updatedAt: new Date().toISOString(),
          }

          if (existingIndex >= 0) {
            list[existingIndex] = { ...list[existingIndex], ...pageRecord }
          } else {
            list.unshift(pageRecord)
          }
          localStorage.setItem(key, JSON.stringify(list))
        } catch {
          // Ignore
        }
      }

      // 2. Save to database via /api/admin/page-builder (synced with FastAPI)
      let saveSuccessful = false
      let errorMessage = "Failed to save to database"

      try {
        const res = await fetch("/api/admin/page-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            title: pageTitle,
            slug: pageSlug,
            widgets: output,
            status: pageStatus,
          }),
        })

        if (res.ok) {
          saveSuccessful = true
        } else {
          const errData = await res.json().catch(() => null)
          errorMessage = errData?.error || errData?.detail || `Save failed (${res.status})`
        }
      } catch (fetchErr) {
        console.warn("Primary API save error, attempting direct backend save:", fetchErr)
      }

      // Fallback: Direct save to FastAPI backend if available
      if (!saveSuccessful) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        try {
          const fastApiRes = await fetch(`${backendUrl}/api/page-builder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid,
              title: pageTitle,
              slug: pageSlug,
              widgets: output,
              status: pageStatus,
            }),
          })
          if (fastApiRes.ok) {
            saveSuccessful = true
          } else {
            const errData = await fastApiRes.json().catch(() => null)
            errorMessage = errData?.detail || errData?.error || errorMessage
          }
        } catch {
          // Both failed
        }
      }

      if (!saveSuccessful) {
        throw new Error(errorMessage)
      }

      setHasUnsavedChanges(false)
      toast.success("Page saved successfully")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save page"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Insert a widget block into Editor.js and immediately select it in Right Sidebar
  const insertWidgetBlock = React.useCallback((toolType: string, blockData: Record<string, unknown>, blockName?: string) => {
    const editor = editorInstanceRef.current
    if (!editor) {
      toast.error("Editor is still initializing")
      return
    }

    try {
      const count = editor.blocks.getBlocksCount()
      const currentIndex = editor.blocks.getCurrentBlockIndex()

      // If a block is currently active, insert after it; otherwise insert at end
      const insertIndex = currentIndex >= 0 ? currentIndex + 1 : count

      const newBlock = editor.blocks.insert(toolType, blockData, {}, insertIndex, true)
      setHasUnsavedChanges(true)
      setTotalBlocksCount(editor.blocks.getBlocksCount())

      // Immediately select the inserted widget in the Right Preferences Sidebar
      setSelectedBlock({
        id: newBlock.id,
        type: newBlock.name,
        data: blockData,
        index: insertIndex,
      })
      setRightSidebarOpen(true)

      // Smooth scroll to inserted element
      setTimeout(() => {
        const block = editor.blocks.getBlockByIndex(insertIndex)
        if (block?.holder) {
          block.holder.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 50)

      toast.success(`Inserted ${blockName || toolType} element`)
    } catch (err) {
      console.error("Failed to insert block:", err)
      toast.error("Failed to insert block")
    }
  }, [])

  // Update selected block data in real-time from the Right Preferences Sidebar
  const handleUpdateBlockData = async (patch: Record<string, unknown>) => {
    if (!selectedBlock || !editorInstanceRef.current) return

    const updatedData = { ...selectedBlock.data, ...patch }
    setSelectedBlock((prev) => (prev ? { ...prev, data: updatedData } : null))

    try {
      await editorInstanceRef.current.blocks.update(selectedBlock.id, updatedData)
      setHasUnsavedChanges(true)
    } catch (err) {
      console.error("Failed to update block in canvas:", err)
    }
  }

  // Delete selected block
  const handleDeleteSelectedBlock = () => {
    if (!selectedBlock || !editorInstanceRef.current) return
    try {
      editorInstanceRef.current.blocks.delete(selectedBlock.index)
      setSelectedBlock(null)
      setTotalBlocksCount(editorInstanceRef.current.blocks.getBlocksCount())
      setHasUnsavedChanges(true)
      toast.success("Block deleted")
    } catch (err) {
      console.error("Failed to delete block:", err)
    }
  }

  // Move block up
  const handleMoveUp = () => {
    if (!selectedBlock || !editorInstanceRef.current || selectedBlock.index <= 0) return
    try {
      const newIndex = selectedBlock.index - 1
      editorInstanceRef.current.blocks.move(newIndex, selectedBlock.index)
      setSelectedBlock((prev) => (prev ? { ...prev, index: newIndex } : null))
      setHasUnsavedChanges(true)
    } catch (err) {
      console.error("Failed to move block up:", err)
    }
  }

  // Move block down
  const handleMoveDown = () => {
    if (!selectedBlock || !editorInstanceRef.current) return
    const total = editorInstanceRef.current.blocks.getBlocksCount()
    if (selectedBlock.index >= total - 1) return
    try {
      const newIndex = selectedBlock.index + 1
      editorInstanceRef.current.blocks.move(newIndex, selectedBlock.index)
      setSelectedBlock((prev) => (prev ? { ...prev, index: newIndex } : null))
      setHasUnsavedChanges(true)
    } catch (err) {
      console.error("Failed to move block down:", err)
    }
  }

  // Duplicate block
  const handleDuplicateBlock = () => {
    if (!selectedBlock || !editorInstanceRef.current) return
    try {
      const insertIndex = selectedBlock.index + 1
      const cloned = editorInstanceRef.current.blocks.insert(
        selectedBlock.type,
        selectedBlock.data,
        {},
        insertIndex,
        true
      )
      setTotalBlocksCount(editorInstanceRef.current.blocks.getBlocksCount())
      setSelectedBlock({
        id: cloned.id,
        type: cloned.name,
        data: selectedBlock.data,
        index: insertIndex,
      })
      setHasUnsavedChanges(true)
      toast.success("Block duplicated")
    } catch (err) {
      console.error("Failed to duplicate block:", err)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widget: WidgetItem) => {
    e.dataTransfer.setData("application/x-editorjs-tool", widget.type)
    e.dataTransfer.setData("application/x-editorjs-data", JSON.stringify(widget.defaultData))
    e.dataTransfer.setData("application/x-editorjs-name", widget.name)
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-editorjs-tool")) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
      if (!isDraggingOver) setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)

    const toolType = e.dataTransfer.getData("application/x-editorjs-tool")
    const rawData = e.dataTransfer.getData("application/x-editorjs-data")
    const name = e.dataTransfer.getData("application/x-editorjs-name")

    if (!toolType) return

    let parsedData: Record<string, unknown> = {}
    try {
      parsedData = JSON.parse(rawData)
    } catch {
      parsedData = {}
    }

    insertWidgetBlock(toolType, parsedData, name)
  }

  // Update Page Settings (Title, Slug)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanTitle = settingsTitle.trim() || pageTitle
    const cleanSlug = (settingsSlug.trim() || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-+|-+$/g, "")

    setPageTitle(cleanTitle)
    setPageSlug(cleanSlug)
    setIsSettingsOpen(false)

    try {
      await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: cleanTitle,
          slug: cleanSlug,
        }),
      })
      toast.success("Page settings updated")
    } catch {
      toast.error("Failed to update settings")
    }
  }

  // Toggle status
  const handleToggleStatus = async (newStatus: "published" | "draft") => {
    setPageStatus(newStatus)
    try {
      await fetch("/api/admin/page-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, status: newStatus }),
      })
      toast.success(`Page set to ${newStatus}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  // Copy Public Link
  const copyLink = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3001", ":3000")
        : ""
    const url = `${origin}/p/${pageSlug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(true)
    toast.success("Public link copied to clipboard")
    setTimeout(() => setCopiedSlug(false), 2000)
  }

  // View Live
  const viewLive = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin.replace(":3001", ":3000")
        : ""
    window.open(`${origin}/p/${pageSlug}`, "_blank")
  }

  const filteredWidgets = WIDGET_CATALOG.filter((w) =>
    w.name.toLowerCase().includes(widgetSearch.toLowerCase()) ||
    w.description.toLowerCase().includes(widgetSearch.toLowerCase()) ||
    w.type.toLowerCase().includes(widgetSearch.toLowerCase())
  )

  const customWidgets = filteredWidgets.filter((w) => w.category === "custom")
  const standardWidgets = filteredWidgets.filter((w) => w.category === "standard")

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Loading page editor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur-sm">
        {/* Left: Sidebar toggle, Back button, Title & Status */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={sidebarOpen ? "Hide elements sidebar" : "Show elements sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/${username}/page-builder`)}
            className="h-8 px-2 text-xs gap-1"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Pages</span>
          </Button>

          <div className="h-4 w-[1px] bg-border" />

          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm truncate max-w-[150px] sm:max-w-[240px]">
              {pageTitle}
            </h1>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer focus:outline-hidden"
                >
                  {pageStatus === "published" ? (
                    <Badge
                      variant="outline"
                      className="text-[11px] border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px]">
                      Draft
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36 text-xs">
                <DropdownMenuItem
                  onClick={() => handleToggleStatus("published")}
                  className="cursor-pointer"
                >
                  Set Published
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToggleStatus("draft")}
                  className="cursor-pointer"
                >
                  Set Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasUnsavedChanges && (
              <span className="text-[11px] text-amber-500 font-medium hidden sm:inline">
                • Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions and Inspector Toggle */}
        <div className="flex items-center gap-2">
          {/* Public Link Badge */}
          <div className="hidden md:flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            <Globe className="size-3 text-muted-foreground" />
            <span className="font-mono text-[11px]">/p/{pageSlug}</span>
            <button
              type="button"
              onClick={copyLink}
              className="hover:text-foreground transition-colors ml-1"
              title="Copy URL"
            >
              {copiedSlug ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={viewLive}
            className="h-8 px-2.5 text-xs gap-1"
            title="View Live Page"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">View Live</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSettingsTitle(pageTitle)
              setSettingsSlug(pageSlug)
              setIsSettingsOpen(true)
            }}
            className="h-8 w-8 p-0"
            title="Page Settings"
          >
            <Settings className="size-3.5" />
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="h-8 px-3 text-xs gap-1.5 font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save
              </>
            )}
          </Button>

          <div className="h-4 w-[1px] bg-border ml-1" />

          {/* Toggle Right Preferences Sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightSidebarOpen((prev) => !prev)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={rightSidebarOpen ? "Hide element preferences" : "Show element preferences"}
          >
            {rightSidebarOpen ? <PanelRightClose className="size-4" /> : <PanelRight className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Main Workspace: Left Sidebar + Editor Canvas + Right Sidebar */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 1. Left Elements Sidebar */}
        <aside
          className={cn(
            "border-r bg-card/70 backdrop-blur-xs transition-all duration-200 flex flex-col shrink-0 z-20 overflow-hidden",
            sidebarOpen ? "w-72 sm:w-80" : "w-0 border-r-0"
          )}
        >
          {/* Sidebar Top: Header & Search */}
          <div className="p-3.5 border-b space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-tight uppercase text-foreground">
                  Elements & Widgets
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
                  {WIDGET_CATALOG.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-6 w-6 text-muted-foreground"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="size-3.5" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={widgetSearch}
                onChange={(e) => setWidgetSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <div className="rounded-md border border-dashed border-border/80 bg-background/50 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <GripVertical className="size-3.5 text-primary shrink-0" />
              <span>Drag into canvas or click to insert</span>
            </div>
          </div>

          {/* Sidebar Widget List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {/* Custom Shadcn Elements */}
            {customWidgets.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Shadcn Custom Blocks
                </div>
                <div className="space-y-1.5">
                  {customWidgets.map((widget) => {
                    const IconComponent = widget.icon
                    return (
                      <div
                        key={widget.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, widget)}
                        onClick={() => insertWidgetBlock(widget.type, widget.defaultData, widget.name)}
                        className="group flex items-start gap-2.5 p-2.5 rounded-lg border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing select-none shadow-2xs"
                      >
                        <GripVertical className="size-3.5 text-muted-foreground/50 group-hover:text-foreground shrink-0 mt-0.5" />
                        <div className={cn("size-7 rounded-md flex items-center justify-center shrink-0 border", widget.badgeColor || "bg-muted text-foreground")}>
                          <IconComponent className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-xs truncate">
                              {widget.name}
                            </span>
                            <Plus className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Standard Content Elements */}
            {standardWidgets.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Typography & Layout
                </div>
                <div className="space-y-1.5">
                  {standardWidgets.map((widget) => {
                    const IconComponent = widget.icon
                    return (
                      <div
                        key={widget.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, widget)}
                        onClick={() => insertWidgetBlock(widget.type, widget.defaultData, widget.name)}
                        className="group flex items-start gap-2.5 p-2.5 rounded-lg border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing select-none shadow-2xs"
                      >
                        <GripVertical className="size-3.5 text-muted-foreground/50 group-hover:text-foreground shrink-0 mt-0.5" />
                        <div className="size-7 rounded-md flex items-center justify-center shrink-0 border bg-muted/40 text-foreground">
                          <IconComponent className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-xs truncate">
                              {widget.name}
                            </span>
                            <Plus className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {filteredWidgets.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-xs">No elements found matching &ldquo;{widgetSearch}&rdquo;</p>
              </div>
            )}
          </div>
        </aside>

        {/* 2. Main Canvas with Drag-and-Drop Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex-1 overflow-y-auto min-h-0 relative transition-colors duration-150",
            isDraggingOver && "bg-primary/5 ring-2 ring-primary/50 ring-inset"
          )}
        >
          {/* Drag Overlay Indicator */}
          {isDraggingOver && (
            <div className="sticky top-4 z-40 mx-auto max-w-sm p-3 rounded-xl border-2 border-dashed border-primary bg-background/95 text-primary text-center text-xs font-semibold shadow-xl backdrop-blur-xs flex items-center justify-center gap-2 pointer-events-none animate-in fade-in zoom-in-95">
              <Plus className="size-4 animate-bounce" />
              Drop here to insert element into page
            </div>
          )}

          <main className="max-w-4xl mx-auto px-6 sm:px-12 py-8 sm:py-10">
            {/* Helper banner */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {!sidebarOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="h-7 px-2 text-xs gap-1.5"
                  >
                    <PanelLeft className="size-3.5" />
                    <span>Open Elements</span>
                  </Button>
                )}
                <span>
                  Click any element on the canvas to customize its properties in the right sidebar.
                </span>
              </div>
            </div>

            {/* Editor.js Canvas */}
            {editorData && (
              <EditorCanvas
                initialData={editorData}
                selectedBlockId={selectedBlock?.id}
                onSelectBlock={(block) => {
                  setSelectedBlock(block)
                  if (editorInstanceRef.current) {
                    setTotalBlocksCount(editorInstanceRef.current.blocks.getBlocksCount())
                  }
                  if (block) setRightSidebarOpen(true)
                }}
                onReady={(editor) => {
                  editorInstanceRef.current = editor
                  setTotalBlocksCount(editor.blocks.getBlocksCount())
                }}
                onChange={() => {
                  setHasUnsavedChanges(true)
                  if (editorInstanceRef.current) {
                    setTotalBlocksCount(editorInstanceRef.current.blocks.getBlocksCount())
                  }
                }}
              />
            )}
          </main>
        </div>

        {/* 3. Right Element Preferences & Inspector Sidebar */}
        <WidgetPreferencesSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          selectedBlock={selectedBlock}
          onUpdateData={handleUpdateBlockData}
          onDeleteBlock={handleDeleteSelectedBlock}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDuplicate={handleDuplicateBlock}
          canMoveUp={Boolean(selectedBlock && selectedBlock.index > 0)}
          canMoveDown={Boolean(selectedBlock && selectedBlock.index < totalBlocksCount - 1)}
          pageMeta={{
            title: pageTitle,
            slug: pageSlug,
            status: pageStatus,
          }}
          onUpdatePageMeta={({ title, slug, status }) => {
            if (title !== undefined) setPageTitle(title)
            if (slug !== undefined) setPageSlug(slug)
            if (status !== undefined) setPageStatus(status)
            setHasUnsavedChanges(true)
          }}
        />
      </div>

      {/* Page Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Page Settings</DialogTitle>
            <DialogDescription>
              Update your page title and public URL address.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Page Title</Label>
              <Input
                id="edit-title"
                value={settingsTitle}
                onChange={(e) => setSettingsTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-slug">URL Slug</Label>
              <div className="flex items-center rounded-md border bg-muted/40 px-3">
                <span className="text-xs text-muted-foreground select-none">/p/</span>
                <Input
                  id="edit-slug"
                  value={settingsSlug}
                  onChange={(e) => setSettingsSlug(e.target.value)}
                  className="border-0 bg-transparent px-1 focus-visible:ring-0 shadow-none text-sm font-mono"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
