"use client"

import * as React from "react"
import { Megaphone, Search, Calendar, AlertTriangle, Plus, Trash2, RefreshCw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function AdminNoticePage() {
  const { data: session } = useSession()
  const [notices, setNotices] = React.useState<Notice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")

  // Create notice form states
  const [isCreating, setIsCreating] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newCategory, setNewCategory] = React.useState<string>("General")
  const [newContent, setNewContent] = React.useState("")
  const [newIsUrgent, setNewIsUrgent] = React.useState(false)
  const [targetRole, setTargetRole] = React.useState("all") // "all" | "teacher" | "student"

  // Push Notification Form States
  const [pushTitle, setPushTitle] = React.useState("")
  const [pushBody, setPushBody] = React.useState("")
  const [pushTargetRole, setPushTargetRole] = React.useState("all")
  const [pushTargetClass, setPushTargetClass] = React.useState("")
  const [pushTargetSection, setPushTargetSection] = React.useState("")
  const [sendingPush, setSendingPush] = React.useState(false)

  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle.trim() || !pushBody.trim()) return

    setSendingPush(true)
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle,
          body: pushBody,
          targetRole: pushTargetRole,
          targetClass: pushTargetClass || null,
          targetSection: pushTargetSection || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Failed to push notification")
      }

      const result = await res.json()
      toast.success(`Notification sent successfully to ${result.deliveredCount} users!`)
      setPushTitle("")
      setPushBody("")
      setPushTargetClass("")
      setPushTargetSection("")
    } catch (err: any) {
      toast.error(err.message || "Failed to send push notification")
    } finally {
      setSendingPush(false)
    }
  }

  const fetchNotices = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notices")
      if (!res.ok) throw new Error("Failed to fetch notices")
      const data = await res.json()
      setNotices(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load notices")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          isUrgent: newIsUrgent,
          targetRole,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to publish notice")
      }

      toast.success("School bulletin published successfully")
      setNewTitle("")
      setNewContent("")
      setNewIsUrgent(false)
      setIsCreating(false)
      fetchNotices()
    } catch (err: any) {
      toast.error(err.message || "Failed to post bulletin")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const res = await fetch("/api/notices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) throw new Error("Failed to delete notice")
      toast.success("Notice deleted successfully")
      fetchNotices()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notice")
    }
  }

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notice.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notice.targetRole.toLowerCase().includes(searchQuery.toLowerCase())
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
            School Notice Administration
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Publish announcements, post official bulletins, and send push notifications to teachers, students, or all campus staff.
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-8">
        <Tabs defaultValue="bulletins" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
            <TabsTrigger value="push-notifications">Push Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="bulletins" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">School Bulletins</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchNotices}
                  variant="outline"
                  size="sm"
                  className="rounded-lg cursor-pointer flex items-center gap-1.5"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setIsCreating(!isCreating)} 
                  className="rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {isCreating ? "View Bulletins" : "Create Announcement"}
                </Button>
              </div>
            </div>

            {isCreating ? (
              /* Create Notice Form */
              <div className="max-w-3xl">
                <form onSubmit={handlePostNotice} className="rounded-xl border border-border bg-card/40 p-6 flex flex-col gap-5 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground">Create School Bulletin</h2>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="notice-title" className="text-xs font-semibold text-foreground">Announcement Title</label>
                    <Input
                      id="notice-title"
                      type="text"
                      placeholder="e.g. Annual Sports Meet 2026 Registration"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="h-10 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/60 text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-semibold text-foreground">Category</label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="h-10 rounded-lg border-border bg-card/60 text-xs shadow-xs outline-hidden cursor-pointer">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Exams">Exams</SelectItem>
                          <SelectItem value="Events">Events</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-semibold text-foreground">Share With (Target Audience)</label>
                      <Select value={targetRole} onValueChange={setTargetRole}>
                        <SelectTrigger className="h-10 rounded-lg border-border bg-card/60 text-xs shadow-xs outline-hidden cursor-pointer">
                          <SelectValue placeholder="Select Audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All (Teachers, Students & Staff)</SelectItem>
                          <SelectItem value="teacher">Teachers Only</SelectItem>
                          <SelectItem value="student">Students Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="notice-urgent"
                      type="checkbox"
                      checked={newIsUrgent}
                      onChange={(e) => setNewIsUrgent(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="notice-urgent" className="text-xs font-semibold text-foreground select-none cursor-pointer">Mark as Urgent Alert</label>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="notice-content" className="text-xs font-semibold text-foreground">Notice Description / Content</label>
                    <textarea
                      id="notice-content"
                      rows={6}
                      placeholder="Enter detailed announcement message here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="flex w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-foreground shadow-xs outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="rounded-lg cursor-pointer">
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-lg cursor-pointer">
                      Publish Bulletin
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              /* Notices List */
              <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                    <Input 
                      type="text"
                      placeholder="Search bulletins..."
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

                <div className="grid gap-6">
                  {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                      <Spinner size="lg" />
                      <p className="text-sm text-muted-foreground font-semibold">Loading school bulletins...</p>
                    </div>
                  ) : filteredNotices.length > 0 ? (
                    filteredNotices.map((notice) => (
                      <div key={notice.id} className={`rounded-xl border p-6 bg-card/30 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
                        notice.isUrgent ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-border"
                      }`}>
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
                            <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-md font-bold">
                              Audience: {notice.targetRole.toUpperCase()}
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(notice.createdAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(notice.id)}
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">{notice.title}</h3>
                          <p className="text-xs text-muted-foreground font-semibold">Posted by: {notice.senderName}</p>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="push-notifications">
            <div className="max-w-3xl">
              <form onSubmit={handleSendPushNotification} className="rounded-xl border border-border bg-card/40 p-6 flex flex-col gap-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Send Push Notification</h2>
                </div>
                <p className="text-xs text-muted-foreground -mt-3 leading-relaxed">
                  This will broadcast a push notification directly to the mobile applications of the selected target audience. Active apps will receive it in-app over sockets, and backgrounded/closed apps will receive a system tray push notification via Firebase.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="push-title" className="text-xs font-semibold text-foreground">Notification Title</label>
                  <Input
                    id="push-title"
                    type="text"
                    placeholder="e.g. Weather Alert: School Closed Tomorrow"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    className="h-10 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/60 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">Target Audience</label>
                    <Select value={pushTargetRole} onValueChange={setPushTargetRole}>
                      <SelectTrigger className="h-10 rounded-lg border-border bg-card/60 text-xs shadow-xs outline-hidden cursor-pointer">
                        <SelectValue placeholder="Select Audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="teacher">Teachers Only</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">Target Class (Optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. 10"
                      value={pushTargetClass}
                      onChange={(e) => setPushTargetClass(e.target.value)}
                      className="h-10 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/60 text-xs"
                      disabled={pushTargetRole !== "student"}
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">Target Section (Optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. A"
                      value={pushTargetSection}
                      onChange={(e) => setPushTargetSection(e.target.value)}
                      className="h-10 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/60 text-xs"
                      disabled={pushTargetRole !== "student"}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="push-body" className="text-xs font-semibold text-foreground">Notification Message Body</label>
                  <textarea
                    id="push-body"
                    rows={4}
                    placeholder="Enter short, descriptive push message (recommended under 150 characters)..."
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    className="flex w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-foreground shadow-xs outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    type="submit" 
                    className="rounded-lg cursor-pointer flex items-center gap-1.5"
                    disabled={sendingPush}
                  >
                    {sendingPush ? (
                      <>
                        <Spinner size="sm" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        Push Broadcast
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
