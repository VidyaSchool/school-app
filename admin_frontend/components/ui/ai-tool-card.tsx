"use client"

import * as React from "react"
import {
  Megaphone,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Users,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────── */
export type AiToolType = "send_notice" | "send_push"
export type AiToolStatus = "draft" | "pending" | "success" | "error" | "cancelled"

export interface AiToolCall {
  type: AiToolType
  params: Record<string, string | boolean | undefined>
  status: AiToolStatus
  result?: string
  deliveredCount?: number
}

/* ── Tool metadata ───────────────────────────────────────────────── */
const toolMeta: Record<AiToolType, { icon: React.ElementType; label: string; color: string }> = {
  send_notice: { icon: Megaphone, label: "Post School Notice",      color: "text-amber-500 dark:text-amber-400" },
  send_push:   { icon: Bell,      label: "Send Push Notification",  color: "text-violet-500 dark:text-violet-400" },
}

/* ── Stable dedup key for a tool call ───────────────────────────── */
export function toolDedupKey(tool: { type: AiToolType; params: Record<string, any> }): string {
  const title = (tool.params.title || "") as string
  const content = ((tool.params.content || tool.params.body || "") as string)
  return `ai_widget_status:${tool.type}:${title.slice(0, 50)}:${content.slice(0, 50)}`
}

/* ── Formal Notification Formatter ──────────────────────────────── */
export function formalizeNotification(rawTitle?: string, rawContent?: string): { title: string; content: string } {
  let text = (rawContent || rawTitle || "").trim()

  // Clean conversational prefixes & lower case artifacts
  text = text
    .replace(/^(that|the|a)\s+/i, "")
    .replace(/^please\s+(notify|send|tell|push|post|broadcast)?\s*(that|the)?\s*/i, "")
    .replace(/^notify\s+(that|the|all)?\s*/i, "")
    .replace(/^alert\s+(that|the|all)?\s*/i, "")
    .replace(/^(students?|teachers?|staff|all|everyone)\s+(that|about)?\s*/i, "")
    .trim()

  if (text) {
    text = text.charAt(0).toUpperCase() + text.slice(1)
  }

  // 1. Application / portal in test mode
  if (/test\s*mode|testing\s*mode|beta\s*mode/i.test(text) || /test\s*mode/i.test(rawTitle || "")) {
    return {
      title: "Application Notice: Test Mode Active",
      content: "Please be advised that the application is currently operating in test mode. Some features may experience temporary maintenance or limited availability. We appreciate your patience and cooperation."
    }
  }

  // 2. Holiday announcements
  if (/holiday|school\s+is\s+closed|day\s+off|closed\s+tomorrow/i.test(text)) {
    return {
      title: "School Announcement: Holiday Notice",
      content: text.endsWith(".") ? text : `${text}. Regular classes and school operations will resume as scheduled.`
    }
  }

  // 3. Exam / Test announcements
  if (/exam|test|assessment|midterm|annual/i.test(text)) {
    return {
      title: "Academic Notice: Examination Update",
      content: text.endsWith(".") ? text : `${text}. Please prepare accordingly and check the schedule.`
    }
  }

  // 4. Meeting / Assembly
  if (/meeting|assembly|gathering|pta/i.test(text)) {
    return {
      title: "School Announcement: Important Meeting",
      content: text.endsWith(".") ? text : `${text}. All concerned members are requested to attend on time.`
    }
  }

  // 5. Fee / Administrative
  if (/fee|due|payment|submission/i.test(text)) {
    return {
      title: "Administrative Notice: Important Update",
      content: text.endsWith(".") ? text : `${text}. Please complete the required formalities at the earliest.`
    }
  }

  // General clean title and message
  let formalTitle = (rawTitle && rawTitle !== rawContent && !rawTitle.toLowerCase().startsWith("that "))
    ? rawTitle
    : ""

  if (!formalTitle) {
    const firstPhrase = text.split(/[.,\n]/)[0].trim()
    formalTitle = firstPhrase.length > 40 ? firstPhrase.slice(0, 40) + "..." : firstPhrase
    if (!formalTitle.toLowerCase().includes("notice") && !formalTitle.toLowerCase().includes("announcement")) {
      formalTitle = `School Notice: ${formalTitle}`
    }
  }

  const formalContent = text.endsWith(".") ? text : `${text}.`

  return {
    title: formalTitle,
    content: formalContent
  }
}

/* ── executeToolCall ─────────────────────────────────────────────── */
export async function executeToolCall(
  tool: AiToolCall
): Promise<{ status: "success" | "error"; result?: string; deliveredCount?: number }> {
  try {
    if (tool.type === "send_notice") {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tool.params.title,
          content: tool.params.content || tool.params.body,
          category: tool.params.category || "General",
          isUrgent: tool.params.isUrgent ?? false,
          targetClass: tool.params.targetClass || "",
          targetSection: tool.params.targetSection || "",
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to post notice")
      }
      return { status: "success" }
    } else {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tool.params.title,
          body: tool.params.body || tool.params.content,
          targetRole: tool.params.targetRole || "all",
          targetClass: tool.params.targetClass || undefined,
          targetSection: tool.params.targetSection || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to send push")
      return { status: "success", deliveredCount: data.deliveredCount }
    }
  } catch (err: any) {
    return { status: "error", result: err.message }
  }
}

/* ── AiToolCard Component ────────────────────────────────────────── */
interface AiToolCardProps {
  tool: AiToolCall
  className?: string
}

export function AiToolCard({ tool, className }: AiToolCardProps) {
  const [expanded, setExpanded] = React.useState(true)
  const meta = toolMeta[tool.type]
  const Icon = meta.icon

  const dedupKey = toolDedupKey(tool)
  const [status, setStatus] = React.useState<AiToolStatus>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(dedupKey)
      if (saved === "done") return "success"
      if (saved === "cancelled") return "cancelled"
    }
    return tool.status || "draft"
  })
  const [deliveredCount, setDeliveredCount] = React.useState<number | undefined>(tool.deliveredCount)
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(tool.result)

  const audience =
    tool.type === "send_push"
      ? (tool.params.targetRole as string) || "all"
      : [
          tool.params.targetClass && `Class ${tool.params.targetClass}`,
          tool.params.targetSection && `Sec ${tool.params.targetSection}`,
        ]
          .filter(Boolean)
          .join(" · ") || "all"

  const handleConfirm = async () => {
    setStatus("pending")
    const res = await executeToolCall(tool)
    if (res.status === "success") {
      setStatus("success")
      setDeliveredCount(res.deliveredCount)
      if (typeof window !== "undefined") localStorage.setItem(dedupKey, "done")
    } else {
      setStatus("error")
      setErrorMessage(res.result || "Failed to send notification")
    }
  }

  const handleCancel = () => {
    setStatus("cancelled")
    if (typeof window !== "undefined") localStorage.setItem(dedupKey, "cancelled")
  }

  return (
    <div className={cn("my-2 w-full max-w-[min(100%,32rem)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 overflow-hidden text-xs shadow-sm transition-all", className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer select-none min-w-0"
      >
        <span className="shrink-0 flex items-center justify-center">
          {status === "draft"     && <Bell className="size-3.5 text-amber-500 animate-pulse" />}
          {status === "pending"   && <Loader2 className="size-3.5 animate-spin text-primary" />}
          {status === "success"   && <CheckCircle2 className="size-3.5 text-emerald-500 dark:text-emerald-400" />}
          {status === "error"     && <AlertCircle  className="size-3.5 text-rose-500 dark:text-rose-400" />}
          {status === "cancelled" && <X className="size-3.5 text-zinc-400" />}
        </span>

        <Icon className={cn("size-3.5 shrink-0", meta.color)} />
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 min-w-0 flex-1 text-left truncate">{meta.label}</span>

        <span className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
          <Users className="size-3" />
          <span className="capitalize">{audience}</span>
        </span>

        <ChevronDown className={cn("size-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/60 px-3.5 py-3 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-950/40 min-w-0">
          {tool.params.title && (
            <div className="flex gap-2 min-w-0 items-start">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0 font-medium pt-0.5">Title</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold break-words min-w-0 flex-1 text-[12px]">{tool.params.title as string}</span>
            </div>
          )}
          {(tool.params.body || tool.params.content) && (
            <div className="flex gap-2 min-w-0 items-start">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0 font-medium pt-0.5">Message</span>
              <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed break-words min-w-0 flex-1 text-[11px]">
                {(tool.params.body || tool.params.content) as string}
              </span>
            </div>
          )}
          {tool.params.category && (
            <div className="flex gap-2 items-center">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0 font-medium">Category</span>
              <span className="text-zinc-700 dark:text-zinc-300">{tool.params.category as string}</span>
            </div>
          )}
          {tool.params.isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-medium">
              <AlertCircle className="size-2.5" /> Urgent
            </span>
          )}

          {/* Interactive Action Footer */}
          {status === "draft" && (
            <div className="pt-2.5 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground select-none">Send to {audience}?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-[11px] font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <X className="size-3 text-zinc-400" />
                  <span>No, Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-[11px] font-medium shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>Yes, Send</span>
                </button>
              </div>
            </div>
          )}

          {status === "pending" && (
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-[11px]">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Sending notification to all target devices&hellip;</span>
            </div>
          )}

          {status === "cancelled" && (
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
              <X className="size-3 text-zinc-400" />
              <span>Notification cancelled. No messages were sent.</span>
            </div>
          )}

          {status === "success" && (
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
              <CheckCircle2 className="size-3.5" />
              <span>
                {tool.type === "send_push" && deliveredCount !== undefined
                  ? `Delivered to ${deliveredCount} user(s)`
                  : "Published successfully to students & staff"}
              </span>
            </div>
          )}

          {status === "error" && (
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px]">
              <AlertCircle className="size-3.5" />
              <span>{errorMessage || "Failed to dispatch notification"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── detectToolsFromMessages ─────────────────────────────────────── */
export function detectToolsFromMessages(
  userMsg: string,
  aiResponse: string
): Omit<AiToolCall, "status">[] {
  const tools: Omit<AiToolCall, "status">[] = []

  // 1. JSON action block detection: ```action { ... } ``` or raw JSON
  const jsonMatch = aiResponse.match(/(?:```(?:action|json)?\s*)?\{[^{}]*"action"\s*:\s*"([^"]+)"[^{}]*\}(?:```)?/)
  if (jsonMatch) {
    try {
      const parsedMatch = jsonMatch[0].replace(/```(?:action|json)?/g, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(parsedMatch)
      const action = parsed.action || ""
      const rawContent = (parsed.message || parsed.body || parsed.content || "").trim()
      const rawTitle = (parsed.title || "").trim()

      const formal = formalizeNotification(rawTitle, rawContent)

      if (/push|notification|notify/i.test(action)) {
        tools.push({
          type: "send_push",
          params: {
            title: formal.title,
            body: formal.content,
            targetRole: parsed.targetRole || "all"
          },
        })
        return tools
      }
      if (/notice|announce|publish/i.test(action)) {
        tools.push({
          type: "send_notice",
          params: {
            title: formal.title,
            content: formal.content,
            category: parsed.category || "General"
          },
        })
        return tools
      }
    } catch {}
  }

  // 2. Draft Message preview pattern in aiResponse
  const draftMatch = aiResponse.match(/(?:📢\s*)?\*?\*?Draft Message:?\*?\*?\s*([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\n?Shall I|\n?Reply|$)/i)
  if (draftMatch) {
    const rawContent = draftMatch[1].trim()
    const formal = formalizeNotification(undefined, rawContent)
    const isPush = /\b(push|notification|mobile|device)\b/i.test(userMsg)

    tools.push({
      type: isPush ? "send_push" : "send_notice",
      params: {
        title: formal.title,
        ...(isPush ? { body: formal.content, targetRole: "all" } : { content: formal.content, category: "General" })
      }
    })
    return tools
  }

  // 3. Raw tool_call syntax pattern detection
  const rawToolCallMatch = (userMsg + " " + aiResponse).match(
    /(?:tool_call>)?call:[\w_]+:(publish_notice|send_push|send_notification)\(([\s\S]+?)\)(?:<\/tool_call|>)?/i
  )
  if (rawToolCallMatch) {
    const rawArgs = rawToolCallMatch[2]
    const extractedMessage =
      rawArgs.match(/(?:message|content|body):\s*['"]([^'"]+)['"]/i)?.[1] ||
      rawArgs.match(/(?:message|content|body):\s*([^,)\}\n]+)/i)?.[1] || ""
    const extractedTitle = rawArgs.match(/title:\s*['"]([^'"]+)['"]/i)?.[1]

    if (extractedMessage) {
      const formal = formalizeNotification(extractedTitle, extractedMessage)
      tools.push({
        type: "send_push",
        params: {
          title: formal.title,
          body: formal.content,
          targetRole: "all"
        }
      })
      return tools
    }
  }

  // 4. Intent detection from userMsg
  const u = userMsg.toLowerCase()
  const a = aiResponse.toLowerCase()

  const pushUserIntent =
    /\b(send|push|notify|broadcast|alert|message)\b/.test(u) &&
    /\b(all|everyone|students|teachers|staff|users|notification|push)\b/.test(u)

  const pushAiConfirm =
    /\b(notification|push|notice|announcement|message).*(sent|delivered|broadcast)\b/.test(a) ||
    /\b(sent|delivered).*(notification|push|users|app|system)\b/.test(a)

  if (pushUserIntent || pushAiConfirm) {
    const targetRole =
      /\bstudents?\b/.test(u) ? "student" :
      /\bteachers?\b/.test(u) ? "teacher" :
      /\bstaff\b/.test(u)    ? "staff"   : "all"

    const rawBody = userMsg.replace(/^(send|push|notify|broadcast|alert|message)\s+(a\s+)?(push\s+)?(notification|message|alert)?\s*(to\s+\w+)?:?\s*/i, "").trim()
    const formal = formalizeNotification(undefined, rawBody)

    tools.push({
      type: "send_push",
      params: {
        title: formal.title,
        body: formal.content,
        targetRole,
      },
    })
    return tools
  }

  const noticeUserIntent =
    /\b(post|send|publish|create|add|write)\b/.test(u) &&
    /\b(notice|announcement|bulletin|board)\b/.test(u)

  const noticeAiConfirm =
    /\b(notice|announcement).*(posted|published|sent|created)\b/.test(a) ||
    /\b(posted|published).*(notice|announcement)\b/.test(a)

  if (noticeUserIntent || noticeAiConfirm) {
    const rawContent = userMsg.replace(/^(post|send|publish|create|add|write)\s+(a\s+)?(notice|announcement|bulletin)?\s*(for|to)?\s*\w*:?\s*/i, "").trim()
    const formal = formalizeNotification(undefined, rawContent)

    tools.push({
      type: "send_notice",
      params: {
        title: formal.title,
        content: formal.content,
        category: /exam|test|quiz/i.test(u) ? "Exam" : /event|trip|excursion/i.test(u) ? "Event" : "General",
        isUrgent: /\b(urgent|important|critical|immediately|asap)\b/i.test(u),
        targetClass: userMsg.match(/class\s*(\d+)/i)?.[1],
        targetSection: userMsg.match(/section\s*([a-z])/i)?.[1]?.toUpperCase() ||
                       userMsg.match(/\bsec\s*([a-z])\b/i)?.[1]?.toUpperCase(),
      },
    })
    return tools
  }

  return tools
}

/* ── useAutoDetectTools ─────────────────────────────────────────── */
export function useAutoDetectTools(userMsg: string, aiMsg: string) {
  const [tools, setTools] = React.useState<AiToolCall[]>([])
  const executedRef = React.useRef(false)

  React.useEffect(() => {
    if (!aiMsg || executedRef.current) return

    const detected = detectToolsFromMessages(userMsg, aiMsg)
    if (detected.length === 0) return

    executedRef.current = true

    // Check localStorage status for each tool call
    const initialTools: AiToolCall[] = detected.map(tool => {
      const dedupKey = toolDedupKey(tool)
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(dedupKey)
        if (saved === "done") return { ...tool, status: "success" }
        if (saved === "cancelled") return { ...tool, status: "cancelled" }
      }
      return { ...tool, status: "draft" }
    })

    setTools(initialTools)
  }, [userMsg, aiMsg])

  return tools
}
