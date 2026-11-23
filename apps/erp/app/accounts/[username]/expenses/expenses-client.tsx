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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Wallet,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  Receipt,
  FileCheck2,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  PieChart as PieIcon,
  Percent,
  AlertCircle,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

interface ExpenseItem {
  id: string
  description: string
  category: string
  amount: number
  date: string
  status: "Paid" | "Pending" | "Voided"
  paymentMethod: string
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: "exp-1", description: "Electricity Bill - June", category: "Utilities", amount: 8500, date: "2024-06-26", status: "Paid", paymentMethod: "Bank Transfer" },
  { id: "exp-2", description: "Teacher Salaries - June", category: "Payroll", amount: 120000, date: "2024-06-24", status: "Paid", paymentMethod: "Bank Transfer" },
  { id: "exp-3", description: "Internet & Digital Services", category: "Utilities", amount: 4500, date: "2024-06-22", status: "Paid", paymentMethod: "Card" },
  { id: "exp-4", description: "Laboratory Equipment Purchase", category: "Academic Supplies", amount: 25000, date: "2024-06-20", status: "Paid", paymentMethod: "Card" },
  { id: "exp-5", description: "HVAC System Service", category: "Maintenance", amount: 12500, date: "2024-06-18", status: "Paid", paymentMethod: "Cash" },
  { id: "exp-6", description: "Staff Commute Reimbursement", category: "Payroll", amount: 6200, date: "2024-06-15", status: "Pending", paymentMethod: "Cash" },
  { id: "exp-7", description: "Classroom Supplies (Markers/Paper)", category: "Academic Supplies", amount: 3200, date: "2024-06-12", status: "Paid", paymentMethod: "UPI" },
]

const expenseChartConfig = {
  value: {
    label: "Amount",
  },
} satisfies ChartConfig

const expenseColors = [
  "oklch(0.608 0.198 18.5)",  // Utilities: Rose
  "oklch(0.55 0.2 250)",     // Payroll: Blue
  "oklch(0.585 0.233 277)",   // Academic Supplies: Indigo
  "oklch(0.769 0.188 70)",    // Maintenance: Amber
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function ExpensesClient({ username }: { username: string }) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Log Expense Dialog form state
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("Utilities")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formMethod, setFormMethod] = useState("Bank Transfer")
  const [formStatus, setFormStatus] = useState<"Paid" | "Pending">("Paid")

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchQuery = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = categoryFilter === "all" || e.category === categoryFilter
      const matchStatus = statusFilter === "all" || e.status === statusFilter
      return matchQuery && matchCat && matchStatus
    })
  }, [expenses, searchQuery, categoryFilter, statusFilter])

  // Aggregate Category Data for Chart
  const chartData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      if (e.status !== "Voided") {
        map[e.category] = (map[e.category] || 0) + e.amount
      }
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [expenses])

  // Summary Metrics
  const metrics = useMemo(() => {
    let total = 0
    let pending = 0
    expenses.forEach((e) => {
      if (e.status === "Paid") total += e.amount
      else if (e.status === "Pending") pending += e.amount
    })
    return { total, pending, count: expenses.length }
  }, [expenses])

  // List of unique categories
  const categoriesList = useMemo(() => {
    const list = new Set<string>()
    expenses.forEach((e) => list.add(e.category))
    return Array.from(list)
  }, [expenses])

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)

    if (!formDescription.trim()) {
      toast.error("Please enter expense description")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: formDescription,
      category: formCategory,
      amount: amt,
      date: formDate,
      status: formStatus,
      paymentMethod: formMethod,
    }

    setExpenses((prev) => [newItem, ...prev])
    toast.success(`Expense entry logged successfully!`)
    setLogDialogOpen(false)

    // Reset Form
    setFormDescription("")
    setFormAmount("")
  }

  const handleDeleteExpense = (id: string, description: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    toast.warning(`Removed expense log for "${description}"`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">School Expenses Ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Record maintenance costs, utility payments, payroll allocations, and log structural school costs.
          </p>
        </div>
        <Button size="sm" onClick={() => setLogDialogOpen(true)} className="gap-1.5 shadow-xs font-semibold z-10">
          <Plus className="size-4" /> Log Expense
        </Button>
      </section>

      {/* Top metrics summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Disbursed Expenses</CardTitle>
            <CardAction>
              <TrendingDown className="size-4 text-rose-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(metrics.total)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Cleared operational expenses</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pending Disbursements</CardTitle>
            <CardAction>
              <AlertCircle className="size-4 text-amber-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(metrics.pending)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Awaiting clerk or admin clearance</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Log Count</CardTitle>
            <CardAction>
              <Receipt className="size-4 text-blue-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{metrics.count}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Logged operational invoice items</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
        
        {/* Table View */}
        <Card className="shadow-xs border flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">General Expenditures</CardTitle>
                <CardDescription>Ledger records of school spending.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-muted/20"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs bg-muted/20 w-[110px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Categories</SelectItem>
                    {categoriesList.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-muted/20 w-[100px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {filteredExpenses.length ? (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 pl-6">ID</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Description</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Category</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Mode</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Status</TableHead>
                    <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((exp) => (
                    <TableRow key={exp.id} className="hover:bg-muted/10 group">
                      <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">
                        {exp.id.startsWith("exp-") ? exp.id.toUpperCase().substring(4, 10) : exp.id}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-sm">
                        {exp.description}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {exp.category}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {exp.paymentMethod}
                      </TableCell>
                      <TableCell className="py-3">
                        {exp.status === "Paid" ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] py-0 font-medium">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0 font-medium animate-pulse">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(exp.id, exp.description)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-75 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No expense logs found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Chart */}
        <Card className="shadow-xs border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="size-4 text-primary" /> Cost Centers Allocation
            </CardTitle>
            <CardDescription>Relative spending breakdown across categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center pb-6">
            {chartData.length ? (
              <div className="space-y-6">
                <div className="relative mx-auto aspect-square h-40">
                  <ChartContainer config={expenseChartConfig} className="w-full h-full">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(val) => formatCurrency(Number(val))} />} />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {chartData.map((entry, idx) => (
                          <Cell key={entry.name} fill={expenseColors[idx % expenseColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Costs</span>
                    <span className="text-base font-extrabold text-rose-600">
                      {formatCurrency(metrics.total / 1000).replace("₹", "")}k
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {chartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs border rounded-xl px-3 py-2 bg-muted/10">
                      <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <span className="size-2 rounded shrink-0" style={{ backgroundColor: expenseColors[idx % expenseColors.length] }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No active records.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Log Expense */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Operational Expense</DialogTitle>
            <DialogDescription>
              Record an outgoing transaction. This directly registers under debited costs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="expDesc">Description</Label>
              <Input
                id="expDesc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Science lab chemical restocking"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="expCat">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Payroll">Payroll</SelectItem>
                    <SelectItem value="Academic Supplies">Academic Supplies</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expAmount">Amount (INR)</Label>
                <Input
                  id="expAmount"
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="₹"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="expMethod">Payment Method</Label>
                <Select value={formMethod} onValueChange={setFormMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expStatus">Approval State</Label>
                <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Cleared / Paid</SelectItem>
                    <SelectItem value="Pending">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expDate">Date of Transaction</Label>
              <Input
                id="expDate"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setLogDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
                Log Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
