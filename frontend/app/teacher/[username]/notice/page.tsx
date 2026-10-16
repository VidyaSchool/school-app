"use client"

import * as React from "react"
import { Megaphone, Search, Calendar, AlertTriangle, Plus, Trash2, RefreshCw, Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

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

export default function TeacherNoticePage() {
  const { data: session } = useSession()
  const [notices, setNotices] = React.useState<Notice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")

  // Create notice form states
  const [isCreating, setIsCreating] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState("")
  const [newCategory, setNewCategory] = React.useState<string>("Academic")
  const [newContent, setNewContent] = React.useState("")
  const [newIsUrgent, setNewIsUrgent] = React.useState(false)
  const [targetClass, setTargetClass] = React.useState("10")
  const [targetSection, setTargetSection] = React.useState("A")

  // Push notification states
  const [pushTitle, setPushTitle] = React.useState("")
  const [pushBody, setPushBody] = React.useState("")
  const [pushTargetRole, setPushTargetRole] = React.useState("student")
  const [pushTargetClass, setPushTargetClass] = React.useState("")
  const [pushTargetSection, setPushTargetSection] = React.useState("")
  const [pushSending, setPushSending] = React.useState(false)

  const fetchNotices = React.useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    else setIsRefreshing(true)
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
          targetClass,
          targetSection: targetSection === "All" ? "" : targetSection,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to publish notice")
      }

      toast.success("Announcement published successfully")
      setNewTitle("")
      setNewContent("")
      setNewIsUrgent(false)
      setIsCreating(false)
      fetchNotices()
    } catch (err: any) {
      toast.error(err.message || "Failed to post announcement")
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

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle.trim() || !pushBody.trim()) return
    setPushSending(true)
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle,
          body: pushBody,
          targetRole: pushTargetRole,
          targetClass: pushTargetClass && pushTargetClass !== "all" ? pushTargetClass : undefined,
          targetSection: pushTargetSection && pushTargetSection !== "all" ? pushTargetSection : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to send notification")
      toast.success(`Notification sent to ${data.deliveredCount} user(s)`)
      setPushTitle("")
      setPushBody("")
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification")
    } finally {
      setPushSending(false)
    }
  }

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          notice.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || notice.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notices & Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Publish school bulletins, schedule notices, and send push notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotices(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-3.5 mr-1.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={() => setIsCreating(!isCreating)} 
          >
            <Plus className="size-3.5 mr-1.5" />
            {isCreating ? "View Notices" : "New Notice"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notices" className="w-full space-y-6">
        <TabsList className="grid w-full sm:w-[320px] grid-cols-2">
          <TabsTrigger value="notices" className="flex items-center gap-1.5 cursor-pointer">
            <Megaphone className="size-3.5" />
            Notices
          </TabsTrigger>
          <TabsTrigger value="push" className="flex items-center gap-1.5 cursor-pointer">
            <Bell className="size-3.5" />
            Push Alert
          </TabsTrigger>
        </TabsList>

        {/* ── NOTICES TAB ── */}
        <TabsContent value="notices" className="space-y-6">
          {isCreating ? (
            <Card className="w-full">
              <form onSubmit={handlePostNotice}>
                <CardHeader>
                  <CardTitle>Create Announcement</CardTitle>
                  <CardDescription>
                    Post an announcement or bulletin visible to students and classes.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notice-title">Title</Label>
                    <Input
                      id="notice-title"
                      type="text"
                      placeholder="e.g. Extra Class for Mathematics"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Exams">Exams</SelectItem>
                          <SelectItem value="Events">Events</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Class</Label>
                      <Select value={targetClass} onValueChange={setTargetClass}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                            <SelectItem key={c} value={c}>Class {c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={targetSection} onValueChange={setTargetSection}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Sections</SelectItem>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                          <SelectItem value="D">Section D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="notice-urgent"
                      checked={newIsUrgent}
                      onCheckedChange={(checked) => setNewIsUrgent(Boolean(checked))}
                    />
                    <Label htmlFor="notice-urgent" className="text-sm font-normal cursor-pointer">
                      Mark as urgent alert
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notice-content">Description</Label>
                    <Textarea
                      id="notice-content"
                      rows={5}
                      placeholder="Write your announcement details here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Publish Announcement
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <>
              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input 
                    type="search"
                    placeholder="Search notices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Tabs
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  className="w-full sm:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="Academic">Academic</TabsTrigger>
                    <TabsTrigger value="Exams">Exams</TabsTrigger>
                    <TabsTrigger value="Events">Events</TabsTrigger>
                    <TabsTrigger value="General">General</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Notices List */}
              <div className="space-y-4">
                {filteredNotices.length > 0 ? (
                  filteredNotices.map((notice) => (
                    <Card key={notice.id} className="transition-colors hover:border-foreground/20">
                      <CardHeader className="gap-2 pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary">{notice.category}</Badge>
                            {notice.isUrgent && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="size-3" /> Urgent
                              </Badge>
                            )}
                            {notice.targetClass && (
                              <Badge variant="outline">
                                Class {notice.targetClass}-{notice.targetSection || "All"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              {new Date(notice.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            {session?.user && (session.user.id === notice.senderId || session.user.role === "admin") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(notice.id)}
                                className="size-7 text-muted-foreground hover:text-destructive"
                                title="Delete notice"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-base font-semibold leading-snug">
                          {notice.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Posted by {notice.senderName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {notice.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="flex flex-col items-center justify-center py-16 text-center">
                    <CardContent className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">No notices found</p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery ? "Try adjusting your search query or category filter." : "There are no notices published yet."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── PUSH NOTIFICATION TAB ── */}
        <TabsContent value="push">
          <Card className="w-full">
            <form onSubmit={handleSendPush}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="size-4 text-primary" />
                  Send Push Notification
                </CardTitle>
                <CardDescription>
                  Broadcast instant alerts to student and teacher devices via WebSocket and push notifications.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="push-title">Title</Label>
                  <Input
                    id="push-title"
                    placeholder="e.g. Exam schedule updated"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="push-body">Message</Label>
                  <Textarea
                    id="push-body"
                    rows={3}
                    placeholder="Enter notification message..."
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Target Role</Label>
                    <Select value={pushTargetRole} onValueChange={setPushTargetRole}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="teacher">Teachers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Class (optional)</Label>
                    <Select value={pushTargetClass} onValueChange={setPushTargetClass}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {["1","2","3","4","5","6","7","8","9","10","11","12"].map(c => (
                          <SelectItem key={c} value={c}>Class {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Section (optional)</Label>
                    <Select value={pushTargetSection} onValueChange={setPushTargetSection}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sections</SelectItem>
                        {["A","B","C","D"].map(s => (
                          <SelectItem key={s} value={s}>Section {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end border-t pt-4">
                <Button type="submit" size="sm" disabled={pushSending}>
                  {pushSending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                  {pushSending ? "Sending..." : "Send Notification"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
