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
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────── */
export type AiToolType = "send_notice" | "send_push"

export interface AiToolCall {
  type: AiToolType
  params: Record<string, string | boolean | undefined>
  status: "pending" | "success" | "error"
  result?: string
  deliveredCount?: number
}

/* ── Tool metadata ───────────────────────────────────────────────── */
const toolMeta: Record<AiToolType, { icon: React.ElementType; label: string; color: string }> = {
  send_notice: { icon: Megaphone, label: "Post Notice",             color: "text-amber-400" },
  send_push:   { icon: Bell,      label: "Send Push Notification",  color: "text-violet-400" },
}

/* ── AiToolCard ─────────────────────────────────────────────────── */
interface AiToolCardProps {
  tool: AiToolCall
  className?: string
}

export function AiToolCard({ tool, className }: AiToolCardProps) {
  const [expanded, setExpanded] = React.useState(true)
  const meta = toolMeta[tool.type]
  const Icon = meta.icon

  const audience =
    tool.type === "send_push"
      ? (tool.params.targetRole as string) || "all"
      : [
          tool.params.targetClass && `Class ${tool.params.targetClass}`,
          tool.params.targetSection && `Sec ${tool.params.targetSection}`,
        ]
          .filter(Boolean)
          .join(" · ") || "all"

  return (
    <div className={cn("my-2 w-full max-w-[min(100%,28rem)] rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 overflow-hidden text-xs shadow-xs", className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none min-w-0"
      >
        <span className="shrink-0">
          {tool.status === "pending" && <Loader2 className="size-3.5 animate-spin text-zinc-400" />}
          {tool.status === "success" && <CheckCircle2 className="size-3.5 text-emerald-500 dark:text-emerald-400" />}
          {tool.status === "error"   && <AlertCircle  className="size-3.5 text-rose-500 dark:text-rose-400" />}
        </span>

        <Icon className={cn("size-3.5 shrink-0", meta.color)} />
        <span className="font-medium text-zinc-800 dark:text-zinc-200 min-w-0 flex-1 text-left truncate">{meta.label}</span>

        <span className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
          <Users className="size-3" />
          <span className="capitalize">{audience}</span>
        </span>

        <ChevronDown className={cn("size-3.5 text-zinc-400 dark:text-zinc-600 shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800/60 px-3.5 py-3 space-y-2 bg-white/80 dark:bg-zinc-950/30 min-w-0">
          {tool.params.title && (
            <div className="flex gap-2 min-w-0">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0">Title</span>
              <span className="text-zinc-900 dark:text-zinc-200 font-medium truncate min-w-0 flex-1">{tool.params.title as string}</span>
            </div>
          )}
          {(tool.params.body || tool.params.content) && (
            <div className="flex gap-2 min-w-0">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0">Message</span>
              <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed break-words min-w-0 flex-1 line-clamp-4">
                {(tool.params.body || tool.params.content) as string}
              </span>
            </div>
          )}
          {tool.params.category && (
            <div className="flex gap-2">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0">Category</span>
              <span className="text-zinc-700 dark:text-zinc-300">{tool.params.category as string}</span>
            </div>
          )}
          {tool.params.isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-medium">
              <AlertCircle className="size-2.5" /> Urgent
            </span>
          )}
          {tool.status === "success" && (
            <div className="mt-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>
                {tool.type === "send_push" && tool.deliveredCount !== undefined
                  ? `Delivered to ${tool.deliveredCount} user(s)`
                  : "Published successfully"}
              </span>
            </div>
          )}
          {tool.status === "error" && (
            <div className="mt-1 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-3" />
              <span>{tool.result || "Something went wrong"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── detectToolsFromMessages ─────────────────────────────────────── */
/**
 * Scans the user message + AI response for notice/push intent.
 * Returns tool params ready to be executed — no backend markers needed.
 */
export function detectToolsFromMessages(
  userMsg: string,
  aiResponse: string
): Omit<AiToolCall, "status">[] {
  const tools: Omit<AiToolCall, "status">[] = []

  // ── Raw tool_call syntax pattern detection ─────────────────────────
  const rawToolCallMatch = (userMsg + " " + aiResponse).match(
    /(?:tool_call>)?call:[\w_]+:(publish_notice|send_push|send_notification)\(([\s\S]+?)\)(?:<\/tool_call|>)?/i
  )
  if (rawToolCallMatch) {
    const rawArgs = rawToolCallMatch[2]
    const extractedMessage =
      rawArgs.match(/(?:message|content|body):\s*['"]([^'"]+)['"]/i)?.[1] ||
      rawArgs.match(/(?:message|content|body):\s*([^,)\}\n]+)/i)?.[1] || ""

    const extractedTitle =
      rawArgs.match(/title:\s*['"]([^'"]+)['"]/i)?.[1] ||
      (extractedMessage ? extractedMessage.slice(0, 50) : "School Notice Announcement")

    if (extractedMessage) {
      const cleanContent = extractedMessage.replace(/^['"]|['"]$/g, "").trim()
      const cleanTitle = extractedTitle.replace(/^['"]|['"]$/g, "").trim()

      tools.push({
        type: "send_notice",
        params: {
          title: cleanTitle,
          content: cleanContent,
          category: "General",
          isUrgent: false
        }
      })
      tools.push({
        type: "send_push",
        params: {
          title: cleanTitle,
          body: cleanContent,
          targetRole: "all"
        }
      })
      return tools
    }
  }

  // ── JSON action block detection (AI outputs raw JSON) ────────────
  const jsonMatch = aiResponse.match(/\{[^{}]*"action"\s*:\s*"([^"]+)"[^{}]*\}/)
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      const action = parsed.action || ""
      const message = (parsed.message || parsed.body || parsed.content || "")
        .replace(/\\n/g, "\n")           // unescape \n
        .replace(/^>\s*/gm, "")          // strip blockquote >
        .replace(/\*{1,2}/g, "")         // strip bold/italic *
        .replace(/^\(Resend\):?\s*/i, "") // strip (Resend): prefix
        .replace(/^#+\s*/gm, "")         // strip markdown headings
        .trim()
      const title = parsed.title || message.split("\n").find((l: string) => l.trim()) || message.slice(0, 60)

      if (/push|notification|notify/i.test(action)) {
        tools.push({
          type: "send_push",
          params: { title, body: message, targetRole: parsed.targetRole || "all" },
        })
        return tools
      }
      if (/notice|announce|publish/i.test(action)) {
        tools.push({
          type: "send_notice",
          params: { title, content: message, category: "General" },
        })
        return tools
      }
    } catch {}
  }

  // Extract quoted title from user message or AI confirmation (supports regular, curly, and bold quotes)
  const quotedMatch =
    userMsg.match(/["“"'\*\*]+([^"”"'\*\*]{3,})["”"'\*\*]+/)?.[1] ||
    aiResponse.match(/["“"'\*\*]+([^"”"'\*\*]{3,})["”"'\*\*]+/)?.[1]
  const quoted = quotedMatch ? quotedMatch.replace(/^\*+|\*+$/g, "").trim() : undefined

  const u = userMsg.toLowerCase()
  const a = aiResponse.toLowerCase()

  // ── Push notification intent ─────────────────────────────────────
  const pushUserIntent =
    /\b(send|push|notify|broadcast|alert|message)\b/.test(u) &&
    /\b(all|everyone|students|teachers|staff|users|notification|push)\b/.test(u)

  const pushAiConfirm =
    /\b(notification|push|notice|announcement|message).*(sent|delivered|broadcast)\b/.test(a) ||
    /\b(sent|delivered).*(notification|push|users|app|system)\b/.test(a)

  if (pushUserIntent || pushAiConfirm) {
    const targetRole =
      /\bstudents?\b/.test(u)
        ? "student"
        : /\bteachers?\b/.test(u)
        ? "teacher"
        : /\bstaff\b/.test(u)
        ? "staff"
        : "all"

    const body =
      userMsg.replace(/^(send|push|notify|broadcast|alert|message)\s+(a\s+)?(push\s+)?(notification|message|alert)?\s*(to\s+\w+)?:?\s*/i, "").trim() ||
      quoted ||
      "Announcement broadcast to all users via app push notifications."

    tools.push({
      type: "send_push",
      params: {
        title: quoted || body.slice(0, 50),
        body,
        targetRole,
      },
    })
    return tools
  }

  // ── Notice/announcement intent ───────────────────────────────────
  const noticeUserIntent =
    /\b(post|send|publish|create|add|write)\b/.test(u) &&
    /\b(notice|announcement|bulletin|board)\b/.test(u)

  const noticeAiConfirm =
    /\b(notice|announcement).*(posted|published|sent|created)\b/.test(a) ||
    /\b(posted|published).*(notice|announcement)\b/.test(a)

  if (noticeUserIntent || noticeAiConfirm) {
    const content =
      userMsg.replace(/^(post|send|publish|create|add|write)\s+(a\s+)?(notice|announcement|bulletin)?\s*(for|to)?\s*\w*:?\s*/i, "").trim() ||
      quoted ||
      "New notice published to the school portal."

    tools.push({
      type: "send_notice",
      params: {
        title: quoted || content.slice(0, 50),
        content,
        category: /exam|test|quiz/i.test(u) ? "Exam" : /event|trip|excursion/i.test(u) ? "Event" : "General",
        isUrgent: /\b(urgent|important|critical|immediately|asap)\b/i.test(u),
        targetClass: userMsg.match(/class\s*(\d+)/i)?.[1],
        targetSection: userMsg.match(/section\s*([a-z])/i)?.[1]?.toUpperCase() ||
                       userMsg.match(/\bsec\s*([a-z])\b/i)?.[1]?.toUpperCase(),
      },
    })
  }

  return tools
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
          content: tool.params.content,
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
          body: tool.params.body,
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

/* ── Stable dedup key for a tool call ───────────────────────────── */
function toolDedupKey(tool: Omit<AiToolCall, "status">): string {
  const title = (tool.params.title || "") as string
  const content = ((tool.params.content || tool.params.body || "") as string)
  return `ai_widget_done:${tool.type}:${title.slice(0, 60)}:${content.slice(0, 60)}`
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

    // Initialize with pending status while checking status
    const initialTools: AiToolCall[] = detected.map(t => ({ ...t, status: "pending" }))
    setTools(initialTools)

    detected.forEach(async (tool) => {
      const dedupKey = toolDedupKey(tool)

      // 1. Check localStorage — if already sent in a previous session, mark done immediately
      if (typeof window !== "undefined" && localStorage.getItem(dedupKey) === "done") {
        setTools(prev =>
          prev.map(t =>
            t.type === tool.type && JSON.stringify(t.params) === JSON.stringify(tool.params)
              ? { ...t, status: "success" }
              : t
          )
        )
        return
      }

      const title = (tool.params.title || "") as string
      const content = ((tool.params.content || tool.params.body || "") as string)

      try {
        // 2. Check backend database to see if this widget action was already executed
        const statusRes = await fetch(
          `/api/backend/api/chats/widget-status?type=${tool.type}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`
        )

        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData.executed && statusData.status === "success") {
            // Found in backend DB — mark as success and persist to localStorage
            if (typeof window !== "undefined") localStorage.setItem(dedupKey, "done")
            setTools(prev =>
              prev.map(t =>
                t.type === tool.type && JSON.stringify(t.params) === JSON.stringify(tool.params)
                  ? { ...t, status: "success" }
                  : t
              )
            )
            return
          }
        }
      } catch (err) {
        console.warn("Backend widget status check failed:", err)
      }

      // 3. Not executed yet — execute via API and persist result
      const res = await executeToolCall({ ...tool, status: "pending" })
      if (res.status === "success" && typeof window !== "undefined") {
        localStorage.setItem(dedupKey, "done")
      }
      setTools(prev =>
        prev.map(t =>
          t.type === tool.type && JSON.stringify(t.params) === JSON.stringify(tool.params)
            ? { ...t, status: res.status, result: res.result, deliveredCount: res.deliveredCount }
            : t
        )
      )
    })
  }, [userMsg, aiMsg])

  return tools
}


