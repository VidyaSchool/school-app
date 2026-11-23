"use client"

import * as React from "react"
import { use } from "react"
import { 
  ArrowLeft, 
  Search, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Link from "next/link"

interface StudentGrade {
  id: string
  name: string
  email: string
  subjectAttendance: string
  score: number
  grade: string
  status: "Pass" | "Warning" | "Fail"
}

const subjectNames: Record<string, string> = {
  "MAT-101": "Mathematics",
  "PHY-101": "Physics",
  "CHM-101": "Chemistry",
  "ENG-101": "English Literature",
  "CSE-101": "Computer Programming",
  "ME-101": "Engineering Graphics",
  "MAT-102": "Advanced Algebra"
}

// Generate 26 mock students for testing pagination (20 per page default)
const generatedRoster: StudentGrade[] = [
  { id: "STU-2026-01", name: "Aarav Mehta", email: "aarav.mehta@vidya.edu", subjectAttendance: "98%", score: 92, grade: "A+", status: "Pass" },
  { id: "STU-2026-02", name: "Ananya Sen", email: "ananya.sen@vidya.edu", subjectAttendance: "95%", score: 88, grade: "A", status: "Pass" },
  { id: "STU-2026-03", name: "Kabir Joshi", email: "kabir.joshi@vidya.edu", subjectAttendance: "84%", score: 65, grade: "C", status: "Warning" },
  { id: "STU-2026-04", name: "Meera Nair", email: "meera.nair@vidya.edu", subjectAttendance: "97%", score: 91, grade: "A", status: "Pass" },
  { id: "STU-2026-05", name: "Rohan Verma", email: "rohan.verma@vidya.edu", subjectAttendance: "90%", score: 78, grade: "B", status: "Pass" },
  { id: "STU-2026-06", name: "Sneha Rao", email: "sneha.rao@vidya.edu", subjectAttendance: "96%", score: 89, grade: "A", status: "Pass" },
  { id: "STU-2026-07", name: "Vihaan Gupta", email: "vihaan.gupta@vidya.edu", subjectAttendance: "75%", score: 48, grade: "F", status: "Fail" },
  { id: "STU-2026-08", name: "Aditya Sharma", email: "aditya.sharma@vidya.edu", subjectAttendance: "92%", score: 85, grade: "A-", status: "Pass" },
  { id: "STU-2026-09", name: "Diya Patel", email: "diya.patel@vidya.edu", subjectAttendance: "94%", score: 87, grade: "A", status: "Pass" },
  { id: "STU-2026-10", name: "Ishaan Malhotra", email: "ishaan.malhotra@vidya.edu", subjectAttendance: "89%", score: 79, grade: "B+", status: "Pass" },
  { id: "STU-2026-11", name: "Kavya Iyer", email: "kavya.iyer@vidya.edu", subjectAttendance: "96%", score: 94, grade: "A+", status: "Pass" },
  { id: "STU-2026-12", name: "Pranav Deshmukh", email: "pranav.deshmukh@vidya.edu", subjectAttendance: "91%", score: 81, grade: "B+", status: "Pass" },
  { id: "STU-2026-13", name: "Riya Kapoor", email: "riya.kapoor@vidya.edu", subjectAttendance: "88%", score: 73, grade: "B-", status: "Pass" },
  { id: "STU-2026-14", name: "Samar Singh", email: "samar.singh@vidya.edu", subjectAttendance: "85%", score: 68, grade: "C+", status: "Warning" },
  { id: "STU-2026-15", name: "Tanya Khanna", email: "tanya.khanna@vidya.edu", subjectAttendance: "93%", score: 86, grade: "A-", status: "Pass" },
  { id: "STU-2026-16", name: "Varun Reddy", email: "varun.reddy@vidya.edu", subjectAttendance: "95%", score: 90, grade: "A", status: "Pass" },
  { id: "STU-2026-17", name: "Zoya Ansari", email: "zoya.ansari@vidya.edu", subjectAttendance: "97%", score: 93, grade: "A+", status: "Pass" },
  { id: "STU-2026-18", name: "Arjun Bhat", email: "arjun.bhat@vidya.edu", subjectAttendance: "82%", score: 62, grade: "C", status: "Warning" },
  { id: "STU-2026-19", name: "Gauri Joshi", email: "gauri.joshi@vidya.edu", subjectAttendance: "90%", score: 76, grade: "B", status: "Pass" },
  { id: "STU-2026-20", name: "Hrithik Shah", email: "hrithik.shah@vidya.edu", subjectAttendance: "79%", score: 55, grade: "D", status: "Warning" },
  // Page 2 Students
  { id: "STU-2026-21", name: "Kiara Sen", email: "kiara.sen@vidya.edu", subjectAttendance: "96%", score: 95, grade: "O", status: "Pass" },
  { id: "STU-2026-22", name: "Nikhil Kumar", email: "nikhil.kumar@vidya.edu", subjectAttendance: "94%", score: 83, grade: "A-", status: "Pass" },
  { id: "STU-2026-23", name: "Pooja Hegde", email: "pooja.hegde@vidya.edu", subjectAttendance: "98%", score: 96, grade: "O", status: "Pass" },
  { id: "STU-2026-24", name: "Rahul Bose", email: "rahul.bose@vidya.edu", subjectAttendance: "87%", score: 70, grade: "B-", status: "Pass" },
  { id: "STU-2026-25", name: "Sanjana Murthy", email: "sanjana.murthy@vidya.edu", subjectAttendance: "93%", score: 87, grade: "A", status: "Pass" },
  { id: "STU-2026-26", name: "Siddharth Roy", email: "siddharth.roy@vidya.edu", subjectAttendance: "77%", score: 45, grade: "F", status: "Fail" },
]

export default function SubjectClassRegisterPage({
  params,
}: {
  params: Promise<{ subjectCode: string }>
}) {
  const resolvedParams = use(params)
  const subjectCode = resolvedParams.subjectCode.toUpperCase()
  const subjectName = subjectNames[subjectCode] || "Subject Class"

  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 20

  const filteredRoster = generatedRoster.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset pagination to first page if search query changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Pagination bounds
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRoster.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRoster.length / itemsPerPage)

  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
      {/* Back link & Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/teacher/subjects" 
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium select-none transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Subjects
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              {subjectName} ({subjectCode})
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              Class Register, subject attendance logs, and evaluation standing records for current academic cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

      {/* Student List Table */}
      <div>
        <div className="rounded-xl border border-border bg-card/30 overflow-x-auto shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Student ID</TableHead>
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">Attendance</TableHead>
                <TableHead className="font-semibold text-foreground">Score</TableHead>
                <TableHead className="font-semibold text-foreground">Grade</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((student) => {
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{student.id}</TableCell>
                      <TableCell className="font-bold text-foreground">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{student.email}</TableCell>
                      <TableCell className="text-foreground text-sm font-semibold">{student.subjectAttendance}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">{student.score} / 100</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">{student.grade}</TableCell>
                      <TableCell>
                        {student.status === "Pass" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Passing
                          </span>
                        )}
                        {student.status === "Warning" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> Warning
                          </span>
                        )}
                        {student.status === "Fail" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> Failing
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-md cursor-pointer" aria-label="Email Student" asChild>
                          <a href={`mailto:${student.email}`}>
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground select-none">
          <div>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRoster.length)} of {filteredRoster.length} students
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
    </div>
  )
}
