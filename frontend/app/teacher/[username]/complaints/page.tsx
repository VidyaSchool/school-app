"use client"

import * as React from "react"
import { Search, Calendar, FileText, CheckCircle2, RefreshCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

export default function TeacherComplaintsPage() {
  const [complaints, setComplaints] = React.useState<Complaint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("All")

  const fetchComplaints = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/complaints?role=teacher")
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
      comp.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      selectedStatus === "All" || comp.status === selectedStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Classroom Complaints
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and resolve student escalations, infrastructural issues, and classroom concerns.
          </p>
        </div>
        <Button
          onClick={fetchComplaints}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search complaints or names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Pending", "Resolved"].map((stat) => (
            <Button
              key={stat}
              variant={selectedStatus === stat ? "secondary" : "ghost"}
              onClick={() => setSelectedStatus(stat)}
              size="sm"
              className="text-xs h-8 shrink-0"
            >
              {stat}
            </Button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="flex flex-col items-center justify-center py-16">
            <CardContent className="flex flex-col items-center gap-2">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading complaints...</p>
            </CardContent>
          </Card>
        ) : filteredComplaints.length > 0 ? (
          filteredComplaints.map((comp) => (
            <Card key={comp.id} className="transition-colors hover:border-foreground/20">
              <CardHeader className="gap-2 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {comp.status === "pending" ? (
                      <Badge variant="destructive">Pending</Badge>
                    ) : (
                      <Badge variant="secondary">Resolved</Badge>
                    )}
                    {comp.taggedPeople && (
                      <Badge variant="outline">
                        Tagged: {comp.taggedPeople}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {new Date(comp.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <CardTitle className="text-base font-semibold leading-snug">
                  {comp.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  Reported by {comp.senderName} ({comp.senderRole}) • {comp.senderEmail}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {comp.message}
                </p>

                {/* Attachments Section */}
                {comp.fileUrl && (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-xs max-w-md">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">
                          {comp.fileName || "Attachment"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Reference File</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <a href={comp.fileUrl} download={comp.fileName || "attachment"}>
                        <Download className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>

              {/* Action Button */}
              {comp.status === "pending" && (
                <CardFooter className="flex justify-end border-t pt-3 pb-3">
                  <Button
                    onClick={() => handleResolve(comp.id)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Mark as Resolved
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <CardContent className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">No complaints found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "Try adjusting your search query or status filter." : "There are no complaints recorded yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
