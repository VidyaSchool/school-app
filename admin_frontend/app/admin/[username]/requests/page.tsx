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
  ArrowLeft,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { formatDate } from "@/lib/date-formatter"
import { io, Socket } from "socket.io-client"
import { authClient } from "@/lib/auth-client"

interface SubjectRequest {
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

interface TeacherRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: string
  createdAt: string
  preferredRole?: string
}

export default function AdminRequestsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [subjectRequests, setSubjectRequests] = React.useState<SubjectRequest[]>([])
  const [teacherRequests, setTeacherRequests] = React.useState<TeacherRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const session = await authClient.getSession()
      console.log("Admin session:", session)
      if (session?.data?.user) {
        setUser(session.data.user)
        console.log("Admin user:", session.data.user)
      }
    }
    fetchUser()
  }, [])

  React.useEffect(() => {
    if (!user) return

    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      transports: ["websocket", "polling"]
    })

    newSocket.on("connect", () => {
      console.log("Admin connected to server")
      newSocket.emit("join_admin_room", { adminId: user.id })
    })

    newSocket.on("teacher_request_created", (data: TeacherRequest) => {
      setTeacherRequests(prev => [data, ...prev])
      toast.info("New teacher account request received")
    })

    newSocket.on("request_updated", (data: { requestId: string; status: string }) => {
      console.log("Request updated received:", data)
      setProcessingId(null)
      toast.success(`Teacher account ${data.status}!`)
      setTeacherRequests(prev => 
        prev.filter(req => req.id !== data.requestId)
      )
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [user])

  const fetchRequests = React.useCallback(() => {
    Promise.all([
      fetch("/api/admin/requests", { credentials: "include" }).then(res => res.json()),
      fetch("/api/admin/teacher-requests", { credentials: "include" }).then(res => res.json())
    ])
      .then(([subjects, teachers]) => {
        setSubjectRequests(subjects)
        setTeacherRequests(teachers)
        setLoading(false)
      })
      .catch((err) => {
        toast.error("Failed to load requests")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSubjectAction = (id: string, action: "approve" | "reject") => {
    setProcessingId(id)
    fetch(`/api/backend/teacher/requests/${id}/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to ${action} request`)
        toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully!`)
        fetchRequests()
      })
      .catch((err) => {
        toast.error(err.message || "Something went wrong")
      })
      .finally(() => {
        setProcessingId(null)
      })
  }

  const handleTeacherAction = (requestId: string, action: "approve" | "reject") => {
    if (!socket || !user) {
      console.error("Socket or user not available", { socket: !!socket, user: !!user })
      toast.error("Connection not ready. Please refresh the page.")
      return
    }
    
    console.log(`${action} teacher request:`, requestId, "by admin:", user.id)
    setProcessingId(requestId)
    
    if (action === "approve") {
      socket.emit("approve_teacher", { requestId, adminId: user.id })
      console.log("Emitted approve_teacher event")
    } else {
      socket.emit("reject_teacher", { requestId, adminId: user.id, reason: "Application denied" })
      console.log("Emitted reject_teacher event")
    }
    
    // Clear processing after 3 seconds as fallback
    setTimeout(() => {
      setProcessingId(null)
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full shrink-0 cursor-pointer" 
            onClick={() => router.push(`/admin/${username}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GitPullRequest className="h-8 w-8 text-primary" />
              Requests Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Review teacher account and subject allocation requests
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="teachers" className="w-full">
        <TabsList>
          <TabsTrigger value="teachers">
            <UserCheck className="h-4 w-4 mr-2" />
            Staff / Teacher Accounts ({teacherRequests.filter(r => r.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookOpen className="h-4 w-4 mr-2" />
            Subject Allocations ({subjectRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Staff & Teacher Account Requests</CardTitle>
              <CardDescription>
                Approve or reject teacher and librarian account applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacherRequests.filter(r => r.status === "pending").length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Requested Role</TableHead>
                        <TableHead>Date Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherRequests.filter(r => r.status === "pending").map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" /> {req.userName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-muted-foreground/60" /> {req.userEmail}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {req.preferredRole || "teacher"}
                            </span>
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
                                disabled={processingId === req.id}
                                onClick={() => handleTeacherAction(req.id, "reject")}
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
                                disabled={processingId === req.id}
                                onClick={() => handleTeacherAction(req.id, "approve")}
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
                  No pending staff or teacher account requests
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subject Allocation Requests</CardTitle>
              <CardDescription>
                Teachers requesting permission to teach specific subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subjectRequests.length > 0 ? (
                <div className="rounded-lg border">
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
                      {subjectRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" /> {req.teacher.name}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
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
                                onClick={() => handleSubjectAction(req.id, "reject")}
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
                                onClick={() => handleSubjectAction(req.id, "approve")}
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
                  No pending subject requests
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
    </div>
  )
}
