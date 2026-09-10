"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowUp, Paperclip, X, FileText, ImageIcon, Video, Loader2 } from "lucide-react"

export function TeacherAIInput() {
  const router = useRouter()
  const pathname = usePathname()
  const [message, setMessage] = React.useState("")
  const [username, setUsername] = React.useState("")
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = React.useState<{ name: string; type: string; content: string; kind: "image" | "pdf" | "video" | "text" } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

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
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [message])

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
    router.push(`/teacher/${username || 'username'}/tasks/${uuid}?initialMessage=${encodeURIComponent(finalMessageText)}`)
  }

  return (
    <div
      className="fixed bottom-3 sm:bottom-4 -translate-x-1/2 w-full max-w-4xl px-2.5 sm:px-5 z-40 pointer-events-none"
      style={{ left: "calc(var(--sidebar-width, 0px) / 2 + 50%)" }}
    >
      {/* File attachment preview badge */}
      {attachedFile && (
        <div className="mb-1.5 sm:mb-2 flex items-center gap-2 px-1 pointer-events-auto">
          <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700/60 text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-300 max-w-[200px] sm:max-w-xs shadow-md">
            {attachedFile.kind === "image" && <ImageIcon className="size-3 sm:size-3.5 text-sky-500 dark:text-sky-400 shrink-0" />}
            {attachedFile.kind === "pdf" && <FileText className="size-3 sm:size-3.5 text-rose-500 dark:text-rose-400 shrink-0" />}
            {attachedFile.kind === "video" && <Video className="size-3 sm:size-3.5 text-violet-500 dark:text-violet-400 shrink-0" />}
            {attachedFile.kind === "text" && <FileText className="size-3 sm:size-3.5 text-zinc-500 shrink-0" />}
            <span className="truncate max-w-[110px] sm:max-w-[180px]">{attachedFile.name}</span>
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">· extracted</span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="ml-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors shrink-0"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pl-2 sm:pl-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black shadow-lg dark:shadow-2xl focus-within:border-zinc-500 dark:focus-within:border-zinc-600 min-h-[46px] sm:min-h-[52px] pointer-events-auto"
      >
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
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-95 cursor-pointer my-auto"
        >
          {isUploading
            ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            : <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={attachedFile ? `Ask about ${attachedFile.name}...` : "Message AI Assistant..."}
          className="flex-1 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-1 sm:px-2 py-1.5 sm:py-2 resize-none max-h-24 sm:max-h-32 min-h-[30px] sm:min-h-[36px] my-auto scrollbar-none"
        />

        <button
          type="submit"
          disabled={!message.trim() && !attachedFile}
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-all active:scale-95 cursor-pointer my-auto"
        >
          <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </form>
    </div>
  )
}
