"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Loader2Icon,
  ArrowLeftIcon,
  CircleUserRoundIcon,
  BookOpenIcon,
  CreditCardIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  AwardIcon,
  CalendarIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ClockIcon,
  SparklesIcon,
  GraduationCapIcon,
  ActivityIcon,
  Users,
  FileTextIcon,
  ShieldCheckIcon,
  FileCheckIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatDate } from "@/lib/date-formatter"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DocumentUploadManager, DocumentSlot } from "@/components/document-upload-manager"

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

const STUDENT_DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: "10th_certificate",
    title: "10th Certificate",
    description: "Class 10th passing certificate or official board marksheet (PDF or Image)",
    required: true,
  },
  {
    type: "student_aadhar",
    title: "Student Aadhar Card",
    description: "Student's Aadhaar identification card front & back scan (PDF or Image)",
    required: true,
  },
  {
    type: "parent_aadhar",
    title: "Parent Aadhar Card",
    description: "Father/Mother/Guardian Aadhaar identification card scan (PDF or Image)",
    required: true,
  },
  {
    type: "birth_certificate",
    title: "Birth Certificate",
    description: "Official municipal birth registration certificate (PDF or Image)",
    required: true,
  },
  {
    type: "parent_pan",
    title: "Parent PAN Card",
    description: "Father/Mother/Guardian Permanent Account Number (PAN) card (PDF or Image)",
    required: false,
  },
]

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const studentUserId = params.studentUserId as string

  const [studentDetails, setStudentDetails] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("details")
  const [activeTerm, setActiveTerm] = React.useState("term-2")

  React.useEffect(() => {
    if (!studentUserId) return

    fetch(`/api/backend/teacher/student/${studentUserId}/details`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load student details")
        return res.json()
      })
      .then(data => {
        setStudentDetails(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [studentUserId])

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !studentDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 p-6 bg-background">
        <p className="text-destructive font-medium">Error: {error || "Student details not found"}</p>
        <Button variant="outline" onClick={() => router.push(`/teacher/${username}/class`)}>
          Back to Class Roster
        </Button>
      </div>
    )
  }

  const { details, marks, fees } = studentDetails

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 bg-background min-h-screen font-sans">
      
      {/* Back button and page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full shrink-0" 
            onClick={() => router.push(`/teacher/${username}/class`)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Student Profile
            </h1>
            <p className="text-xs text-muted-foreground">
              Admission ID: {details.admissionNumber || "Not Assigned"}
            </p>
          </div>
        </div>

        {/* Top Badges */}
        <div className="flex gap-2">
          <Badge variant="outline">
            GPA: {marks[activeTerm]?.gpa || "N/A"}
          </Badge>
          <Badge variant="secondary">
            Class {details.class || "N/A"} - {details.section || "N/A"}
          </Badge>
        </div>
      </div>

      {/* Student Hero Roster Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 border">
                <AvatarImage src={details.image || undefined} alt={details.name} />
                <AvatarFallback className="font-bold bg-muted text-muted-foreground text-xl">
                  {getInitials(details.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground tracking-tight">{details.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MailIcon className="h-4 w-4 text-muted-foreground" /> {details.email}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Student</Badge>
                  {details.admissionNumber && (
                    <Badge variant="outline">ID: {details.admissionNumber}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-3 w-full lg:w-fit min-w-[320px] max-w-md">
              {/* Rank */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <AwardIcon className="h-3.5 w-3.5" /> Rank
                  </span>
                  <span className="text-lg font-bold text-foreground mt-2">{marks[activeTerm]?.rank || "N/A"}</span>
                </CardContent>
              </Card>

              {/* Attendance */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ActivityIcon className="h-3.5 w-3.5" /> Attendance
                  </span>
                  <span className="text-lg font-bold text-foreground mt-2">
                    {marks[activeTerm]?.attendance || "N/A"}
                  </span>
                </CardContent>
              </Card>

              {/* Term GPA */}
              <Card className="bg-muted/50 border-none shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <GraduationCapIcon className="h-3.5 w-3.5" /> GPA
                  </span>
                  <span className="text-lg font-bold text-foreground mt-2">{marks[activeTerm]?.gpa?.split(" ")[0] || "N/A"}</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabbed Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex items-center justify-start gap-1 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="details" className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold">
            <CircleUserRoundIcon className="h-3.5 w-3.5" /> Profile Details
          </TabsTrigger>
          <TabsTrigger value="marks" className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold">
            <BookOpenIcon className="h-3.5 w-3.5" /> Marks & Grades
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold">
            <CreditCardIcon className="h-3.5 w-3.5" /> Fee Roster
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold">
            <FileTextIcon className="h-3.5 w-3.5" /> Documents
          </TabsTrigger>
        </TabsList>

        {/* Tab contents */}
        <div className="mt-2">
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Profile details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" /> Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Email Address</span>
                      <span className="text-sm font-medium text-foreground block truncate">{details.email}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Phone Number</span>
                      <span className="text-sm font-medium text-foreground block">{details.phoneNumber || "Not provided"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Class</span>
                      <span className="text-sm font-medium text-foreground block capitalize">{details.class || "Not set"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Section</span>
                      <span className="text-sm font-medium text-foreground block uppercase">{details.section || "Not set"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parents Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Parent / Guardian Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Parent Name</span>
                      <span className="text-sm font-medium text-foreground block">{details.parentName || "Not provided"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Parent Phone</span>
                      <span className="text-sm font-medium text-foreground block">{details.parentPhone || "Not provided"}</span>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground block">Parent Email</span>
                      <span className="text-sm font-medium text-foreground block truncate">{details.parentEmail || "Not provided"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-primary" /> Residential Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground block">Street Address</span>
                      <span className="text-sm font-medium text-foreground block">{details.address || "Not provided"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">City & State</span>
                      <span className="text-sm font-medium text-foreground block">
                        {details.city || details.state ? `${details.city || ""}, ${details.state || ""}` : "Not provided"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground block">Pincode</span>
                      <span className="text-sm font-medium text-foreground block">{details.pincode || "Not provided"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Marks & Grades Tab */}
          <TabsContent value="marks" className="space-y-6 outline-none">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <BookOpenIcon className="h-4 w-4 text-primary" /> Academic Report Card
              </h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={activeTerm === "term-1" ? "default" : "outline"}
                  onClick={() => setActiveTerm("term-1")}
                >
                  Term 1
                </Button>
                <Button 
                  size="sm" 
                  variant={activeTerm === "term-2" ? "default" : "outline"}
                  onClick={() => setActiveTerm("term-2")}
                >
                  Term 2
                </Button>
              </div>
            </div>

            {marks[activeTerm] ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <span className="text-xs text-muted-foreground block font-medium">Total Marks</span>
                    <span className="text-xl font-bold text-foreground">{marks[activeTerm].totalMarks}</span>
                  </Card>
                  <Card className="p-4">
                    <span className="text-xs text-muted-foreground block font-medium">Percentage</span>
                    <span className="text-xl font-bold text-foreground">{marks[activeTerm].percentage}</span>
                  </Card>
                  <Card className="p-4">
                    <span className="text-xs text-muted-foreground block font-medium">GPA</span>
                    <span className="text-xl font-bold text-foreground">{marks[activeTerm].gpa}</span>
                  </Card>
                  <Card className="p-4">
                    <span className="text-xs text-muted-foreground block font-medium">Class Rank</span>
                    <span className="text-xl font-bold text-foreground">{marks[activeTerm].rank}</span>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Subject Breakdown ({activeTerm.toUpperCase()})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Max Score</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marks[activeTerm].subjects?.map((sub: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{sub.name}</TableCell>
                            <TableCell className="font-bold">{sub.score}</TableCell>
                            <TableCell className="text-muted-foreground">{sub.maxScore}</TableCell>
                            <TableCell>
                              <Badge variant={sub.grade === "A+" || sub.grade === "A" ? "default" : "secondary"}>
                                {sub.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{sub.remarks || "Good effort"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                No marks recorded for this term.
              </div>
            )}
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4 outline-none">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
              <CreditCardIcon className="h-4 w-4 text-primary" /> Roster Installments
            </h3>

            {fees && fees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fees.map((fee: any) => {
                  return (
                    <Card key={fee.id}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                          {fee.month} {fee.year}
                        </CardTitle>
                        <Badge variant={
                          fee.status === "paid" ? "secondary" : 
                          fee.status === "pending" ? "outline" : 
                          fee.status === "overdue" ? "destructive" : "default"
                        }>
                          {fee.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">Amount</span>
                          <div className="text-2xl font-bold">₹{fee.amount}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs text-muted-foreground">
                          <div>
                            <span className="block font-medium">Due Date</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                              {fee.dueDate ? formatDate(fee.dueDate) : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="block font-medium">Paid Date</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                              {fee.paidDate ? formatDate(fee.paidDate) : "-"}
                            </span>
                          </div>
                        </div>

                        {fee.receiptNo && (
                          <div className="bg-muted p-2 rounded text-[10px] font-mono flex justify-between">
                            <span>Receipt: {fee.receiptNo}</span>
                            <span className="capitalize text-muted-foreground">{fee.paymentMethod}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg border-dashed">
                No fee installment records found for this student.
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 outline-none">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FileCheckIcon className="h-5 w-5 text-primary" /> Verified Student Documents
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Review identity certificates and documents uploaded by {details.name}.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs shrink-0 w-fit">
                    <ShieldCheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Encrypted & Authenticated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <DocumentUploadManager
                  role="teacher"
                  documentSlots={STUDENT_DOCUMENT_SLOTS}
                  userId={studentUserId}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
