/**
 * Custom Editor.js Block Tools designed with shadcn UI aesthetics.
 * Canvas elements render clean, high-fidelity components.
 * Extended properties and settings are edited via the Right Preferences Sidebar.
 */

// Helper to create SVG icons
function createSvgIcon(path: string, viewBox = "0 0 24 24"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
}

// ── 1. Shadcn Alert / Notice Tool ─────────────────────────────────────────────

export interface AlertToolData {
  title: string
  message: string
  variant: "default" | "destructive" | "warning" | "success"
}

export class ShadcnAlertTool {
  static get toolbox() {
    return {
      title: "Notice / Alert",
      icon: createSvgIcon(
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: AlertToolData
  private readOnly: boolean
  private container: HTMLElement | null = null

  constructor({ data, readOnly }: { data: Partial<AlertToolData>; readOnly?: boolean }) {
    this.data = {
      title: data.title || "",
      message: data.message || "",
      variant: data.variant || "warning",
    }
    this.readOnly = Boolean(readOnly)
  }

  render(): HTMLElement {
    const container = document.createElement("div")
    this.container = container
    container.className = "my-4 group/alert"

    this.updateDom()
    return container
  }

  private updateDom() {
    if (!this.container) return
    this.container.innerHTML = ""

    const variantStyles = {
      default: "border-border bg-card text-card-foreground",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    }

    const wrapper = document.createElement("div")
    wrapper.className = `relative w-full rounded-xl border p-4 text-sm space-y-1.5 shadow-xs transition-colors ${variantStyles[this.data.variant] || variantStyles.default}`

    // Title input
    const titleEl = document.createElement("div")
    titleEl.contentEditable = (!this.readOnly).toString()
    titleEl.className = "font-bold tracking-tight text-base focus:outline-hidden empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 cursor-text"
    titleEl.setAttribute("data-placeholder", "Notice Title (e.g. School Reopening Schedule)...")
    titleEl.innerHTML = this.data.title
    titleEl.oninput = () => {
      this.data.title = titleEl.innerHTML
    }
    wrapper.appendChild(titleEl)

    // Message input
    const msgEl = document.createElement("div")
    msgEl.contentEditable = (!this.readOnly).toString()
    msgEl.className = "text-xs sm:text-sm leading-relaxed opacity-90 focus:outline-hidden empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 cursor-text"
    msgEl.setAttribute("data-placeholder", "Notice details and instructions for students, parents, and teachers...")
    msgEl.innerHTML = this.data.message
    msgEl.oninput = () => {
      this.data.message = msgEl.innerHTML
    }
    wrapper.appendChild(msgEl)

    this.container.appendChild(wrapper)
  }

  save(): AlertToolData {
    return this.data
  }
}

// ── 2. Shadcn Button / Call-to-Action Tool ─────────────────────────────────────

export interface ButtonItem {
  id: string
  text: string
  url: string
  variant: "default" | "secondary" | "outline" | "destructive"
}

export interface ButtonToolData {
  text?: string
  url?: string
  variant?: "default" | "secondary" | "outline" | "destructive"
  align: "left" | "center" | "right"
  items?: ButtonItem[]
}

export class ShadcnButtonTool {
  static get toolbox() {
    return {
      title: "CTA Buttons",
      icon: createSvgIcon(
        '<rect x="3" y="6" width="18" height="12" rx="3"/><line x1="8" y1="12" x2="16" y2="12"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: ButtonToolData
  private readOnly: boolean
  private container: HTMLElement | null = null

  constructor({ data, readOnly }: { data: Partial<ButtonToolData>; readOnly?: boolean }) {
    const defaultItems: ButtonItem[] =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : [
            {
              id: "btn-1",
              text: data.text || "Apply for Admissions Online",
              url: data.url || "/admissions",
              variant: data.variant || "default",
            },
          ]

    this.data = {
      align: data.align || "left",
      items: defaultItems,
      text: defaultItems[0]?.text || "Apply for Admissions Online",
      url: defaultItems[0]?.url || "/admissions",
      variant: defaultItems[0]?.variant || "default",
    }
    this.readOnly = Boolean(readOnly)
  }

  render(): HTMLElement {
    const container = document.createElement("div")
    this.container = container
    container.className = "my-4"

    this.updateDom()
    return container
  }

  private updateDom() {
    if (!this.container) return
    this.container.innerHTML = ""

    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    }

    const btnStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    }

    const wrapper = document.createElement("div")
    wrapper.className = `flex flex-wrap items-center gap-3 my-2 select-none ${alignClasses[this.data.align] || "justify-start"}`

    const items =
      Array.isArray(this.data.items) && this.data.items.length > 0
        ? this.data.items
        : [
            {
              id: "btn-1",
              text: this.data.text || "Button Label",
              url: this.data.url || "#",
              variant: this.data.variant || "default",
            },
          ]

    items.forEach((item, idx) => {
      const previewBtn = document.createElement("button")
      previewBtn.type = "button"
      previewBtn.className = `inline-flex items-center justify-center gap-2 font-semibold text-sm rounded-xl px-6 py-2.5 shadow-xs transition-all pointer-events-none ${btnStyles[item.variant] || btnStyles.default}`
      previewBtn.textContent = item.text || `Button ${idx + 1}`
      wrapper.appendChild(previewBtn)
    })

    this.container.appendChild(wrapper)
  }

  save(): ButtonToolData {
    return this.data
  }
}

// ── 3. Shadcn Feature / Card Tool ─────────────────────────────────────────────

export interface CardItem {
  id: string
  badge: string
  title: string
  description: string
  linkUrl?: string
}

export interface CardToolData {
  columns?: number
  badge?: string
  title?: string
  description?: string
  linkUrl?: string
  items?: CardItem[]
}

export class ShadcnCardTool {
  static get toolbox() {
    return {
      title: "Feature Cards",
      icon: createSvgIcon(
        '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: CardToolData
  private readOnly: boolean
  private container: HTMLElement | null = null

  constructor({ data, readOnly }: { data: Partial<CardToolData>; readOnly?: boolean }) {
    const defaultItems: CardItem[] =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : [
            {
              id: "card-1",
              badge: data.badge ?? "Academic Highlight",
              title: data.title ?? "Smart Robotics & AI Lab",
              description: data.description ?? "Hands-on experiential learning facilities equipped with modern robotics kits.",
              linkUrl: data.linkUrl ?? "",
            },
          ]

    this.data = {
      columns: Number(data.columns) || Math.min(defaultItems.length, 3) || 1,
      items: defaultItems,
      badge: defaultItems[0]?.badge || "",
      title: defaultItems[0]?.title || "",
      description: defaultItems[0]?.description || "",
      linkUrl: defaultItems[0]?.linkUrl || "",
    }
    this.readOnly = Boolean(readOnly)
  }

  render(): HTMLElement {
    const container = document.createElement("div")
    this.container = container
    container.className = "my-4"

    this.updateDom()
    return container
  }

  private updateDom() {
    if (!this.container) return
    this.container.innerHTML = ""

    const cols = Number(this.data.columns) || 1
    const gridColsClass =
      cols === 1
        ? "grid-cols-1"
        : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : cols === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

    const grid = document.createElement("div")
    grid.className = `grid gap-4 ${gridColsClass} w-full`

    const items =
      Array.isArray(this.data.items) && this.data.items.length > 0
        ? this.data.items
        : [
            {
              id: "card-1",
              badge: this.data.badge || "Academic Highlight",
              title: this.data.title || "Smart Robotics & AI Lab",
              description: this.data.description || "Hands-on experiential learning facilities.",
              linkUrl: this.data.linkUrl || "",
            },
          ]

    items.forEach((item, idx) => {
      const card = document.createElement("div")
      card.className =
        "rounded-xl border bg-card text-card-foreground shadow-xs p-5 sm:p-6 space-y-3 transition-shadow hover:shadow-sm flex flex-col justify-between"

      const topSection = document.createElement("div")
      topSection.className = "space-y-3"

      // Badge input
      const badgeWrap = document.createElement("div")
      badgeWrap.className = "flex items-center gap-2"
      const badge = document.createElement("span")
      badge.className =
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary focus:outline-hidden"
      badge.contentEditable = (!this.readOnly).toString()
      badge.textContent = item.badge || "Highlight"
      badge.oninput = () => {
        item.badge = badge.textContent || ""
        if (idx === 0) this.data.badge = item.badge
      }
      badgeWrap.appendChild(badge)
      topSection.appendChild(badgeWrap)

      // Title input
      const title = document.createElement("div")
      title.contentEditable = (!this.readOnly).toString()
      title.className =
        "text-lg font-semibold tracking-tight text-foreground focus:outline-hidden empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 cursor-text"
      title.setAttribute("data-placeholder", "Card Title...")
      title.textContent = item.title
      title.oninput = () => {
        item.title = title.textContent || ""
        if (idx === 0) this.data.title = item.title
      }
      topSection.appendChild(title)

      // Description input
      const desc = document.createElement("div")
      desc.contentEditable = (!this.readOnly).toString()
      desc.className =
        "text-sm text-muted-foreground leading-relaxed focus:outline-hidden empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 cursor-text"
      desc.setAttribute("data-placeholder", "Card description explaining the feature...")
      desc.textContent = item.description
      desc.oninput = () => {
        item.description = desc.textContent || ""
        if (idx === 0) this.data.description = item.description
      }
      topSection.appendChild(desc)

      card.appendChild(topSection)

      if (item.linkUrl) {
        const linkFooter = document.createElement("div")
        linkFooter.className = "pt-2 text-xs font-medium text-primary flex items-center gap-1 opacity-85"
        linkFooter.innerHTML = `<span class="truncate">Link: ${item.linkUrl}</span>`
        card.appendChild(linkFooter)
      }

      grid.appendChild(card)
    })

    this.container.appendChild(grid)
  }

  save(): CardToolData {
    return this.data
  }
}

// ── 4. Shadcn Stats / Metrics Counter Tool ────────────────────────────────────

export interface StatsToolData {
  stat: string
  label: string
  subtext: string
}

export class ShadcnStatsTool {
  static get toolbox() {
    return {
      title: "Stats Counter",
      icon: createSvgIcon(
        '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: StatsToolData
  private readOnly: boolean

  constructor({ data, readOnly }: { data: Partial<StatsToolData>; readOnly?: boolean }) {
    this.data = {
      stat: data.stat || "100%",
      label: data.label || "CBSE Board Pass Rate",
      subtext: data.subtext || "Consistently across 5 consecutive academic years",
    }
    this.readOnly = Boolean(readOnly)
  }

  render(): HTMLElement {
    const card = document.createElement("div")
    card.className = "my-4 rounded-xl border bg-card/60 p-6 text-center space-y-1 shadow-xs"

    const statNum = document.createElement("div")
    statNum.contentEditable = (!this.readOnly).toString()
    statNum.className = "text-3xl sm:text-4xl font-extrabold text-primary tracking-tight focus:outline-hidden cursor-text"
    statNum.textContent = this.data.stat
    statNum.oninput = () => {
      this.data.stat = statNum.textContent || ""
    }
    card.appendChild(statNum)

    const label = document.createElement("div")
    label.contentEditable = (!this.readOnly).toString()
    label.className = "text-sm font-semibold text-foreground focus:outline-hidden cursor-text"
    label.textContent = this.data.label
    label.oninput = () => {
      this.data.label = label.textContent || ""
    }
    card.appendChild(label)

    const sub = document.createElement("div")
    sub.contentEditable = (!this.readOnly).toString()
    sub.className = "text-xs text-muted-foreground focus:outline-hidden cursor-text"
    sub.textContent = this.data.subtext
    sub.oninput = () => {
      this.data.subtext = sub.textContent || ""
    }
    card.appendChild(sub)

    return card
  }

  save(): StatsToolData {
    return this.data
  }
}

// ── 5. Shadcn PDF / Document Embed Tool ────────────────────────────────────────

export interface PdfToolData {
  title: string
  url: string
  fileSize: string
}

export class ShadcnPdfTool {
  static get toolbox() {
    return {
      title: "PDF Document",
      icon: createSvgIcon(
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: PdfToolData

  constructor({ data }: { data: Partial<PdfToolData>; readOnly?: boolean }) {
    this.data = {
      title: data.title || "CBSE Mandatory Public Disclosure.pdf",
      url: data.url || "",
      fileSize: data.fileSize || "2.4 MB PDF",
    }
  }

  render(): HTMLElement {
    const card = document.createElement("div")
    card.className = "my-4 rounded-xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"

    const left = document.createElement("div")
    left.className = "flex items-start gap-3"

    const iconBox = document.createElement("div")
    iconBox.className = "size-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0"
    iconBox.innerHTML = createSvgIcon(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
    )
    left.appendChild(iconBox)

    const textCol = document.createElement("div")
    textCol.className = "space-y-0.5 flex-1"

    const title = document.createElement("div")
    title.className = "text-sm font-semibold text-foreground"
    title.textContent = this.data.title || "Document.pdf"
    textCol.appendChild(title)

    const size = document.createElement("div")
    size.className = "text-xs text-muted-foreground"
    size.textContent = this.data.fileSize || "PDF Document"
    textCol.appendChild(size)

    left.appendChild(textCol)
    card.appendChild(left)

    const downloadBtn = document.createElement("a")
    downloadBtn.href = this.data.url || "#"
    downloadBtn.target = "_blank"
    downloadBtn.rel = "noreferrer"
    downloadBtn.className = "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-input bg-background hover:bg-accent text-foreground transition-colors shrink-0"
    downloadBtn.innerHTML = `${createSvgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')} View / Download`
    card.appendChild(downloadBtn)

    return card
  }

  save(): PdfToolData {
    return this.data
  }
}

// ── 6. Shadcn YouTube / Video Embed Tool ───────────────────────────────────────

export interface VideoToolData {
  url: string
  caption: string
}

export class ShadcnVideoTool {
  static get toolbox() {
    return {
      title: "YouTube Video",
      icon: createSvgIcon(
        '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: VideoToolData
  private container: HTMLElement | null = null

  constructor({ data }: { data: Partial<VideoToolData>; readOnly?: boolean }) {
    this.data = {
      url: data.url || "",
      caption: data.caption || "",
    }
  }

  render(): HTMLElement {
    const container = document.createElement("div")
    this.container = container
    container.className = "my-4 space-y-2"

    this.updateDom()
    return container
  }

  private getEmbedUrl(url: string): string | null {
    if (!url) return null
    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0]
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }
      if (url.includes("youtube.com/watch")) {
        const u = new URL(url)
        const id = u.searchParams.get("v")
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }
      if (url.includes("youtube.com/embed/")) {
        return url
      }
      return url
    } catch {
      return null
    }
  }

  private updateDom() {
    if (!this.container) return
    this.container.innerHTML = ""

    const embedUrl = this.getEmbedUrl(this.data.url)

    if (embedUrl) {
      const frameWrap = document.createElement("div")
      frameWrap.className = "aspect-video w-full rounded-xl overflow-hidden border bg-black/90 shadow-xs"
      const iframe = document.createElement("iframe")
      iframe.src = embedUrl
      iframe.className = "w-full h-full border-0"
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      iframe.allowFullscreen = true
      frameWrap.appendChild(iframe)
      this.container.appendChild(frameWrap)

      if (this.data.caption) {
        const cap = document.createElement("p")
        cap.className = "text-center text-xs text-muted-foreground mt-1"
        cap.textContent = this.data.caption
        this.container.appendChild(cap)
      }
    } else {
      const placeholder = document.createElement("div")
      placeholder.className = "rounded-xl border border-dashed p-8 text-center bg-muted/20 text-muted-foreground text-xs space-y-1"
      placeholder.innerHTML = `<div class="font-medium text-foreground">No Video Loaded</div><div>Configure video URL in the Right Properties panel.</div>`
      this.container.appendChild(placeholder)
    }
  }

  save(): VideoToolData {
    return this.data
  }
}

// ── 7. Shadcn Smart Table Tool with Interactive Buttons & S3 Attachments ───────

export interface TableCellButtonData {
  isButton: true
  label: string
  url: string
  actionType: "view_pdf" | "view_video" | "link" | "download"
  icon?: string // "file-text", "video", "download", "eye", "play", "external-link", "arrow-right", "sparkles"
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost"
}

export type TableCellData = string | TableCellButtonData

export interface TableToolData {
  withHeadings: boolean
  content: TableCellData[][]
}

function getButtonIconSvg(iconName?: string): string {
  switch (iconName) {
    case "video":
      return createSvgIcon('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>', "0 0 24 24")
    case "download":
      return createSvgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>')
    case "eye":
      return createSvgIcon('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')
    case "play":
      return createSvgIcon('<polygon points="5 3 19 12 5 21 5 3"/>')
    case "external-link":
      return createSvgIcon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>')
    case "arrow-right":
      return createSvgIcon('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>')
    case "sparkles":
      return createSvgIcon('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>')
    case "file-text":
    default:
      return createSvgIcon('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>')
  }
}

export class ShadcnTableTool {
  static get toolbox() {
    return {
      title: "Table / Data Grid",
      icon: createSvgIcon(
        '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>'
      ),
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  private data: TableToolData
  private readOnly: boolean
  private container: HTMLElement | null = null

  constructor({ data, readOnly }: { data: Partial<TableToolData>; readOnly?: boolean }) {
    let initialContent: TableCellData[][] = []

    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      initialContent = data.content
    } else {
      // Default interactive table with buttons
      initialContent = [
        ["Document Name", "Category / Class", "Action"],
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
      ]
    }

    this.data = {
      withHeadings: data.withHeadings !== undefined ? Boolean(data.withHeadings) : true,
      content: initialContent,
    }
    this.readOnly = Boolean(readOnly)
  }

  render(): HTMLElement {
    const container = document.createElement("div")
    this.container = container
    container.className = "my-4 group/table relative"

    this.updateDom()
    return container
  }

  private updateDom() {
    if (!this.container) return
    this.container.innerHTML = ""

    const wrapper = document.createElement("div")
    wrapper.className = "w-full rounded-xl border border-border bg-card shadow-xs overflow-hidden"

    const scrollWrap = document.createElement("div")
    scrollWrap.className = "w-full overflow-x-auto"

    const tableEl = document.createElement("table")
    tableEl.className = "w-full border-collapse text-left text-sm"

    const rows = this.data.content || []
    const hasHeadings = this.data.withHeadings && rows.length > 0

    if (hasHeadings) {
      const thead = document.createElement("thead")
      thead.className = "border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      const tr = document.createElement("tr")

      const headerRow = rows[0] || []
      headerRow.forEach((cellData, cIdx) => {
        const th = document.createElement("th")
        th.className = "px-4 py-3 border-r border-border/40 last:border-r-0 whitespace-nowrap"

        const editable = document.createElement("div")
        editable.contentEditable = (!this.readOnly).toString()
        editable.className = "focus:outline-hidden cursor-text min-h-[20px]"
        editable.innerHTML = typeof cellData === "string" ? cellData : cellData.label || "Header"
        editable.oninput = () => {
          this.data.content[0][cIdx] = editable.innerText || editable.innerHTML
        }
        editable.onclick = () => {
          this.dispatchSelectCell(0, cIdx)
        }
        th.appendChild(editable)
        tr.appendChild(th)
      })

      thead.appendChild(tr)
      tableEl.appendChild(thead)
    }

    const tbody = document.createElement("tbody")
    tbody.className = "divide-y divide-border/60"

    const bodyRows = hasHeadings ? rows.slice(1) : rows
    const rowOffset = hasHeadings ? 1 : 0

    bodyRows.forEach((row, rIdxRel) => {
      const rIdx = rIdxRel + rowOffset
      const tr = document.createElement("tr")
      tr.className = "hover:bg-muted/30 transition-colors"

      row.forEach((cellData, cIdx) => {
        const td = document.createElement("td")
        td.className = "px-4 py-3 text-sm text-foreground border-r border-border/40 last:border-r-0 align-middle"

        const isButton = typeof cellData === "object" && cellData !== null && cellData.isButton

        if (isButton) {
          const btnData = cellData as TableCellButtonData
          const variantClasses = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-xs",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
            ghost: "hover:bg-accent hover:text-accent-foreground",
          }

          const btnEl = document.createElement("div")
          btnEl.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all active:scale-95 ${variantClasses[btnData.variant || "default"]}`

          const iconWrap = document.createElement("span")
          iconWrap.className = "size-3.5 shrink-0 flex items-center justify-center"
          iconWrap.innerHTML = getButtonIconSvg(btnData.icon)
          btnEl.appendChild(iconWrap)

          const labelSpan = document.createElement("span")
          labelSpan.className = "truncate max-w-[160px]"
          labelSpan.textContent = btnData.label || "Action"
          btnEl.appendChild(labelSpan)

          // Action Pill
          const actionPill = document.createElement("span")
          actionPill.className = "ml-1 text-[9px] px-1 py-0.2 rounded bg-black/15 dark:bg-white/15 uppercase tracking-wider opacity-80"
          actionPill.textContent = btnData.actionType === "view_pdf" ? "PDF" : btnData.actionType === "view_video" ? "Video" : btnData.actionType === "download" ? "DL" : "Link"
          btnEl.appendChild(actionPill)

          btnEl.onclick = (e) => {
            e.stopPropagation()
            this.dispatchSelectCell(rIdx, cIdx)
          }

          td.appendChild(btnEl)
        } else {
          // Regular text cell
          const textEl = document.createElement("div")
          textEl.contentEditable = (!this.readOnly).toString()
          textEl.className = "focus:outline-hidden cursor-text min-h-[24px] text-foreground/90 empty:before:content-['...'] empty:before:opacity-40"
          textEl.innerHTML = typeof cellData === "string" ? cellData : ""
          textEl.oninput = () => {
            this.data.content[rIdx][cIdx] = textEl.innerText || textEl.innerHTML
          }
          textEl.onclick = () => {
            this.dispatchSelectCell(rIdx, cIdx)
          }
          td.appendChild(textEl)
        }

        tr.appendChild(td)
      })

      tbody.appendChild(tr)
    })

    tableEl.appendChild(tbody)
    scrollWrap.appendChild(tableEl)
    wrapper.appendChild(scrollWrap)

    // Canvas action toolbar for fast row/col adding
    if (!this.readOnly) {
      const bottomBar = document.createElement("div")
      bottomBar.className = "flex items-center justify-between px-3 py-1.5 bg-muted/20 border-t border-border/40 text-xs text-muted-foreground"

      const leftActions = document.createElement("div")
      leftActions.className = "flex items-center gap-2"

      const addRowBtn = document.createElement("button")
      addRowBtn.type = "button"
      addRowBtn.className = "px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-border hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
      addRowBtn.innerHTML = `<span>+ Row</span>`
      addRowBtn.onclick = (e) => {
        e.stopPropagation()
        this.addRow()
      }
      leftActions.appendChild(addRowBtn)

      const addColBtn = document.createElement("button")
      addColBtn.type = "button"
      addColBtn.className = "px-2 py-0.5 rounded text-[11px] font-medium bg-background border border-border hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
      addColBtn.innerHTML = `<span>+ Column</span>`
      addColBtn.onclick = (e) => {
        e.stopPropagation()
        this.addColumn()
      }
      leftActions.appendChild(addColBtn)

      bottomBar.appendChild(leftActions)

      const infoSpan = document.createElement("span")
      infoSpan.className = "text-[10px] opacity-70"
      infoSpan.textContent = "Click cell or button to customize in Right Sidebar"
      bottomBar.appendChild(infoSpan)

      wrapper.appendChild(bottomBar)
    }

    this.container.appendChild(wrapper)
  }

  private dispatchSelectCell(rowIndex: number, colIndex: number) {
    if (typeof window === "undefined") return
    window.dispatchEvent(
      new CustomEvent("pagebuilder:select-table-cell", {
        detail: {
          rowIndex,
          colIndex,
          cell: this.data.content[rowIndex]?.[colIndex],
        },
      })
    )
  }

  private addRow() {
    const colCount = (this.data.content[0] || []).length || 3
    const newRow: TableCellData[] = Array(colCount).fill("New Cell")
    this.data.content.push(newRow)
    this.updateDom()
  }

  private addColumn() {
    this.data.content.forEach((row, rIdx) => {
      row.push(rIdx === 0 ? "New Column" : "New Cell")
    })
    this.updateDom()
  }

  save(): TableToolData {
    return this.data
  }
}

