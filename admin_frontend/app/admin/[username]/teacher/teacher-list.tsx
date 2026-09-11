'use client'

import * as React from "react"
import { 
  Users, 
  Search, 
  UserCheck, 
  UserPlus, 
  UserX,
  Mail,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Check,
  Filter,
  Sliders,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Info,
  ShieldCheck,
  BookOpen,
  Award,
  HelpCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

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

interface AbsentRecord {
  id: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  teacherImage: string | null
  teacherUsername: string | null
  admissionNumber: string | null
  assignedClass: string | null
  category?: string
  date: string
  dayOfWeek?: string
  status?: string
  reason: string
  duration: string
  remarks?: string
  affectedPeriodsCount?: number
  createdAt?: string
}

interface AlternativeCandidate {
  teacherId: string
  name: string
  category: string
  eligible: boolean
  score: number | null
  breakdown: Record<string, number>
  reason: string | null
}

interface SubstitutionRecordItem {
  id: string
  date: string
  periodName: string
  startTime: string
  endTime: string
  class: string
  section: string
  subject: string
  room?: string | null
  originalTeacher: {
    id: string
    name: string
    email?: string
    image?: string | null
  }
  substituteTeacher?: {
    id: string
    name: string
    email: string
    image?: string | null
    category?: string
  } | null
  status: 'assigned' | 'activity_fallback' | 'unassigned' | 'manual_override'
  isActivityFallback: boolean
  activityName?: string | null
  suitabilityScore?: number | null
  scoreBreakdown?: Record<string, number>
  notes?: string | null
  alternatives?: AlternativeCandidate[]
}

interface SubstitutionSettingsData {
  same_subject_score: number
  same_category_score: number
  same_class_score: number
  same_section_score: number
  matching_activity_skill_score: number
  low_workload_bonus: number
  workload_penalty_per_sub: number
  high_workload_penalty: number
  high_workload_threshold: number
  activity_fallback_threshold: number
  enabled_activities: string[]
  allow_cross_category: boolean
}

interface FacultyRosterItem {
  id: string
  name: string
  email: string
  image?: string | null
  role: string
  category: 'PRT' | 'TGT' | 'PGT' | string
  activitySkills: string[]
  isAvailableForSubstitution: boolean
  totalSubstitutions: number
  assignedClass?: string | null
  assignedSection?: string | null
}

export function TeacherList({ initialTeachers }: { initialTeachers: TeacherRow[] }) {
  const [activeTab, setActiveTab] = React.useState("all-teachers")
  const [absentSubTab, setAbsentSubTab] = React.useState<"board" | "registry" | "roster">("board")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  // Date State
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], [])
  const [selectedDate, setSelectedDate] = React.useState(todayStr)

  // Loading States
  const [isLoadingAbsences, setIsLoadingAbsences] = React.useState(false)
  const [isLoadingSubstitutions, setIsLoadingSubstitutions] = React.useState(false)
  const [isAllocating, setIsAllocating] = React.useState(false)
  const [isSubmittingAbsence, setIsSubmittingAbsence] = React.useState(false)

  // Data States
  const [absentRecords, setAbsentRecords] = React.useState<AbsentRecord[]>([])
  const [substitutions, setSubstitutions] = React.useState<SubstitutionRecordItem[]>([])
  const [facultyRoster, setFacultyRoster] = React.useState<FacultyRosterItem[]>([])
  const [settings, setSettings] = React.useState<SubstitutionSettingsData>({
    same_subject_score: 100,
    same_category_score: 50,
    same_class_score: 40,
    same_section_score: 30,
    matching_activity_skill_score: 25,
    low_workload_bonus: 10,
    workload_penalty_per_sub: 15,
    high_workload_penalty: 20,
    high_workload_threshold: 2,
    activity_fallback_threshold: 35,
    enabled_activities: ["Games / Sports", "Arts", "Music", "Library", "Computer"],
    allow_cross_category: false,
  })

  // Filters
  const [absentSearch, setAbsentSearch] = React.useState("")
  const [absentReasonFilter, setAbsentReasonFilter] = React.useState("all")

  // Modals
  const [isMarkModalOpen, setIsMarkModalOpen] = React.useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false)
  const [editingTeacher, setEditingTeacher] = React.useState<FacultyRosterItem | null>(null)

  // Form State for Marking Absent
  const [selectedTeacherId, setSelectedTeacherId] = React.useState("")
  const [absenceDate, setAbsenceDate] = React.useState(todayStr)
  const [absenceReason, setAbsenceReason] = React.useState("Sick Leave")
  const [absenceDuration, setAbsenceDuration] = React.useState("Full Day")
  const [absenceRemarks, setAbsenceRemarks] = React.useState("")

  // Fetch Absences & Substitutions from Backend
  const fetchAbsences = React.useCallback(async (targetDate: string) => {
    try {
      setIsLoadingAbsences(true)
      const res = await fetch(`/api/backend/api/admin/absences?date=${targetDate}`)
      if (res.ok) {
        const data = await res.json()
        setAbsentRecords(data)
      }
    } catch (err) {
      console.error("Failed to load absences:", err)
    } finally {
      setIsLoadingAbsences(false)
    }
  }, [])

  const fetchSubstitutions = React.useCallback(async (targetDate: string) => {
    try {
      setIsLoadingSubstitutions(true)
      const res = await fetch(`/api/backend/api/admin/substitutions?date=${targetDate}`)
      if (res.ok) {
        const data = await res.json()
        setSubstitutions(data)
      }
    } catch (err) {
      console.error("Failed to load substitutions:", err)
    } finally {
      setIsLoadingSubstitutions(false)
    }
  }, [])

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/backend/api/admin/substitution/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      console.error("Failed to load substitution settings:", err)
    }
  }, [])

  const fetchFacultyRoster = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/backend/api/admin/teachers/substitution-roster`)
      if (res.ok) {
        const data = await res.json()
        setFacultyRoster(data)
      }
    } catch (err) {
      console.error("Failed to load faculty roster:", err)
    }
  }, [])

  // Initial and on Date Change fetch
  React.useEffect(() => {
    fetchAbsences(selectedDate)
    fetchSubstitutions(selectedDate)
  }, [selectedDate, fetchAbsences, fetchSubstitutions])

  React.useEffect(() => {
    if (activeTab === "absent-teachers") {
      fetchSettings()
      fetchFacultyRoster()
    }
  }, [activeTab, fetchSettings, fetchFacultyRoster])

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Filters for All Teachers
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

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage)

  const totalTeachers = initialTeachers.length
  const onboardedCount = initialTeachers.filter(t => t.onboardingCompleted).length
  const pendingCount = totalTeachers - onboardedCount

  // Filtered Absent Records
  const filteredAbsentRecords = absentRecords.filter(record => {
    const matchesSearch =
      record.teacherName.toLowerCase().includes(absentSearch.toLowerCase()) ||
      record.teacherEmail.toLowerCase().includes(absentSearch.toLowerCase()) ||
      (record.admissionNumber && record.admissionNumber.toLowerCase().includes(absentSearch.toLowerCase()))

    const matchesReason =
      absentReasonFilter === "all" || record.reason === absentReasonFilter

    const matchesDate = !selectedDate || record.date === selectedDate

    return matchesSearch && matchesReason && matchesDate
  })

  const todayAbsentCount = absentRecords.filter(r => r.date === selectedDate).length
  const todayPresentCount = Math.max(0, totalTeachers - todayAbsentCount)

  // Substitution Statistics
  const totalSlotsCount = substitutions.length
  const assignedSlotsCount = substitutions.filter(s => s.status === "assigned" || s.status === "manual_override").length
  const activitySlotsCount = substitutions.filter(s => s.status === "activity_fallback").length
  const unassignedSlotsCount = substitutions.filter(s => s.status === "unassigned").length

  // Handlers
  const handleMarkAbsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacherId) {
      toast.error("Please select a teacher")
      return
    }

    try {
      setIsSubmittingAbsence(true)
      const res = await fetch('/api/backend/api/admin/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: selectedTeacherId,
          date: absenceDate,
          reason: absenceReason,
          duration: absenceDuration,
          remarks: absenceRemarks.trim() || undefined,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to mark teacher absent')
      }

      const data = await res.json()
      toast.success(`${data.teacherName} marked absent. Generated ${data.allocationsCount} substitution requirements!`)
      setIsMarkModalOpen(false)
      setSelectedTeacherId("")
      setAbsenceRemarks("")

      if (selectedDate !== absenceDate) {
        setSelectedDate(absenceDate)
      } else {
        fetchAbsences(absenceDate)
        fetchSubstitutions(absenceDate)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record absence")
    } finally {
      setIsSubmittingAbsence(false)
    }
  }

  const handleMarkPresent = async (recordId: string, teacherName: string) => {
    try {
      const res = await fetch(`/api/backend/api/admin/absences/${recordId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to remove absence')
      }

      toast.success(`${teacherName} marked as present. Allocations updated.`)
      fetchAbsences(selectedDate)
      fetchSubstitutions(selectedDate)
    } catch (err: any) {
      toast.error(err.message || "Failed to update attendance")
    }
  }

  const handleRunAllocation = async () => {
    try {
      setIsAllocating(true)
      const res = await fetch('/api/backend/api/admin/substitutions/run-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Allocation failed')
      }

      const data = await res.json()
      toast.success(`Optimal allocation complete! Optimized ${data.totalAllocations} period assignments.`)
      fetchSubstitutions(selectedDate)
    } catch (err: any) {
      toast.error(err.message || "Allocation failed")
    } finally {
      setIsAllocating(false)
    }
  }

  const handleOverrideSubstitute = async (subId: string, candidateId: string | null, isActivity: boolean = false, activityName?: string) => {
    try {
      const res = await fetch(`/api/backend/api/admin/substitutions/${subId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substitute_teacher_id: candidateId,
          is_activity_fallback: isActivity,
          activity_name: activityName,
          notes: isActivity ? `Assigned to ${activityName}` : "Manual override by administrator",
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Override failed')
      }

      toast.success("Substitute assigned successfully")
      fetchSubstitutions(selectedDate)
    } catch (err: any) {
      toast.error(err.message || "Failed to update substitute")
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/backend/api/admin/substitution/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save settings')
      }

      toast.success("Substitution scoring rules saved successfully!")
      setIsSettingsModalOpen(false)
      // Auto re-run allocation with new weights if there are substitutions
      if (substitutions.length > 0) {
        handleRunAllocation()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    }
  }

  const handleSaveTeacherSubstitutionProfile = async (teacherId: string, category: string, skills: string[], isAvailable: boolean) => {
    try {
      const res = await fetch(`/api/backend/api/admin/teachers/${teacherId}/substitution-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          activity_skills: skills,
          is_available_for_substitution: isAvailable,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to update teacher profile')
      }

      toast.success("Teacher substitution profile updated!")
      setEditingTeacher(null)
      fetchFacultyRoster()
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile")
    }
  }

  const handleQuickMarkAbsent = (teacher: TeacherRow) => {
    setSelectedTeacherId(teacher.id)
    setAbsenceDate(selectedDate || todayStr)
    setIsMarkModalOpen(true)
  }

  const getReasonBadgeClass = (reason: string) => {
    switch (reason) {
      case "Sick Leave":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      case "Casual Leave":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      case "Emergency Leave":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
      case "Official Duty":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      case "Half Day":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
    }
  }

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case "PGT":
        return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
      case "TGT":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      case "PRT":
        return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
      default:
        return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen font-sans">
      
      {/* Tab Navigation Header */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
          <TabsList className="h-10 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger 
              value="all-teachers" 
              className="gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer data-active:shadow-xs"
            >
              <span>All Teachers</span>
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {totalTeachers}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="absent-teachers" 
              className="gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer data-active:shadow-xs"
            >
              <span>Absent Teachers & Substitutions</span>
              {todayAbsentCount > 0 && (
                <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {todayAbsentCount} Absent
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === "absent-teachers" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsModalOpen(true)}
                className="gap-1.5 h-9 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                Scoring Rules
              </Button>
              <Button 
                onClick={() => {
                  setAbsenceDate(selectedDate || todayStr)
                  setIsMarkModalOpen(true)
                }} 
                className="gap-2 h-9 text-xs font-semibold rounded-lg cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                Mark Teacher Absent
              </Button>
            </div>
          )}
        </div>

        {/* ── Tab 1: All Teachers ── */}
        <TabsContent value="all-teachers" className="space-y-6 mt-0">
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
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Faculty</SelectItem>
                    <SelectItem value="completed">Onboarded</SelectItem>
                    <SelectItem value="pending">Pending Setup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* All Teachers Table */}
          <div className="rounded-xl border border-border bg-card/20 overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-foreground w-[130px]">Employee ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Teacher</TableHead>
                  <TableHead className="font-semibold text-foreground">Contact</TableHead>
                  <TableHead className="font-semibold text-foreground">Class Teacher</TableHead>
                  <TableHead className="font-semibold text-foreground">Onboarding</TableHead>
                  <TableHead className="font-semibold text-foreground">Role</TableHead>
                  <TableHead className="font-semibold text-foreground">Joined</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Attendance Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTeachers.length > 0 ? (
                  currentTeachers.map((teacher) => {
                    const isAbsent = absentRecords.some(r => r.teacherId === teacher.id && r.date === (selectedDate || todayStr))
                    return (
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
                              <SelectItem value="librarian">Librarian</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-primary/70" /> {formatDate(teacher.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAbsent ? (
                            <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 rounded-full text-[10px] font-semibold">
                              <UserX className="h-3 w-3" /> Absent
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickMarkAbsent(teacher)}
                              className="h-7 text-[11px] px-2.5 rounded-lg border-dashed hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                            >
                              <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                              Mark Absent
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm font-medium">
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
        </TabsContent>

        {/* ── Tab 2: Absent Teachers & Substitution Allocation ── */}
        <TabsContent value="absent-teachers" className="space-y-6 mt-0">
          
          {/* Top Bar: Date Selector & Quick Metrics */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/40">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <Label htmlFor="target-date" className="text-xs font-semibold text-foreground">
                  Selected Date:
                </Label>
                <Input
                  id="target-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-38 bg-background text-xs h-9 rounded-lg"
                />
              </div>

              {selectedDate !== todayStr && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs h-8 text-primary"
                >
                  Jump to Today
                </Button>
              )}
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="p-1 bg-muted/60 rounded-lg flex items-center gap-1 text-xs">
                <button
                  onClick={() => setAbsentSubTab("board")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    absentSubTab === "board" 
                      ? "bg-background shadow-xs text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Substitutions Board ({totalSlotsCount})
                </button>
                <button
                  onClick={() => setAbsentSubTab("registry")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    absentSubTab === "registry" 
                      ? "bg-background shadow-xs text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Absent Registry ({todayAbsentCount})
                </button>
                <button
                  onClick={() => setAbsentSubTab("roster")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    absentSubTab === "roster" 
                      ? "bg-background shadow-xs text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Faculty Skills & Category
                </button>
              </div>

              {absentSubTab === "board" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunAllocation}
                  disabled={isAllocating || todayAbsentCount === 0}
                  className="gap-1.5 h-9 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${isAllocating ? "animate-spin" : ""}`} />
                  Re-Optimize Allocation
                </Button>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-xs border-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Faculty Absent
                </CardTitle>
                <UserX className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {todayAbsentCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  On leave for {selectedDate}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Affected Periods
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalSlotsCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total periods requiring substitution
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Covered by Substitutes
                </CardTitle>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {assignedSlotsCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned by qualification and score
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Activity Fallbacks / Unassigned
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {activitySlotsCount + unassignedSlotsCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activitySlotsCount} activity classes, {unassignedSlotsCount} unassigned
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Sub-view 1: Substitutions Allocation Board ── */}
          {absentSubTab === "board" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card/20 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground w-[120px]">Period & Time</TableHead>
                      <TableHead className="font-semibold text-foreground">Class & Subject</TableHead>
                      <TableHead className="font-semibold text-foreground">Absent Teacher</TableHead>
                      <TableHead className="font-semibold text-foreground">Assigned Substitute</TableHead>
                      <TableHead className="font-semibold text-foreground">Suitability Score</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Reassign / Override</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSubstitutions ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Calculating global substitution allocations...</p>
                        </TableCell>
                      </TableRow>
                    ) : substitutions.length > 0 ? (
                      substitutions.map((sub) => (
                        <TableRow key={sub.id} className="hover:bg-muted/5 transition-colors">
                          {/* Period and Time */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">{sub.periodName}</span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {sub.startTime} - {sub.endTime}
                              </span>
                            </div>
                          </TableCell>

                          {/* Class & Subject */}
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground text-sm">
                                  Class {sub.class}-{sub.section}
                                </span>
                                {sub.room && (
                                  <Badge variant="outline" className="text-[10px] h-4 py-0 px-1">
                                    Room {sub.room}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-primary font-medium">{sub.subject}</span>
                            </div>
                          </TableCell>

                          {/* Absent Teacher */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={sub.originalTeacher.image || undefined} alt={sub.originalTeacher.name} />
                                <AvatarFallback className="text-[10px] bg-rose-500/10 text-rose-600">
                                  {getInitials(sub.originalTeacher.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-xs text-foreground">{sub.originalTeacher.name}</span>
                                <span className="text-[10px] text-rose-500 font-semibold">Absent</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Assigned Substitute */}
                          <TableCell>
                            {sub.substituteTeacher ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={sub.substituteTeacher.image || undefined} alt={sub.substituteTeacher.name} />
                                  <AvatarFallback className="text-[10px] bg-emerald-500/10 text-emerald-600">
                                    {getInitials(sub.substituteTeacher.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-foreground">{sub.substituteTeacher.name}</span>
                                    {sub.substituteTeacher.category && (
                                      <Badge className={`text-[9px] h-3.5 px-1 py-0 border ${getCategoryBadgeClass(sub.substituteTeacher.category)}`}>
                                        {sub.substituteTeacher.category}
                                      </Badge>
                                    )}
                                  </div>
                                  {sub.isActivityFallback ? (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                      <Sparkles className="size-2.5" /> {sub.activityName || "Activity Fallback"}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">{sub.substituteTeacher.email}</span>
                                  )}
                                </div>
                              </div>
                            ) : sub.isActivityFallback ? (
                              <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-xs">
                                <Sparkles className="size-3.5" />
                                <span>{sub.activityName || "Activity Class Fallback"}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-500 font-semibold text-xs">
                                <AlertCircle className="size-3.5" />
                                <span>Unassigned</span>
                              </div>
                            )}
                          </TableCell>

                          {/* Suitability Score with Popover Breakdown */}
                          <TableCell>
                            {sub.suitabilityScore !== undefined && sub.suitabilityScore !== null ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-1.5 font-mono text-xs font-bold px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer border border-border">
                                    <Award className="size-3 text-primary" />
                                    <span>{sub.suitabilityScore > 0 ? `+${sub.suitabilityScore}` : sub.suitabilityScore}</span>
                                    <Info className="size-3 text-muted-foreground ml-0.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3 text-xs space-y-2">
                                  <div className="font-bold border-b pb-1 flex items-center justify-between">
                                    <span>Score Breakdown</span>
                                    <Badge variant="secondary" className="text-[10px]">
                                      Total: {sub.suitabilityScore}
                                    </Badge>
                                  </div>
                                  {sub.scoreBreakdown && Object.keys(sub.scoreBreakdown).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(sub.scoreBreakdown).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center text-[11px]">
                                          <span className="text-muted-foreground capitalize">
                                            {key.replace(/_/g, " ")}:
                                          </span>
                                          <span className={Number(val) >= 0 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                                            {Number(val) > 0 ? `+${val}` : val}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground text-[11px]">Direct assignment or activity fallback.</p>
                                  )}
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            {sub.status === "assigned" && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                                Auto-Assigned
                              </Badge>
                            )}
                            {sub.status === "activity_fallback" && (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                Activity Fallback
                              </Badge>
                            )}
                            {sub.status === "manual_override" && (
                              <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-semibold">
                                Admin Override
                              </Badge>
                            )}
                            {sub.status === "unassigned" && (
                              <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-semibold">
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>

                          {/* Reassign / Manual Override Action */}
                          <TableCell className="text-right">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                                  <span>Reassign</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-72 p-2">
                                <div className="space-y-2">
                                  <div className="font-bold text-xs text-foreground px-1 pb-1 border-b">
                                    Eligible Substitute Candidates
                                  </div>
                                  <div className="max-h-56 overflow-y-auto space-y-1">
                                    {sub.alternatives && sub.alternatives.length > 0 ? (
                                      sub.alternatives.map((cand) => (
                                        <button
                                          key={cand.teacherId}
                                          disabled={!cand.eligible}
                                          onClick={() => handleOverrideSubstitute(sub.id, cand.teacherId)}
                                          className={`w-full text-left p-1.5 rounded-md flex items-center justify-between text-xs transition-colors ${
                                            cand.eligible 
                                              ? "hover:bg-muted cursor-pointer" 
                                              : "opacity-50 cursor-not-allowed bg-muted/20"
                                          } ${cand.teacherId === sub.substituteTeacher?.id ? "bg-primary/10 border border-primary/20" : ""}`}
                                        >
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                              <span className="font-semibold text-foreground">{cand.name}</span>
                                              <Badge className={`text-[8px] h-3 px-1 py-0 ${getCategoryBadgeClass(cand.category)}`}>
                                                {cand.category}
                                              </Badge>
                                            </div>
                                            {!cand.eligible && cand.reason && (
                                              <span className="text-[10px] text-rose-500 line-clamp-1">{cand.reason}</span>
                                            )}
                                          </div>
                                          {cand.eligible && cand.score !== null && (
                                            <span className="font-mono text-[11px] font-bold text-primary">
                                              +{cand.score}
                                            </span>
                                          )}
                                        </button>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground p-2">No other eligible teachers found.</p>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground px-1">
                                      Or Switch to Activity:
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {settings.enabled_activities.map(act => (
                                        <button
                                          key={act}
                                          onClick={() => handleOverrideSubstitute(sub.id, null, true, act)}
                                          className="text-[10px] text-left p-1 rounded hover:bg-amber-500/10 hover:text-amber-600 font-medium truncate"
                                        >
                                          {act}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
                              <CheckCircle className="size-5" />
                            </div>
                            <p className="font-semibold text-sm text-foreground">No Substitutions Needed</p>
                            <p className="text-xs text-muted-foreground text-center">
                              No teacher absence requirements are recorded for {selectedDate}. All scheduled classes proceed normally.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setAbsenceDate(selectedDate || todayStr)
                                setIsMarkModalOpen(true)
                              }}
                              className="mt-2 text-xs gap-1.5"
                            >
                              <Plus className="size-3.5" />
                              Mark a Teacher Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── Sub-view 2: Absent Registry ── */}
          {absentSubTab === "registry" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                  <Input
                    placeholder="Search absent teachers by name, email, employee ID..."
                    value={absentSearch}
                    onChange={(e) => setAbsentSearch(e.target.value)}
                    className="pl-9 bg-card/50 text-xs h-9.5 rounded-lg border-border"
                  />
                </div>

                <div className="w-40">
                  <Select value={absentReasonFilter} onValueChange={setAbsentReasonFilter}>
                    <SelectTrigger className="bg-card/50 text-xs h-9.5 rounded-lg">
                      <SelectValue placeholder="All Reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                      <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                      <SelectItem value="Official Duty">Official Duty</SelectItem>
                      <SelectItem value="Half Day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/20 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground w-[130px]">Employee ID</TableHead>
                      <TableHead className="font-semibold text-foreground">Teacher</TableHead>
                      <TableHead className="font-semibold text-foreground">Category</TableHead>
                      <TableHead className="font-semibold text-foreground">Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Reason</TableHead>
                      <TableHead className="font-semibold text-foreground">Duration</TableHead>
                      <TableHead className="font-semibold text-foreground">Periods Affected</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAbsentRecords.length > 0 ? (
                      filteredAbsentRecords.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                            {record.admissionNumber || "Not Set"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={record.teacherImage || undefined} alt={record.teacherName} />
                                <AvatarFallback className="font-semibold text-xs bg-rose-500/10 text-rose-600">
                                  {getInitials(record.teacherName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-sm">{record.teacherName}</span>
                                <span className="text-[10px] text-muted-foreground">{record.teacherEmail}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`border text-[10px] font-semibold ${getCategoryBadgeClass(record.category)}`}>
                              {record.category || "TGT"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {record.date} ({record.dayOfWeek || ""})
                          </TableCell>
                          <TableCell>
                            <Badge className={`border gap-1 rounded-full text-[10px] font-semibold ${getReasonBadgeClass(record.reason)}`}>
                              {record.reason}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {record.duration}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono font-bold text-xs">
                              {record.affectedPeriodsCount ?? 0} Periods
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkPresent(record.id, record.teacherName)}
                              className="h-7 text-xs gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-colors cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Mark Present
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm font-medium">
                          No absent teacher records for {selectedDate}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── Sub-view 3: Faculty Skills & Category Roster ── */}
          {absentSubTab === "roster" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card/20 overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">Faculty Member</TableHead>
                      <TableHead className="font-semibold text-foreground">Category</TableHead>
                      <TableHead className="font-semibold text-foreground">Activity Skills</TableHead>
                      <TableHead className="font-semibold text-foreground">Availability for Sub</TableHead>
                      <TableHead className="font-semibold text-foreground">Substitutions Handled</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facultyRoster.map((teacher) => (
                      <TableRow key={teacher.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={teacher.image || undefined} alt={teacher.name} />
                              <AvatarFallback className="text-xs font-bold">
                                {getInitials(teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">{teacher.name}</span>
                              <span className="text-[10px] text-muted-foreground">{teacher.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border text-xs font-bold ${getCategoryBadgeClass(teacher.category)}`}>
                            {teacher.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.activitySkills && teacher.activitySkills.length > 0 ? (
                              teacher.activitySkills.map(sk => (
                                <Badge key={sk} variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {sk}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None configured</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {teacher.isAvailableForSubstitution ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                              Available
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-500/15 text-zinc-600 border-zinc-500/30 text-[10px] font-semibold">
                              Unavailable
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          {teacher.totalSubstitutions} classes
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTeacher(teacher)}
                            className="h-7 text-xs cursor-pointer"
                          >
                            Edit Skills
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

        </TabsContent>
      </Tabs>

      {/* ── Dialog: Mark Teacher Absent ── */}
      <Dialog open={isMarkModalOpen} onOpenChange={setIsMarkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <UserX className="h-5 w-5 text-rose-500" />
              Mark Teacher Absent
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Recording an absence automatically detects affected periods and allocates optimal substitutes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMarkAbsentSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-select" className="text-xs font-semibold">
                Select Teacher <span className="text-rose-500">*</span>
              </Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger id="teacher-select" className="text-xs h-9.5 bg-card/50">
                  <SelectValue placeholder="Choose a faculty member..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {initialTeachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id} className="text-xs py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={teacher.image || undefined} alt={teacher.name} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{teacher.name}</span>
                        {teacher.class && teacher.class !== "none" && (
                          <span className="text-[10px] text-muted-foreground">
                            (Class {teacher.class})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="absence-date" className="text-xs font-semibold">
                Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="absence-date"
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="text-xs h-9.5 bg-card/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="absence-reason" className="text-xs font-semibold">
                  Leave Type / Reason <span className="text-rose-500">*</span>
                </Label>
                <Select value={absenceReason} onValueChange={setAbsenceReason}>
                  <SelectTrigger id="absence-reason" className="text-xs h-9.5 bg-card/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Official Duty">Official Duty</SelectItem>
                    <SelectItem value="Half Day">Half Day</SelectItem>
                    <SelectItem value="Unannounced">Unannounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="absence-duration" className="text-xs font-semibold">
                  Duration <span className="text-rose-500">*</span>
                </Label>
                <Select value={absenceDuration} onValueChange={setAbsenceDuration}>
                  <SelectTrigger id="absence-duration" className="text-xs h-9.5 bg-card/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Day">Full Day</SelectItem>
                    <SelectItem value="Half Day (Morning)">Half Day (Morning)</SelectItem>
                    <SelectItem value="Half Day (Afternoon)">Half Day (Afternoon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="absence-remarks" className="text-xs font-semibold">
                Remarks / Notes <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="absence-remarks"
                placeholder="Reason or authorization notes..."
                value={absenceRemarks}
                onChange={(e) => setAbsenceRemarks(e.target.value)}
                className="text-xs bg-card/50 min-h-20 resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMarkModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingAbsence} className="text-xs font-semibold">
                {isSubmittingAbsence ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Allocating Substitutes...
                  </>
                ) : (
                  "Confirm & Allocate"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Substitution Scoring Rules & Settings ── */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sliders className="h-5 w-5 text-primary" />
              Substitution Scoring Rules & Engine Weights
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure candidate ranking weights, priority bonuses, workload penalties, and fallback rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Same Subject Bonus</span>
                  <span className="font-mono text-primary">+{settings.same_subject_score}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.same_subject_score}
                  onChange={(e) => setSettings({ ...settings, same_subject_score: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Same Category Bonus</span>
                  <span className="font-mono text-primary">+{settings.same_category_score}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.same_category_score}
                  onChange={(e) => setSettings({ ...settings, same_category_score: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Same Class Bonus</span>
                  <span className="font-mono text-primary">+{settings.same_class_score}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.same_class_score}
                  onChange={(e) => setSettings({ ...settings, same_class_score: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Same Section Bonus</span>
                  <span className="font-mono text-primary">+{settings.same_section_score}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.same_section_score}
                  onChange={(e) => setSettings({ ...settings, same_section_score: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Matching Activity Skill</span>
                  <span className="font-mono text-primary">+{settings.matching_activity_skill_score}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.matching_activity_skill_score}
                  onChange={(e) => setSettings({ ...settings, matching_activity_skill_score: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Low Workload Bonus</span>
                  <span className="font-mono text-primary">+{settings.low_workload_bonus}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.low_workload_bonus}
                  onChange={(e) => setSettings({ ...settings, low_workload_bonus: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Workload Penalty per Sub</span>
                  <span className="font-mono text-rose-500">-{settings.workload_penalty_per_sub}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.workload_penalty_per_sub}
                  onChange={(e) => setSettings({ ...settings, workload_penalty_per_sub: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>High Workload Penalty</span>
                  <span className="font-mono text-rose-500">-{settings.high_workload_penalty}</span>
                </Label>
                <Input
                  type="number"
                  value={settings.high_workload_penalty}
                  onChange={(e) => setSettings({ ...settings, high_workload_penalty: Number(e.target.value) })}
                  className="text-xs h-8.5"
                />
              </div>
            </div>

            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Activity Fallback Threshold</Label>
                  <p className="text-[11px] text-muted-foreground">
                    If candidate suitability is below this score without subject match, trigger activity fallback.
                  </p>
                </div>
                <Input
                  type="number"
                  value={settings.activity_fallback_threshold}
                  onChange={(e) => setSettings({ ...settings, activity_fallback_threshold: Number(e.target.value) })}
                  className="w-20 text-xs h-8"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Allow Cross-Category Substitution</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Strictly enforce PRT / TGT / PGT barriers if turned off.
                  </p>
                </div>
                <Switch
                  checked={settings.allow_cross_category}
                  onCheckedChange={(val) => setSettings({ ...settings, allow_cross_category: val })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="text-xs font-semibold">
                Save & Apply Rules
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Teacher Skills & Category ── */}
      {editingTeacher && (
        <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Faculty Profile: {editingTeacher.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set category (PRT/TGT/PGT) and activity capabilities for substitution matching.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select
                  value={editingTeacher.category}
                  onValueChange={(val) => setEditingTeacher({ ...editingTeacher, category: val })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRT">PRT (Primary Teacher - Classes Nursery to 5)</SelectItem>
                    <SelectItem value="TGT">TGT (Trained Graduate Teacher - Classes 6 to 10)</SelectItem>
                    <SelectItem value="PGT">PGT (Post Graduate Teacher - Classes 11 & 12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Activity Skills</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Games / Sports", "Arts", "Music", "Library", "Computer"].map((skill) => {
                    const hasSkill = editingTeacher.activitySkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const updated = hasSkill
                            ? editingTeacher.activitySkills.filter(s => s !== skill)
                            : [...editingTeacher.activitySkills, skill]
                          setEditingTeacher({ ...editingTeacher, activitySkills: updated })
                        }}
                        className={`text-xs p-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          hasSkill 
                            ? "border-primary bg-primary/10 text-primary font-bold" 
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span>{skill}</span>
                        {hasSkill && <Check className="size-3.5 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs font-semibold">Available for Substitutions</Label>
                <Switch
                  checked={editingTeacher.isAvailableForSubstitution}
                  onCheckedChange={(val) => setEditingTeacher({ ...editingTeacher, isAvailableForSubstitution: val })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingTeacher(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveTeacherSubstitutionProfile(
                  editingTeacher.id,
                  editingTeacher.category,
                  editingTeacher.activitySkills,
                  editingTeacher.isAvailableForSubstitution
                )}
                className="text-xs font-semibold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
