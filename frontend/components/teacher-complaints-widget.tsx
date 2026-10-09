"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, RefreshCw, Wifi, WifiOff, FileText, Download, Calendar } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"
import { useSWRFetch } from "@/hooks/use-swr-fetch"

interface Complaint {
  id: string
  userId: string
  title: string
  recipient: string
  taggedPeople: string | null
  message: string
  fileUrl: string | null
  fileName: string | null
  status: "pending" | "resolved"
  createdAt: string
  senderName: string
  senderEmail: string
  senderRole: string
}

export function TeacherComplaintsWidget() {
  const { data: fetchedComplaints, isLoading: swrLoading, mutate } = useSWRFetch<Complaint[]>("/api/complaints?role=teacher")
  const [localComplaints, setLocalComplaints] = React.useState<Complaint[]>([])
  const [resolving, setResolving] = React.useState<string | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set())
  const socketRef = React.useRef<Socket | null>(null)

  // Merge SWR data with local optimistic updates
  const complaints = localComplaints.length > 0 ? localComplaints : (fetchedComplaints ?? [])
  const loading = swrLoading && localComplaints.length === 0

  // Socket.IO for real-time new complaints
  React.useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
      { transports: ["polling", "websocket"], reconnectionAttempts: 3 }
    )
    socketRef.current = socket

    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))

    socket.on("complaint_created", (payload: Complaint | undefined) => {
      if (payload && payload.id) {
        // Append from socket payload instead of re-fetching
        setLocalComplaints(prev => {
          const current = prev.length > 0 ? prev : (fetchedComplaints ?? [])
          if (current.some(c => c.id === payload.id)) return current
          return [payload, ...current]
        })
        setNewIds(ids => new Set([...ids, payload.id]))
        setTimeout(() => {
          setNewIds(ids => {
            const next = new Set(ids)
            next.delete(payload.id)
            return next
          })
        }, 4000)
        toast("New complaint received", {
          description: payload.title,
          icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
        })
        // Revalidate SWR cache in background
        mutate()
      } else {
        // Fallback: if payload is missing, revalidate via SWR
        mutate()
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      })
      if (!res.ok) throw new Error("Failed")
      setLocalComplaints(prev => {
        const current = prev.length > 0 ? prev : (fetchedComplaints ?? [])
        return current.map(c => c.id === id ? { ...c, status: "resolved" as const } : c)
      })
      toast.success("Complaint marked as resolved")
    } catch {
      toast.error("Failed to resolve complaint")
    } finally {
      setResolving(null)
    }
  }

  const pendingCount = complaints.filter(c => c.status === "pending").length

  return (
    <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
      <div className="p-5 pb-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base leading-snug font-medium text-foreground">
              Complaints
            </h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
            {/* Socket connection indicator */}
            <span
              title={connected ? "Live updates active" : "Connecting…"}
              className={cn(
                "size-2 rounded-full transition-colors duration-500",
                connected ? "bg-emerald-400 shadow-[0_0_6px_1px_#34d399]" : "bg-zinc-400"
              )}
            />
          </div>

          <button
            onClick={() => { setLocalComplaints([]); mutate() }}
            disabled={loading}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
          {loading ? (
            // Skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-xl bg-zinc-200/60 dark:bg-zinc-800/40 animate-pulse" />
            ))
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm rounded-xl border border-dashed border-border/50">
              No complaints received yet.
            </div>
          ) : (
            complaints.map(comp => (
              <div
                key={comp.id}
                className={cn(
                  "rounded-xl border px-4 py-3 flex flex-col gap-2 transition-all duration-300",
                  newIds.has(comp.id)
                    ? "border-rose-400/60 bg-rose-500/10 scale-[1.01] shadow-md"
                    : comp.status === "pending"
                    ? "border-rose-500/15 bg-rose-500/[0.03]"
                    : "border-emerald-500/15 bg-emerald-500/[0.03]"
                )}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0",
                        comp.status === "pending"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {comp.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {comp.title}
                    </span>
                    {newIds.has(comp.id) && (
                      <span className="shrink-0 text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Calendar className="size-3" />
                    {new Date(comp.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Sender & message */}
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {comp.senderName} · {comp.senderRole}
                  </p>
                  <p className="text-xs text-foreground/75 leading-relaxed line-clamp-2 mt-0.5">
                    {comp.message}
                  </p>
                </div>

                {/* Bottom row: attachment + action */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {comp.fileUrl ? (
                    <a
                      href={comp.fileUrl}
                      download={comp.fileName || "attachment"}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FileText className="size-3 text-rose-400" />
                      <span className="truncate max-w-[160px]">{comp.fileName || "Attachment"}</span>
                      <Download className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span />
                  )}

                  {comp.status === "pending" && (
                    <button
                      onClick={() => handleResolve(comp.id)}
                      disabled={resolving === comp.id}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {resolving === comp.id ? (
                        <RefreshCw className="size-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  )
}
