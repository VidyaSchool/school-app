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
  AlertCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRightLeft,
} from "lucide-react"

interface RefundItem {
  id: string
  studentName: string
  classSection: string
  category: "Caution Money" | "Duplicate Fee" | "Admission Cancellation"
  amount: number
  date: string
  status: "Processed" | "Pending" | "Rejected"
}

const INITIAL_REFUNDS: RefundItem[] = [
  { id: "REF-2024-001", studentName: "Rohan Gupta", classSection: "Class 12-A", category: "Caution Money", amount: 5000, date: "2024-06-25", status: "Processed" },
  { id: "REF-2024-002", studentName: "Seema Das", classSection: "Class 6-B", category: "Duplicate Fee", amount: 15000, date: "2024-06-23", status: "Pending" },
  { id: "REF-2024-003", studentName: "Amit Kumar", classSection: "Class 1-C", category: "Admission Cancellation", amount: 20000, date: "2024-06-18", status: "Rejected" },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function RefundsClient({ username }: { username: string }) {
  const [refunds, setRefunds] = useState<RefundItem[]>(INITIAL_REFUNDS)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)

  // Form state
  const [formStudent, setFormStudent] = useState("")
  const [formClass, setFormClass] = useState("Class 10-A")
  const [formCategory, setFormCategory] = useState<"Caution Money" | "Duplicate Fee" | "Admission Cancellation">("Caution Money")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])

  // Filtered list
  const filteredRefunds = useMemo(() => {
    return refunds.filter((ref) => {
      const matchQuery = ref.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || ref.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === "all" || ref.status === statusFilter
      return matchQuery && matchStatus
    })
  }, [refunds, searchQuery, statusFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    let processed = 0
    let pending = 0
    refunds.forEach((r) => {
      if (r.status === "Processed") processed += r.amount
      else if (r.status === "Pending") pending += r.amount
    })
    return { processed, pending, count: refunds.length }
  }, [refunds])

  const handleCreateRefund = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)

    if (!formStudent.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid student name and amount")
      return
    }

    const newRefund: RefundItem = {
      id: `REF-2024-${String(refunds.length + 1).padStart(3, "0")}`,
      studentName: formStudent,
      classSection: formClass,
      category: formCategory,
      amount: amt,
      date: formDate,
      status: "Pending",
    }

    setRefunds((prev) => [newRefund, ...prev])
    toast.success(`Refund request ${newRefund.id} submitted for clearance`)
    setRefundDialogOpen(false)

    // Reset Form
    setFormStudent("")
    setFormAmount("")
  }

  const handleDeleteRefund = (id: string, description: string) => {
    setRefunds((prev) => prev.filter((r) => r.id !== id))
    toast.warning(`Cancelled refund request: "${description}"`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Refund Registry Ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Record duplication fees adjustments, cautionary deposits refunds, and withdrawal payouts.
          </p>
        </div>
        <Button size="sm" onClick={() => setRefundDialogOpen(true)} className="gap-1.5 shadow-xs font-semibold z-10">
          <Plus className="size-4" /> Initiate Refund
        </Button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Total Disbursed Refunds</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums text-emerald-600">{formatCurrency(stats.processed)}</p></CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Pending Requests</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums text-amber-600">{formatCurrency(stats.pending)}</p></CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Total Logs Count</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums">{stats.count}</p></CardContent>
        </Card>
      </section>

      {/* Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Ledger Refunds</CardTitle>
              <CardDescription>Verify disbursements history.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search student..."
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
                <option value="Processed">Processed</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredRefunds.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold text-xs py-3 pl-6">Refund ID</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Student Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Class Bracket</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Category</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Posting Date</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Status</TableHead>
                  <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((ref) => (
                  <TableRow key={ref.id} className="hover:bg-muted/10 group">
                    <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">{ref.id}</TableCell>
                    <TableCell className="py-3 font-semibold text-sm">{ref.studentName}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{ref.classSection}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{ref.category}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{ref.date}</TableCell>
                    <TableCell className="py-3 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(ref.amount)}</TableCell>
                    <TableCell className="py-3 text-right">
                      {ref.status === "Processed" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]">Processed</Badge>
                      ) : ref.status === "Rejected" ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/20 text-[10px]">Rejected</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] animate-pulse">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRefund(ref.id, ref.studentName)} className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-75 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">No refunds match filters.</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Initiate Refund */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Initiate Fees Refund</DialogTitle>
            <DialogDescription>Submit a refund request for security deposits or excess payments.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRefund} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="refName">Student Name</Label>
              <Input id="refName" value={formStudent} onChange={(e) => setFormStudent(e.target.value)} placeholder="e.g. Rohan Gupta" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="refClass">Class Bracket</Label>
                <Select value={formClass} onValueChange={setFormClass}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class 10-A">Class 10-A</SelectItem>
                    <SelectItem value="Class 12-A">Class 12-A</SelectItem>
                    <SelectItem value="Class 6-B">Class 6-B</SelectItem>
                    <SelectItem value="Class 1-C">Class 1-C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="refAmount">Amount (INR)</Label>
                <Input id="refAmount" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="₹" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="refCat">Refund Classification</Label>
              <Select value={formCategory} onValueChange={(val: any) => setFormCategory(val)}>
                <SelectTrigger><SelectValue placeholder="Classification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caution Money">Caution Money Deposit</SelectItem>
                  <SelectItem value="Duplicate Fee">Duplicate Payment Adjustment</SelectItem>
                  <SelectItem value="Admission Cancellation">Admission Cancellation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="refDate">Date</Label>
              <Input id="refDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
