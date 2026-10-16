"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  CalendarDays,
  Clock,
  UserX,
  Users,
  Search,
  Check,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  GitMerge,
  UserCheck,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface SubstituteTeacher {
  id: string
  name: string
  email: string
  image: string | null
  wingId: string
}

interface MergedClassInfo {
  timetableId: string
  class: string
  section: string
  subject: string
  teacherName: string
}

interface CellSubstitution {
  id: string
  status: "AUTO_ASSIGNED" | "MANUAL_OVERRIDE" | "MERGED" | "UNASSIGNED"
  substituteTeacher: SubstituteTeacher | null
  mergedWith: MergedClassInfo | null
  notes?: string | null
}

interface TimetableSlot {
  id: string
  class: string
  section: string
  subject: string
}

interface PeriodCellData {
  periodNumber: number
  isOutOfScope: boolean
  hasScheduledClass: boolean
  timetableSlot: TimetableSlot | null
  substitution: CellSubstitution | null
}

interface AbsentTeacherRow {
  absenceId: string
  teacher: {
    id: string
    name: string
    email: string
    image: string | null
    wingId: string
  }
  absence: {
    reason: string
    duration: string
    remarks?: string | null
  }
  periods: PeriodCellData[]
}

interface StandbyTeacherCandidate {
  id: string
  name: string
  email: string
  image: string | null
  wingId: string
  dailyFreeCount: number
  weeklyProxyCount: number
}

interface MergeCandidateItem {
  timetableId: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  class: string
  section: string
  subject: string
  wingId: string
}

function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getInitials(name?: string): string {
  if (!name) return "T"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function SubstitutionsDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date") || getTodayString()

  // Selected date state
  const [selectedDate, setSelectedDate] = React.useState<string>(dateParam)

  // Matrix data state
  const [isLoading, setIsLoading] = React.useState(true)
  const [weekdayName, setWeekdayName] = React.useState("")
  const [absentTeachers, setAbsentTeachers] = React.useState<AbsentTeacherRow[]>([])
  const [stats, setStats] = React.useState({
    totalAbsent: 0,
    totalSubstitutionsRequired: 0,
    autoAssignedCount: 0,
    manualOverrideCount: 0,
    mergedCount: 0,
    unassignedCount: 0,
  })

  // Selected cell for Drawer
  const [selectedCell, setSelectedCell] = React.useState<{
    teacherRow: AbsentTeacherRow
    cellData: PeriodCellData
  } | null>(null)

  // Drawer candidates data
  const [isLoadingCandidates, setIsLoadingCandidates] = React.useState(false)
  const [standbyTeachers, setStandbyTeachers] = React.useState<StandbyTeacherCandidate[]>([])
  const [mergeCandidates, setMergeCandidates] = React.useState<MergeCandidateItem[]>([])
  const [candidateSearch, setCandidateSearch] = React.useState("")
  const [isMutating, setIsMutating] = React.useState(false)

  // Load matrix data
  const loadMatrixData = React.useCallback(async (targetDate: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/substitutions?date=${encodeURIComponent(targetDate)}`)
      const data = await res.json()
      if (data.success) {
        setWeekdayName(data.dayOfWeek)
        setAbsentTeachers(data.absentTeachers || [])
        setStats(data.stats || {
          totalAbsent: 0,
          totalSubstitutionsRequired: 0,
          autoAssignedCount: 0,
          manualOverrideCount: 0,
          mergedCount: 0,
          unassignedCount: 0,
        })
      } else {
        toast.error(data.error || "Failed to load substitutions")
      }
    } catch (err: any) {
      console.error("Error loading matrix:", err)
      toast.error("Could not fetch substitution schedule")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sync date param
  React.useEffect(() => {
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam)
    }
  }, [dateParam])

  React.useEffect(() => {
    loadMatrixData(selectedDate)
    setSelectedCell(null)
  }, [selectedDate, loadMatrixData])

  // Load drawer candidates when a valid cell is selected
  React.useEffect(() => {
    if (!selectedCell || !selectedCell.cellData.timetableSlot) {
      setStandbyTeachers([])
      setMergeCandidates([])
      return
    }

    const { teacherRow, cellData } = selectedCell
    const periodNumber = cellData.periodNumber
    const absentTeacherId = teacherRow.teacher.id
    const currentClass = cellData.timetableSlot?.class || ""
    const currentSubId = cellData.substitution?.id || ""

    async function fetchCandidates() {
      setIsLoadingCandidates(true)
      try {
        const url = `/api/substitutions/candidates?date=${encodeURIComponent(
          selectedDate
        )}&periodNumber=${periodNumber}&absentTeacherId=${encodeURIComponent(
          absentTeacherId
        )}&class=${encodeURIComponent(currentClass)}&substitutionId=${encodeURIComponent(
          currentSubId
        )}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.success) {
          setStandbyTeachers(data.standbyTeachers || [])
          setMergeCandidates(data.mergeCandidates || [])
        } else {
          toast.error(data.error || "Failed to load candidate teachers")
        }
      } catch (err: any) {
        console.error("Error loading candidates:", err)
        toast.error("Could not load candidates")
      } finally {
        setIsLoadingCandidates(false)
      }
    }

    fetchCandidates()
    setCandidateSearch("")
  }, [selectedCell, selectedDate])

  // Cell selection handler
  const handleSelectCell = (teacherRow: AbsentTeacherRow, cellData: PeriodCellData) => {
    // Disabled / out-of-scope or empty classes cannot be overridden
    if (cellData.isOutOfScope || !cellData.hasScheduledClass) {
      return
    }

    // Toggle or select
    if (
      selectedCell?.teacherRow.teacher.id === teacherRow.teacher.id &&
      selectedCell?.cellData.periodNumber === cellData.periodNumber
    ) {
      setSelectedCell(null)
    } else {
      setSelectedCell({ teacherRow, cellData })
    }
  }

  // Optimistic Mutation: Assign Standby Teacher
  const handleAssignSubstitute = async (substitute: StandbyTeacherCandidate) => {
    if (!selectedCell || !selectedCell.cellData.substitution?.id) return

    const subId = selectedCell.cellData.substitution.id
    const originalTeacherId = selectedCell.teacherRow.teacher.id
    const periodNumber = selectedCell.cellData.periodNumber

    // Optimistic UI update
    setAbsentTeachers((prev) =>
      prev.map((row) => {
        if (row.teacher.id === originalTeacherId) {
          return {
            ...row,
            periods: row.periods.map((p) => {
              if (p.periodNumber === periodNumber && p.substitution) {
                return {
                  ...p,
                  substitution: {
                    ...p.substitution,
                    status: "MANUAL_OVERRIDE",
                    substituteTeacher: {
                      id: substitute.id,
                      name: substitute.name,
                      email: substitute.email,
                      image: substitute.image,
                      wingId: substitute.wingId,
                    },
                    mergedWith: null,
                  },
                }
              }
              return p
            }),
          }
        }
        return row
      })
    )

    // Update selectedCell state optimistically
    setSelectedCell((prev) => {
      if (!prev) return null
      return {
        ...prev,
        cellData: {
          ...prev.cellData,
          substitution: {
            ...prev.cellData.substitution!,
            status: "MANUAL_OVERRIDE",
            substituteTeacher: {
              id: substitute.id,
              name: substitute.name,
              email: substitute.email,
              image: substitute.image,
              wingId: substitute.wingId,
            },
            mergedWith: null,
          },
        },
      }
    })

    // Decrement candidate's available count in local list
    setStandbyTeachers((prev) =>
      prev.map((c) =>
        c.id === substitute.id
          ? {
              ...c,
              dailyFreeCount: Math.max(0, c.dailyFreeCount - 1),
              weeklyProxyCount: c.weeklyProxyCount + 1,
            }
          : c
      )
    )

    // API Call
    setIsMutating(true)
    try {
      const res = await fetch(`/api/substitutions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          substituteTeacherId: substitute.id,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign substitute")
      }
      toast.success(`Assigned ${substitute.name} for Period ${periodNumber}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update substitute")
      // Revert by re-fetching
      loadMatrixData(selectedDate)
    } finally {
      setIsMutating(false)
    }
  }

  // Optimistic Mutation: Merge Class
  const handleMergeClass = async (candidate: MergeCandidateItem) => {
    if (!selectedCell || !selectedCell.cellData.substitution?.id) return

    const subId = selectedCell.cellData.substitution.id
    const originalTeacherId = selectedCell.teacherRow.teacher.id
    const periodNumber = selectedCell.cellData.periodNumber

    // Optimistic UI update
    setAbsentTeachers((prev) =>
      prev.map((row) => {
        if (row.teacher.id === originalTeacherId) {
          return {
            ...row,
            periods: row.periods.map((p) => {
              if (p.periodNumber === periodNumber && p.substitution) {
                return {
                  ...p,
                  substitution: {
                    ...p.substitution,
                    status: "MERGED",
                    substituteTeacher: null,
                    mergedWith: {
                      timetableId: candidate.timetableId,
                      class: candidate.class,
                      section: candidate.section,
                      subject: candidate.subject,
                      teacherName: candidate.teacherName,
                    },
                  },
                }
              }
              return p
            }),
          }
        }
        return row
      })
    )

    // Update selectedCell
    setSelectedCell((prev) => {
      if (!prev) return null
      return {
        ...prev,
        cellData: {
          ...prev.cellData,
          substitution: {
            ...prev.cellData.substitution!,
            status: "MERGED",
            substituteTeacher: null,
            mergedWith: {
              timetableId: candidate.timetableId,
              class: candidate.class,
              section: candidate.section,
              subject: candidate.subject,
              teacherName: candidate.teacherName,
            },
          },
        },
      }
    })

    // API Call
    setIsMutating(true)
    try {
      const res = await fetch(`/api/substitutions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "merge",
          mergedWithTimetableId: candidate.timetableId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to merge class")
      }
      toast.success(
        `Merged with Class ${candidate.class}-${candidate.section} (${candidate.teacherName})`
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to merge class")
      loadMatrixData(selectedDate)
    } finally {
      setIsMutating(false)
    }
  }

  // Filter candidates in Drawer
  const filteredStandbyTeachers = standbyTeachers.filter((t) => {
    const q = candidateSearch.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.wingId.toLowerCase().includes(q)
  })

  const filteredMergeCandidates = mergeCandidates.filter((m) => {
    const q = candidateSearch.toLowerCase()
    return (
      m.teacherName.toLowerCase().includes(q) ||
      m.class.toLowerCase().includes(q) ||
      m.section.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full font-sans animate-in fade-in duration-300">
      
      {/* ── Top Header & Global Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/timetable/absences?date=${encodeURIComponent(selectedDate)}`)}
              className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground"
              title="Back to Mark Absences"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Substitution Dashboard
                </h1>
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                  {weekdayName || "Schedule"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Visual timetable matrix for period-by-period substitution management and live manual override.
              </p>
            </div>
          </div>
        </div>

        {/* Global Date & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-card border border-border/70 rounded-xl px-3 py-1.5 shadow-2xs">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Target Date
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  router.push(`/timetable/substitutions?date=${encodeURIComponent(e.target.value)}`)
                }}
                className="h-7 px-1 py-0 text-xs font-semibold bg-transparent border-0 focus-visible:ring-0 shadow-none cursor-pointer w-34"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMatrixData(selectedDate)}
            disabled={isLoading}
            className="h-10 text-xs font-semibold rounded-xl cursor-pointer gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => router.push(`/timetable/absences?date=${encodeURIComponent(selectedDate)}`)}
            className="h-10 text-xs font-semibold rounded-xl cursor-pointer gap-1.5 bg-primary text-primary-foreground shadow-2xs"
          >
            <UserX className="h-3.5 w-3.5" />
            Mark More Absences
          </Button>
        </div>
      </div>

      {/* ── Status Metrics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 border-border/60 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Absent Faculty</span>
          <div className="text-xl font-bold text-foreground mt-0.5">{stats.totalAbsent}</div>
        </Card>

        <Card className="p-3 border-border/60 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Needed Substitutions</span>
          <div className="text-xl font-bold text-foreground mt-0.5">{stats.totalSubstitutionsRequired}</div>
        </Card>

        <Card className="p-3 border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Auto-Assigned</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.autoAssignedCount}</div>
        </Card>

        <Card className="p-3 border-amber-500/20 bg-amber-500/5 shadow-2xs">
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Manual Override</span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.manualOverrideCount}</div>
        </Card>

        <Card className="p-3 border-purple-500/20 bg-purple-500/5 shadow-2xs">
          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase">Merged Sections</span>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{stats.mergedCount}</div>
        </Card>

        <Card className="p-3 border-rose-500/20 bg-rose-500/5 shadow-2xs">
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Pending / Unassigned</span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.unassignedCount}</div>
        </Card>
      </div>

      {/* ── Responsive Two-Column Layout ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* ── 1. Main View: Substitution Matrix Table (Left column - wide) ── */}
        <div className="flex-1 w-full min-w-0">
          <Card className="border-border/70 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 px-4 sm:px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Daily Substitution Matrix</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalSubstitutionsRequired} slots required
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Click on any active substitution cell to inspect candidate standby teachers or merge sections.
                </CardDescription>
              </div>

              {/* Legend */}
              <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Auto-Assigned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Manual Override
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Merged
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unassigned
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm font-semibold text-foreground">Loading Substitution Schedule...</p>
                  <p className="text-xs text-muted-foreground">Gathering absent faculty and matching standby slots</p>
                </div>
              ) : absentTeachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                    <UserCheck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">No Teacher Absences Marked</h3>
                  <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
                    There are currently no recorded faculty absences for {selectedDate}. To generate a substitution matrix, mark absent teachers first.
                  </p>
                  <Button
                    onClick={() => router.push(`/timetable/absences?date=${encodeURIComponent(selectedDate)}`)}
                    className="text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5"
                  >
                    <UserX className="h-4 w-4" />
                    Mark Absences for {selectedDate}
                  </Button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 w-52 shrink-0">Absent Teacher</th>
                      {Array.from({ length: 8 }, (_, i) => (
                        <th key={i + 1} className="py-3 px-2 text-center w-28">
                          Period {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs">
                    {absentTeachers.map((row) => (
                      <tr key={row.absenceId} className="hover:bg-muted/15 transition-colors">
                        
                        {/* Absent Teacher Column */}
                        <td className="py-3.5 px-4 align-top bg-card/60 border-r border-border/40">
                          <div className="flex items-start gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0 mt-0.5 border border-border/60">
                              <AvatarImage src={row.teacher.image || undefined} />
                              <AvatarFallback className="text-[10px] font-bold">
                                {getInitials(row.teacher.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground text-xs truncate">
                                {row.teacher.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {row.teacher.wingId} Wing
                              </div>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                                  {row.absence.reason}
                                </Badge>
                                {row.absence.duration !== "Full Day" && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary bg-primary/10">
                                    {row.absence.duration.replace("Half Day ", "")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 8 Period Columns */}
                        {row.periods.map((cell) => {
                          const isSelected =
                            selectedCell?.teacherRow.teacher.id === row.teacher.id &&
                            selectedCell?.cellData.periodNumber === cell.periodNumber

                          // Cell State: Out of Scope (Half Day)
                          if (cell.isOutOfScope) {
                            return (
                              <td
                                key={cell.periodNumber}
                                className="p-1.5 align-middle text-center bg-muted/40 opacity-40 select-none border-r border-border/30 cursor-not-allowed"
                                title="Out of scope for this leave duration"
                              >
                                <div className="h-20 flex items-center justify-center rounded-lg border border-dashed border-border/40">
                                  <span className="text-[10px] font-medium text-muted-foreground italic">
                                    Off Duty
                                  </span>
                                </div>
                              </td>
                            )
                          }

                          // Cell State: Empty / No teaching assigned in timetable
                          if (!cell.hasScheduledClass) {
                            return (
                              <td
                                key={cell.periodNumber}
                                className="p-1.5 align-middle text-center border-r border-border/30"
                              >
                                <div className="h-20 flex items-center justify-center rounded-lg bg-muted/10 text-muted-foreground/40 font-mono text-sm">
                                  —
                                </div>
                              </td>
                            )
                          }

                          // Cell State: Substitution Required
                          const sub = cell.substitution
                          const status = sub?.status || "UNASSIGNED"

                          let statusBadge = null
                          let cellBgClass = "bg-card hover:bg-muted/30"

                          if (status === "AUTO_ASSIGNED") {
                            cellBgClass = "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30"
                            statusBadge = (
                              <Badge className="text-[9px] h-4 px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold">
                                AUTO_ASSIGNED
                              </Badge>
                            )
                          } else if (status === "MANUAL_OVERRIDE") {
                            cellBgClass = "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30"
                            statusBadge = (
                              <Badge className="text-[9px] h-4 px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold">
                                MANUAL_OVERRIDE
                              </Badge>
                            )
                          } else if (status === "MERGED") {
                            cellBgClass = "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/30"
                            statusBadge = (
                              <Badge className="text-[9px] h-4 px-1.5 py-0 bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold">
                                MERGED
                              </Badge>
                            )
                          } else {
                            cellBgClass = "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/30"
                            statusBadge = (
                              <Badge className="text-[9px] h-4 px-1.5 py-0 bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold">
                                UNASSIGNED
                              </Badge>
                            )
                          }

                          return (
                            <td
                              key={cell.periodNumber}
                              className="p-1.5 align-top border-r border-border/30 cursor-pointer"
                              onClick={() => handleSelectCell(row, cell)}
                            >
                              <div
                                className={`h-22 rounded-xl p-2 border flex flex-col justify-between transition-all duration-150 ${cellBgClass} ${
                                  isSelected
                                    ? "ring-2 ring-primary border-primary shadow-sm scale-[0.98]"
                                    : ""
                                }`}
                              >
                                {/* Top: Class & Subject */}
                                <div>
                                  <div className="flex items-center justify-between gap-1 leading-tight">
                                    <span className="font-extrabold text-foreground text-xs">
                                      {cell.timetableSlot?.class}-{cell.timetableSlot?.section}
                                    </span>
                                    {statusBadge}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={cell.timetableSlot?.subject}>
                                    {cell.timetableSlot?.subject}
                                  </div>
                                </div>

                                {/* Bottom: Assigned Substitute or Merged Class */}
                                <div className="mt-1 pt-1 border-t border-border/40 text-[10px]">
                                  {status === "MERGED" && sub?.mergedWith ? (
                                    <div className="text-purple-600 dark:text-purple-400 font-semibold truncate flex items-center gap-1">
                                      <GitMerge className="h-3 w-3 shrink-0" />
                                      <span>Merged: {sub.mergedWith.class}-{sub.mergedWith.section}</span>
                                    </div>
                                  ) : sub?.substituteTeacher ? (
                                    <div className="font-semibold text-foreground truncate flex items-center gap-1">
                                      <UserCheck className="h-3 w-3 shrink-0 text-primary" />
                                      <span className="truncate">{sub.substituteTeacher.name}</span>
                                    </div>
                                  ) : (
                                    <div className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3 shrink-0" />
                                      <span>Assign teacher</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 2. Right Pane: Action & Reassignment Drawer (Sticky Right Pane) ── */}
        <div className="w-full xl:w-96 shrink-0 xl:sticky xl:top-6">
          <Card className="border-border/70 shadow-xs rounded-2xl overflow-hidden flex flex-col">
            
            {!selectedCell ? (
              // Empty State
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                  <Clock className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Select a Period to Manage
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Click on any active substitution slot in the matrix to view eligible standby teachers or merge sections.
                </p>
              </div>
            ) : (
              // Active Cell Drawer Content
              <div className="flex flex-col">
                {/* Drawer Header */}
                <CardHeader className="bg-muted/30 border-b border-border/50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] font-bold bg-primary text-primary-foreground">
                          Period {selectedCell.cellData.periodNumber}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {selectedCell.teacherRow.teacher.wingId} Wing
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground mt-1.5 leading-snug">
                        Class {selectedCell.cellData.timetableSlot?.class}-{selectedCell.cellData.timetableSlot?.section}
                        {" • "}
                        {selectedCell.cellData.timetableSlot?.subject}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Absent: <strong className="text-foreground">{selectedCell.teacherRow.teacher.name}</strong> ({selectedCell.teacherRow.absence.reason})
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCell(null)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Current Status banner */}
                  <div className="mt-3 p-2 rounded-xl bg-card border border-border/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">Current Status:</span>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {selectedCell.cellData.substitution?.status || "UNASSIGNED"}
                    </Badge>
                  </div>

                  {/* Quick Search Bar */}
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search teacher..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-xl bg-card/60"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto">
                  
                  {/* ── Section 1: Available Standby Teachers ── */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Available Standby Teachers
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {filteredStandbyTeachers.length}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Free in Period {selectedCell.cellData.periodNumber} within {selectedCell.teacherRow.teacher.wingId} Wing.
                    </p>

                    {isLoadingCandidates ? (
                      <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Loading available teachers...
                      </div>
                    ) : filteredStandbyTeachers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
                        No free standby teachers found in this wing for Period {selectedCell.cellData.periodNumber}.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredStandbyTeachers.map((t) => {
                          const isCurrentlyAssigned =
                            selectedCell.cellData.substitution?.substituteTeacher?.id === t.id

                          return (
                            <div
                              key={t.id}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                isCurrentlyAssigned
                                  ? "bg-primary/10 border-primary/40 shadow-xs"
                                  : "bg-card/70 border-border/70 hover:border-primary/40 hover:bg-card"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar className="h-7 w-7 shrink-0 border border-border/60">
                                  <AvatarImage src={t.image || undefined} />
                                  <AvatarFallback className="text-[9px]">
                                    {getInitials(t.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-foreground truncate">
                                    {t.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {t.dailyFreeCount} free today
                                    </span>
                                    <span>•</span>
                                    <span>{t.weeklyProxyCount} proxies</span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                disabled={isMutating || isCurrentlyAssigned}
                                onClick={() => handleAssignSubstitute(t)}
                                className={`h-7 px-3 text-[11px] font-bold rounded-lg cursor-pointer shrink-0 ${
                                  isCurrentlyAssigned
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }`}
                              >
                                {isCurrentlyAssigned ? "Assigned" : "Assign"}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* ── Section 2: Merge Candidates ── */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <GitMerge className="h-3.5 w-3.5 text-purple-500" />
                        Merge Candidates
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {filteredMergeCandidates.length}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Faculty teaching compatible classes in Period {selectedCell.cellData.periodNumber} to combine sections.
                    </p>

                    {isLoadingCandidates ? (
                      <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Evaluating merge candidates...
                      </div>
                    ) : filteredMergeCandidates.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
                        No compatible section teachers active in Period {selectedCell.cellData.periodNumber}.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredMergeCandidates.map((m) => {
                          const isCurrentlyMerged =
                            selectedCell.cellData.substitution?.mergedWith?.timetableId === m.timetableId

                          return (
                            <div
                              key={m.timetableId}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                isCurrentlyMerged
                                  ? "bg-purple-500/10 border-purple-500/40 shadow-xs"
                                  : "bg-card/70 border-border/70 hover:border-purple-500/40 hover:bg-card"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-foreground truncate">
                                  {m.teacherName}
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-purple-500/30 text-purple-600 dark:text-purple-400">
                                    Class {m.class}-{m.section}
                                  </Badge>
                                  <span className="truncate">{m.subject}</span>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant={isCurrentlyMerged ? "secondary" : "outline"}
                                disabled={isMutating || isCurrentlyMerged}
                                onClick={() => handleMergeClass(m)}
                                className={`h-7 px-3 text-[11px] font-bold rounded-lg cursor-pointer shrink-0 ${
                                  isCurrentlyMerged
                                    ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                    : "hover:bg-purple-500/10 hover:text-purple-600 border-border/80"
                                }`}
                              >
                                {isCurrentlyMerged ? "Merged" : "Merge"}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </CardContent>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
