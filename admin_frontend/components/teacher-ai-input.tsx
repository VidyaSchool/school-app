"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { ArrowUp, Paperclip, X, FileText, ImageIcon, Video, Loader2 } from "lucide-react"

export function TeacherAIInput() {
  const router = useRouter()
  const pathname = usePathname()
  const sidebar = useSidebar()
  const [message, setMessage] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = React.useState<{ name: string; type: string; content: string; kind: "image" | "pdf" | "video" | "text" } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const isExpanded = isFocused || Boolean(message.trim()) || Boolean(attachedFile)

  const isMobile = sidebar.isMobile
  const sidebarState = sidebar.state

  const desktopLeft = React.useMemo(() => {
    if (isMobile) return "50%"
    if (sidebarState === "collapsed") {
      return "calc(var(--sidebar-width-icon, 3rem) / 2 + 50%)"
    }
    return "calc(var(--sidebar-width, 16rem) / 2 + 50%)"
  }, [isMobile, sidebarState])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  React.useEffect(() => {
    fetch("/api/profile/username")
      .then(res => res.json())
      .then(data => {
        if (data.username) setUsername(data.username)
      })
      .catch(() => {})
  }, [])

  // Auto-expand textarea on content growth
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && isExpanded) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 54), 160)}px`
    }
  }, [message, isExpanded])

  // Focus textarea when expanding
  React.useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  // Hide the floating bar on chat room and email pages
  if (pathname?.includes("/tasks/") || pathname?.includes("/email")) {
    return null
  }

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
        kind: data.type
      })
      setIsFocused(true)
    } catch (err) {
      console.error("File upload failed:", err)
      alert("Failed to process the file. Please try a different file.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!message.trim() && !attachedFile) return

    const uuid = crypto.randomUUID()
    let finalMessageText = message.trim()
    if (attachedFile) {
      const filePrefix = `[Attached ${attachedFile.kind.toUpperCase()}: ${attachedFile.name}]\n\nExtracted content:\n${attachedFile.content}\n\n---\n\nUser message: `
      finalMessageText = filePrefix + (message.trim() || `Analyze ${attachedFile.name}`)
      setAttachedFile(null)
    }

    setMessage("")
    setIsFocused(false)
    router.push(`/teacher/${username || 'username'}/tasks/${uuid}?initialMessage=${encodeURIComponent(finalMessageText)}`)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-3 sm:bottom-4 z-40 pointer-events-none transition-[max-width,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "-translate-x-1/2 left-1/2 md:left-[var(--ai-input-left)]",
        "px-3 sm:px-5",
        isExpanded
          ? "w-full max-w-4xl"
          : "w-[90%] sm:w-2/3 min-w-[280px] max-w-[580px]"
      )}
      style={
        {
          "--ai-input-left": desktopLeft,
          left: isMobile ? "50%" : desktopLeft,
        } as React.CSSProperties
      }
    >
      {/* File attachment preview badge */}
      {attachedFile && (
        <div className="mb-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
          <div className="group relative inline-flex items-start gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-900/80 p-2 sm:p-2.5 shadow-sm max-w-[280px] sm:max-w-sm backdrop-blur-sm">
            {attachedFile.kind === "image" ? (
              <div className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-sky-100 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center">
                <ImageIcon className="size-5 text-sky-500 dark:text-sky-400" />
              </div>
            ) : attachedFile.kind === "pdf" ? (
              <div className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center">
                <FileText className="size-5 text-rose-500 dark:text-rose-400" />
              </div>
            ) : attachedFile.kind === "video" ? (
              <div className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center">
                <Video className="size-5 text-violet-500 dark:text-violet-400" />
              </div>
            ) : (
              <div className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <FileText className="size-5 text-zinc-500 dark:text-zinc-400" />
              </div>
            )}
            <div className="flex flex-col justify-center min-w-0 flex-1 pr-5">
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{attachedFile.name}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 capitalize">
                {attachedFile.kind} · extracted
              </p>
            </div>
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <motion.form
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 54,
        }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        onClick={() => {
          if (!isExpanded) {
            setIsFocused(true)
          }
        }}
        onSubmit={handleSubmit}
        className="w-full bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-lg dark:shadow-2xl border-none pointer-events-auto cursor-text rounded-2xl overflow-hidden"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isExpanded ? (
            /* ── Expanded UI: matches the AI chat page input box ── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-between px-2.5 sm:px-3 py-3 sm:py-3.5 min-h-[102px] sm:min-h-[114px] h-full"
            >
              <textarea
                ref={textareaRef}
                rows={2}
                value={message}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder={attachedFile ? `Ask about ${attachedFile.name}...` : "Message AI Assistant..."}
                className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-1.5 py-1.5 resize-none min-h-[48px] sm:min-h-[54px] max-h-40 scrollbar-none"
              />

              {/* Bottom Toolbar - Buttons sticked to bottom */}
              <div className="flex items-center justify-between pt-1.5 pb-0.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                    title="Attach image, PDF, or video"
                    className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                  >
                    {isUploading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Paperclip className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!message.trim() && !attachedFile}
                  className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Collapsed UI: compact 2/3 width bar with matching rounded-2xl and rounded-xl buttons ── */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 h-[54px] cursor-text"
            >
              <button
                type="button"
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                title="Attach image, PDF, or video"
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-40 transition-all active:scale-95 cursor-pointer my-auto"
              >
                {isUploading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Paperclip className="h-4 w-4" />}
              </button>

              <span className="flex-1 bg-transparent text-xs sm:text-sm text-muted-foreground/60 truncate select-none px-1.5 sm:px-2 py-1.5 my-auto">
                {attachedFile ? `Ask about ${attachedFile.name}...` : "Ask Sarvam AI..."}
              </span>

              <button
                type="submit"
                disabled={!message.trim() && !attachedFile}
                className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-all active:scale-95 cursor-pointer my-auto"
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  )
}
