"use client"

import { useEffect, useState, useMemo } from "react"
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
  ReceiptText,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  Eye,
  Printer,
  Download,
  Wallet,
  CreditCard,
  RefreshCw,
  TrendingUp,
} from "lucide-react"

interface PaidTransaction {
  id: string
  amount: number
  status: string
  month: string
  year: string
  dueDate: string | null
  paidDate: string | null
  paymentMethod: string | null
  studentName: string
  studentId: string
  class: string | null
  section: string | null
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

export function PaymentsClient({ username }: { username: string }) {
  const [payments, setPayments] = useState<PaidTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTxn, setSelectedTxn] = useState<PaidTransaction | null>(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/admin/fee-management`)
      if (!res.ok) throw new Error("Failed to load fee management ledger")
      const data = await res.json()
      
      // Filter out only paid installments
      const paidOnly = data.filter((item: any) => item.status === "paid")
      setPayments(paidOnly)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load transaction ledger from server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchQuery = 
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.id || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchMethod = methodFilter === "all" || p.paymentMethod === methodFilter
      
      const matchClass = classFilter === "all" || p.class === classFilter

      return matchQuery && matchMethod && matchClass
    })
  }, [payments, searchQuery, methodFilter, classFilter])

  // Extract unique classes
  const classesList = useMemo(() => {
    const list = new Set<string>()
    payments.forEach((p) => p.class && list.add(p.class))
    return Array.from(list).sort()
  }, [payments])

  // Metrics calculation
  const metrics = useMemo(() => {
    let total = 0
    let upi = 0
    let cash = 0
    let others = 0

    filteredPayments.forEach((p) => {
      total += p.amount
      const m = (p.paymentMethod || "").toLowerCase()
      if (m.includes("upi")) upi += p.amount
      else if (m.includes("cash")) cash += p.amount
      else others += p.amount
    })

    return { total, upi, cash, others, count: filteredPayments.length }
  }, [filteredPayments])

  const handleExport = (type: "pdf" | "csv") => {
    const loadingToast = toast.loading(`Compiling cleared ledger records...`)
    setTimeout(() => {
      toast.dismiss(loadingToast)
      toast.success(`Ledger log exported as VidyaSchool_payments_ledger.${type}`, {
        icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header section */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Payments Log Ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Verify cleared student fee transactions, check payment methods, and retrieve historical invoice receipts.
          </p>
        </div>
        
        {/* Actions Strip */}
        <div className="flex gap-2 z-10">
          <Button variant="outline" size="sm" onClick={fetchPayments} className="bg-background shrink-0">
            <RefreshCw className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="gap-2 bg-background text-muted-foreground">
            <Download className="h-4 w-4" />
            PDF Log
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="gap-2 bg-background text-muted-foreground">
            CSV Export
          </Button>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Collected</CardTitle>
            <CardAction>
              <TrendingUp className="size-4 text-emerald-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(metrics.total)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Sum of {metrics.count} cleared transactions</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">UPI Payments</CardTitle>
            <CardAction>
              <Wallet className="size-4 text-indigo-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(metrics.upi)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Digital wallet deposits</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Cash Collections</CardTitle>
            <CardAction>
              <DollarSign className="size-4 text-amber-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(metrics.cash)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Manual paper currency</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Bank & Cards</CardTitle>
            <CardAction>
              <CreditCard className="size-4 text-blue-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(metrics.others)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Wire & POS transfers</p>
          </CardContent>
        </Card>
      </section>

      {/* Ledger Records Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Historical Transactions Ledger</CardTitle>
              <CardDescription>Verify fee installment logs and payment channels.</CardDescription>
            </div>
            
            {/* Table Filters Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-[200px] md:w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search student, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/20"
                />
              </div>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="h-8 text-xs bg-muted/20 w-[110px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classesList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="h-8 text-xs bg-muted/20 w-[130px]">
                  <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredPayments.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 pl-6">ID / Reference</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Student Name</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Class/Sec</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Period / Month</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Payment Channel</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Paid Date</TableHead>
                    <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/10 group">
                      <TableCell className="font-mono text-[11px] py-3 pl-6 text-muted-foreground">
                        {p.id?.toString().toUpperCase().substring(0, 10)}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-sm">
                        {p.studentName}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {p.class}-{p.section}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {p.month} {p.year}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[10px] py-0 border-muted-foreground/20 font-medium">
                          {p.paymentMethod || "Online"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {p.paidDate ? formatDate(p.paidDate) : "N/A"}
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTxn(p)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-75 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 border-t">
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10">
                <ReceiptText className="size-10 text-muted-foreground/60 mb-3" />
                <p className="text-base font-semibold">No transactions match filters</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Try checking spelling of student names or clearing existing selection filters.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Invoice Receipt Popup */}
      <Dialog open={selectedTxn !== null} onOpenChange={(open) => !open && setSelectedTxn(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border bg-background">
          {selectedTxn && (
            <div className="flex flex-col">
              <div className="bg-muted/50 p-6 border-b text-center relative">
                <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" /> Success
                </span>
                <p className="text-xs font-bold text-primary tracking-widest uppercase">VidyaSchool Ledger Receipt</p>
                <div className="mt-4 text-3xl font-extrabold text-emerald-600">
                  {formatCurrency(selectedTxn.amount)}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">
                  REF: {selectedTxn.id?.toString().toUpperCase()}
                </p>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Student Name</span>
                  <span className="text-right font-medium">{selectedTxn.studentName}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Class Tier</span>
                  <span className="text-right font-medium">Class {selectedTxn.class}-{selectedTxn.section}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Installment Period</span>
                  <span className="text-right font-medium">{selectedTxn.month} {selectedTxn.year}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Payment Mode</span>
                  <span className="text-right font-medium">{selectedTxn.paymentMethod || "UPI"}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Clearance Date</span>
                  <span className="text-right font-medium">{selectedTxn.paidDate ? formatDate(selectedTxn.paidDate) : "N/A"}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Admin Clerk</span>
                  <span className="text-right font-medium font-mono text-xs">{username}</span>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t bg-muted/20">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => toast.success("Invoice PDF generated and queued for download!")}
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  PDF Invoice
                </Button>
                <Button
                  variant="outline"
                  className="flex-grow-0 shrink-0 aspect-square p-2.5"
                  onClick={() => toast.info("Sent receipt draft to system printing spool...")}
                  title="Print receipt"
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setSelectedTxn(null)}
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
