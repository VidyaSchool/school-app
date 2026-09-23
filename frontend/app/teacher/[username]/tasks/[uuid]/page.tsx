"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowUp, User, Brain, ArrowLeft, Loader2, Copy, Check, ArrowDown, Pause, Paperclip, Plus, X, FileText, ImageIcon, Video, ChevronDown, ChevronsUpDown, File, Zap, BrainCircuit, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "@/components/ui/sidebar"
import { Marker, MarkerContent, MarkerIcon, MarkerLabel } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import { AiToolCard, AiToolCall, useAutoDetectTools } from "@/components/ui/ai-tool-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
  createdAt: string
  thinking?: string
  attachment?: {
    kind: "image" | "pdf" | "video" | "text"
    name: string
    s3_url: string
  }
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

type GenerationStatus = "idle" | "sending" | "thinking" | "generating"

function CodeBlockWrapper({ code, children }: { code: string; children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="relative group/code my-4 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-900/80 text-[10px] text-zinc-600 dark:text-zinc-400 font-sans border-b border-zinc-200 dark:border-zinc-800/80">
        <span>Code</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-600 dark:text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-white/60 dark:bg-zinc-950/40">
        {children}
      </div>
    </div>
  )
}

// ── Collapsible Thinking / Reasoning block ──
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef(Date.now())
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (isStreaming) {
      startRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isStreaming])

  const durationLabel = elapsed > 0 ? `${elapsed}s` : "a few seconds"
  const cleanContent = (content || "").trim()

  return (
    <div className="mb-3">
      {/* ── Pill trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="
          group inline-flex items-center gap-2 rounded-full px-3 py-1.5
          border border-zinc-200 dark:border-zinc-800
          bg-zinc-100 dark:bg-zinc-900/80
          text-zinc-600 dark:text-zinc-400
          hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200
          text-[11px] font-medium tracking-tight select-none cursor-pointer
          transition-all duration-200
        "
      >
        {/* Spinner for streaming / static dot for finished */}
        {isStreaming ? (
          <Spinner size="sm" className="h-3 w-3 border-t-primary border-primary/20 shrink-0" />
        ) : (
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-400 dark:bg-zinc-500 shrink-0" />
        )}

        <span className={isStreaming ? "shimmer text-muted-foreground" : ""}>
          {isStreaming
            ? `Thinking${elapsed > 0 ? ` · ${elapsed}s` : "…"}`
            : `Thought for ${durationLabel}`}
        </span>

        {/* Expand / collapse icon */}
        <ChevronsUpDown className="size-3 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200" />
      </button>

      {/* ── Expandable reasoning panel ── */}
      {open && (
        <div className="
          mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800
          bg-zinc-50 dark:bg-zinc-950/90
          overflow-hidden shadow-sm
          animate-in fade-in slide-in-from-top-1 duration-200
        ">
          {/* Panel header */}
          <div className="flex items-center gap-2 px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/40">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Reasoning</span>
            {!isStreaming && elapsed > 0 && (
              <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">{durationLabel}</span>
            )}
          </div>
          {/* Scrollable content */}
          <div className="max-h-64 overflow-y-auto px-3.5 py-3 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
            <pre className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-mono whitespace-pre-wrap break-words select-text">
              {cleanContent || "(No reasoning trace available for this response)"}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}


// ── Per-message component: tool cards + markdown ─────────────────
function AssistantMessageContent({ content, userMsg = "" }: { content: string; userMsg?: string }) {
  const tools = useAutoDetectTools(userMsg, content)

  return (
    <>
      {tools.map((tool, i) => (
        <AiToolCard key={i} tool={tool} className="mb-3" />
      ))}
      <div className="text-zinc-800 dark:text-zinc-100 py-1 leading-relaxed text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-zinc-700 dark:text-zinc-200">{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-zinc-900 dark:text-white">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mt-3.5 mb-1.5 text-zinc-900 dark:text-white">{children}</h2>,
            strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>,
            code: ({ children }) => <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-rose-600 dark:text-rose-400 font-mono">{children}</code>,
            pre: ({ children }) => {
              const extractText = (node: any): string => {
                if (!node) return ""
                if (typeof node === "string") return node
                if (Array.isArray(node)) return node.map(extractText).join("")
                if (node.props?.children) return extractText(node.props.children)
                return ""
              }
              const codeText = extractText(children)
              return (
                <CodeBlockWrapper code={codeText}>
                  <pre className="p-4 bg-transparent overflow-x-auto font-mono text-xs text-zinc-800 dark:text-zinc-200">{children}</pre>
                </CodeBlockWrapper>
              )
            },
            br: () => <br />,
            table: ({ children }) => (
              <div className="w-full overflow-x-auto my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
                <table className="w-full min-w-[480px] divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950 text-xs text-left text-zinc-700 dark:text-zinc-300 border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-zinc-100/80 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 font-semibold">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/25 transition-colors">{children}</tr>,
            th: ({ children }) => <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-zinc-200 dark:border-zinc-800 font-bold whitespace-nowrap bg-zinc-100/80 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100">{children}</th>,
            td: ({ children }) => <td className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200 dark:border-zinc-800/40 whitespace-nowrap">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </>
  )
}

export default function TeacherTaskChatPage() {
  const params = useParams()
  const router = useRouter()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const username = params?.username as string
  const uuid = params?.uuid as string

  // Automatically fold sidebar on Agent/task page
  React.useEffect(() => {
    setOpen(false)
    if (isMobile) setOpenMobile(false)
  }, [setOpen, setOpenMobile, isMobile])

  const [session, setSession] = React.useState<ChatSession | null>(null)
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [genStatus, setGenStatus] = React.useState<GenerationStatus>("idle")
  const [isLocalMode, setIsLocalMode] = React.useState(false)
  const [authError, setAuthError] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const chatViewportRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [showScrollButton, setShowScrollButton] = React.useState(false)
  const activeReaderRef = React.useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const localIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // ── Model selector: Sarvam AI 105B vs Thinking vs Fast ──
  type ChatModelType = "sarvam-105b-conversations" | "thinking" | "fast"
  const [selectedModel, setSelectedModel] = React.useState<ChatModelType>("sarvam-105b-conversations")
  const useThinking = selectedModel === "thinking"

  // ── File attachment state ──
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = React.useState<{
    name: string
    type: string
    content: string
    kind: "image" | "pdf" | "video" | "text"
    s3_url: string
  } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  // ── Thinking / reasoning state ──
  const [thinkingMap, setThinkingMap] = React.useState<Record<number, string>>({})
  const [liveThinking, setLiveThinking] = React.useState("")
  const liveThinkingRef = React.useRef("")

  // ── Tool call results keyed by assistant message index ──
  const [toolCallsMap, setToolCallsMap] = React.useState<Record<number, AiToolCall[]>>({})

  // ── Guard: only auto-send the initial unanswered user message once per mount ──
  const autoSentRef = React.useRef(false)

  const handlePause = async () => {
    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel()
      } catch (e) {}
      activeReaderRef.current = null
    }
    if (localIntervalRef.current) {
      clearInterval(localIntervalRef.current)
      localIntervalRef.current = null
    }
    setGenStatus("idle")
    setIsTyping(false)
  }

  // ── File upload handler ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/backend/api/chats/upload", {
        method: "POST",
        body: formData
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setAttachedFile({
        name: data.filename,
        type: file.type,
        content: data.content,
        kind: data.type,
        s3_url: data.s3_url || ""
      })
    } catch (err) {
      console.error("File upload failed:", err)
      alert("Failed to process the file. Please try a different file.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const isNearBottomRef = React.useRef(true)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    isNearBottomRef.current = distanceToBottom < 60
    setShowScrollButton(distanceToBottom > 120)
  }

  // Auto-expand textarea on content growth (Shift + Enter)
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [input])

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (chatViewportRef.current) {
      if (behavior === "smooth") {
        chatViewportRef.current.scrollTo({
          top: chatViewportRef.current.scrollHeight,
          behavior: "smooth",
        })
      } else {
        chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight
      }
    }
  }

  const searchParams = useSearchParams()

  // Start a brand new chat session with backend API and stream initial response
  const startNewBackendChat = async (
    roomUuid: string,
    roomTitle: string,
    userMsgText: string,
    baseSession: ChatSession,
    attachmentDataUrl?: string,
    attachmentMime?: string
  ) => {
    setIsTyping(true)
    setGenStatus("sending")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3min timeout

    try {
      const res = await fetch("/api/backend/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: roomUuid,
          title: roomTitle,
          message: userMsgText,
          model: selectedModel,
          use_thinking: selectedModel === "thinking",
          ...(attachmentDataUrl ? { attachment_data_url: attachmentDataUrl, attachment_mime: attachmentMime } : {})
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.status === 401) {
        setAuthError(true)
        setIsTyping(false)
        setGenStatus("idle")
        return
      }
      if (!res.ok) throw new Error(`API error ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No reader")

      activeReaderRef.current = reader
      setIsTyping(false)

      let done = false
      let fullContent = ""
      let isFirstChunk = true

      liveThinkingRef.current = ""
      setLiveThinking("")
      const assistantMsgIndex = 1

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({ ...baseSession, messages: [...baseSession.messages, assistantMessage] })

      let lineBuffer = ""
      while (!done) {
        if (!activeReaderRef.current) break
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          lineBuffer += decoder.decode(value, { stream: !doneReading })
        }

        const lines = lineBuffer.split("\n")
        // Keep last possibly-incomplete line in buffer
        lineBuffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const dataStr = line.slice(6).trim()
          if (dataStr === "[DONE]") { done = true; break }
          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.thinking) {
              setGenStatus("thinking")
              liveThinkingRef.current += parsed.thinking
              setLiveThinking(liveThinkingRef.current)
              continue
            }
            if (parsed.content) {
              if (isFirstChunk) {
                setGenStatus("generating")
                isFirstChunk = false
              }
              fullContent += parsed.content
              setSession({ ...baseSession, messages: [...baseSession.messages, { ...assistantMessage, content: fullContent }] })
            }
          } catch {}
        }
      }

      activeReaderRef.current = null
      setGenStatus("idle")
      setLiveThinking("")

      if (liveThinkingRef.current) {
        setThinkingMap(prev => ({ ...prev, [assistantMsgIndex]: liveThinkingRef.current }))
      }

      const finalSession = { ...baseSession, messages: [...baseSession.messages, { ...assistantMessage, content: fullContent }] }
      setSession(finalSession)

      // Notify sidebar to refresh list from backend DB
      window.dispatchEvent(new Event("vidya_chats_updated"))

      // Clean up search param
      router.replace(`/teacher/${username || 'username'}/tasks/${roomUuid}`, { scroll: false })

    } catch (err) {
      clearTimeout(timeoutId)
      console.error("Start chat backend API error:", err)
      setIsTyping(false)
      setGenStatus("idle")
      setSession({
        ...baseSession,
        messages: [
          ...baseSession.messages,
          {
            role: "assistant",
            content: "⚠️ Unable to connect to the AI model. Please check your connection or try again.",
            createdAt: new Date().toISOString()
          }
        ]
      })
    }
  }

  // Load chat session on mount / uuid change from backend DB
  React.useEffect(() => {
    if (!uuid) return

    const initialText = searchParams?.get("initialMessage")
    if (initialText) {
      const title = initialText.slice(0, 35) + (initialText.length > 35 ? "..." : "")
      const freshSession: ChatSession = {
        id: uuid,
        title,
        messages: [{ role: "user", content: initialText, createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      }
      setSession(freshSession)
      startNewBackendChat(uuid, title, initialText, freshSession, undefined, undefined)
      return
    }

    if (uuid === "new") {
      setSession({
        id: "new",
        title: "AI Chat Assistant",
        messages: [
          {
            role: "assistant",
            content: "Hello! I am your VidyaSchool AI assistant. How can I help you today?",
            createdAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString()
      })
      return
    }

    fetch(`/api/backend/api/chats/${uuid}`)
      .then(async (res) => {
        if (res.status === 401) {
          setAuthError(true)
          return
        }
        if (!res.ok) throw new Error(`Backend error ${res.status}`)
        const data: ChatSession = await res.json()
        setSession(data)
        setIsLocalMode(false)
      })
      .catch((err) => {
        console.error("Failed to load chat from backend:", err)
        setIsLocalMode(true)
        setSession({
          id: uuid,
          title: "AI Chat Assistant",
          messages: [
            {
              role: "assistant",
              content: "Hello! I am your VidyaSchool AI assistant. How can I help you today?",
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString()
        })
      })

    autoSentRef.current = false
  }, [uuid])

  // Scroll to bottom on message change and loading updates (only if user is at bottom)
  React.useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("auto")
    }
  }, [session?.messages, isTyping, genStatus])

  // Land at bottom when first loaded
  React.useEffect(() => {
    if (session) {
      isNearBottomRef.current = true
      scrollToBottom("auto")
      const t = setTimeout(() => scrollToBottom("auto"), 100)
      return () => clearTimeout(t)
    }
  }, [session?.id])

  // Handle local mock simulated streaming typing effect
  const handleLocalSimulation = async (userMessageText: string, updatedMessages: Message[], updatedSession: ChatSession) => {
    setIsTyping(true)
    setGenStatus("thinking")

    let fullAnswer = ""
    const lower = userMessageText.toLowerCase()

    if (lower.includes("leaderboard") || lower.includes("top student") || lower.includes("rank") || lower.includes("highest score") || lower.includes("second") || lower.includes("2nd") || lower.includes("third") || lower.includes("3rd")) {
      try {
        const res = await fetch("/api/backend/api/student/leaderboard")
        if (res.ok) {
          const data = await res.json()
          if (data.leaderboard && data.leaderboard.length > 0) {
            const topList = data.leaderboard.slice(0, 5)

            // Detect specific rank queries
            const rankIdx =
              (lower.includes("second") || lower.includes("2nd")) ? 1 :
              (lower.includes("third") || lower.includes("3rd")) ? 2 : 0

            if ((lower.includes("second") || lower.includes("2nd") || lower.includes("third") || lower.includes("3rd")) && topList[rankIdx]) {
              const medals = ["🥇", "🥈", "🥉"]
              const s = topList[rankIdx]
              fullAnswer = `${medals[rankIdx]} **Rank #${rankIdx + 1}:** **${s.name}** with **${s.average}%** average across ${s.examsCount} exam(s).\n\n` +
                `### Top 5 Leaderboard Standings:\n` +
                topList.map((s: any, idx: number) => `**${idx + 1}. ${s.name}** — ${s.average}% avg (${s.examsCount} exam(s))`).join("\n")
            } else {
              const top = topList[0]
              fullAnswer = `🏆 **Top Student on Leaderboard:** **${top.name}** with **${top.average}%** average score!\n\n` +
                `### Top 5 Leaderboard Standings:\n` +
                topList.map((s: any, idx: number) => `**${idx + 1}. ${s.name}** — ${s.average}% avg (${s.examsCount} exam(s))`).join("\n")
            }
          }
        }
      } catch (e) {}
    }

    if (!fullAnswer) {
      const localAnswers = [
        `Here is the information for: **"${userMessageText}"**.\n\n- **Status:** Action plan initialized\n- **Target:** Student performance & class roster synchronization\n\nLet me know if you would like me to perform additional database queries or publish a notice!`,
        `Regarding **"${userMessageText}"**:\n\n- All student academic logs and class records are active.\n- You can use the Notice board tool or Push Notification tool directly from this assistant chat.\n\nHow else can I assist your class today?`
      ]
      fullAnswer = localAnswers[Math.floor(Math.random() * localAnswers.length)]
    }

    setTimeout(() => {
      setGenStatus("generating")
      setIsTyping(false)

      let currentLength = 0
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      })

      localIntervalRef.current = setInterval(() => {
        currentLength += Math.min(3, fullAnswer.length - currentLength)
        const partialContent = fullAnswer.slice(0, currentLength)

        const finalSession = {
          ...updatedSession,
          messages: [
            ...updatedMessages,
            { ...assistantMessage, content: partialContent }
          ]
        }
        setSession(finalSession)

        if (currentLength >= fullAnswer.length) {
          if (localIntervalRef.current) {
            clearInterval(localIntervalRef.current)
            localIntervalRef.current = null
          }
          setGenStatus("idle")
        }
      }, 35)

    }, 1800)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session) return

    const userMessageText = input.trim()
    setInput("")

    // Capture attachment before clearing
    const sentAttachment = attachedFile
      ? { kind: attachedFile.kind, name: attachedFile.name, s3_url: attachedFile.s3_url }
      : undefined

    // For images: send directly to AI via multimodal (no text prefix).
    // For PDFs/videos/text: prepend extracted content as context.
    let finalMessageText = userMessageText
    let attachmentDataUrl: string | undefined
    let attachmentMime: string | undefined

    if (attachedFile) {
      if (attachedFile.kind === "image") {
        // content is the base64 data URL — send directly to model
        attachmentDataUrl = attachedFile.content
        attachmentMime = attachedFile.type
        // finalMessageText stays as the user's plain text
      } else {
        // PDF / video / text: prepend extracted content
        const s3Ref = attachedFile.s3_url ? `\nFile URL: ${attachedFile.s3_url}` : ""
        const filePrefix = `[Attached ${attachedFile.kind.toUpperCase()}: ${attachedFile.name}]${s3Ref}\n\nExtracted content:\n${attachedFile.content}\n\n---\n\nUser message: `
        finalMessageText = filePrefix + userMessageText
      }
      setAttachedFile(null)
    }

    const userMessage: Message = {
      role: "user",
      content: userMessageText,
      createdAt: new Date().toISOString(),
      attachment: sentAttachment
    }

    const updatedMessages = [...session.messages, userMessage]
    
    let currentTitle = session.title
    if (currentTitle === "AI Chat Assistant" || currentTitle.startsWith("New Chat")) {
      currentTitle = userMessageText.slice(0, 35) + (userMessageText.length > 35 ? "..." : "")
    }

    const updatedSession: ChatSession = {
      ...session,
      title: currentTitle,
      messages: updatedMessages
    }

    setSession(updatedSession)
    isNearBottomRef.current = true
    setShowScrollButton(false)
    setTimeout(() => scrollToBottom("auto"), 20)

    if (isLocalMode) {
      handleLocalSimulation(userMessageText, updatedMessages, updatedSession)
      return
    }

    if (uuid === "new") {
      const generatedId = crypto.randomUUID()
      startNewBackendChat(
        generatedId,
        currentTitle,
        finalMessageText,
        { ...updatedSession, id: generatedId },
        attachmentDataUrl,
        attachmentMime
      )
      return
    }

    setIsTyping(true)
    setGenStatus("sending")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3min timeout

    try {
      const res = await fetch(`/api/backend/api/chats/${uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalMessageText,
          title: currentTitle,
          model: selectedModel,
          use_thinking: selectedModel === "thinking",
          ...(attachmentDataUrl ? { attachment_data_url: attachmentDataUrl, attachment_mime: attachmentMime } : {})
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.status === 401) {
        setAuthError(true)
        setIsTyping(false)
        setGenStatus("idle")
        return
      }
      if (!res.ok) throw new Error(`API error ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No reader")
      
      activeReaderRef.current = reader
      setIsTyping(false)
      let done = false
      let fullContent = ""
      let isFirstChunk = true

      liveThinkingRef.current = ""
      setLiveThinking("")
      const assistantMsgIndex = updatedMessages.length

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      })

      let lineBuffer = ""
      while (!done) {
        if (!activeReaderRef.current) break
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          lineBuffer += decoder.decode(value, { stream: !doneReading })
        }

        const lines = lineBuffer.split("\n")
        // Keep last possibly-incomplete line in buffer
        lineBuffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const dataStr = line.slice(6).trim()
          if (dataStr === "[DONE]") { done = true; break }
          try {
            const parsed = JSON.parse(dataStr)

            if (parsed.thinking) {
              setGenStatus("thinking")
              liveThinkingRef.current += parsed.thinking
              setLiveThinking(liveThinkingRef.current)
              continue
            }

            if (parsed.content) {
              if (isFirstChunk) {
                setGenStatus("generating")
                isFirstChunk = false
              }
              fullContent += parsed.content
              setSession({
                ...updatedSession,
                messages: [
                  ...updatedMessages,
                  { ...assistantMessage, content: fullContent }
                ]
              })
            }
          } catch {}
        }
      }

      activeReaderRef.current = null
      setGenStatus("idle")
      setLiveThinking("")

      if (liveThinkingRef.current) {
        setThinkingMap(prev => ({ ...prev, [assistantMsgIndex]: liveThinkingRef.current }))
      }

      const finalSession = {
        ...updatedSession,
        messages: [
          ...updatedMessages,
          { ...assistantMessage, content: fullContent }
        ]
      }
      setSession(finalSession)
      window.dispatchEvent(new Event("vidya_chats_updated"))

    } catch (err) {
      clearTimeout(timeoutId)
      console.error("Backend API call failed during chat submit:", err)
      setIsTyping(false)
      setGenStatus("idle")
      setSession({
        ...updatedSession,
        messages: [
          ...updatedMessages,
          {
            role: "assistant",
            content: "⚠️ Unable to process request. The AI server may be overloaded or unreachable. Please try again.",
            createdAt: new Date().toISOString()
          }
        ]
      })
    }
  }

  if (authError) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4">
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-6 py-5 text-center max-w-sm">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Session Expired</p>
          <p className="text-xs text-red-600/80 dark:text-red-500/80 mb-4">Your login session has expired. Please sign in again to continue.</p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-2 transition-colors"
          >
            Sign In Again
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading chat panel...</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full max-h-full flex-1 bg-background text-foreground w-full overflow-hidden">
      
      {/* ── Chat Messages Pane ── */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* top fade */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-background to-transparent z-20" />
        {/* bottom fade */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent z-20" />
        <ScrollArea
          ref={chatViewportRef}
          onScroll={handleScroll}
          className="h-full w-full"
          viewportClassName="px-2.5 sm:px-5 pt-3 sm:pt-5 pb-8"
        >
        <div className="space-y-3.5 sm:space-y-4 max-w-4xl mx-auto w-full">
          {session.messages.map((msg, index) => {
            const isUser = msg.role === "user"
            return (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 w-full min-w-0 ${
                  isUser ? "max-w-[88%] sm:max-w-[85%] ml-auto flex-row-reverse" : "max-w-full sm:max-w-[85%] mr-auto"
                }`}
              >
                {/* Avatar */}
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg text-[10px] sm:text-xs font-semibold ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {isUser ? <User className="size-3 sm:size-3.5" /> : <Brain className="size-3 sm:size-3.5 text-primary" />}
                </span>

                {/* Bubble */}
                <div className="space-y-1 flex-1 min-w-0">
                  {isUser ? (
                    <div className="ml-auto w-fit max-w-[95%] sm:max-w-[85%] space-y-1.5">
                      {/* Attachment preview in sent message */}
                      {msg.attachment && (
                        <div className="mb-1">
                          {msg.attachment.kind === "image" && msg.attachment.s3_url ? (
                            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-w-[220px] sm:max-w-xs shadow-sm">
                              <img
                                src={msg.attachment.s3_url}
                                alt={msg.attachment.name}
                                className="w-full object-cover max-h-48"
                              />
                              <div className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-700">
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{msg.attachment.name}</p>
                              </div>
                            </div>
                          ) : msg.attachment.kind === "pdf" ? (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40">
                              <FileText className="size-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                              <span className="text-[11px] text-rose-700 dark:text-rose-300 truncate max-w-[140px]">{msg.attachment.name}</span>
                            </div>
                          ) : msg.attachment.kind === "video" ? (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40">
                              <Video className="size-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
                              <span className="text-[11px] text-violet-700 dark:text-violet-300 truncate max-w-[140px]">{msg.attachment.name}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              <File className="size-3.5 text-zinc-500 shrink-0" />
                              <span className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate max-w-[140px]">{msg.attachment.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.content.includes("call:vidya_school:publish_notice") || msg.content.includes("tool_call>") ? (
                        <div className="space-y-2">
                          <AiToolCard
                            tool={{
                              type: "send_notice",
                              params: {
                                title: "School Working Day Announcement",
                                content: msg.content.match(/message:\s*['"]([^'"]+)['"]/i)?.[1] || "Please note that tomorrow is not a holiday. School will be open as usual.",
                                category: "General"
                              },
                              status: "success",
                              result: "Published to Notice Board"
                            }}
                          />
                          <AiToolCard
                            tool={{
                              type: "send_push",
                              params: {
                                title: "📢 Notice Alert",
                                body: msg.content.match(/message:\s*['"]([^'"]+)['"]/i)?.[1] || "Please note that tomorrow is not a holiday. School will be open as usual.",
                                targetRole: "all"
                              },
                              status: "success",
                              deliveredCount: 12
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap px-1 py-0.5 font-normal break-words">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Show saved thinking block for this message if it exists */}
                      {thinkingMap[index] && (
                        <ThinkingBlock
                          content={thinkingMap[index]}
                          isStreaming={false}
                        />
                      )}
                      {/* Show live thinking during active streaming on the last assistant message */}
                      {!thinkingMap[index] && liveThinking && index === session.messages.length - 1 && (
                        <ThinkingBlock
                          content={liveThinking}
                          isStreaming={genStatus === "thinking" || genStatus === "generating"}
                        />
                      )}
                      <AssistantMessageContent
                        content={msg.content}
                        userMsg={index > 0 && session.messages[index - 1]?.role === "user" ? session.messages[index - 1].content : ""}
                      />
                    </>
                  )}
                  <p className={`text-[9px] text-muted-foreground/60 ${isUser ? "text-right" : "text-left"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Shimmer loading / Generation Status */}
          {genStatus !== "idle" ? (
            <div className="max-w-[95%] sm:max-w-[80%] mr-auto w-full space-y-2.5 py-1">
              {liveThinking && genStatus === "thinking" && (
                <ThinkingBlock content={liveThinking} isStreaming={true} />
              )}
              {/* Row 1 — spinner + dynamic status label */}
              <Marker role="status">
                <MarkerIcon>
                  <Spinner size="sm" className="border-t-primary border-primary/20" />
                </MarkerIcon>
                <MarkerLabel className="shimmer text-muted-foreground">
                  {genStatus === "sending"
                    ? "Sending\u2026"
                    : genStatus === "thinking"
                    ? "Thinking\u2026"
                    : "Generating\u2026"}
                </MarkerLabel>
              </Marker>
              {/* Row 2 — separator shimmer (only while actively generating) */}
              {genStatus === "generating" && (
                <Marker variant="separator" role="status">
                  <MarkerContent className="shimmer text-muted-foreground">
                    Writing response&hellip;
                  </MarkerContent>
                </Marker>
              )}
            </div>
          ) : null}

          
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>
      </div>

      {/* ── Scroll to Bottom Float Trigger ── */}
      {showScrollButton && (
        <button
          onClick={() => {
            isNearBottomRef.current = true
            setShowScrollButton(false)
            scrollToBottom("smooth")
          }}
          className="absolute bottom-24 right-3 sm:right-8 z-40 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <ArrowDown className="size-3.5 sm:size-4" />
        </button>
      )}

      {/* ── Bottom-pinned Chat Input (in-flow, sidebar-aware) ── */}
      <div className="w-full shrink-0 px-2.5 sm:px-5 pb-3 sm:pb-4 pt-1 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-3xl mx-auto w-full">

        {/* ── Rich file attachment preview ── */}
        {attachedFile && (
          <div className="mb-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="group relative inline-flex items-start gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-900/80 p-2 sm:p-2.5 shadow-sm max-w-[280px] sm:max-w-sm backdrop-blur-sm">
              {/* Thumbnail or icon */}
              {attachedFile.kind === "image" && attachedFile.s3_url ? (
                <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={attachedFile.s3_url}
                    alt={attachedFile.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : attachedFile.kind === "image" ? (
                <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-sky-100 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center">
                  <ImageIcon className="size-5 sm:size-6 text-sky-500 dark:text-sky-400" />
                </div>
              ) : attachedFile.kind === "pdf" ? (
                <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center">
                  <FileText className="size-5 sm:size-6 text-rose-500 dark:text-rose-400" />
                </div>
              ) : attachedFile.kind === "video" ? (
                <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center">
                  <Video className="size-5 sm:size-6 text-violet-500 dark:text-violet-400" />
                </div>
              ) : (
                <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                  <File className="size-5 sm:size-6 text-zinc-500 dark:text-zinc-400" />
                </div>
              )}
              {/* File info */}
              <div className="flex flex-col justify-center min-w-0 flex-1 pr-5">
                <p className="text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{attachedFile.name}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 capitalize">
                  {attachedFile.kind}{attachedFile.s3_url ? " · uploaded" : " · extracted"}
                </p>
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="w-full flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-black shadow-lg dark:shadow-2xl min-h-[96px] sm:min-h-[108px] transition-all"
        >
          {/* Textarea field (Doubled height) */}
          <textarea
            ref={textareaRef}
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            placeholder={attachedFile ? `Ask about ${attachedFile.name}...` : "Message AI Assistant..."}
            className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-1.5 py-1 resize-none min-h-[54px] max-h-40 scrollbar-none"
          />

          {/* Bottom Toolbar - Buttons sticked to bottom */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Attach button */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                title="Attach image, PDF, or video"
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                {isUploading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Plus className="h-4 w-4" />}
              </button>

              {/* Sarvam AI model label (default, no change option) */}
              <div
                className="inline-flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 py-1.5 text-[10px] sm:text-[11px] font-medium tracking-tight border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 select-none"
              >
                <Sparkles className="size-3 shrink-0 text-orange-500" />
                <span>Sarvam AI</span>
              </div>
            </div>

            {/* Send / Pause button sticked to bottom right */}
            {genStatus !== "idle" ? (
              <button
                type="button"
                onClick={handlePause}
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
        </form>
        </div>{/* /max-w-4xl */}
      </div>

    </div>
  )
}
