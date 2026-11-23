"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Users, 
  Search, 
  Loader2Icon,
  ArrowLeft,
  BookOpen,
  Plus,
  Save,
  GraduationCap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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

interface Student {
  id: string
  userId: string
  name: string
  email: string
  image?: string | null
  examScores: Record<string, number | null>
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

export default function SubjectClassStudentsPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const subjectCode = params.subjectCode as string
  const classSection = params.classSection as string

  // Parse class name and section name from the classSection parameter
  const match = React.useMemo(() => {
    if (!classSection) return { className: "", sectionName: "" }
    const m = classSection.match(/^Class([^-]+)-(.*)$/)
    return m ? { className: m[1], sectionName: m[2] } : { className: "", sectionName: "" }
  }, [classSection])

  const { className, sectionName } = match

  // Tab State
  const [activeTab, setActiveTab] = React.useState("students")

  // Students list state
  const [students, setStudents] = React.useState<Student[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Exams & Marks states
  const [exams, setExams] = React.useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = React.useState<string>("")
  const [newExamName, setNewExamName] = React.useState("")
  const [examDialogOpen, setExamDialogOpen] = React.useState(false)
  const [creatingExam, setCreatingExam] = React.useState(false)
  
  const [marksData, setMarksData] = React.useState<any[]>([])
  const [loadingMarks, setLoadingMarks] = React.useState(false)
  const [savingMarks, setSavingMarks] = React.useState(false)
  const [enteredScores, setEnteredScores] = React.useState<Record<string, string>>({})

  // Fetch students
  const fetchStudents = React.useCallback(() => {
    if (!className || !sectionName) return
    setLoading(true)
    fetch(`/api/backend/teacher/subjects/students?class_name=${className}&section_name=${sectionName}&subject_name=${subjectCode}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("You are not authorized to view the student list for this class-section.")
          }
          throw new Error("Failed to load students")
        }
        return res.json()
      })
      .then((data) => {
        setStudents(data.students)
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load class roster")
        setLoading(false)
      })
  }, [className, sectionName, subjectCode])

  // Fetch exams (visible to all subject teachers of class/section)
  const fetchExams = React.useCallback(() => {
    if (!className || !sectionName) return
    fetch(`/api/backend/teacher/exams?class_name=${className}&section_name=${sectionName}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load exams")
        return res.json()
      })
      .then((data) => {
        setExams(data)
        if (data.length > 0 && !selectedExamId) {
          setSelectedExamId(data[0].id)
        }
      })
      .catch((err) => {
        toast.error("Failed to load exams list")
      })
  }, [className, sectionName, selectedExamId])

  // Fetch marks when active exam changes
  const fetchMarks = React.useCallback(() => {
    if (!selectedExamId || !subjectCode) return
    setLoadingMarks(true)
    fetch(`/api/backend/teacher/marks?exam_id=${selectedExamId}&subject=${subjectCode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load marks")
        return res.json()
      })
      .then((data) => {
        setMarksData(data.students)
        
        // Populate input values
        const scoresMap: Record<string, string> = {}
        data.students.forEach((s: any) => {
          scoresMap[s.userId] = s.score !== null ? String(s.score) : ""
        })
        setEnteredScores(scoresMap)
        
        setLoadingMarks(false)
      })
      .catch((err) => {
        toast.error("Failed to load marks roster")
        setLoadingMarks(false)
      })
  }, [selectedExamId, subjectCode])

  React.useEffect(() => {
    fetchStudents()
    fetchExams()
  }, [fetchStudents, fetchExams])



  // Load marks when selected exam changes
  React.useEffect(() => {
    if (activeTab === "marks" && selectedExamId) {
      fetchMarks()
    }
  }, [activeTab, selectedExamId, fetchMarks])

  // Create exam
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExamName.trim()) {
      toast.error("Please enter an exam name")
      return
    }
    setCreatingExam(true)
    fetch("/api/backend/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newExamName.trim(),
        class_name: className,
        section_name: sectionName
      })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || "Failed to create exam")
        toast.success("Exam created successfully!")
        setNewExamName("")
        setExamDialogOpen(false)
        setSelectedExamId(data.id)
        fetchExams()
      })
      .catch((err) => {
        toast.error(err.message || "Failed to create exam")
      })
      .finally(() => {
        setCreatingExam(false)
      })
  }

  // Save marks
  const handleSaveMarks = () => {
    if (!selectedExamId) return
    setSavingMarks(true)
    
    // Parse score inputs
    const scoresPayload: Record<string, number> = {}
    Object.entries(enteredScores).forEach(([userId, val]) => {
      if (val.trim() !== "") {
        scoresPayload[userId] = parseFloat(val)
      }
    })
    
    fetch("/api/backend/teacher/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: selectedExamId,
        subject: subjectCode,
        scores: scoresPayload
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || "Failed to save marks")
        }
        toast.success("Marks saved successfully!")
        fetchMarks()
      })
      .catch((err) => {
        toast.error(err.message || "Failed to save marks")
      })
      .finally(() => {
        setSavingMarks(false)
      })
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const latestExams = React.useMemo(() => {
    // Slice the first 2 (newest) exams, then reverse to show chronological order (older first)
    return [...exams].slice(0, 2).reverse()
  }, [exams])

  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full shrink-0" 
            onClick={() => router.push(`/teacher/${username}/subjects`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Subject Class Manager
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage student roster and record subject exam grades.
            </p>
          </div>
        </div>

        {/* Top badges */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="capitalize">
            <BookOpen className="h-3.5 w-3.5 mr-1" /> {subjectCode}
          </Badge>
          <Badge variant="outline">
            {className === "Nursery" || className === "KG" ? className : `Class ${className}`} - {sectionName}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex items-center justify-start gap-1 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="students" className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" /> Students List
          </TabsTrigger>
          <TabsTrigger value="marks" className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold">
            <GraduationCap className="h-3.5 w-3.5" /> Subject Marks Grid
          </TabsTrigger>
        </TabsList>

        <div className="mt-2">
          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4 outline-none">
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
            </div>

            {/* Students Table */}
            {loading ? (
              <div className="flex min-h-[200px] w-full items-center justify-center">
                <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      {latestExams.map((exam) => (
                        <TableHead key={exam.id}>{exam.name}</TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{student.id}</TableCell>
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
                          {latestExams.map((exam) => {
                            const score = student.examScores?.[exam.id]
                            return (
                              <TableCell key={exam.id} className="font-semibold text-sm">
                                {score !== undefined && score !== null ? `${score} / 100` : "-"}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs rounded-lg cursor-pointer h-8"
                              onClick={() => router.push(`/teacher/${username}/subjects/${subjectCode}/${classSection}/students/${student.userId}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4 + latestExams.length} className="text-center py-12 text-muted-foreground text-sm">
                          No students matched your search filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Marks Tab */}
          <TabsContent value="marks" className="space-y-4 outline-none">
            
            {/* Header controls: select exam, add exam, save marks */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-card/35">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">Select Exam:</span>
                <div className="flex items-center gap-2">
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Choose an exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Add Exam Dialog */}
                  <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="cursor-pointer shrink-0">
                        <Plus className="h-4 w-4 mr-1" /> Add Exam
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handleCreateExam}>
                        <DialogHeader>
                          <DialogTitle>Create Class Exam</DialogTitle>
                          <DialogDescription>
                            Create an exam category for Class {className} - {sectionName}. This exam name will be visible to all subject teachers of this class and section.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">Exam Name</label>
                            <Input 
                              value={newExamName}
                              onChange={(e) => setNewExamName(e.target.value)}
                              placeholder="e.g. Mid-Term, Unit Test 1"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setExamDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={creatingExam}>
                            {creatingExam ? "Creating..." : "Create Exam"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {selectedExamId && (
                <Button className="cursor-pointer" onClick={handleSaveMarks} disabled={savingMarks}>
                  {savingMarks ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Marks
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Excel-like Input Grid */}
            {selectedExamId ? (
              loadingMarks ? (
                <div className="flex min-h-[200px] w-full items-center justify-center">
                  <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[180px]">Subject Marks (Max: 100)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksData.length > 0 ? (
                        marksData.map((student) => (
                          <TableRow key={student.userId}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{student.id}</TableCell>
                            <TableCell className="font-semibold text-foreground">{student.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{student.email}</TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                value={enteredScores[student.userId] || ""}
                                onChange={(e) => {
                                  setEnteredScores({
                                    ...enteredScores,
                                    [student.userId]: e.target.value
                                  })
                                }}
                                className="h-8 w-28 text-sm font-semibold"
                                placeholder="Enter score"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                            No students registered in this class.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-lg">
                Please select or create an exam above to start logging scores.
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
      </div>
    </div>
  )
}
