"use client"

import * as React from "react"
import { Megaphone, Search, Calendar, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import StudentNoticeSkeleton from "./skeleton"

interface Notice {
  id: string
  title: string
  content: string
  category: string
  isUrgent: boolean
  senderId: string
  targetRole: string
  targetClass: string | null
  targetSection: string | null
  createdAt: string
  senderName: string
}

export default function StudentNoticePage() {
  const [notices, setNotices] = React.useState<Notice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")

  const fetchNotices = React.useCallback(async (isInitial = false) => {
    if (!isInitial) setIsRefreshing(true)
    try {
      const res = await fetch("/api/notices")
      if (!res.ok) throw new Error("Failed to fetch notices")
      const data = await res.json()
      setNotices(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load notices")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotices(true)
  }, [fetchNotices])

  if (loading) {
    return <StudentNoticeSkeleton />
  }

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notice.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || notice.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Notice Board
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Stay updated with official notifications, exam announcements, holidays, and class bulletins.
          </p>
        </div>
        <Button
          onClick={() => fetchNotices(false)}
          variant="outline"
          size="sm"
          className="sm:w-auto rounded-lg cursor-pointer flex items-center gap-1.5"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 lg:px-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Academic", "Exams", "Events", "General"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
              className="text-xs rounded-lg cursor-pointer shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      <div className="grid gap-6 px-6 lg:px-8">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div key={notice.id} className={`rounded-xl border p-6 bg-card/30 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
              notice.isUrgent ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-border"
            }`}>
              {/* Urgent Left Stripe Accent */}
              {notice.isUrgent && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    notice.category === "Exams" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                    notice.category === "Academic" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    notice.category === "Events" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {notice.category}
                  </span>
                  {notice.isUrgent && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> Urgent Notice
                    </span>
                  )}
                  {notice.targetClass && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                      Class: {notice.targetClass}-{notice.targetSection || "All"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(notice.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">{notice.title}</h3>
                <p className="text-xs text-muted-foreground font-semibold">Posted by: {notice.senderName || "System"}</p>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">{notice.content}</p>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/10">
            No notices found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
