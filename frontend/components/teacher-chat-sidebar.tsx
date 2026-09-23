"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { MessageSquare, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ChatItem {
  id: string
  title: string
  createdAt?: string
}

export function TeacherChatSidebar({ open = true }: { open?: boolean }) {
  const params = useParams()
  const router = useRouter()
  const username = (params?.username as string) || "username"
  const currentUuid = params?.uuid as string

  const [chats, setChats] = React.useState<ChatItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const loadChats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/backend/api/chats")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setChats(data)
        }
      }
    } catch (e) {
      console.error("Failed to load chats:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadChats()
    window.addEventListener("vidya_chats_updated", loadChats)
    return () => {
      window.removeEventListener("vidya_chats_updated", loadChats)
    }
  }, [loadChats])

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (deletingId) return

    setDeletingId(chatId)
    try {
      const res = await fetch(`/api/backend/api/chats/${chatId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId))
        window.dispatchEvent(new Event("vidya_chats_updated"))
        if (currentUuid === chatId) {
          router.push(`/teacher/${username}/tasks/new`)
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <aside
      className={cn(
        "shrink-0 bg-sidebar dark:bg-black text-sidebar-foreground flex flex-col overflow-hidden transition-all duration-200 ease-linear rounded-xl",
        open
          ? "w-64 sm:w-72 h-[calc(100%-1rem)] m-2 opacity-100"
          : "w-0 h-full m-0 p-0 opacity-0 pointer-events-none"
      )}
    >
      {/* Chat List */}
      <ScrollArea
        className="flex-1 w-full min-w-0 [&_[data-slot=scroll-area-viewport]>div]:!block"
        viewportClassName="p-2"
      >
        <div className="space-y-1 w-full min-w-0">
          {loading ? (
            <div className="space-y-1 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-full rounded-xl bg-sidebar-accent/60 animate-pulse" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="size-6 text-sidebar-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-sidebar-foreground/60 font-normal">
                No previous chats
              </p>
              <Link
                href={`/teacher/${username}/tasks/new`}
                className="inline-block mt-2 text-xs text-primary hover:underline font-normal"
              >
                Start a new chat
              </Link>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = currentUuid === chat.id
              return (
                <Link
                  key={chat.id}
                  href={`/teacher/${username}/tasks/${chat.id}`}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-colors",
                    isActive
                      ? "bg-[#0C0C0C] text-white font-medium shadow-xs"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 font-normal"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-sidebar-foreground/50 group-hover:text-foreground dark:group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{chat.title || "Untitled Chat"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, chat.id)}
                    disabled={deletingId === chat.id}
                    title="Delete chat"
                    className={cn(
                      "opacity-0 group-hover:opacity-100 size-6 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive transition-opacity cursor-pointer",
                      isActive ? "text-white/60 hover:text-destructive" : "text-sidebar-foreground/40"
                    )}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Link>
              )
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
