"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CalendarIcon,
  Plus,
  Trash2,
  UserX,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Search,
  Check,
  ChevronsUpDown,
  CalendarDays,
  Clock,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface TeacherItem {
  id: string
  name: string
  email: string
  image: string | null
  wingId: string
  dailyFreeCount: number
  weeklyProxyCount: number
  designation?: string
  category?: string
  assignedClass?: string | null
}

interface AbsenceRow {
  rowId: string
  teacherId: string
  reason: string
  duration: string
  notes: string
}

const LEAVE_REASONS = [
  "Sick Leave",
  "Casual Leave",
  "Emergency Leave",
  "Official Duty",
  "Half Day",
  "Unannounced",
]

const DURATIONS = [
  { label: "Full Day (Periods 1-8)", value: "Full Day", periods: "Periods 1-8" },
  { label: "Half Day (Morning) (Periods 1-4)", value: "Half Day (Morning)", periods: "Periods 1-4" },
  { label: "Half Day (Afternoon) (Periods 5-8)", value: "Half Day (Afternoon)", periods: "Periods 5-8" },
]

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

export default function MarkTeacherAbsencesPage() {
  const router = useRouter()

  // Global state
  const [selectedDate, setSelectedDate] = React.useState<string>(getTodayString)
  const [teachers, setTeachers] = React.useState<TeacherItem[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Repeater rows
  const [rows, setRows] = React.useState<AbsenceRow[]>([
    {
      rowId: `row_${Date.now()}_1`,
      teacherId: "",
      reason: "Sick Leave",
      duration: "Full Day",
      notes: "",
    },
  ])

  // Teacher search states per row: rowId -> open/search string
  const [openComboboxId, setOpenComboboxId] = React.useState<string | null>(null)
  const [teacherSearch, setTeacherSearch] = React.useState("")

  // Fetch active teachers
  React.useEffect(() => {
    async function loadTeachers() {
      setIsLoadingTeachers(true)
      try {
        const res = await fetch("/api/absences/teachers")
        const data = await res.json()
        if (data.success && Array.isArray(data.teachers)) {
          setTeachers(data.teachers)
        } else {
          toast.error("Failed to load teachers list")
        }
      } catch (err: any) {
        console.error("Error loading teachers:", err)
        toast.error("Could not load faculty members")
      } finally {
        setIsLoadingTeachers(false)
      }
    }
    loadTeachers()
  }, [])

  // Format date display
  const dateFormatted = React.useMemo(() => {
    try {
      const dt = new Date(`${selectedDate}T00:00:00`)
      return dt.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return selectedDate
    }
  }, [selectedDate])

  const weekdayName = React.useMemo(() => {
    try {
      const dt = new Date(`${selectedDate}T00:00:00`)
      return dt.toLocaleDateString("en-US", { weekday: "long" })
    } catch {
      return ""
    }
  }, [selectedDate])

  // Row operations
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: `row_${Date.now()}_${prev.length + 1}`,
        teacherId: "",
        reason: "Sick Leave",
        duration: "Full Day",
        notes: "",
      },
    ])
  }

  const handleRemoveRow = (rowId: string) => {
    if (rows.length === 1) {
      // Keep at least one row, just clear it
      setRows([
        {
          rowId: `row_${Date.now()}`,
          teacherId: "",
          reason: "Sick Leave",
          duration: "Full Day",
          notes: "",
        },
      ])
      return
    }
    setRows((prev) => prev.filter((r) => r.rowId !== rowId))
  }

  const handleUpdateRow = (rowId: string, field: keyof AbsenceRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId === rowId) {
          // If reason is Half Day, adjust default duration if appropriate
          if (field === "reason" && value === "Half Day" && r.duration === "Full Day") {
            return { ...r, [field]: value, duration: "Half Day (Morning)" }
          }
          return { ...r, [field]: value }
        }
        return r
      })
    )
  }

  // Submission handler
  const handleSubmit = async () => {
    // 1. Validation
    if (!selectedDate) {
      toast.error("Please select a date for the absences")
      return
    }

    if (rows.length === 0) {
      toast.error("Please add at least one teacher absence")
      return
    }

    // Check that every row has a teacher selected
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].teacherId) {
        toast.error(`Please select a teacher in row #${i + 1}`)
        return
      }
    }

    // Check for duplicate teachers
    const selectedTeacherIds = rows.map((r) => r.teacherId)
    const duplicates = selectedTeacherIds.filter(
      (id, index) => selectedTeacherIds.indexOf(id) !== index
    )
    if (duplicates.length > 0) {
      const dupTeacher = teachers.find((t) => t.id === duplicates[0])
      toast.error(
        `Teacher "${dupTeacher?.name || 'Selected faculty'}" is duplicated. Please remove the duplicate entry.`
      )
      return
    }

    // 2. Execute POST /api/absences/batch
    setIsSubmitting(true)
    try {
      const payload = {
        date: selectedDate,
        absences: rows.map((r) => ({
          teacherId: r.teacherId,
          reason: r.reason,
          duration: r.duration,
          notes: r.notes.trim() || undefined,
        })),
      }

      const res = await fetch("/api/absences/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record absences")
      }

      toast.success(
        `Absences recorded! Auto-assigned substitutions generated for ${data.count} teacher(s).`
      )

      // 3. Navigate to Substitution Dashboard
      router.push(`/timetable/substitutions?date=${encodeURIComponent(selectedDate)}`)
    } catch (err: any) {
      console.error("Error submitting absences:", err)
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set of selected teacher IDs to indicate in combobox
  const selectedTeacherIdsSet = React.useMemo(() => {
    return new Set(rows.map((r) => r.teacherId).filter(Boolean))
  }, [rows])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans animate-in fade-in duration-300">
      
      {/* ── 1. Page Header & Global Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Mark Teacher Absences
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Record planned or unannounced absences to automatically calculate timetable proxy requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Global Date Selector */}
          <div className="flex items-center gap-2 bg-card border border-border/70 rounded-xl px-3 py-1.5 shadow-2xs">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Absence Date ({weekdayName})
              </span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-7 px-1 py-0 text-xs font-semibold bg-transparent border-0 focus-visible:ring-0 shadow-none cursor-pointer w-34"
              />
            </div>
          </div>

          {/* Quick link to existing dashboard for selected date */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/timetable/substitutions?date=${encodeURIComponent(selectedDate)}`)}
            className="h-10 text-xs font-semibold rounded-xl cursor-pointer gap-1.5"
          >
            <span>View Substitutions</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/80 leading-relaxed">
          <p className="font-semibold text-foreground">
            Session Date: {dateFormatted} ({weekdayName})
          </p>
          <p className="text-muted-foreground mt-0.5">
            All absent teachers in this batch will be evaluated simultaneously. The proxy engine will automatically assign available faculty from the same wing who are free during affected periods.
          </p>
        </div>
      </div>

      {/* ── 2. Dynamic Absence Form (Multi-Row Repeater) ── */}
      <Card className="border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Absent Faculty Roster
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Specify affected periods, leave reasons, and coordinator remarks for each teacher.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
              {rows.length} {rows.length === 1 ? "Teacher" : "Teachers"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {rows.map((row, index) => {
            const selectedTeacher = teachers.find((t) => t.id === row.teacherId)
            const isComboboxOpen = openComboboxId === row.rowId

            const filteredTeachers = teachers.filter((t) => {
              const query = teacherSearch.toLowerCase()
              return (
                t.name.toLowerCase().includes(query) ||
                t.email.toLowerCase().includes(query) ||
                t.wingId.toLowerCase().includes(query)
              )
            })

            return (
              <div
                key={row.rowId}
                className="group relative bg-card border border-border/70 hover:border-primary/40 rounded-xl p-4 transition-all duration-150 shadow-2xs space-y-3"
              >
                {/* Row Header Indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {selectedTeacher ? selectedTeacher.name : "Select Faculty Member"}
                    </span>
                    {selectedTeacher && (
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 py-0">
                        {selectedTeacher.wingId} Wing
                      </Badge>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(row.rowId)}
                    disabled={rows.length === 1 && !row.teacherId}
                    className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                    title="Remove this teacher"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Form Row Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-start">
                  
                  {/* 1. Teacher Name (Searchable Combobox) */}
                  <div className="lg:col-span-4 space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Teacher Name <span className="text-rose-500">*</span></span>
                      {selectedTeacher && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {selectedTeacher.dailyFreeCount} free today
                        </span>
                      )}
                    </Label>

                    <Popover
                      open={isComboboxOpen}
                      onOpenChange={(open) => {
                        setOpenComboboxId(open ? row.rowId : null)
                        if (open) setTeacherSearch("")
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isComboboxOpen}
                          className="w-full justify-between h-9 text-xs px-2.5 font-normal bg-card/60 rounded-lg border-border/70 hover:bg-muted/40 cursor-pointer text-left"
                        >
                          {selectedTeacher ? (
                            <div className="flex items-center gap-2 truncate">
                              <Avatar className="h-5 w-5 shrink-0">
                                <AvatarImage src={selectedTeacher.image || undefined} />
                                <AvatarFallback className="text-[9px]">
                                  {getInitials(selectedTeacher.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-foreground truncate">
                                {selectedTeacher.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Select a teacher...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-80 p-0 shadow-lg rounded-xl" align="start">
                        <div className="p-2 border-b border-border/50">
                          <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg">
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <input
                              type="text"
                              placeholder="Search teacher by name or wing..."
                              value={teacherSearch}
                              onChange={(e) => setTeacherSearch(e.target.value)}
                              className="w-full bg-transparent text-xs focus:outline-hidden"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                          {isLoadingTeachers ? (
                            <div className="flex items-center justify-center p-4 text-xs text-muted-foreground gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              Loading teachers...
                            </div>
                          ) : filteredTeachers.length === 0 ? (
                            <p className="p-4 text-center text-xs text-muted-foreground">
                              No teachers found.
                            </p>
                          ) : (
                            filteredTeachers.map((t) => {
                              const isSelected = row.teacherId === t.id
                              const isAlreadyChosen = selectedTeacherIdsSet.has(t.id) && !isSelected

                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateRow(row.rowId, "teacherId", t.id)
                                    setOpenComboboxId(null)
                                  }}
                                  className={`w-full flex items-center justify-between p-2 text-left rounded-lg text-xs transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : isAlreadyChosen
                                      ? "opacity-50 hover:bg-muted/40"
                                      : "hover:bg-muted/60 text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={t.image || undefined} />
                                      <AvatarFallback className="text-[10px]">
                                        {getInitials(t.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                      <div className="font-semibold leading-tight truncate">
                                        {t.name}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground truncate">
                                        {t.wingId} Wing • {t.dailyFreeCount} free today
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {isAlreadyChosen && (
                                      <span className="text-[9px] text-amber-600 dark:text-amber-400">
                                        Added
                                      </span>
                                    )}
                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* 2. Leave Reason */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Leave Reason <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={row.reason}
                      onValueChange={(val) => handleUpdateRow(row.rowId, "reason", val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-card/60 rounded-lg border-border/70 cursor-pointer">
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAVE_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason} className="text-xs cursor-pointer">
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Duration */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Duration <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={row.duration}
                      onValueChange={(val) => handleUpdateRow(row.rowId, "duration", val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-card/60 rounded-lg border-border/70 cursor-pointer">
                        <SelectValue placeholder="Select duration..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((dur) => (
                          <SelectItem key={dur.value} value={dur.value} className="text-xs cursor-pointer">
                            <div className="flex flex-col">
                              <span>{dur.value}</span>
                              <span className="text-[10px] text-muted-foreground">{dur.periods}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 4. Notes */}
                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Remarks / Notes
                    </Label>
                    <Input
                      type="text"
                      placeholder="Optional notes..."
                      value={row.notes}
                      onChange={(e) => handleUpdateRow(row.rowId, "notes", e.target.value)}
                      className="h-9 text-xs bg-card/60 rounded-lg border-border/70"
                    />
                  </div>

                </div>
              </div>
            )
          })}

          {/* Add Teacher Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            className="w-full py-4 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 text-xs font-semibold text-foreground rounded-xl cursor-pointer gap-2 transition-all"
          >
            <Plus className="h-4 w-4 text-primary" />
            Add Another Absent Teacher
          </Button>
        </CardContent>

        {/* ── 3. Submission & Workflow Transition ── */}
        <CardFooter className="bg-muted/20 border-t border-border/50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>
              Generating will analyze periods 1-8 for {weekdayName} and find matching standby teachers.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/timetable/substitutions?date=${encodeURIComponent(selectedDate)}`)}
              className="h-10 text-xs font-semibold rounded-xl cursor-pointer w-full sm:w-auto"
            >
              Skip to Dashboard
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 text-xs font-bold rounded-xl cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 w-full sm:w-auto px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Substitutions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Confirm & Generate Substitutions
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
