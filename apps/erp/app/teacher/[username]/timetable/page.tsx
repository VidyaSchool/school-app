"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { 
  CalendarIcon, 
  ClockIcon, 
  BookOpenIcon, 
  PlusIcon, 
  Trash2Icon, 
  GraduationCapIcon,
  MapPinIcon,
  Loader2Icon,
  SparklesIcon,
  ChevronsUpDown,
  Check,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const CLASSES_LIST = ["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

function ClassCombobox({ 
  value, 
  onChange 
}: { 
  value: string
  onChange: (val: string) => void 
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = CLASSES_LIST.filter(c => 
    c.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="col-span-3 justify-between text-xs font-normal h-9 px-3 w-full bg-background border-input hover:bg-accent hover:text-accent-foreground"
        >
          {value ? value : "Select class..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Input
            placeholder="Search class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full border-0 bg-transparent py-3 text-xs placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">No class found.</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item}
                type="button"
                className="w-full text-left flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(item)
                  setOpen(false)
                  setSearch("")
                }}
              >
                {item}
                {value === item && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimetableEntry {
  id: string
  class: string
  section: string
  subject: string
  dayOfWeek: string
  periodNumber?: number
  startTime?: string
  endTime?: string
  room?: string | null
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const SUBJECT_COLORS = [
  { bg: 'bg-violet-500/10 dark:bg-violet-500/20', border: 'border-l-violet-500', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-sky-500/10 dark:bg-sky-500/20', border: 'border-l-sky-500', text: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-amber-500/10 dark:bg-amber-500/20', border: 'border-l-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-l-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-rose-500/10 dark:bg-rose-500/20', border: 'border-l-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', border: 'border-l-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
  { bg: 'bg-orange-500/10 dark:bg-orange-500/20', border: 'border-l-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-teal-500/10 dark:bg-teal-500/20', border: 'border-l-teal-500', text: 'text-teal-600 dark:text-teal-400' },
]

function getSubjectColor(subject: string) {
  let hash = 0
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) % SUBJECT_COLORS.length
  }
  return SUBJECT_COLORS[hash]
}

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = React.useState<TimetableEntry[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [activeDay, setActiveDay] = React.useState<string>("Monday")
  const [isOpen, setIsOpen] = React.useState<boolean>(false)
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Form State
  const [formClass, setFormClass] = React.useState("")
  const [formSection, setFormSection] = React.useState("")
  const [formSubject, setFormSubject] = React.useState("")
  const [formDay, setFormDay] = React.useState("Monday")
  const [formPeriodNumber, setFormPeriodNumber] = React.useState<number>(1)
  const [formRoom, setFormRoom] = React.useState("")

  const loadTimetable = React.useCallback(() => {
    setLoading(true)
    fetch("/api/teacher/timetable")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load timetable")
        return res.json()
      })
      .then((data) => {
        setTimetable(data.timetable || [])
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setLoading(false)
      })
  }, [])

  React.useEffect(() => {
    loadTimetable()
  }, [loadTimetable])

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formClass || !formSection || !formDay || !formPeriodNumber) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/teacher/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class: formClass,
          section: formSection,
          subject: formSubject || "",
          dayOfWeek: formDay,
          periodNumber: Number(formPeriodNumber),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to add slot")
      }

      toast.success("Period added to timetable successfully!")
      setIsOpen(false)
      // Reset Form fields
      setFormClass("")
      setFormSection("")
      setFormSubject("")
      setFormPeriodNumber(1)
      setFormRoom("")
      loadTimetable()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this period?")) return

    try {
      const res = await fetch(`/api/teacher/timetable?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete period")

      toast.success("Period deleted successfully")
      loadTimetable()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const activeDayEntries = timetable.filter((entry) => entry.dayOfWeek === activeDay)

  // Simple statistics
  const totalClassesCount = timetable.length
  const subjectsMap = new Set(timetable.map(t => t.subject))
  const uniqueSubjectsCount = subjectsMap.size

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background relative px-4 lg:px-6">
      {/* Header section with styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            My Timetable Schedule
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Organize your teaching slots, schedule class timings, and coordinate your weekly lesson planners.
          </p>
        </div>

        <Button onClick={() => setIsOpen(true)} className="w-full md:w-auto shadow-md">
          <PlusIcon className="mr-2 h-4 w-4" /> Add Period
        </Button>
      </div>

      {/* Stats Widgets cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-tr from-primary/5 via-card to-card border-primary/10 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Weekly Teaching Load</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              {totalClassesCount} Periods / Week
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-tr from-primary/5 via-card to-card border-primary/10 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Unique Subjects taught</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              {uniqueSubjectsCount} Subjects
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-tr from-primary/5 via-card to-card border-primary/10 shadow-xs sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Today's schedule status</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-amber-500 animate-pulse" />
              {timetable.filter(t => t.dayOfWeek === activeDay).length} Periods Today
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Weekday Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border">
        {DAYS.map((day) => (
          <Button
            key={day}
            variant={activeDay === day ? "default" : "ghost"}
            onClick={() => setActiveDay(day)}
            className={`rounded-full text-xs font-semibold px-4 transition-all duration-150 shrink-0 ${
              activeDay === day 
                ? "shadow-sm" 
                : "text-muted-foreground hover:bg-muted"
            }`}
            size="sm"
          >
            {day}
          </Button>
        ))}
      </div>

      {/* Periods list */}
      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/80 px-4 py-5 flex flex-col gap-3 border-l-4 border-l-zinc-200 dark:border-l-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : activeDayEntries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDayEntries.map((entry) => {
              const colors = getSubjectColor(entry.subject)
              return (
                <div
                  key={entry.id}
                  className={`group relative rounded-xl border border-border/80 px-4 py-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 ${colors.bg} ${colors.border}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-base leading-snug flex items-center gap-1.5 ${colors.text}`}>
                        <BookOpenIcon className="h-4 w-4 shrink-0" />
                        {entry.subject}
                      </h3>
                      
                      {/* Delete button (hidden by default, shown on group-hover) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                        onClick={() => handleDeleteSlot(entry.id)}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                      {entry.periodNumber ? `Period ${entry.periodNumber}` : `${entry.startTime} - ${entry.endTime}`}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
                      <GraduationCapIcon className="h-3.5 w-3.5 shrink-0" />
                      Class {entry.class} - Section {entry.section}
                    </div>

                    {entry.room && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        Room {entry.room}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-border rounded-2xl p-6 bg-muted/10">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-lg text-foreground">No periods scheduled</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
              You haven't scheduled any teaching slots for {activeDay} yet. Click "Add Period" to get started.
            </p>
          </div>
        )}
      </div>

      {/* Add Period Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Period</DialogTitle>
            <DialogDescription>
              Create a recurring class time slot. Fill in the class details, subject, day and timing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSlot} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class" className="text-right">Class *</Label>
              <ClassCombobox
                value={formClass}
                onChange={setFormClass}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section" className="text-right">Section *</Label>
              <Input
                id="section"
                placeholder="e.g. A, B"
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                className="col-span-3 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g. Mathematics, English"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="col-span-3 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="day" className="text-right">Day *</Label>
              <Select value={formDay} onValueChange={setFormDay}>
                <SelectTrigger className="col-span-3 text-xs">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day} className="text-xs">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="periodNumber" className="text-right">Period No. *</Label>
              <Input
                id="periodNumber"
                type="number"
                min={1}
                max={12}
                value={formPeriodNumber}
                onChange={(e) => setFormPeriodNumber(parseInt(e.target.value, 10) || 1)}
                className="col-span-3 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">Room</Label>
              <Input
                id="room"
                placeholder="e.g. 104, Lab 2 (optional)"
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                className="col-span-3 text-xs"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : "Save Period"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
