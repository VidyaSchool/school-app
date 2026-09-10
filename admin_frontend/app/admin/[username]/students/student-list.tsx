'use client'

import * as React from "react"
import { 
  GraduationCap, 
  Search, 
  UserCheck, 
  UserPlus, 
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/date-formatter"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface StudentRow {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  admissionNumber: string | null
  username: string | null
  class: string | null
  section: string | null
  phoneNumber: string | null
  parentName: string | null
  parentPhone: string | null
  onboardingCompleted: boolean
  createdAt: Date
}

export function StudentList({ initialStudents }: { initialStudents: StudentRow[] }) {
  const [search, setSearch] = React.useState("")
  const [classFilter, setClassFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Filters
  const filteredStudents = initialStudents.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      (student.username && student.username.toLowerCase().includes(search.toLowerCase())) ||
      (student.admissionNumber && student.admissionNumber.toLowerCase().includes(search.toLowerCase()))

    const matchesClass = 
      classFilter === "all" || 
      student.class === classFilter

    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "completed" && student.onboardingCompleted) ||
      (statusFilter === "pending" && !student.onboardingCompleted)

    return matchesSearch && matchesClass && matchesStatus
  })

  // Reset pagination to first page if search/filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, classFilter, statusFilter])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  // Summary Metrics
  const totalStudents = initialStudents.length
  const onboardedCount = initialStudents.filter(s => s.onboardingCompleted).length
  const pendingCount = totalStudents - onboardedCount

  // Unique classes for filtering
  const classesList = Array.from(new Set(initialStudents.map(s => s.class).filter(Boolean))).sort((a, b) => {
    if (a === "Nursery") return -1;
    if (b === "Nursery") return 1;
    if (a === "KG") return -1;
    if (b === "KG") return 1;
    return parseInt(a!) - parseInt(b!);
  })

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <GraduationCap className="h-8 w-8 text-primary" />
              Student Management
            </h1>
            <p className="text-sm text-muted-foreground">
              View all enrolled students, their admission numbers, classes, and onboarding status.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
              Total Enrolled
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered student accounts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
              Onboarded
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onboardedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed profile setup ({totalStudents ? Math.round((onboardedCount / totalStudents) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
              Pending Onboarding
            </CardTitle>
            <UserPlus className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Accounts requiring profile updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input
            placeholder="Search by name, email, admission no or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50 text-xs h-9.5 rounded-lg border-border"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="bg-card/50 text-xs h-9.5 rounded-lg">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classesList.map((cls) => (
                  <SelectItem key={cls} value={cls || ""}>
                    {cls === "Nursery" || cls === "KG" ? cls : `Class ${cls}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card/50 text-xs h-9.5 rounded-lg">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Onboarding Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-border bg-card/20 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-foreground w-[150px]">Admission No</TableHead>
              <TableHead className="font-semibold text-foreground">Student</TableHead>
              <TableHead className="font-semibold text-foreground">Contact</TableHead>
              <TableHead className="font-semibold text-foreground">Class & Sec</TableHead>
              <TableHead className="font-semibold text-foreground">Parent Info</TableHead>
              <TableHead className="font-semibold text-foreground">Onboarding</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead className="font-semibold text-foreground">Joined Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {student.admissionNumber || "Not Set"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.image || undefined} alt={student.name} />
                        <AvatarFallback className="font-semibold text-xs bg-primary/10 text-primary">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{student.name}</span>
                        {student.username && (
                          <span className="text-[10px] text-muted-foreground font-mono">@{student.username}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary/70" /> {student.email}
                      </span>
                      {student.phoneNumber && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary/70" /> {student.phoneNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm text-foreground">
                    {student.class ? (
                      student.class === "Nursery" || student.class === "KG" 
                        ? `${student.class} ${student.section ? `- ${student.section}` : ""}`
                        : `Class ${student.class} ${student.section ? `- ${student.section}` : ""}`
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.parentName ? (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-semibold text-foreground">{student.parentName}</span>
                        {student.parentPhone && (
                          <span className="text-muted-foreground font-mono text-[10px]">{student.parentPhone}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/75 italic text-xs">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.onboardingCompleted ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 gap-1 rounded-full text-[10px] font-semibold">
                        <CheckCircle className="h-3 w-3" /> Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 gap-1 rounded-full text-[10px] font-semibold">
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={student.role} 
                      disabled={updatingUserId === student.id}
                      onValueChange={async (newRole) => {
                        try {
                          setUpdatingUserId(student.id)
                          const res = await fetch('/api/backend/api/admin/change-role', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ userId: student.id, role: newRole })
                          })
                          if (!res.ok) {
                            const data = await res.json()
                            throw new Error(data.detail || data.error || 'Failed to update role')
                          }
                          toast.success(`Role updated successfully to ${newRole}`)
                          router.refresh()
                        } catch (err: any) {
                          toast.error(err.message || 'Something went wrong')
                        } finally {
                          setUpdatingUserId(null)
                        }
                      }}
                    >
                      <SelectTrigger className="w-[110px] text-xs h-8 bg-card/50" disabled={updatingUserId === student.id}>
                        <div className="flex items-center gap-1.5">
                          {updatingUserId === student.id && (
                            <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                          )}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary/70" /> {formatDate(student.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm font-medium">
                  No matching student records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground select-none">
          <div>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

    </div>
  )
}
