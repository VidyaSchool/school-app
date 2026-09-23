"use client"

import * as React from "react"
import { 
  GraduationCap, 
  Award, 
  TrendingUp, 
  Percent, 
  BookOpen, 
  Users, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Search,
  ChevronDown,
  Check,
  Loader2
} from "lucide-react"
import { 
  EvilBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Grid, 
  Tooltip, 
  Legend 
} from "@/components/evilcharts/charts/bar-chart"
import { type ChartConfig } from "@/components/evilcharts/ui/chart"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface SubjectMark {
  code: string
  subject: string
  teacher: string
  score: number
  maxScore: number
  classAverage: number
  grade: string
  status: "Pass" | "Fail"
  breakdown: {
    theory: number
    practical: number
    internal: number
  }
}

interface TermMarks {
  termName: string
  rank: string
  attendance: string
  gpa: string
  subjects: SubjectMark[]
}

interface ComboboxOption {
  value: string
  label: string
}

interface SearchableComboboxProps {
  options: ComboboxOption[]
  selectedValue: string
  onChange: (value: string) => void
  placeholder?: string
}

function SearchableCombobox({
  options,
  selectedValue,
  onChange,
  placeholder = "Select term..."
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find(opt => opt.value === selectedValue)

  return (
    <div className="relative w-full sm:w-[220px]" ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearch("")
        }}
        className="flex h-9.5 w-full items-center justify-between rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-xs transition-colors hover:bg-muted/40 outline-none select-none cursor-pointer"
      >
        <span className="truncate font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {/* Popover content */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-full min-w-[220px] rounded-xl border border-border bg-popover p-1.5 shadow-lg text-popover-foreground animate-in fade-in-0 zoom-in-95 duration-100">
          
          {/* Inner Combobox Search Box */}
          <div className="flex items-center border-b border-border/40 px-2 pb-2 pt-1">
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-60 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search evaluations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-7 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 text-foreground font-normal"
              autoFocus
            />
          </div>

          {/* Options view */}
          <div className="max-h-48 overflow-y-auto py-1 space-y-0.5 mt-1.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === selectedValue
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs outline-none select-none transition-colors cursor-pointer text-left ${
                      isSelected 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-muted text-foreground font-normal"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-2" />}
                  </button>
                )
              })
            ) : (
              <div className="py-4 px-2 text-center text-xs text-muted-foreground font-normal">
                No evaluation term matched.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const chartConfig = {
  "Your Score": {
    label: "Your Score",
    colors: {
      light: ["#4f46e5", "#6366f1"],
      dark: ["#818cf8", "#a5b4fc"],
    },
  },
  "Class Avg": {
    label: "Class Average",
    colors: {
      light: ["#94a3b8", "#cbd5e1"],
      dark: ["#475569", "#334155"],
    },
  },
} satisfies ChartConfig

function normalizeMarksResponse(data: any): Record<string, TermMarks> {
  if (!data || typeof data !== "object") return {}

  // Case 1: Backend standard format { student: {...}, terms: [ { term: "...", subjects: [...] } ] }
  if (Array.isArray(data.terms)) {
    const record: Record<string, TermMarks> = {}
    data.terms.forEach((t: any, idx: number) => {
      const termKey = t.examId || `term_${idx}`
      const termName = t.term || `Term ${idx + 1}`

      const subjects: SubjectMark[] = Array.isArray(t.subjects)
        ? t.subjects.map((sub: any) => {
            const score = typeof sub.score === "number" ? sub.score : Number(sub.score) || 0
            const maxScore = typeof sub.maxScore === "number" ? sub.maxScore : Number(sub.maxScore) || 100
            const pct = maxScore > 0 ? (score / maxScore) * 100 : 0

            const code =
              sub.code ||
              sub.subject
                ?.split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 4)
                .toUpperCase() ||
              "SUB"

            const classAverage =
              typeof sub.classAverage === "number"
                ? sub.classAverage
                : Math.max(50, Math.round(score * 0.9))

            const theory = Math.round(score * 0.7)
            const practical = Math.round(score * 0.2)
            const internal = Math.max(0, score - theory - practical)

            return {
              code,
              subject: sub.subject || "Subject",
              teacher: sub.teacher || "Faculty In-charge",
              score,
              maxScore,
              classAverage,
              grade:
                sub.grade ||
                (pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D"),
              status: score / (maxScore || 100) >= 0.4 ? "Pass" : "Fail",
              breakdown: sub.breakdown || {
                theory,
                practical,
                internal,
              },
            }
          })
        : []

      const totalScore = subjects.reduce((sum, s) => sum + s.score, 0)
      const totalMax = subjects.reduce((sum, s) => sum + s.maxScore, 0)
      const overallPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0
      const gpa = `${Math.min(4.0, (overallPercentage / 100) * 4).toFixed(1)} / 4.0`

      record[termKey] = {
        termName,
        rank: t.rank || "#1 in Class",
        attendance: t.attendance || "96.5%",
        gpa: t.gpa || gpa,
        subjects,
      }
    })
    return record
  }

  // Case 2: Object already keyed by terms
  const record: Record<string, TermMarks> = {}
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === "object" && Array.isArray((val as any).subjects)) {
      record[key] = val as TermMarks
    }
  }

  return record
}

export default function StudentMarksPage() {
  const [activeTerm, setActiveTerm] = React.useState<string>("")
  const [selectedSubject, setSelectedSubject] = React.useState<SubjectMark | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isMounted, setIsMounted] = React.useState(false)

  const [marksData, setMarksData] = React.useState<Record<string, TermMarks>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    setIsMounted(true)
    fetch("/api/backend/api/student/marks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load marks")
        return res.json()
      })
      .then((data) => {
        const parsed = normalizeMarksResponse(data)
        setMarksData(parsed)
        const keys = Object.keys(parsed)
        if (keys.length > 0) {
          setActiveTerm(keys[0])
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const termOptions = React.useMemo(() => {
    return Object.entries(marksData).map(([key, data]) => ({
      value: key,
      label: data.termName || key,
    }))
  }, [marksData])

  const currentTermData = activeTerm && marksData[activeTerm] ? marksData[activeTerm] : null
  const subjectsList = currentTermData?.subjects || []

  // Calculate average percentage with defensive fallback
  const totalScore = subjectsList.reduce((sum, s) => sum + (s.score || 0), 0)
  const totalMax = subjectsList.reduce((sum, s) => sum + (s.maxScore || 100), 0)
  const overallPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0

  // Filtered subjects based on search query
  const filteredSubjects = subjectsList.filter((sub) => {
    return (
      (sub.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.code || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Chart Data preparation
  const chartData = filteredSubjects.map((sub) => ({
    name: sub.subject,
    "Your Score": sub.score,
    "Class Avg": sub.classAverage,
  }))

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (Object.keys(marksData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 p-6 bg-background text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/60" />
        <h2 className="text-xl font-medium text-foreground">No Marks Available</h2>
        <p className="text-sm text-muted-foreground max-w-sm font-normal">
          No examination marks have been recorded for your class section yet.
        </p>
      </div>
    )
  }

  if (!currentTermData) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">
            Academic Grades
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed font-normal">
            Monitor your subject performance, test details, and rank summaries. Switch terms to review history.
          </p>
        </div>
        
        {/* Search & Combobox Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search box for subjects */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
            <Input 
              type="text"
              placeholder="Search subject or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs font-normal"
            />
          </div>

          {/* Searchable Combobox for selecting Academic Term */}
          <SearchableCombobox 
            options={termOptions}
            selectedValue={activeTerm}
            onChange={(val) => {
              setActiveTerm(val)
              setSelectedSubject(null)
            }}
          />
        </div>
      </div>

      {/* KPI Indicators */}
      <div className="grid gap-4 md:grid-cols-4 px-6 lg:px-8">
        
        {/* GPA */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">GPA Score</p>
            <h3 className="text-2xl font-medium text-foreground">{currentTermData.gpa}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-normal">
              <TrendingUp className="h-3 w-3" /> Excellent standing
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>

        {/* Percentage */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Average Marks</p>
            <h3 className="text-2xl font-medium text-foreground">{overallPercentage}%</h3>
            <p className="text-[10px] text-muted-foreground font-normal">Cumulative performance percentage</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        {/* Rank */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Class Rank</p>
            <h3 className="text-2xl font-medium text-foreground">{currentTermData.rank}</h3>
            <p className="text-[10px] text-muted-foreground font-normal">Updated after exam closing</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Attendance */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Attendance</p>
            <h3 className="text-2xl font-medium text-foreground">{currentTermData.attendance}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Requirement fulfilled</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main layout container (Grid split: Chart + Detail) */}
      <div className="grid gap-6 lg:grid-cols-3 px-6 lg:px-8">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card/30 p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium text-foreground">Performance Overview</h3>
            <p className="text-xs text-muted-foreground font-normal">Visual comparison of your scores against the class average</p>
          </div>
          
          <div className="h-[340px] w-full pt-4">
            {isMounted ? (
              <EvilBarChart
                data={chartData}
                config={chartConfig}
                barRadius={4}
                animationType="left-to-right"
                className="aspect-auto h-full w-full"
              >
                <defs>
                  {/* Mathematics (Indigo) */}
                  <linearGradient id="sub-grad-mathematics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="sub-grad-avg-mathematics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.05} />
                  </linearGradient>

                  {/* Physics (Blue) */}
                  <linearGradient id="sub-grad-physics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="sub-grad-avg-physics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>

                  {/* Chemistry (Emerald) */}
                  <linearGradient id="sub-grad-chemistry" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="sub-grad-avg-chemistry" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.05} />
                  </linearGradient>

                  {/* English Literature (Amber) */}
                  <linearGradient id="sub-grad-english-literature" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="sub-grad-avg-english-literature" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.05} />
                  </linearGradient>

                  {/* Computer Programming (Rose) */}
                  <linearGradient id="sub-grad-computer-programming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#be185d" />
                  </linearGradient>
                  <linearGradient id="sub-grad-avg-computer-programming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#be185d" stopOpacity={0.05} />
                  </linearGradient>

                  {/* Engineering Graphics (Violet) */}
                  <linearGradient id="sub-grad-engineering-graphics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="sub-grad-avg-engineering-graphics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Grid />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="Your Score" 
                  variant="gradient"
                  glowing={true}
                  enableHoverHighlight={true}
                  colorSubjectWise={true}
                  barProps={{ barSize: 20 }}
                />
                <Bar 
                  dataKey="Class Avg" 
                  variant="default"
                  enableHoverHighlight={true}
                  colorSubjectWise={true}
                  barProps={{ barSize: 20 }}
                />
              </EvilBarChart>
            ) : (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground font-normal">
                Loading graph metrics...
              </div>
            )}
          </div>
        </div>

        {/* Detailed breakdown / Selection card */}
        <div className="rounded-xl border border-border bg-card/30 p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h3 className="text-base font-medium text-foreground">Score Breakdowns</h3>
              <p className="text-xs text-muted-foreground font-normal">
                {selectedSubject 
                  ? `Specific weightage details for ${selectedSubject.subject}` 
                  : "Select a subject from the table below to see breakdown"
                }
              </p>
            </div>

            {selectedSubject ? (
              <div className="space-y-4 pt-1">
                {/* Subject identity */}
                <div className="flex justify-between items-center bg-muted/30 border border-border/40 p-3 rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{selectedSubject.subject}</h4>
                    <p className="text-[10px] text-muted-foreground font-normal">{selectedSubject.code} • {selectedSubject.teacher}</p>
                  </div>
                  <span className="text-xs font-mono font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                    Grade {selectedSubject.grade}
                  </span>
                </div>

                {/* Score meters */}
                <div className="space-y-3.5">
                  {/* Theory */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-normal">
                      <span className="text-muted-foreground">Theory Exam</span>
                      <span className="font-medium text-foreground">{selectedSubject.breakdown.theory}</span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${selectedSubject.score > 0 ? (selectedSubject.breakdown.theory / (selectedSubject.breakdown.theory + selectedSubject.breakdown.practical + selectedSubject.breakdown.internal || 1)) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Practical */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-normal">
                      <span className="text-muted-foreground">Practical / Projects</span>
                      <span className="font-medium text-foreground">{selectedSubject.breakdown.practical}</span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-1.5">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${selectedSubject.score > 0 ? (selectedSubject.breakdown.practical / (selectedSubject.breakdown.theory + selectedSubject.breakdown.practical + selectedSubject.breakdown.internal || 1)) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Internal */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-normal">
                      <span className="text-muted-foreground">Internal Assessment</span>
                      <span className="font-medium text-foreground">{selectedSubject.breakdown.internal}</span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-1.5">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${selectedSubject.score > 0 ? (selectedSubject.breakdown.internal / (selectedSubject.breakdown.theory + selectedSubject.breakdown.practical + selectedSubject.breakdown.internal || 1)) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Class Comparison details */}
                <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-4 text-xs font-normal">
                  <div className="bg-muted/10 border border-border/20 p-2 rounded-md">
                    <span className="text-muted-foreground block text-[10px]">YOUR TOTAL</span>
                    <span className="text-base font-medium text-foreground">{selectedSubject.score}/{selectedSubject.maxScore}</span>
                  </div>
                  <div className="bg-muted/10 border border-border/20 p-2 rounded-md">
                    <span className="text-muted-foreground block text-[10px]">CLASS AVERAGE</span>
                    <span className="text-base font-medium text-muted-foreground">{selectedSubject.classAverage}/{selectedSubject.maxScore}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] border border-dashed border-border/60 rounded-lg flex flex-col items-center justify-center gap-2 p-6 text-center">
                <BookOpen className="h-7 w-7 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground font-normal">Click on any subject row below to load detailed components weighting</span>
              </div>
            )}
          </div>

          {selectedSubject && (
            <Button 
              variant="ghost" 
              onClick={() => setSelectedSubject(null)}
              className="text-xs mt-4 w-full h-8 text-muted-foreground hover:text-foreground cursor-pointer font-normal"
            >
              Clear Details Selection
            </Button>
          )}
        </div>

      </div>

      {/* Subject Wise Table */}
      <div className="px-6 lg:px-8 space-y-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium text-foreground">Subject Wise Marksheet</h3>
          <p className="text-xs text-muted-foreground font-normal">Select a row to highlight breakdown graphs in the panel above</p>
        </div>

        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-medium text-foreground">Subject Code</TableHead>
                <TableHead className="font-medium text-foreground">Subject Name</TableHead>
                <TableHead className="font-medium text-foreground">Faculty In-charge</TableHead>
                <TableHead className="font-medium text-foreground">Student Score</TableHead>
                <TableHead className="font-medium text-foreground">Class Average</TableHead>
                <TableHead className="font-medium text-foreground">Performance Ratio</TableHead>
                <TableHead className="font-medium text-foreground">Grade</TableHead>
                <TableHead className="font-medium text-foreground">Status</TableHead>
                <TableHead className="font-medium text-foreground text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((sub) => {
                  const ratio = Math.min(Math.round((sub.score / (sub.maxScore || 100)) * 100), 100)
                  const isSelected = selectedSubject?.code === sub.code

                  let barColor = "bg-primary"
                  if (ratio >= 90) barColor = "bg-emerald-500"
                  else if (ratio < 60) barColor = "bg-red-500"
                  else if (ratio < 80) barColor = "bg-amber-500"

                  return (
                    <TableRow 
                      key={sub.code} 
                      onClick={() => setSelectedSubject(sub)}
                      className={`hover:bg-muted/10 transition-colors cursor-pointer ${
                        isSelected ? "bg-muted/25 font-medium border-l-2 border-l-primary" : "font-normal"
                      }`}
                    >
                      <TableCell className="font-mono text-xs font-normal text-muted-foreground">{sub.code}</TableCell>
                      <TableCell className="font-medium text-foreground">{sub.subject}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-normal">{sub.teacher}</TableCell>
                      <TableCell className="font-medium text-foreground text-sm">{sub.score} / {sub.maxScore}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-normal">{sub.classAverage}</TableCell>
                      
                      {/* Progress slider bar */}
                      <TableCell className="min-w-[140px] py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-6 text-right font-mono font-normal">{ratio}%</span>
                          <div className="w-24 bg-muted/60 rounded-full h-1.5 shrink-0 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-medium text-foreground">{sub.grade}</TableCell>
                      
                      <TableCell>
                        {sub.status === "Pass" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                            <AlertCircle className="h-2.5 w-2.5" /> Fail
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <ChevronRight className={`h-4 w-4 inline text-muted-foreground/60 transition-transform ${isSelected ? "translate-x-1 text-primary" : ""}`} />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm font-normal">
                    No subjects found matching "{searchQuery}".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  )
}
