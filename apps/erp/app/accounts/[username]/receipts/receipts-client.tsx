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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Receipt,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Printer,
  Download,
  DollarSign,
  Wallet,
  CreditCard,
} from "lucide-react"

interface ReceiptItem {
  id: string
  studentName: string
  classSection: string
  description: string
  amount: number
  paidDate: string
  paymentMethod: string
}

const INITIAL_RECEIPTS: ReceiptItem[] = [
  { id: "REC-2024-814", studentName: "John Doe", classSection: "Class 10-A", description: "Tuition Fee - June", amount: 15000, paidDate: "2024-06-27", paymentMethod: "UPI" },
  { id: "REC-2024-815", studentName: "Bob Johnson", classSection: "Class 11-C", description: "Tuition Fee - June", amount: 18000, paidDate: "2024-06-25", paymentMethod: "UPI" },
  { id: "REC-2024-816", studentName: "Jane Smith", classSection: "Class 9-B", description: "Admission & Registration Fees", amount: 14000, paidDate: "2024-06-21", paymentMethod: "Cash" },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function ReceiptsClient({ username }: { username: string }) {
  const [receipts] = useState<ReceiptItem[]>(INITIAL_RECEIPTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null)

  // Filtered list
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rec) => {
      const matchQuery = rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || rec.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchMethod = methodFilter === "all" || rec.paymentMethod === methodFilter
      return matchQuery && matchMethod
    })
  }, [receipts, searchQuery, methodFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    let total = 0
    let upi = 0
    let cash = 0
    receipts.forEach((r) => {
      total += r.amount
      if (r.paymentMethod.toLowerCase() === "upi") upi += r.amount
      else cash += r.amount
    })
    return { total, upi, cash }
  }, [receipts])

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Receipts Log Ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Retrieve, verify, and reprint generated fee receipts issued to student accounts.
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Total Cash Settled</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums">{formatCurrency(stats.total)}</p></CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">UPI Settled</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums text-indigo-600">{formatCurrency(stats.upi)}</p></CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Cash Settled</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums text-amber-600">{formatCurrency(stats.cash)}</p></CardContent>
        </Card>
      </section>

      {/* Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Ledger Receipts</CardTitle>
              <CardDescription>Verify settlement records.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full max-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search receipt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/20"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-8 text-xs bg-muted/20 rounded-lg border px-2 py-1 outline-hidden"
              >
                <option value="all">All Channels</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredReceipts.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold text-xs py-3 pl-6">Receipt ID</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Student Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Class/Sec</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Description</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Paid Date</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Channel</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-muted/10 group">
                    <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">{rec.id}</TableCell>
                    <TableCell className="py-3 font-semibold text-sm">{rec.studentName}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{rec.classSection}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{rec.description}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{rec.paidDate}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{rec.paymentMethod}</TableCell>
                    <TableCell className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(rec.amount)}</TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedReceipt(rec)} className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-75 group-hover:opacity-100 transition-opacity">
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">No receipts match filters.</div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={selectedReceipt !== null} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border bg-background">
          {selectedReceipt && (
            <div className="flex flex-col">
              <div className="bg-muted/50 p-6 border-b text-center relative">
                <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" /> Success
                </span>
                <p className="text-xs font-bold text-primary tracking-widest uppercase">VidyaSchool Ledger Receipt</p>
                <div className="mt-4 text-3xl font-extrabold text-emerald-600">
                  {formatCurrency(selectedReceipt.amount)}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">REF: {selectedReceipt.id}</p>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed"><span className="text-muted-foreground">Student Name</span><span className="text-right font-medium">{selectedReceipt.studentName}</span></div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed"><span className="text-muted-foreground">Class Tier</span><span className="text-right font-medium">{selectedReceipt.classSection}</span></div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed"><span className="text-muted-foreground">Installment Period</span><span className="text-right font-medium">{selectedReceipt.description}</span></div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed"><span className="text-muted-foreground">Payment Mode</span><span className="text-right font-medium">{selectedReceipt.paymentMethod}</span></div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed"><span className="text-muted-foreground">Clearance Date</span><span className="text-right font-medium">{selectedReceipt.paidDate}</span></div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed"><span className="text-muted-foreground">Admin Clerk</span><span className="text-right font-medium font-mono text-xs">{username}</span></div>
              </div>

              <div className="flex gap-2 p-4 border-t bg-muted/20">
                <Button variant="outline" className="flex-grow-0 shrink-0 aspect-square p-2.5" onClick={() => toast.info("Statement queued on printer spool...")}>
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => toast.success("Receipt invoice PDF generated!")}>
                  <Download className="h-4 w-4 text-muted-foreground" />
                  PDF Receipt
                </Button>
                <Button className="flex-1" onClick={() => setSelectedReceipt(null)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
