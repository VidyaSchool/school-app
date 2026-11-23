"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  Mail,
  User,
  GraduationCap,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

interface SubjectDetail {
  code: string
  subject: string
  score: number
  maxScore: number
  grade: string
}

interface TermReport {
  termName: string
  rank: string
  gpa: string
  subjects: SubjectDetail[]
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

export default function StudentSubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const subjectCode = params.subjectCode as string
  const classSection = params.classSection as string
  const studentUserId = params.studentUserId as string

  const [studentDetails, setStudentDetails] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!studentUserId) return

    fetch(`/api/backend/teacher/student/${studentUserId}/details`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load student details")
        return res.json()
      })
      .then((data) => {
        setStudentDetails(data)
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load student details")
        setLoading(false)
      })
  }, [studentUserId])

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!studentDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 p-6 bg-background">
        <p className="text-destructive font-medium">Student details not found</p>
        <Button variant="outline" onClick={() => router.push(`/teacher/${username}/subjects/${subjectCode}/${classSection}/students`)}>
          Back to Class Roster
        </Button>
      </div>
    )
  }

  const { details, exams, examScores } = studentDetails

  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
      
      {/* Header with back navigation */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full shrink-0" 
          onClick={() => router.push(`/teacher/${username}/subjects/${subjectCode}/${classSection}/students`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Subject Performance Details
          </h1>
          <p className="text-xs text-muted-foreground">
            Subject-specific examination logs for {details.name}
          </p>
        </div>
      </div>

      {/* Student details header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border">
              <AvatarImage src={details.image || undefined} alt={details.name} />
              <AvatarFallback className="font-bold bg-muted text-muted-foreground text-lg">
                {getInitials(details.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">{details.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {details.email}
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="capitalize">
                  <BookOpen className="h-3.5 w-3.5 mr-1" /> {subjectCode}
                </Badge>
                <Badge variant="outline">
                  Class {details.class} - {details.section}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject details card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {exams && exams.length > 0 ? (
          exams.map((exam: any) => {
            const scoreObj = examScores?.[exam.id]
            const score = scoreObj?.[subjectCode]
            return (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> {exam.name}
                  </CardTitle>
                  <CardDescription>
                    Examination Log
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Score Obtained</span>
                      <span className="text-xl font-bold text-foreground mt-0.5 block">
                        {score !== undefined && score !== null ? `${score} / 100` : "-"}
                      </span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status</span>
                      <Badge variant={score !== undefined && score !== null ? (score >= 40 ? "default" : "secondary") : "outline"} className="mt-1 text-sm font-bold">
                        {score !== undefined && score !== null ? (score >= 40 ? "Passed" : "Failed") : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-2 text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            No exams have been created for this class and section.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
