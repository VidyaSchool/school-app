"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Users,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  CheckCircle2,
  FileSpreadsheet,
  Coins,
  Send,
  Loader2,
  ArrowUpRight,
  Printer,
} from "lucide-react"

interface StaffPayroll {
  id: string
  name: string
  role: string
  baseSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: "Paid" | "Pending"
  disbursementDate: string | null
}

const INITIAL_STAFF: StaffPayroll[] = [
  { id: "staff-1", name: "Alok Sharma", role: "PGT Physics Teacher", baseSalary: 45000, allowances: 4000, deductions: 2000, netSalary: 47000, status: "Paid", disbursementDate: "2024-06-25" },
  { id: "staff-2", name: "Sunita Patel", role: "TGT Mathematics Teacher", baseSalary: 38000, allowances: 3500, deductions: 1800, netSalary: 39700, status: "Paid", disbursementDate: "2024-06-25" },
  { id: "staff-3", name: "Ramesh Verma", role: "IT Administrator", baseSalary: 35000, allowances: 3000, deductions: 1500, netSalary: 36500, status: "Pending", disbursementDate: null },
  { id: "staff-4", name: "Priya Nair", role: "Primary School Teacher", baseSalary: 32000, allowances: 2500, deductions: 1500, netSalary: 33000, status: "Paid", disbursementDate: "2024-06-25" },
  { id: "staff-5", name: "Vikram Singh", role: "Academic Coordinator", baseSalary: 55000, allowances: 5000, deductions: 2500, netSalary: 57500, status: "Pending", disbursementDate: null },
  { id: "staff-6", name: "Geeta Rao", role: "Senior Accountant", baseSalary: 42000, allowances: 4000, deductions: 2000, netSalary: 44000, status: "Paid", disbursementDate: "2024-06-25" },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function PayrollClient({ username }: { username: string }) {
  const [staff, setStaff] = useState<StaffPayroll[]>(INITIAL_STAFF)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Salary slip dialog
  const [activeStaff, setActiveStaff] = useState<StaffPayroll | null>(null)
  
  // Payroll disbursement loading state
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isProcessingAll, setIsProcessingAll] = useState(false)

  // Filtered list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchRole = roleFilter === "all" || s.role.toLowerCase().includes(roleFilter.toLowerCase())
      const matchStatus = statusFilter === "all" || s.status === statusFilter
      return matchQuery && matchRole && matchStatus
    })
  }, [staff, searchQuery, roleFilter, statusFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    let disbursed = 0
    let pending = 0
    staff.forEach((s) => {
      if (s.status === "Paid") disbursed += s.netSalary
      else pending += s.netSalary
    })
    return { disbursed, pending, total: disbursed + pending }
  }, [staff])

  // Disburse individual salary
  const handleDisburseSalary = (staffId: string, name: string) => {
    setProcessingId(staffId)
    setTimeout(() => {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId 
            ? { ...s, status: "Paid", disbursementDate: new Date().toISOString().split("T")[0] } 
            : s
        )
      )
      setProcessingId(null)
      toast.success(`Salary of ${formatCurrency(staff.find(s => s.id === staffId)?.netSalary)} successfully disbursed to ${name}!`)
    }, 1500)
  }

  // Disburse all pending salaries
  const handleDisburseAll = () => {
    const hasPending = staff.some((s) => s.status === "Pending")
    if (!hasPending) {
      toast.info("All staff salaries are already disbursed for the active cycle.")
      return
    }

    setIsProcessingAll(true)
    setTimeout(() => {
      setStaff((prev) =>
        prev.map((s) =>
          s.status === "Pending"
            ? { ...s, status: "Paid", disbursementDate: new Date().toISOString().split("T")[0] }
            : s
        )
      )
      setIsProcessingAll(false)
      toast.success("All pending salaries disbursed successfully!", {
        icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      })
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Staff Payroll Management</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Oversee staff salary distributions, calculate deductions and allowances, and trigger bank disbursements.
          </p>
        </div>
        <Button size="sm" onClick={handleDisburseAll} disabled={isProcessingAll} className="gap-1.5 shadow-xs font-semibold z-10">
          {isProcessingAll ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Disburse All Pending
        </Button>
      </section>

      {/* Stats Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Disbursed Salaries</CardTitle>
            <CardAction>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(stats.disbursed)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Paid this cycle</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pending Disbursements</CardTitle>
            <CardAction>
              <Loader2 className="size-4 text-amber-500 animate-pulse" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(stats.pending)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Scheduled for wire release</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Payroll Budget</CardTitle>
            <CardAction>
              <Briefcase className="size-4 text-blue-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(stats.total)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Combined monthly cost</p>
          </CardContent>
        </Card>
      </section>

      {/* Roster table */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Staff Payroll Roster</CardTitle>
              <CardDescription>Review wages, allowances, and pay slips.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/20"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 text-xs bg-muted/20 rounded-lg border px-2 py-1 outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Administrators</option>
                <option value="account">Accountants</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs bg-muted/20 rounded-lg border px-2 py-1 outline-hidden"
              >
                <option value="all">Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredStaff.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableRow className="contents" />
                  <TableHead className="font-semibold text-xs py-3 pl-6">ID</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Staff Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Role / Department</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Base Salary</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Deductions</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Net Wages</TableHead>
                  <TableHead className="font-semibold text-xs py-3">State</TableHead>
                  <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">
                      {s.id.toUpperCase()}
                    </TableCell>
                    <TableCell className="py-3 font-semibold text-sm">
                      {s.name}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                      {s.role}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(s.baseSalary)}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums text-rose-600">
                      -{formatCurrency(s.deductions)}
                    </TableCell>
                    <TableCell className="py-3 text-right font-bold tabular-nums text-foreground">
                      {formatCurrency(s.netSalary)}
                    </TableCell>
                    <TableCell className="py-3">
                      {s.status === "Paid" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] py-0 font-medium">
                          Paid
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0 font-medium animate-pulse">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6 space-x-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setActiveStaff(s)}
                        className="h-7 text-xs px-2"
                      >
                        Salary Slip
                      </Button>
                      {s.status === "Pending" && (
                        <Button
                          size="xs"
                          onClick={() => handleDisburseSalary(s.id, s.name)}
                          disabled={processingId === s.id}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 px-2"
                        >
                          {processingId === s.id ? <Loader2 className="size-3 animate-spin" /> : "Pay"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No staff members match selected filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Salary Slip receipt */}
      <Dialog open={activeStaff !== null} onOpenChange={(open) => !open && setActiveStaff(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border bg-background">
          {activeStaff && (
            <div className="flex flex-col">
              <div className="bg-muted/50 p-6 border-b text-center">
                <Badge variant="secondary" className="mb-2 font-bold">{activeStaff.status === "Paid" ? "Salary Disbursed" : "Awaiting Process"}</Badge>
                <p className="text-xs font-bold text-primary tracking-widest uppercase">VidyaSchool Salary Statement</p>
                <div className="mt-4 text-3xl font-extrabold text-foreground">
                  {formatCurrency(activeStaff.netSalary)}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">
                  PAYROLL REF: SLIP-{activeStaff.id.toUpperCase()}
                </p>
              </div>

              <div className="p-6 space-y-3.5 text-sm">
                <div className="grid grid-cols-2 py-1 border-b border-dashed">
                  <span className="text-muted-foreground">Employee Name</span>
                  <span className="text-right font-medium">{activeStaff.name}</span>
                </div>
                <div className="grid grid-cols-2 py-1 border-b border-dashed">
                  <span className="text-muted-foreground">Department / Role</span>
                  <span className="text-right font-medium">{activeStaff.role}</span>
                </div>
                <div className="grid grid-cols-2 py-1 border-b border-dashed">
                  <span className="text-muted-foreground">Basic Pay Base</span>
                  <span className="text-right font-medium">{formatCurrency(activeStaff.baseSalary)}</span>
                </div>
                <div className="grid grid-cols-2 py-1 border-b border-dashed text-emerald-600">
                  <span>Allowances & HRA</span>
                  <span className="text-right font-medium">+{formatCurrency(activeStaff.allowances)}</span>
                </div>
                <div className="grid grid-cols-2 py-1 border-b border-dashed text-rose-600">
                  <span>Taxes & Deductions</span>
                  <span className="text-right font-medium">-{formatCurrency(activeStaff.deductions)}</span>
                </div>
                <div className="grid grid-cols-2 py-1 border-b border-dashed">
                  <span className="text-muted-foreground">Disbursement Date</span>
                  <span className="text-right font-medium">{activeStaff.disbursementDate || "Pending release"}</span>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t bg-muted/20">
                <Button
                  variant="outline"
                  className="flex-grow-0 shrink-0 aspect-square p-2.5"
                  onClick={() => toast.info("Statement queued on printer spool...")}
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => toast.success("Payslip exported as spreadsheet CSV!")}
                >
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  CSV Payslip
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setActiveStaff(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
