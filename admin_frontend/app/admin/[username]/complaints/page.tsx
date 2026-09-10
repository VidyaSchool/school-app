"use client"

import * as React from "react"
import { AlertTriangle, Search, Calendar, FileText, CheckCircle2, RefreshCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

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

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = React.useState<Complaint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("All")

  const fetchComplaints = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/complaints?role=admin")
      if (!res.ok) throw new Error("Failed to fetch complaints")
      const data = await res.json()
      setComplaints(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast.success("Complaint marked as resolved")
      fetchComplaints()
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve complaint")
    }
  }

  const filteredComplaints = complaints.filter((comp) => {
    const matchesSearch =
      comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.recipient.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      selectedStatus === "All" || comp.status === selectedStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            Administrative Complaints & Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Manage escalations, infrastructural reports, and technical concerns logged by teachers, staff, and students.
          </p>
        </div>
        <Button
          onClick={fetchComplaints}
          variant="outline"
          size="sm"
          className="sm:w-auto rounded-lg cursor-pointer flex items-center gap-1.5"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 lg:px-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input
            type="text"
            placeholder="Search complaints, recipient or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Pending", "Resolved"].map((stat) => (
            <Button
              key={stat}
              variant={selectedStatus === stat ? "default" : "outline"}
              onClick={() => setSelectedStatus(stat)}
              size="sm"
              className="text-xs rounded-lg cursor-pointer shrink-0"
            >
              {stat}
            </Button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="grid gap-6 px-6 lg:px-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground font-semibold">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length > 0 ? (
          filteredComplaints.map((comp) => (
            <div
              key={comp.id}
              className={`rounded-xl border p-6 bg-card/30 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
                comp.status === "pending"
                  ? "border-rose-500/20 bg-rose-500/[0.005]"
                  : "border-emerald-500/20 bg-emerald-500/[0.005]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      comp.status === "pending"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {comp.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold">
                    Recipient: {comp.recipient}
                  </span>
                  {comp.taggedPeople && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">
                      Tagged: {comp.taggedPeople}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(comp.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">
                  {comp.title}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Reported by: {comp.senderName} ({comp.senderRole}) • {comp.senderEmail}
                </p>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
                {comp.message}
              </p>

              {/* Attachments Section */}
              {comp.fileUrl && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/80 bg-card/65 w-fit max-w-full">
                  <FileText className="h-5 w-5 text-rose-500 shrink-0" />
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                      {comp.fileName || "Attachment"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Reference File</span>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    <a href={comp.fileUrl} download={comp.fileName || "attachment"}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}

              {/* Action Button */}
              {comp.status === "pending" && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleResolve(comp.id)}
                    className="rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/10">
            No complaints found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
