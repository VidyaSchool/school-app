"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  BookMarked,
  Plus,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

interface Assignment {
  id: string
  class: string
  section: string
  subject: string
  createdAt: string
}

interface SubjectRequest {
  id: string
  class: string
  section: string
  subject: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

const CLASSES = ["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
const SECTIONS = ["A", "B", "C", "D"]
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Literature",
  "Computer Programming",
  "History",
  "Geography",
  "Economics",
  "Civics"
]

export default function SubjectsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [assignments, setAssignments] = React.useState<Assignment[]>([])
  const [requests, setRequests] = React.useState<SubjectRequest[]>([])
  const [isClassTeacher, setIsClassTeacher] = React.useState(false)
  const [teacherClass, setTeacherClass] = React.useState("")
  const [teacherSection, setTeacherSection] = React.useState("")
  
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  // Form State
  const [selectedClass, setSelectedClass] = React.useState("")
  const [selectedSection, setSelectedSection] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState("")

  const fetchData = React.useCallback(() => {
    fetch("/api/backend/teacher/subjects")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch subjects data")
        return res.json()
      })
      .then((data) => {
        setAssignments(data.assignments)
        setRequests(data.requests)
        setIsClassTeacher(data.isClassTeacher)
        setTeacherClass(data.class)
        setTeacherSection(data.section)
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load subjects data")
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass || !selectedSection || !selectedSubject) {
      toast.error("Please fill in all fields")
      return
    }

    setSubmitting(true)

    fetch("/api/backend/teacher/subjects/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class: selectedClass,
        section: selectedSection,
        subject: selectedSubject
      })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.detail || "Failed to submit request")
        }
        toast.success("Subject class request submitted successfully!")
        setOpen(false)
        setSelectedClass("")
        setSelectedSection("")
        setSelectedSubject("")
        fetchData()
      })
      .catch((err) => {
        toast.error(err.message || "Something went wrong")
      })
      .finally(() => {
        setSubmitting(false)
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
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookMarked className="h-8 w-8 text-primary" />
            Subject Allocation
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subject allocations, requests to teach classes, and review approval workflows.
          </p>
        </div>

        {/* Action Button: Dialog Trigger */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> Request Subject Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmitRequest}>
              <DialogHeader>
                <DialogTitle>Request Subject Class</DialogTitle>
                <DialogDescription>
                  Select the class, section, and subject you would like to request to teach. The assigned class teacher must approve this request.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Select Class */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls === "Nursery" || cls === "KG" ? cls : `Class ${cls}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Section */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">Section</label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          Section {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Subject */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Teacher Callout */}
      {isClassTeacher && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Class Teacher Portal Available
                </p>
                <p className="text-xs text-muted-foreground">
                  You are the designated Class Teacher of Class {teacherClass} - {teacherSection}. You can approve subject allocation requests from other teachers.
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0 cursor-pointer">
              <Link href={`/teacher/${username}/requests`}>
                View Approvals <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Roster Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Assigned Classes (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Active Assignments
              </CardTitle>
              <CardDescription>
                Subjects and classes currently assigned to you and approved by the respective class teachers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class & Section</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((asg) => (
                        <TableRow key={asg.id}>
                          <TableCell className="font-semibold">
                            {asg.class === "Nursery" || asg.class === "KG" ? asg.class : `Class ${asg.class}`} - {asg.section}
                          </TableCell>
                          <TableCell>{asg.subject}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/teacher/${username}/subjects/${asg.subject.toLowerCase()}/Class${asg.class}-${asg.section}/students`}>
                                View Students
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg">
                  You have no active subject class assignments yet. Request a class above to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Request History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <GitPullRequest className="h-5 w-5 text-primary" /> Request History
              </CardTitle>
              <CardDescription>
                History of your subject allocation requests and their resolution status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div 
                      key={req.id} 
                      className="p-3 border rounded-lg flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {req.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {req.class === "Nursery" || req.class === "KG" ? req.class : `Class ${req.class}`} - {req.section}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {req.status === "approved" && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/25 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </Badge>
                        )}
                        {req.status === "pending" && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/25 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                        {req.status === "rejected" && (
                          <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/25 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg">
                  No requests history found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
      </div>
    </div>
  )
}
