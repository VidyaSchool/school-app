"use client"

import { useState, useMemo } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
} from "lucide-react"

interface InvoiceItem {
  id: string
  studentName: string
  classSection: string
  description: string
  amount: number
  dueDate: string
  status: "Paid" | "Unpaid" | "Overdue"
}

const INITIAL_INVOICES: InvoiceItem[] = [
  { id: "INV-2024-001", studentName: "John Doe", classSection: "Class 10-A", description: "Tuition Fee - June", amount: 15000, dueDate: "2024-06-30", status: "Paid" },
  { id: "INV-2024-002", studentName: "Jane Smith", classSection: "Class 9-B", description: "Tuition Fee - June", amount: 14000, dueDate: "2024-06-30", status: "Unpaid" },
  { id: "INV-2024-003", studentName: "Bob Johnson", classSection: "Class 11-C", description: "Tuition Fee - June", amount: 18000, dueDate: "2024-06-30", status: "Paid" },
  { id: "INV-2024-004", studentName: "Alice Brown", classSection: "Class 8-A", description: "Admission & Uniform Fee", amount: 22000, dueDate: "2024-06-15", status: "Overdue" },
  { id: "INV-2024-005", studentName: "Charlie Green", classSection: "Class 12-B", description: "Exam Fee Q1", amount: 3500, dueDate: "2024-06-25", status: "Unpaid" },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function InvoicesClient({ username }: { username: string }) {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
  // Form state
  const [formStudent, setFormStudent] = useState("")
  const [formClass, setFormClass] = useState("Class 10-A")
  const [formDesc, setFormDesc] = useState("Tuition Fee - June")
  const [formAmount, setFormAmount] = useState("")
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split("T")[0])

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchQuery = inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === "all" || inv.status === statusFilter
      return matchQuery && matchStatus
    })
  }, [invoices, searchQuery, statusFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    let total = 0
    let paid = 0
    let unpaid = 0
    let overdue = 0

    invoices.forEach((inv) => {
      total += inv.amount
      if (inv.status === "Paid") paid += inv.amount
      else if (inv.status === "Unpaid") unpaid += inv.amount
      else overdue += inv.amount
    })

    return { total, paid, unpaid, overdue }
  }, [invoices])

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)

    if (!formStudent.trim() || !formDesc.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Please fill in all fields with valid inputs")
      return
    }

    const newInvoice: InvoiceItem = {
      id: `INV-2024-${String(invoices.length + 1).padStart(3, "0")}`,
      studentName: formStudent,
      classSection: formClass,
      description: formDesc,
      amount: amt,
      dueDate: formDueDate,
      status: "Unpaid",
    }

    setInvoices((prev) => [newInvoice, ...prev])
    toast.success(`Invoice ${newInvoice.id} generated for ${formStudent}`)
    setCreateDialogOpen(false)

    // Reset Form
    setFormStudent("")
    setFormAmount("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Invoice Management Ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Generate, query, and monitor invoices billed to student accounts.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-1.5 shadow-xs font-semibold z-10">
          <Plus className="size-4" /> Create Invoice
        </Button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Settled (Paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tabular-nums text-emerald-600">{formatCurrency(stats.paid)}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Outstanding (Unpaid)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tabular-nums text-amber-600">{formatCurrency(stats.unpaid)}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold tabular-nums text-rose-600">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Billed Invoices</CardTitle>
              <CardDescription>Review fee invoices status.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/20"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs bg-muted/20 rounded-lg border px-2 py-1 outline-hidden"
              >
                <option value="all">All States</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredInvoices.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold text-xs py-3 pl-6">Invoice ID</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Student Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Class Bracket</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Description</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Due Date</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">{inv.id}</TableCell>
                    <TableCell className="py-3 font-semibold text-sm">{inv.studentName}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{inv.classSection}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{inv.description}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{inv.dueDate}</TableCell>
                    <TableCell className="py-3 text-right font-bold tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="py-3 text-right">
                      {inv.status === "Paid" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]">Paid</Badge>
                      ) : inv.status === "Overdue" ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/20 text-[10px]">Overdue</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]">Unpaid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">No invoices match selected criteria.</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Create Invoice */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Fee Invoice</DialogTitle>
            <DialogDescription>Create a tuition or exam charge bill.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="studName">Student Name</Label>
              <Input id="studName" value={formStudent} onChange={(e) => setFormStudent(e.target.value)} placeholder="e.g. John Doe" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="studClass">Class Bracket</Label>
                <Select value={formClass} onValueChange={setFormClass}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class 10-A">Class 10-A</SelectItem>
                    <SelectItem value="Class 9-B">Class 9-B</SelectItem>
                    <SelectItem value="Class 11-C">Class 11-C</SelectItem>
                    <SelectItem value="Class 8-A">Class 8-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="invAmount">Amount (INR)</Label>
                <Input id="invAmount" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="₹" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invDesc">Description</Label>
              <Input id="invDesc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invDueDate">Due Date</Label>
              <Input id="invDueDate" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Generate Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
