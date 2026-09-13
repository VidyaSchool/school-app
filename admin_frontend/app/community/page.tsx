"use client"

import * as React from "react"
import Link from "next/link"
import { io, Socket } from "socket.io-client"
import { 
  Send, 
  Users, 
  Wifi, 
  WifiOff, 
  ArrowLeft, 
  Loader2,
  Hash,
  Bell,
  Pin,
  Inbox,
  HelpCircle,
  Plus,
  Smile,
  CornerUpLeft,
  Pencil,
  Trash2,
  X,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createPortal } from "react-dom"
import { CommunityHeaderActions } from "./header-actions"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface Message {
  id: string
  userId: string
  name: string
  role: string
  content: string
  timestamp: string
  image?: string | null
  replyTo?: {
    id: string
    name: string
    content: string
  } | null
}

interface OnlineUser {
  userId: string
  name: string
  role: string
  sid: string
  image?: string | null
}

function CommunitySkeleton() {
  return (
    <div className="flex h-[calc(100vh-var(--header-height))] w-full bg-background overflow-hidden animate-pulse">
      {/* Main Chat Panel Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <div className="h-14 border-b border-border flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted/60 rounded-md" />
            <div className="h-5 w-28 bg-muted/60 rounded-md" />
          </div>
          <div className="h-5 w-16 bg-muted/60 rounded-md" />
        </div>
        {/* Messages List Skeleton */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="size-10 rounded-full bg-muted/60 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex gap-2 items-center">
                  <div className="h-4 w-24 bg-muted/60 rounded-md" />
                  <div className="h-3 w-16 bg-muted/60 rounded-md" />
                </div>
                <div className="h-4 w-full bg-muted/60 rounded-md" />
                <div className="h-4 w-2/3 bg-muted/60 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        {/* Input Area Skeleton */}
        <div className="p-4 bg-transparent shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 w-full bg-muted/10 border border-border rounded-2xl">
            {/* Plus Icon Skeleton */}
            <div className="size-7 rounded-full bg-muted/60 shrink-0" />
            {/* Textarea Placeholder Skeleton */}
            <div className="h-5 flex-1 bg-muted/40 rounded-md" />
            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="size-5 rounded-full bg-muted/60" />
              <div className="size-5 rounded-full bg-muted/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Member List Sidebar Skeleton on the Right */}
      <div className="hidden md:flex w-60 my-4 mr-4 ml-0 border border-border bg-muted/10 rounded-2xl flex flex-col p-4 space-y-4 shrink-0 overflow-hidden h-[calc(100%-2rem)]">
        <div className="h-6 w-32 bg-muted/60 rounded-md mb-4" />
        <div className="space-y-3">
          <div className="h-8 w-full bg-muted/60 rounded-md" />
          <div className="h-8 w-4/5 bg-muted/60 rounded-md" />
          <div className="h-8 w-full bg-muted/60 rounded-md" />
          <div className="h-8 w-3/4 bg-muted/60 rounded-md" />
        </div>
      </div>
    </div>
  )
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export default function CommunityChatPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const scrollRestorationRef = React.useRef<{
    previousScrollHeight: number
    previousScrollTop: number
  } | null>(null)
  const [userProfile, setUserProfile] = React.useState<any>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = React.useState<OnlineUser[]>([])
  const [inputText, setInputText] = React.useState("")
  const [typingUsers, setTypingUsers] = React.useState<{ userId: string; name: string }[]>([])
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = React.useRef(false)
  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [showMemberList, setShowMemberList] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)
  
  // Reply & Edit state
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
  const [editText, setEditText] = React.useState("")
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [showScrollBottom, setShowScrollBottom] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content height
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [inputText])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch session on mount
  React.useEffect(() => {
    setMounted(true)
    fetch("/api/account")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized")
        return res.json()
      })
      .then((data) => {
        setCurrentUser(data.user)
        setUserProfile(data.profile)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // Initialize Socket.IO connection
  React.useEffect(() => {
    if (!currentUser) return

    // Connect directly to FastAPI backend on port 8000
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.IO")
      setConnected(true)

      // Join the community room
      socketInstance.emit("join", {
        userId: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        image: currentUser.image,
      })
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Socket.IO")
      setConnected(false)
    })

    socketInstance.on("online_users", (users: OnlineUser[]) => {
      setOnlineUsers(users)
      setTypingUsers((prev) => prev.filter((tu) => users.some((u) => u.userId === tu.userId)))
    })

    socketInstance.on("user_typing", (data: { userId: string; name: string; isTyping: boolean }) => {
      if (!currentUser || data.userId === currentUser.id) return
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (prev.some((u) => u.userId === data.userId)) return prev
          return [...prev, { userId: data.userId, name: data.name }]
        } else {
          return prev.filter((u) => u.userId !== data.userId)
        }
      })
    })

    socketInstance.on("recent_messages", (data: { messages: Message[]; hasMore: boolean }) => {
      setMessages(data.messages || [])
      setHasMore(data.hasMore || false)
      setTimeout(scrollToBottom, 100)
    })

    socketInstance.on("more_messages", (data: { messages: Message[]; hasMore: boolean }) => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current
        scrollRestorationRef.current = {
          previousScrollHeight: container.scrollHeight,
          previousScrollTop: container.scrollTop,
        }

        setMessages((prev) => [...(data.messages || []), ...prev])
        setHasMore(data.hasMore || false)
        setLoadingMore(false)
      }
    })

    socketInstance.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg])
      setTimeout(scrollToBottom, 100)
    })

    socketInstance.on("message_edited", (data: { id: string; content: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.id ? { ...msg, content: data.content } : msg))
      )
    })

    socketInstance.on("message_deleted", (data: { id: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id))
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [currentUser])

  useIsomorphicLayoutEffect(() => {
    if (scrollRestorationRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current
      const { previousScrollHeight, previousScrollTop } = scrollRestorationRef.current
      const newScrollHeight = container.scrollHeight
      const scrollHeightDiff = newScrollHeight - previousScrollHeight
      
      if (scrollHeightDiff > 0) {
        container.scrollTop = previousScrollTop + scrollHeightDiff
        scrollRestorationRef.current = null
      }
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !socket || !connected) return

    const payload: any = { content: inputText }
    if (replyingTo) {
      payload.replyTo = {
        id: replyingTo.id,
        name: replyingTo.name,
        content: replyingTo.content,
      }
    }

    socket.emit("send_message", payload)
    setInputText("")
    setReplyingTo(null)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    isTypingRef.current = false
    socket.emit("typing", { isTyping: false })
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputText(val)

    if (!socket || !connected) return

    if (val.trim() === "") {
      if (isTypingRef.current) {
        isTypingRef.current = false
        socket.emit("typing", { isTyping: false })
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      return
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("typing", { isTyping: true })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit("typing", { isTyping: false })
    }, 2500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleEditMessage = (messageId: string, content: string) => {
    if (!socket || !connected || !content.trim()) return
    socket.emit("edit_message", { messageId, content })
    setEditingMessageId(null)
    setEditText("")
  }

  const handleDeleteMessage = (messageId: string) => {
    if (!socket || !connected) return
    socket.emit("delete_message", { messageId })
  }

  const handleScroll = () => {
    if (!chatContainerRef.current) return
    const container = chatContainerRef.current
    
    // Check if scrolled near the top to load older messages
    if (socket && connected && hasMore && !loadingMore && container.scrollTop <= 5 && messages.length > 0) {
      setLoadingMore(true)
      socket.emit("load_more", { before: messages[0].timestamp })
    }

    // Check if scrolled away from bottom to show the jump-to-bottom button
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
    setShowScrollBottom(!isNearBottom)
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?"
  }

  const getAvatarGradient = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-br from-rose-500 to-red-600 text-white"
      case "teacher":
      case "librarian":
        return "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
      case "account":
        return "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
      default:
        return "bg-gradient-to-br from-slate-500 to-gray-600 text-white"
    }
  }

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-rose-600 dark:text-rose-400 font-bold"
      case "teacher":
      case "librarian":
        return "text-blue-600 dark:text-blue-400 font-bold"
      case "account":
        return "text-emerald-600 dark:text-emerald-400 font-bold"
      default:
        return "text-foreground"
    }
  }

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Check if yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' }) + 
           ` ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  if (loading) {
    return <CommunitySkeleton />
  }

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm font-semibold text-muted-foreground">Unauthorized access. Please login.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  const backHref = currentUser.role === "admin"
    ? `/admin/${userProfile?.username || ""}`
    : `/teacher/${userProfile?.username || ""}`

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {mounted && typeof document !== "undefined" && document.getElementById("site-header-actions") && 
        createPortal(
          <CommunityHeaderActions 
            connected={connected} 
            onToggleMembers={() => setShowMemberList((prev) => !prev)} 
          />,
          document.getElementById("site-header-actions")!
        )
      }

      {/* Chat Area */}
      <main className="relative flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Scrollable Message List */}
        <ScrollArea 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0"
          viewportClassName="px-3 sm:px-6 pt-4 sm:pt-6"
        >
          <div className="space-y-[2px] pb-28">
            {loadingMore && (
              <div className="w-full py-3 flex items-center justify-center gap-2 select-none">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">Loading older messages...</span>
              </div>
            )}
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const isMe = msg.userId === currentUser.id
                
                // Group messages sent by same user within 5 minutes
                const isGrouped = index > 0 && 
                  messages[index - 1].userId === msg.userId &&
                  (new Date(msg.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime()) < 300000 &&
                  !msg.replyTo;

                // Edit Message View
                const isEditing = editingMessageId === msg.id

                return (
                  <div key={msg.id} className="relative group w-full">
                    
                    {/* Discord Style Curved Reply Connection */}
                    {msg.replyTo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/75 pl-[52px] sm:pl-[72px] mb-1 select-none">
                        <div className="w-8 h-2.5 border-l-2 border-t-2 border-border rounded-tl-md mr-1 mt-1.5 shrink-0" />
                        <span className="font-bold hover:underline cursor-pointer">@{msg.replyTo.name}</span>
                        <span className="truncate opacity-75 italic">"{msg.replyTo.content}"</span>
                      </div>
                    )}

                    {/* Options overlay menu on hover */}
                    {!isEditing && (
                      <div className="absolute right-4 top-[-10px] bg-background border border-border shadow-xs rounded-md flex items-center p-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => setReplyingTo(msg)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Reply"
                        >
                          <CornerUpLeft className="h-4 w-4" />
                        </Button>
                        {isMe && (
                          <>
                            <Button
                              onClick={() => {
                                setEditingMessageId(msg.id)
                                setEditText(msg.content)
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteMessage(msg.id)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {isGrouped ? (
                      // Grouped rendering
                      <div className="pl-[52px] sm:pl-[72px] pr-8 sm:pr-16 py-[2px] hover:bg-muted/30 group/grouped relative flex items-center min-h-[22px]">
                        <span className="absolute left-1 sm:left-4 hidden group-hover/grouped:block text-[10px] text-muted-foreground select-none w-8 sm:w-10 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        
                        {isEditing ? (
                          <form 
                            onSubmit={(e) => { e.preventDefault(); handleEditMessage(msg.id, editText); }}
                            className="w-full mt-1"
                          >
                            <Input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Escape") setEditingMessageId(null); }}
                              className="bg-muted text-base md:text-sm border-border w-full focus-visible:ring-1 focus-visible:ring-primary py-1 px-3 h-8"
                              autoFocus
                            />
                            <div className="text-[10px] text-muted-foreground mt-1 select-none">
                              escape to <button type="button" onClick={() => setEditingMessageId(null)} className="underline text-primary hover:text-primary-foreground">cancel</button> • enter to <button type="submit" className="underline text-primary hover:text-primary-foreground">save</button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap w-full">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Normal full rendering
                      <div className="mt-2 pl-2 sm:pl-4 pr-8 sm:pr-16 py-[2px] hover:bg-muted/30 flex items-start gap-3 sm:gap-4">
                        <Avatar className={`h-8 w-8 sm:h-10 sm:w-10 shrink-0 shadow-xs rounded-full cursor-pointer select-none ${getAvatarGradient(msg.role)}`}>
                          <AvatarImage src={msg.image || undefined} alt={msg.name} />
                          <AvatarFallback className="font-semibold text-sm">{getInitials(msg.name)}</AvatarFallback>
                        </Avatar>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap select-none">
                            <span className={`font-semibold text-[15px] hover:underline cursor-pointer ${getRoleTextColor(msg.role)}`}>
                              {msg.name}
                            </span>
                            
                            <span className={`text-[10px] font-bold uppercase rounded-sm px-1 py-0.25 select-none shrink-0 ${
                              msg.role === 'admin' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                              (msg.role === 'teacher' || msg.role === 'librarian') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {msg.role}
                            </span>

                            <span className="text-[11px] text-muted-foreground select-none">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          
                          {isEditing ? (
                            <form 
                              onSubmit={(e) => { e.preventDefault(); handleEditMessage(msg.id, editText); }}
                              className="w-full mt-1"
                            >
                              <Input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setEditingMessageId(null); }}
                                className="bg-muted text-base md:text-sm border-border w-full focus-visible:ring-1 focus-visible:ring-primary py-1 px-3 h-8"
                                autoFocus
                              />
                              <div className="text-[10px] text-muted-foreground mt-1 select-none">
                                escape to <button type="button" onClick={() => setEditingMessageId(null)} className="underline text-primary">cancel</button> • enter to <button type="submit" className="underline text-primary">save</button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="flex h-full flex-col justify-end p-6 pb-12 select-none">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center text-muted-foreground mb-4">
                  <Hash className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to #community!</h2>
                <p className="text-base text-muted-foreground max-w-lg mb-6">
                  This is the start of the secure #community channel. Discuss and sync in realtime with teachers and administrators.
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-[96px] right-8 p-2.5 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-md text-muted-foreground hover:text-foreground hover:scale-105 hover:bg-background active:scale-95 transition-all z-20 pointer-events-auto flex items-center justify-center"
            title="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}

        {/* Chat Input Bar with Docked Reply Banner */}
        <footer className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-background via-gradient/90 to-transparent pointer-events-none z-10 shrink-0">
            {typingUsers.length > 0 && (
              <div className="pointer-events-auto flex items-center gap-2 mb-2 px-1 text-xs text-muted-foreground select-none animate-fade-in">
                <div className="flex gap-1.5 items-center bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/80 shadow-md">
                  <div className="flex gap-0.5 items-center justify-center mr-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                  </div>
                  <span className="font-medium text-[11px] tracking-wide text-foreground/80">
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].name} is typing...` 
                      : typingUsers.length === 2 
                        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...` 
                        : "Several people are typing..."}
                  </span>
                </div>
              </div>
            )}
            <div className="pointer-events-auto flex flex-col w-full bg-background/80 backdrop-blur-md border border-border rounded-2xl shadow-lg focus-within:border-primary/40 focus-within:shadow-primary/5 transition-all">
              
              {/* Replying To Preview Banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs text-muted-foreground bg-muted/40 rounded-t-2xl">
                  <div className="flex items-center gap-2 truncate">
                    <CornerUpLeft className="h-3.5 w-3.5" />
                    <span>Replying to <span className="font-semibold text-foreground/80">@{replyingTo.name}</span></span>
                    <span className="truncate opacity-75 italic">"{replyingTo.content}"</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="hover:text-foreground p-0.5 rounded-full hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 w-full">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="bg-secondary text-secondary-foreground hover:bg-muted rounded-full p-1.5 transition-colors shrink-0 mb-[2px]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    <p>Comming Soon!</p>
                  </TooltipContent>
                </Tooltip>
                
                <textarea
                  ref={textareaRef}
                  placeholder="Message #community"
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  disabled={!connected}
                  rows={1}
                  className="bg-transparent border-0 outline-none text-foreground placeholder-muted-foreground flex-1 text-sm focus:ring-0 focus-visible:ring-0 p-0 resize-none py-1 min-h-[20px] max-h-[200px]"
                />
                
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 mb-[2px]">
                  <button type="button" className="hover:text-foreground transition-colors">
                    <Smile className="h-5 w-5" />
                  </button>
                  <button 
                    type="submit" 
                    disabled={!inputText.trim() || !connected} 
                    className="hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </footer>
        </main>

        {/* Member List Sidebar */}
        {showMemberList && (
          <aside className="w-60 border border-border bg-background/95 backdrop-blur-md rounded-2xl flex flex-col shrink-0 shadow-xl overflow-hidden h-[calc(100%-2rem)] absolute right-4 top-4 bottom-4 z-40 md:relative md:my-4 md:mr-4 md:ml-0 md:bg-background/50 md:backdrop-blur-sm md:shadow-sm">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online — {onlineUsers.length}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:hidden text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setShowMemberList(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0" viewportClassName="p-2">
              <div className="space-y-1">
                {onlineUsers.map((user) => (
                  <div
                    key={user.sid}
                    className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

      </div>
  )
}
