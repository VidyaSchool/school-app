"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  GitPullRequest,
  Check,
  X,
  Loader2,
  User,
  Mail,
  BookOpen,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { formatDate } from "@/lib/date-formatter"

interface PendingRequest {
  id: string
  class: string
  section: string
  subject: string
  status: string
  createdAt: string
  teacher: {
    id: string
    name: string
    email: string
  }
}

export default function RequestsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [requests, setRequests] = React.useState<PendingRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)

  const fetchPendingRequests = React.useCallback(() => {
    fetch("/api/backend/teacher/requests/pending", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load requests")
        return res.json()
      })
      .then((data) => {
        setRequests(data)
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load pending requests")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchPendingRequests()
  }, [fetchPendingRequests])

  const handleAction = (id: string, action: "approve" | "reject") => {
    setProcessingId(id)
    fetch(`/api/backend/teacher/requests/${id}/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to ${action} request`)
        toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully!`)
        fetchPendingRequests()
      })
      .catch((err) => {
        toast.error(err.message || "Something went wrong")
      })
      .finally(() => {
        setProcessingId(null)
      })
  }

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
      
      {/* Header & Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full shrink-0" 
            onClick={() => router.push(`/teacher/${username}/subjects`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GitPullRequest className="h-8 w-8 text-primary" />
              Allocation Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Review and resolve subject allocation requests submitted by other teachers for your class.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Subject Requests</CardTitle>
          <CardDescription>
            Teachers requesting permission to teach specific subjects to your class students. Approving adds them as the subject teacher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class & Section</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" /> {req.teacher.name}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-muted-foreground/60" /> {req.teacher.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-primary" /> {req.subject}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {req.class === "Nursery" || req.class === "KG" ? req.class : `Class ${req.class}`} - {req.section}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 hover:bg-destructive/10 hover:text-destructive text-xs cursor-pointer"
                            disabled={processingId !== null}
                            onClick={() => handleAction(req.id, "reject")}
                          >
                            {processingId === req.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm"
                            className="h-8 bg-primary hover:bg-primary/95 text-xs cursor-pointer"
                            disabled={processingId !== null}
                            onClick={() => handleAction(req.id, "approve")}
                          >
                            {processingId === req.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-lg">
              No pending subject requests for your class section.
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
