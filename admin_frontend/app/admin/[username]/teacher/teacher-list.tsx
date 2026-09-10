'use client'

import * as React from "react"
import { 
  Users, 
  Search, 
  UserCheck, 
  UserPlus, 
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

interface TeacherRow {
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
  onboardingCompleted: boolean
  createdAt: Date
}

export function TeacherList({ initialTeachers }: { initialTeachers: TeacherRow[] }) {
  const [search, setSearch] = React.useState("")
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
  const filteredTeachers = initialTeachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(search.toLowerCase()) ||
      teacher.email.toLowerCase().includes(search.toLowerCase()) ||
      (teacher.username && teacher.username.toLowerCase().includes(search.toLowerCase())) ||
      (teacher.admissionNumber && teacher.admissionNumber.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "completed" && teacher.onboardingCompleted) ||
      (statusFilter === "pending" && !teacher.onboardingCompleted)

    return matchesSearch && matchesStatus
  })

  // Reset pagination to first page if search/filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage)

  // Summary Metrics
  const totalTeachers = initialTeachers.length
  const onboardedCount = initialTeachers.filter(t => t.onboardingCompleted).length
  const pendingCount = totalTeachers - onboardedCount

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
              <Users className="h-8 w-8 text-primary" />
              Teacher Management
            </h1>
            <p className="text-sm text-muted-foreground">
              View all school faculty, their teacher registration numbers, assigned class teacher details, and onboarding status.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
              Total Faculty
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered teacher accounts
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
              Completed profile setup ({totalTeachers ? Math.round((onboardedCount / totalTeachers) * 100) : 0}%)
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
            placeholder="Search by name, email, employee ID or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50 text-xs h-9.5 rounded-lg border-border"
          />
        </div>
        
        <div className="flex items-center gap-3">
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
              <TableHead className="font-semibold text-foreground w-[150px]">Employee ID</TableHead>
              <TableHead className="font-semibold text-foreground">Teacher</TableHead>
              <TableHead className="font-semibold text-foreground">Contact</TableHead>
              <TableHead className="font-semibold text-foreground">Assigned Class Teacher</TableHead>
              <TableHead className="font-semibold text-foreground">Onboarding</TableHead>
              <TableHead className="font-semibold text-foreground">Role</TableHead>
              <TableHead className="font-semibold text-foreground">Joined Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTeachers.length > 0 ? (
              currentTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {teacher.admissionNumber || "Not Set"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={teacher.image || undefined} alt={teacher.name} />
                        <AvatarFallback className="font-semibold text-xs bg-primary/10 text-primary">
                          {getInitials(teacher.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{teacher.name}</span>
                        {teacher.username && (
                          <span className="text-[10px] text-muted-foreground font-mono">@{teacher.username}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary/70" /> {teacher.email}
                      </span>
                      {teacher.phoneNumber && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary/70" /> {teacher.phoneNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm text-foreground">
                    {teacher.class && teacher.class !== "none" && teacher.class !== "None" ? (
                      teacher.class === "Nursery" || teacher.class === "KG" 
                        ? `${teacher.class} ${teacher.section && teacher.section !== "none" ? `- ${teacher.section}` : ""}`
                        : `Class ${teacher.class} ${teacher.section && teacher.section !== "none" ? `- ${teacher.section}` : ""}`
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {teacher.onboardingCompleted ? (
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
                      defaultValue={teacher.role} 
                      disabled={updatingUserId === teacher.id}
                      onValueChange={async (newRole) => {
                        try {
                          setUpdatingUserId(teacher.id)
                          const res = await fetch('/api/backend/api/admin/change-role', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ userId: teacher.id, role: newRole })
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
                      <SelectTrigger className="w-[110px] text-xs h-8 bg-card/50" disabled={updatingUserId === teacher.id}>
                        <div className="flex items-center gap-1.5">
                          {updatingUserId === teacher.id && (
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
                      <Calendar className="h-3.5 w-3.5 text-primary/70" /> {formatDate(teacher.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm font-medium">
                  No matching teacher records found.
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
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTeachers.length)} of {filteredTeachers.length} teachers
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
