"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Percent,
  Activity,
  Trash2,
  Calendar,
  Gift,
  Building,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

interface IncomeItem {
  id: string
  description: string
  source: string
  amount: number
  date: string
  paymentMethod: string
}

const INITIAL_INCOME: IncomeItem[] = [
  { id: "inc-1", description: "Tuition Fees Collection - Class 10", source: "Tuition Fees", amount: 154000, date: "2024-06-27", paymentMethod: "UPI" },
  { id: "inc-2", description: "Government STEM Grant - Q2", source: "Grants & Sponsorships", amount: 500000, date: "2024-06-25", paymentMethod: "Bank Transfer" },
  { id: "inc-3", description: "Bus Logistics Fee Collection", source: "Transport Fees", amount: 64000, date: "2024-06-24", paymentMethod: "Cash" },
  { id: "inc-4", description: "Corporate CSR Donation", source: "Donations & Philanthropy", amount: 200000, date: "2024-06-22", paymentMethod: "Bank Transfer" },
  { id: "inc-5", description: "Tuition Fees Collection - Class 9", source: "Tuition Fees", amount: 142000, date: "2024-06-21", paymentMethod: "UPI" },
  { id: "inc-6", description: "Admission & Registration Fees", source: "Admission Fees", amount: 48000, date: "2024-06-18", paymentMethod: "Card" },
]

const incomeChartConfig = {
  value: {
    label: "Amount",
  },
} satisfies ChartConfig

const incomeColors = [
  "oklch(0.645 0.203 142)",  // Tuition Fees: Emerald
  "oklch(0.55 0.2 250)",     // Grants: Blue
  "oklch(0.769 0.188 70)",    // Transport: Amber
  "oklch(0.585 0.233 277)",   // Donations: Indigo
  "oklch(0.67 0.18 200)",    // Admission Fees: Cyan
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function IncomeClient({ username }: { username: string }) {
  const [incomes, setIncomes] = useState<IncomeItem[]>(INITIAL_INCOME)
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")

  // Log Income Dialog form state
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [formDescription, setFormDescription] = useState("")
  const [formSource, setFormSource] = useState("Tuition Fees")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formMethod, setFormMethod] = useState("Bank Transfer")

  // Filtered income list
  const filteredIncome = useMemo(() => {
    return incomes.filter((inc) => {
      const matchQuery = inc.description.toLowerCase().includes(searchQuery.toLowerCase()) || inc.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchSource = sourceFilter === "all" || inc.source === sourceFilter
      return matchQuery && matchSource
    })
  }, [incomes, searchQuery, sourceFilter])

  // Aggregate source breakdown data for donut chart
  const chartData = useMemo(() => {
    const map: Record<string, number> = {}
    incomes.forEach((inc) => {
      map[inc.source] = (map[inc.source] || 0) + inc.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [incomes])

  // Summary Metrics
  const metrics = useMemo(() => {
    let total = 0
    let tuition = 0
    let grants = 0
    let others = 0

    incomes.forEach((inc) => {
      total += inc.amount
      if (inc.source === "Tuition Fees") tuition += inc.amount
      else if (inc.source === "Grants & Sponsorships") grants += inc.amount
      else others += inc.amount
    })

    return { total, tuition, grants, others, count: incomes.length }
  }, [incomes])

  // Unique sources
  const sourcesList = useMemo(() => {
    const list = new Set<string>()
    incomes.forEach((inc) => list.add(inc.source))
    return Array.from(list)
  }, [incomes])

  // Target Annual Goal simulation
  const targetGoal = 2500000
  const targetPercent = Math.min(100, Math.round((metrics.total / targetGoal) * 100))

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)

    if (!formDescription.trim()) {
      toast.error("Please enter income description")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const newItem: IncomeItem = {
      id: `inc-${Date.now()}`,
      description: formDescription,
      source: formSource,
      amount: amt,
      date: formDate,
      paymentMethod: formMethod,
    }

    setIncomes((prev) => [newItem, ...prev])
    toast.success(`Revenue logged! Recalculating charts...`)
    setLogDialogOpen(false)

    setFormDescription("")
    setFormAmount("")
  }

  const handleDeleteIncome = (id: string, description: string) => {
    setIncomes((prev) => prev.filter((inc) => inc.id !== id))
    toast.warning(`Deleted income entry: "${description}"`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Title block */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Revenue & Inflows Ledger</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Administer multi-channel school income, CSR funding, student tuition fee deposits, and grants.
          </p>
        </div>
        <Button size="sm" onClick={() => setLogDialogOpen(true)} className="gap-1.5 shadow-xs font-semibold z-10">
          <Plus className="size-4" /> Log Inflow
        </Button>
      </section>

      {/* Target Progress Banner */}
      <section className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="size-3.5 text-primary" /> Session Treasury Target
              </span>
              <p className="text-xs text-muted-foreground">
                Inflow target trajectory for operations and expansions budget.
              </p>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-emerald-600">{targetPercent}%</span>
          </div>
          <div className="space-y-2">
            <Progress value={targetPercent} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-0.5">
              <span>Current Inflow: {formatCurrency(metrics.total)}</span>
              <span>Target Reserve: {formatCurrency(targetGoal)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-card p-4 flex flex-col justify-between shadow-xs">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tuition Fees</p>
              <p className="text-lg font-bold mt-1.5 tabular-nums text-foreground">
                {formatCurrency(metrics.tuition)}
              </p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
              <Coins className="size-3 text-emerald-500" />
              <span>Core Revenue</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 flex flex-col justify-between shadow-xs">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Grants & CSR</p>
              <p className="text-lg font-bold mt-1.5 tabular-nums text-foreground">
                {formatCurrency(metrics.grants)}
              </p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 w-fit">
              <Building className="size-3 text-indigo-500" />
              <span>Endowments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
        
        {/* Table list */}
        <Card className="shadow-xs border">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Ledger Inflows</CardTitle>
                <CardDescription>Records of logged revenue deposits.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search ledger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-muted/20"
                  />
                </div>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-8 text-xs bg-muted/20 w-[120px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sources</SelectItem>
                    {sourcesList.map((src) => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {filteredIncome.length ? (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 pl-6">ID</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Description</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Source Channel</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Mode</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Date</TableHead>
                    <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncome.map((inc) => (
                    <TableRow key={inc.id} className="hover:bg-muted/10 group">
                      <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">
                        {inc.id.startsWith("inc-") ? inc.id.toUpperCase().substring(4, 10) : inc.id}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-sm">
                        {inc.description}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {inc.source}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {inc.paymentMethod}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {inc.date}
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(inc.amount)}
                      </TableCell>
                      <TableCell className="py-3 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteIncome(inc.id, inc.description)}
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
                No revenue records found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donut chart source share */}
        <Card className="shadow-xs border flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Channel Breakdown
            </CardTitle>
            <CardDescription>Share of revenue by source channel.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center pb-6">
            {chartData.length ? (
              <div className="space-y-6">
                <div className="relative mx-auto aspect-square h-40">
                  <ChartContainer config={incomeChartConfig} className="w-full h-full">
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
                          <Cell key={entry.name} fill={incomeColors[idx % incomeColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Deposits</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {formatCurrency(metrics.total / 100000).replace("₹", "")}L
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {chartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs border rounded-xl px-3 py-2 bg-muted/10">
                      <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <span className="size-2 rounded shrink-0" style={{ backgroundColor: incomeColors[idx % incomeColors.length] }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No active income records.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Log Inflow */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Ledger Inflow</DialogTitle>
            <DialogDescription>
              Record an incoming balance deposit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddIncome} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="incDesc">Description</Label>
              <Input
                id="incDesc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Science Fair CSR sponsorship"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="incSource">Inflow Source</Label>
                <Select value={formSource} onValueChange={setFormSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tuition Fees">Tuition Fees</SelectItem>
                    <SelectItem value="Grants & Sponsorships">Grants & Sponsorships</SelectItem>
                    <SelectItem value="Transport Fees">Transport Fees</SelectItem>
                    <SelectItem value="Donations & Philanthropy">Donations & Philanthropy</SelectItem>
                    <SelectItem value="Admission Fees">Admission Fees</SelectItem>
                    <SelectItem value="Other Inflow">Other Inflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="incAmount">Amount (INR)</Label>
                <Input
                  id="incAmount"
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="₹"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="incMethod">Payment Channel</Label>
                <Select value={formMethod} onValueChange={setFormMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI / Digital</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="incDate">Date</Label>
                <Input
                  id="incDate"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setLogDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Log Deposit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
