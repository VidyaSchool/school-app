"use client"

import { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Users,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  CreditCard,
  ArrowLeft,
  Loader2,
  Clock,
  Printer,
  Download,
  ReceiptText,
  Bus,
  Layers,
} from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  username: string
  class: string | null
  section: string | null
  admission_number: string | null
  outstanding_dues_count: number
}

interface Installment {
  id: string
  month: string
  year: string
  amount: number
  due_date: string
  status: "paid" | "pending" | "overdue" | "upcoming"
  paid_date: string | null
  receipt_no: string | null
  payment_method: string | null
}

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  } catch (e) {
    return value
  }
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-muted/10">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ReceiptText className="size-6" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function StudentFeesClient({ username }: { username: string }) {
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // Installments state
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loadingInstallments, setLoadingInstallments] = useState(false)
  const [breakdown, setBreakdown] = useState<any>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [duesFilter, setDuesFilter] = useState("all")

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedInstallments, setSelectedInstallments] = useState<Installment[]>([])
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Fetch all students
  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch("/api/admin/students")
      if (!res.ok) throw new Error("Failed to load students")
      const data = await res.json()
      setStudents(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load student profiles from server")
    } finally {
      setLoadingStudents(false)
    }
  }

  // Fetch installments for selected student with full breakdown
  const fetchInstallments = async (studentId: string) => {
    setLoadingInstallments(true)
    try {
      const res = await fetch(`/api/admin/fees/${studentId}/breakdown`)
      if (!res.ok) throw new Error("Failed to load fee breakdown")
      const data = await res.json()
      
      setBreakdown({
        student: data.student,
        classNum: data.classNum,
        components: data.components || [],
        transportFee: data.transportFee || 0,
        transportFeeApplied: data.transportFeeApplied || 0,
        baseMonthlyTotal: data.baseMonthlyTotal || 0,
        netMonthlyTotal: data.netMonthlyTotal || 0,
      })

      const mappedData: Installment[] = (data.installments || []).map((inst: any) => ({
        id: inst.id,
        month: inst.month,
        year: inst.year,
        amount: inst.amount,
        due_date: inst.dueDate || inst.due_date,
        status: inst.status,
        paid_date: inst.paidDate || inst.paid_date,
        receipt_no: inst.receiptNo || inst.receipt_no,
        payment_method: inst.paymentMethod || inst.payment_method,
      }))
      
      setInstallments(mappedData)
    } catch (error) {
      console.error(error)
      // Fallback to legacy endpoint if breakdown API fails
      try {
        const fallbackRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/admin/fees/${studentId}`)
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          setInstallments(fallbackData.map((inst: any) => ({
            id: inst.id,
            month: inst.month,
            year: inst.year,
            amount: inst.amount,
            due_date: inst.dueDate || inst.due_date,
            status: inst.status,
            paid_date: inst.paidDate || inst.paid_date,
            receipt_no: inst.receiptNo || inst.receipt_no,
            payment_method: inst.paymentMethod || inst.payment_method,
          })))
        }
      } catch (e) {
        toast.error("Failed to load fee schedule for student")
      }
    } finally {
      setLoadingInstallments(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Refetch selected student installments when needed
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    fetchInstallments(student.id)
  }

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchQuery = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.admission_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchClass = classFilter === "all" || s.class === classFilter
      
      const matchDues = 
        duesFilter === "all" || 
        (duesFilter === "dues" && s.outstanding_dues_count > 0) ||
        (duesFilter === "nodues" && s.outstanding_dues_count === 0)

      return matchQuery && matchClass && matchDues
    })
  }, [students, searchQuery, classFilter, duesFilter])

  // Extract unique classes
  const classesList = useMemo(() => {
    const list = new Set<string>()
    students.forEach((s) => s.class && list.add(s.class))
    return Array.from(list).sort()
  }, [students])

  // Handle open payment dialog
  const handleOpenPayment = (inst: Installment) => {
    setSelectedInstallments([inst])
    setPaymentMethod("Cash")
    setPaymentDialogOpen(true)
  }

  const handleOpenMultiplePayments = () => {
    const pendingInsts = installments.filter(inst => inst.status === "pending" || inst.status === "overdue")
    if (pendingInsts.length === 0) {
      toast.info("No pending or overdue installments to pay.")
      return
    }
    setSelectedInstallments(pendingInsts)
    setPaymentMethod("Cash")
    setPaymentDialogOpen(true)
  }

  // Record manual fee payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || selectedInstallments.length === 0) return

    setSubmittingPayment(true)
    const installmentIds = selectedInstallments.map((inst) => inst.id)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/admin/fees/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          installment_ids: installmentIds,
          payment_method: paymentMethod,
        }),
      })

      if (!res.ok) throw new Error("Payment record failed")
      const result = await res.json()

      toast.success(`Payment recorded! Receipt: ${result.receipt_no || "REC-OK"}`)
      setPaymentDialogOpen(false)
      
      // Refresh lists
      fetchInstallments(selectedStudent.id)
      fetchStudents()
    } catch (err) {
      console.error(err)
      toast.error("Failed to record fee payment on backend")
    } finally {
      setSubmittingPayment(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Banner */}
      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-xs relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Student Fees Management</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Query individual student registers, view academic fee schedules, and log manual fee payments.
          </p>
        </div>
        <div className="flex gap-2 z-10 text-xs font-semibold select-none border px-3 py-1.5 rounded-lg bg-background text-muted-foreground items-center">
          <Users className="size-4 mr-1 text-primary" /> Active Clerk: {username}
        </div>
      </section>

      {/* Dual Pane Layout */}
      <div className="grid gap-6 md:grid-cols-[1.25fr_1.75fr]">
        
        {/* Left Pane: Student search & selector list */}
        <Card className="flex flex-col h-[650px] shadow-xs">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Student Roster</CardTitle>
            <CardDescription>Select a student to audit or collect fees.</CardDescription>
            
            {/* Roster Filters */}
            <div className="space-y-2 mt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs bg-muted/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="text-xs bg-muted/20 h-8">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classesList.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={duesFilter} onValueChange={setDuesFilter}>
                  <SelectTrigger className="text-xs bg-muted/20 h-8">
                    <SelectValue placeholder="Dues Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="dues">Has Dues</SelectItem>
                    <SelectItem value="nodues">No Dues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {loadingStudents ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredStudents.length ? (
              <div className="divide-y">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id
                  const hasDues = student.outstanding_dues_count > 0
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-muted/80 border-r-4 border-primary" 
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <span>Adm: {student.admission_number || "N/A"}</span>
                          <span>•</span>
                          <span>Class {student.class}-{student.section}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasDues ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0">
                            {student.outstanding_dues_count} Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] py-0">
                            Cleared
                          </Badge>
                        )}
                        <ChevronRight className="size-4 text-muted-foreground/60" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No students found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Pane: Installments Audit & Collection */}
        <div className="flex flex-col h-[650px]">
          {selectedStudent ? (
            <Card className="flex flex-col h-full shadow-xs">
              <CardHeader className="pb-3 border-b flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    {selectedStudent.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">
                    Admission #: <span className="font-mono text-foreground font-semibold">{selectedStudent.admission_number}</span> | Class: <span className="text-foreground font-semibold">{selectedStudent.class}-{selectedStudent.section}</span>
                  </p>
                </div>
                <CardAction>
                  {installments.some(inst => inst.status === "pending" || inst.status === "overdue") && (
                    <Button size="xs" variant="outline" onClick={handleOpenMultiplePayments} className="text-xs gap-1.5">
                      <DollarSign className="size-3.5" /> Collect All Pending
                    </Button>
                  )}
                </CardAction>
              </CardHeader>
              
              <CardContent className="p-0 overflow-y-auto flex-1">
                {loadingInstallments ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-8 w-44" />
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : installments.length ? (
                  <div className="flex flex-col">
                    {/* Itemized Fee Breakdown Card */}
                    {breakdown && (
                      <div className="m-4 p-4 rounded-xl border bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="size-3.5 text-primary" /> Class {breakdown.classNum} Fee Breakdown
                          </span>
                          {breakdown.student?.uses_transport ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[11px] font-semibold gap-1">
                              <Bus className="size-3" /> School Transport Opted (+{formatCurrency(breakdown.transportFeeApplied)}/mo)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                              Self Transport
                            </Badge>
                          )}
                        </div>

                        {/* Components tags */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {breakdown.components.map((comp: any) => (
                            <div key={comp.id || comp.name} className="text-xs border px-2.5 py-1 rounded-lg bg-background flex items-center gap-2">
                              <span className="font-medium text-foreground">{comp.name}</span>
                              <span className="text-muted-foreground font-mono text-[11px]">{formatCurrency(comp.amount)}/{comp.billingPeriod ? comp.billingPeriod[0] : "mo"}</span>
                            </div>
                          ))}
                          {breakdown.student?.uses_transport && (
                            <div className="text-xs border border-blue-500/30 px-2.5 py-1 rounded-lg bg-blue-500/5 text-blue-700 dark:text-blue-400 flex items-center gap-2 font-semibold">
                              <Bus className="size-3" /> Transport Surcharge
                              <span className="font-mono text-[11px]">{formatCurrency(breakdown.transportFeeApplied)}/mo</span>
                            </div>
                          )}
                        </div>

                        {/* Totals Summary */}
                        <div className="pt-2 border-t flex items-center justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Calculated Monthly Installment Amount:</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(breakdown.netMonthlyTotal)} / month</span>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-semibold text-xs py-3 pl-6">Fee Month</TableHead>
                          <TableHead className="font-semibold text-xs py-3">Due Date</TableHead>
                          <TableHead className="font-semibold text-xs py-3">Status</TableHead>
                          <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                          <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {installments.map((inst) => {
                          const isPaid = inst.status === "paid"
                          const isOverdue = inst.status === "overdue"
                          const isPending = inst.status === "pending"
                          
                          return (
                            <TableRow key={inst.id} className="hover:bg-muted/10">
                              <TableCell className="font-semibold text-sm py-3 pl-6">
                                {inst.month} {inst.year}
                              </TableCell>
                              <TableCell className="py-3 text-xs text-muted-foreground">
                                {formatDate(inst.due_date)}
                              </TableCell>
                              <TableCell className="py-3">
                                {isPaid ? (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] py-0 font-medium">
                                    Paid
                                  </Badge>
                                ) : isOverdue ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0 font-medium">
                                    Overdue
                                  </Badge>
                                ) : isPending ? (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0 font-medium">
                                    Pending
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-zinc-500/10 text-zinc-700 border-zinc-500/20 text-[10px] py-0 font-medium">
                                    Upcoming
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-3 text-right font-bold tabular-nums">
                                {formatCurrency(inst.amount)}
                              </TableCell>
                              <TableCell className="py-3 text-right pr-6">
                                {isPaid ? (
                                  <div className="flex items-center justify-end text-[10px] text-muted-foreground gap-1.5 font-medium">
                                    <span>Via {inst.payment_method || "Online"}</span>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleOpenPayment(inst)}
                                    disabled={inst.status === "upcoming"}
                                    className="h-7 text-xs px-2"
                                  >
                                    Collect
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                  <div className="p-8 text-center">
                    <EmptyState
                      title="No installments generated"
                      description="Click generate or audit student status to initialize installments."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-dashed p-8 text-center bg-muted/10">
              <Users className="size-12 text-muted-foreground/60 mb-4" />
              <p className="text-base font-semibold">Audit Student Fees</p>
              <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
                Please select a student from the roster list on the left to examine payments history or record payments.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Fees Payment</DialogTitle>
            <DialogDescription>
              Submit payment confirmation. This will instantly change installment status to Paid in the student database.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && selectedInstallments.length > 0 && (
            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div className="bg-muted/40 p-3.5 rounded-xl border space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Student Name:</span>
                  <span className="font-semibold text-foreground">{selectedStudent.name}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Admission Number:</span>
                  <span className="font-mono text-foreground">{selectedStudent.admission_number}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2 border-dashed">
                  <span>Installment Period:</span>
                  <span className="font-semibold text-foreground">
                    {selectedInstallments.map((inst) => `${inst.month} ${inst.year}`).join(", ")}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t pt-2 mt-1">
                  <span>Total Due:</span>
                  <span className="text-emerald-600">
                    {formatCurrency(selectedInstallments.reduce((sum, inst) => sum + inst.amount, 0))}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Channel / Mode</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Payment Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash Payment</SelectItem>
                    <SelectItem value="UPI">UPI / Digital</SelectItem>
                    <SelectItem value="Card">Credit/Debit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingPayment} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                  {submittingPayment && <Loader2 className="size-4 animate-spin" />}
                  Confirm Payment Collect
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
