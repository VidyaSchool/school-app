"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Users, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Loader2Icon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface Student {
  id: string
  userId: string
  name: string
  email: string
  image?: string | null
  attendance: string
  gpa: number
  performance: "improving" | "stable" | "declining"
  status: "Excellent" | "Good" | "Needs Attention"
}

const getInitials = (name: string) => {
  if (!name) return "ST"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function MyClassPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [students, setStudents] = React.useState<Student[]>([])
  const [className, setClassName] = React.useState<string>("")
  const [sectionName, setSectionName] = React.useState<string>("")
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("All")

  React.useEffect(() => {
    fetch("/api/backend/teacher/class/students")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load students")
        return res.json()
      })
      .then(data => {
        setStudents(data.students)
        setClassName(data.class)
        setSectionName(data.section)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const handleViewDetails = (studentUserId: string) => {
    router.push(`/teacher/${username}/class/${studentUserId}`)
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = statusFilter === "All" || student.status === statusFilter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 p-6 bg-background">
        <p className="text-destructive font-medium">Error: {error}</p>
        <Button variant="outline" onClick={() => { setLoading(true); setError(""); window.location.reload() }}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans relative">
      <div className="page-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            My Class: {className && className !== "Not Assigned" && className !== "none" ? (className === "Nursery" || className === "KG" ? className : `Class ${className}`) : "Not Assigned"}{sectionName && sectionName !== "None" && sectionName !== "none" ? ` - ${sectionName}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Manage your classroom roster, track student engagement, grade standing, and daily attendance records.
          </p>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button 
            variant={statusFilter === "All" ? "default" : "outline"}
            onClick={() => setStatusFilter("All")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "Excellent" ? "default" : "outline"}
            onClick={() => setStatusFilter("Excellent")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            Excellent
          </Button>
          <Button 
            variant={statusFilter === "Good" ? "default" : "outline"}
            onClick={() => setStatusFilter("Good")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            Good
          </Button>
          <Button 
            variant={statusFilter === "Needs Attention" ? "default" : "outline"}
            onClick={() => setStatusFilter("Needs Attention")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            Needs Attention
          </Button>
        </div>
      </div>

      {/* Roster Table */}
      <div>
        <div className="rounded-xl border border-border bg-card/30 overflow-x-auto shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Student ID</TableHead>
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">Attendance</TableHead>
                <TableHead className="font-semibold text-foreground">GPA</TableHead>
                <TableHead className="font-semibold text-foreground">Trend</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{student.id}</TableCell>
                      <TableCell className="font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.image || undefined} alt={student.name} />
                            <AvatarFallback className="font-semibold text-xs bg-primary/10 text-primary">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{student.email}</TableCell>
                      <TableCell className="text-foreground text-sm font-semibold">{student.attendance}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">{student.gpa} / 10</TableCell>
                      <TableCell>
                        {student.performance === "improving" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <TrendingUp className="h-3.5 w-3.5" /> Improving
                          </span>
                        )}
                        {student.performance === "stable" && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            Stable
                          </span>
                        )}
                        {student.performance === "declining" && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            <TrendingDown className="h-3.5 w-3.5" /> Declining
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.status === "Excellent" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Excellent
                          </span>
                        )}
                        {student.status === "Good" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            Good
                          </span>
                        )}
                        {student.status === "Needs Attention" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            Needs Attention
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs rounded-lg cursor-pointer h-8"
                          onClick={() => handleViewDetails(student.userId)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    No students matched "{searchQuery}".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    </div>
  )
}
