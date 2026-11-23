"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CreditCard,
  DollarSign,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Search,
  Plus,
  Download,
  Filter,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  ChevronRight,
  CheckCircle2,
  LineChart as LineChartIcon,
  BarChart4,
  Percent,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts"

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface PaymentMethod {
  name: string
  value: number
}

interface Transaction {
  id: string | number
  description: string
  category: string
  amount: number
  date: string
  paymentMethod?: string
  status?: "Completed" | "Pending" | "Failed"
}

interface DashboardStats {
  totalRevenue?: number
  outstandingFees?: number
  totalExpenses?: number
  netIncome?: number
  monthlyRevenue?: MonthlyRevenue[]
  paymentMethods?: PaymentMethod[]
  recentTransactions?: Transaction[]
}

interface KPICardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: ReactNode
  loading?: boolean
  description: string
  colorClass: string
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "oklch(0.645 0.203 142)", // Emerald theme
  },
} satisfies ChartConfig

const paymentChartConfig = {
  cash: {
    label: "Cash",
    color: "oklch(0.769 0.188 70)", // Amber
  },
  card: {
    label: "Card",
    color: "oklch(0.55 0.2 250)", // Blue
  },
  bank: {
    label: "Bank Transfer",
    color: "oklch(0.67 0.18 200)", // Cyan
  },
  upi: {
    label: "UPI",
    color: "oklch(0.585 0.233 277)", // Indigo
  },
  other: {
    label: "Other",
    color: "oklch(0.6 0.15 40)", // Slate/Orange
  },
} satisfies ChartConfig

const paymentColors = [
  "oklch(0.769 0.188 70)",  // Cash: Amber
  "oklch(0.585 0.233 277)", // UPI: Indigo
  "oklch(0.55 0.2 250)",    // Card: Blue
  "oklch(0.67 0.18 200)",    // Bank Transfer: Cyan
  "oklch(0.6 0.15 40)",     // Other: Slate/Orange
]

const INITIAL_STATS: DashboardStats = {
  totalRevenue: 1245000,
  outstandingFees: 325000,
  totalExpenses: 850000,
  netIncome: 395000,
  monthlyRevenue: [
    { month: "Jan", revenue: 120000 },
    { month: "Feb", revenue: 135000 },
    { month: "Mar", revenue: 142000 },
    { month: "Apr", revenue: 155000 },
    { month: "May", revenue: 148000 },
    { month: "Jun", revenue: 165000 },
    { month: "Jul", revenue: 180000 },
  ],
  paymentMethods: [
    { name: "UPI", value: 40 },
    { name: "Cash", value: 35 },
    { name: "Card", value: 15 },
    { name: "Bank Transfer", value: 10 },
  ],
  recentTransactions: [
    {
      id: "txn-1",
      description: "Student Fee Payment - John Doe",
      category: "Class 10 - Section A",
      amount: 15000,
      date: "2024-06-27",
      paymentMethod: "UPI",
      status: "Completed",
    },
    {
      id: "txn-2",
      description: "Electricity Bill (June)",
      category: "Maintenance",
      amount: -8500,
      date: "2024-06-26",
      paymentMethod: "Bank Transfer",
      status: "Completed",
    },
    {
      id: "txn-3",
      description: "Student Fee Payment - Jane Smith",
      category: "Class 9 - Section B",
      amount: 14000,
      date: "2024-06-25",
      paymentMethod: "Cash",
      status: "Completed",
    },
    {
      id: "txn-4",
      description: "Teacher Salaries (June)",
      category: "Payroll",
      amount: -120000,
      date: "2024-06-24",
      paymentMethod: "Bank Transfer",
      status: "Completed",
    },
    {
      id: "txn-5",
      description: "Broadband Bill",
      category: "Utilities",
      amount: -4500,
      date: "2024-06-22",
      paymentMethod: "Card",
      status: "Completed",
    },
    {
      id: "txn-6",
      description: "Student Fee Payment - Bob Johnson",
      category: "Class 11 - Section C",
      amount: 18000,
      date: "2024-06-21",
      paymentMethod: "UPI",
      status: "Completed",
    },
    {
      id: "txn-7",
      description: "Laboratory Chemical Purchase",
      category: "Academic Supplies",
      amount: -25000,
      date: "2024-06-20",
      paymentMethod: "Card",
      status: "Completed",
    },
  ],
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

function getCategoryBadgeStyles(category: string) {
  const cat = category.toLowerCase()
  if (cat.includes("class") || cat.includes("fee") || cat.includes("student")) {
    return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20 font-medium"
  }
  if (cat.includes("maintenance") || cat.includes("utility") || cat.includes("bill") || cat.includes("broadband")) {
    return "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20 font-medium"
  }
  if (cat.includes("payroll") || cat.includes("salary") || cat.includes("staff") || cat.includes("teacher")) {
    return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20 font-medium"
  }
  if (cat.includes("supply") || cat.includes("academic") || cat.includes("chemical") || cat.includes("lab")) {
    return "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 border-violet-500/20 font-medium"
  }
  return "bg-zinc-500/10 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-500/20 font-medium"
}

function KPICard({ title, value, change, trend, icon, loading, description, colorClass }: KPICardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight

  return (
    <Card size="sm" className="relative overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01] border">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colorClass}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <div className="flex size-8 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground transition-colors group-hover/card:bg-muted">
            {icon}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight tabular-nums">
              {value}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium ${
                trend === "up" 
                  ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                  : "bg-destructive/10 text-destructive dark:bg-destructive/20"
              }`}>
                <TrendIcon className="size-3" />
                {change}
              </span>
              <span className="truncate">{description}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
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

function ChartSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function AccountsDashboard({ username }: { username: string }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [isSyncing, setIsSyncing] = useState(false)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [fiscalYear, setFiscalYear] = useState("FY 2024-25")

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all")

  // Modals state
  const [isRecordOpen, setIsRecordOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  // Record Transaction form state
  const [formType, setFormType] = useState<"income" | "expense">("income")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("Class Fees")
  const [formCustomCategory, setFormCustomCategory] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formPaymentMethod, setFormPaymentMethod] = useState("UPI")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/accounts/dashboard`)
      if (!res.ok) throw new Error("Server responded with error status")
      const data = (await res.json()) as DashboardStats
      setStats(prev => ({
        ...prev,
        ...data,
      }))
      if (silent) toast.success("Dashboard metrics updated!")
    } catch (error) {
      console.warn("Failed to fetch backend data. Falling back to client-side mock data.", error)
      if (silent) toast.error("Could not sync with backend. Using local state.")
    } finally {
      setLoading(false)
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleSync = () => {
    setIsSyncing(true)
    fetchDashboardData(true)
  }

  // Categories present in transactions for filter dropdown
  const categories = useMemo(() => {
    const list = new Set<string>()
    stats.recentTransactions?.forEach((t) => list.add(t.category))
    return Array.from(list)
  }, [stats.recentTransactions])

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let list = stats.recentTransactions ?? []

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.id?.toString() || "").toLowerCase().includes(q)
      )
    }

    if (filterCategory !== "all") {
      list = list.filter((t) => t.category === filterCategory)
    }

    if (filterType !== "all") {
      list = list.filter((t) => {
        if (filterType === "income") return t.amount > 0
        if (filterType === "expense") return t.amount < 0
        return true
      })
    }

    if (filterPaymentMethod !== "all") {
      list = list.filter((t) => t.paymentMethod === filterPaymentMethod)
    }

    return list
  }, [stats.recentTransactions, searchQuery, filterCategory, filterType, filterPaymentMethod])

  // Calculation rate
  const collectionRate = useMemo(() => {
    const revenue = stats.totalRevenue ?? 0
    const outstanding = stats.outstandingFees ?? 0
    const total = revenue + outstanding

    if (!total) return 0
    return Math.round((revenue / total) * 100)
  }, [stats])

  // Export handler
  const handleExport = (type: "pdf" | "csv") => {
    const loadingToast = toast.loading(`Generating ledger report in ${type.toUpperCase()}...`)
    
    setTimeout(() => {
      toast.dismiss(loadingToast)
      toast.success(`Ledger exported successfully as VidyaSchool_ledger_${fiscalYear.replace(" ", "_")}.${type}`, {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      })
    }, 1500)
  }

  // Handle Recording New Transaction
  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault()

    const amt = parseFloat(formAmount)
    if (!formDescription.trim()) {
      toast.error("Please enter a description")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount greater than 0")
      return
    }

    const finalCategory = formCategory === "custom" ? formCustomCategory : formCategory
    if (!finalCategory.trim()) {
      toast.error("Please enter or select a category")
      return
    }

    const signedAmount = formType === "income" ? amt : -amt
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      description: formDescription,
      category: finalCategory,
      amount: signedAmount,
      date: formDate,
      paymentMethod: formPaymentMethod,
      status: "Completed",
    }

    // Update stats metrics
    setStats((prev) => {
      const updatedRevenue = prev.totalRevenue ?? 0
      const updatedExpenses = prev.totalExpenses ?? 0
      const updatedOutstanding = prev.outstandingFees ?? 0

      let nextRevenue = updatedRevenue
      let nextExpenses = updatedExpenses
      let nextOutstanding = updatedOutstanding

      if (formType === "income") {
        nextRevenue += amt
        // Deduct outstanding fees if student class fee payment
        if (
          finalCategory.toLowerCase().includes("class") ||
          finalCategory.toLowerCase().includes("fee")
        ) {
          nextOutstanding = Math.max(0, updatedOutstanding - amt)
        }
      } else {
        nextExpenses += amt
      }

      const nextNetIncome = nextRevenue - nextExpenses

      // Update Monthly Revenue chart
      // Find month name from formDate (e.g. "Jun")
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const txnMonthIndex = new Date(formDate).getMonth()
      const txnMonthName = monthNames[txnMonthIndex]

      const nextMonthlyRevenue = (prev.monthlyRevenue ?? []).map((m) => {
        if (m.month === txnMonthName && formType === "income") {
          return { ...m, revenue: m.revenue + amt }
        }
        return m
      })

      // Update Payment Methods pie chart
      // We will adjust based on relative values. We convert percentages back to relative weights, increment, and re-calculate.
      const prevTotalRevenue = updatedRevenue || 1
      const updatedMethods = (prev.paymentMethods ?? []).map((m) => {
        const absoluteVal = (m.value / 100) * prevTotalRevenue
        const addedVal = (m.name.toLowerCase() === formPaymentMethod.toLowerCase() && formType === "income") ? amt : 0
        return {
          name: m.name,
          rawVal: absoluteVal + addedVal,
        }
      })

      const newMethodsTotal = updatedMethods.reduce((sum, item) => sum + item.rawVal, 0) || 1
      const nextPaymentMethods = updatedMethods.map((m) => ({
        name: m.name,
        value: Math.round((m.rawVal / newMethodsTotal) * 100),
      }))

      return {
        ...prev,
        totalRevenue: nextRevenue,
        totalExpenses: nextExpenses,
        outstandingFees: nextOutstanding,
        netIncome: nextNetIncome,
        monthlyRevenue: nextMonthlyRevenue,
        paymentMethods: nextPaymentMethods,
        recentTransactions: [newTxn, ...(prev.recentTransactions ?? [])],
      }
    })

    toast.success(`${formType === "income" ? "Revenue" : "Expense"} of ${formatCurrency(amt)} recorded!`)
    setIsRecordOpen(false)

    // Reset Form
    setFormDescription("")
    setFormAmount("")
    setFormCustomCategory("")
    setFormCategory("Class Fees")
  }

  // Handle Deleting Transaction
  const handleDeleteTransaction = (id: string | number) => {
    const txnToDelete = stats.recentTransactions?.find((t) => t.id === id)
    if (!txnToDelete) return

    setStats((prev) => {
      const amt = Math.abs(txnToDelete.amount)
      const isIncome = txnToDelete.amount > 0

      const nextRevenue = isIncome ? (prev.totalRevenue ?? 0) - amt : (prev.totalRevenue ?? 0)
      const nextExpenses = !isIncome ? (prev.totalExpenses ?? 0) - amt : (prev.totalExpenses ?? 0)
      const nextOutstanding = (isIncome && (txnToDelete.category.toLowerCase().includes("class") || txnToDelete.category.toLowerCase().includes("fee")))
        ? (prev.outstandingFees ?? 0) + amt 
        : (prev.outstandingFees ?? 0)
      const nextNetIncome = nextRevenue - nextExpenses

      // Adjust monthly chart
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const txnMonthIndex = new Date(txnToDelete.date).getMonth()
      const txnMonthName = monthNames[txnMonthIndex]
      const nextMonthlyRevenue = (prev.monthlyRevenue ?? []).map((m) => {
        if (m.month === txnMonthName && isIncome) {
          return { ...m, revenue: Math.max(0, m.revenue - amt) }
        }
        return m
      })

      // Adjust Payment Methods
      const prevTotalRevenue = prev.totalRevenue || 1
      const updatedMethods = (prev.paymentMethods ?? []).map((m) => {
        const absoluteVal = (m.value / 100) * prevTotalRevenue
        const subtractedVal = (m.name.toLowerCase() === (txnToDelete.paymentMethod ?? "").toLowerCase() && isIncome) ? amt : 0
        return {
          name: m.name,
          rawVal: Math.max(0, absoluteVal - subtractedVal),
        }
      })

      const newMethodsTotal = updatedMethods.reduce((sum, item) => sum + item.rawVal, 0) || 1
      const nextPaymentMethods = updatedMethods.map((m) => ({
        name: m.name,
        value: Math.round((m.rawVal / newMethodsTotal) * 100),
      }))

      return {
        ...prev,
        totalRevenue: nextRevenue,
        totalExpenses: nextExpenses,
        outstandingFees: nextOutstanding,
        netIncome: nextNetIncome,
        monthlyRevenue: nextMonthlyRevenue,
        paymentMethods: nextPaymentMethods,
        recentTransactions: (prev.recentTransactions ?? []).filter((t) => t.id !== id),
      }
    })

    toast.warning("Transaction entry removed from ledger")
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0 w-full max-w-[1536px] mx-auto">
      <Toaster />

      {/* Welcome & Global Actions Banner */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold select-none border">
              {username}
            </Badge>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
            Monitor and administer accounts ledger activity, invoices, expense metrics, and collection channels.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
            <SelectTrigger className="w-[140px] bg-background">
              <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
              <SelectValue placeholder="Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FY 2024-25">FY 2024-25</SelectItem>
              <SelectItem value="FY 2025-26">FY 2025-26</SelectItem>
              <SelectItem value="FY 2026-27">FY 2026-27</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-background shrink-0 h-8 w-8 hover:bg-muted"
            title="Sync metrics"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isSyncing ? "animate-spin" : ""}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background gap-2 text-muted-foreground">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Export as PDF Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Export Ledger (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Record Transaction Button */}
          <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
            <Button size="sm" onClick={() => setIsRecordOpen(true)} className="gap-2 shadow-xs hover:shadow-sm font-medium">
              <Plus className="h-4 w-4" />
              Record Entry
            </Button>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
                <DialogDescription>
                  Manually log a financial event. This instantly recalculates all metrics and charts below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordTransaction} className="space-y-4 pt-2">
                <div className="flex gap-2 p-1 border rounded-lg bg-muted/40">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("income")
                      setFormCategory("Class Fees")
                    }}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                      formType === "income"
                        ? "bg-background text-emerald-600 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Income (Receipt)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("expense")
                      setFormCategory("Maintenance")
                    }}
                    className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                      formType === "expense"
                        ? "bg-background text-rose-600 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Expense (Debit)
                  </button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={formType === "income" ? "e.g., Student Fee - Grade 10" : "e.g., Lab supplies purchase"}
                    className="col-span-3"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {formType === "income" ? (
                        <>
                          <SelectItem value="Class Fees">Class Fees</SelectItem>
                          <SelectItem value="Admission Fees">Admission Fees</SelectItem>
                          <SelectItem value="Bus Fees">Bus Fees</SelectItem>
                          <SelectItem value="Donations">Donations</SelectItem>
                          <SelectItem value="custom">Other (Custom Category)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Payroll">Payroll</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Academic Supplies">Academic Supplies</SelectItem>
                          <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                          <SelectItem value="custom">Other (Custom Category)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {formCategory === "custom" && (
                  <div className="grid gap-2">
                    <Label htmlFor="custom-category">Custom Category Name</Label>
                    <Input
                      id="custom-category"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="e.g. Science Fair Fund"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (INR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="₹ Amount"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Channel</Label>
                    <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className={formType === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}>
                    Record Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Collection Progress & Overall Breakdown Banner */}
      <section className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Percent className="size-3.5" /> Collection Completion Rate
              </span>
              <p className="text-xs text-muted-foreground">
                Percentage of tuition and facility fees collected for the current session.
              </p>
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">{collectionRate}%</span>
          </div>
          <div className="space-y-2">
            <Progress value={collectionRate} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1">
              <span>Collected: {formatCurrency(stats.totalRevenue)}</span>
              <span>Remaining Target: {formatCurrency(stats.outstandingFees)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-card p-4 flex flex-col justify-between shadow-xs transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Collected Revenue</p>
              <p className="text-xl font-bold mt-1.5 tabular-nums text-emerald-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5 bg-emerald-500/5 px-2 py-1 rounded w-fit">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>In Treasury</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 flex flex-col justify-between shadow-xs transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Outstanding Dues</p>
              <p className="text-xl font-bold mt-1.5 tabular-nums text-amber-600">
                {formatCurrency(stats.outstandingFees)}
              </p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5 bg-amber-500/5 px-2 py-1 rounded w-fit">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Uncollected Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change="+12.5%"
          trend="up"
          description="from last month"
          icon={<DollarSign className="size-4" />}
          loading={loading}
          colorClass="bg-emerald-500"
        />
        <KPICard
          title="Outstanding Fees"
          value={formatCurrency(stats.outstandingFees)}
          change="-8.2%"
          trend="down"
          description="since session startup"
          icon={<CreditCard className="size-4" />}
          loading={loading}
          colorClass="bg-amber-500"
        />
        <KPICard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          change="+5.3%"
          trend="up"
          description="fixed & variable cost"
          icon={<Wallet className="size-4" />}
          loading={loading}
          colorClass="bg-rose-500"
        />
        <KPICard
          title="Net Cashflow"
          value={formatCurrency(stats.netIncome)}
          change="+18.4%"
          trend="up"
          description="cumulative profit"
          icon={<TrendingUp className="size-4" />}
          loading={loading}
          colorClass="bg-indigo-500"
        />
      </section>

      {/* Analytics Charts & ledger logs */}
      <Tabs defaultValue="overview" className="gap-6 flex flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 font-medium">Overview & Charts</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-lg px-4 py-2 font-medium">Ledger Book ({filteredTransactions.length})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Layers className="size-3.5" />
            <span>Active Period: {fiscalYear}</span>
          </div>
        </div>

        {/* Tab 1: Overview and Charts */}
        <TabsContent value="overview" className="space-y-6 outline-hidden">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
            
            {/* Chart: Monthly Revenue */}
            <Card className="shadow-xs border hover:shadow-sm transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Monthly Income Flow</CardTitle>
                  <CardDescription>Track monthly incoming collections and fees deposits.</CardDescription>
                </div>
                <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
                  <Button
                    variant={chartType === "bar" ? "secondary" : "ghost"}
                    size="icon-sm"
                    className="h-7 w-7 rounded"
                    onClick={() => setChartType("bar")}
                    title="Bar chart representation"
                  >
                    <BarChart4 className="size-3.5" />
                  </Button>
                  <Button
                    variant={chartType === "line" ? "secondary" : "ghost"}
                    size="icon-sm"
                    className="h-7 w-7 rounded"
                    onClick={() => setChartType("line")}
                    title="Line chart representation"
                  >
                    <LineChartIcon className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {loading ? (
                  <ChartSkeleton />
                ) : stats.monthlyRevenue?.length ? (
                  <ChartContainer
                    config={revenueChartConfig}
                    className="h-72 w-full mt-2"
                  >
                    {chartType === "bar" ? (
                      <BarChart data={stats.monthlyRevenue} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="oklch(0.645 0.203 142)" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="oklch(0.645 0.203 142)" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                        />
                        <ChartTooltip
                          cursor={{ fill: "var(--muted/10)", radius: 4 }}
                          content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(Number(value))} />}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="url(#barGradient)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                        />
                      </BarChart>
                    ) : (
                      <LineChart data={stats.monthlyRevenue} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                        />
                        <ChartTooltip
                          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                          content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(Number(value))} />}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="oklch(0.645 0.203 142)"
                          strokeWidth={2.5}
                          dot={{ stroke: "oklch(0.645 0.203 142)", strokeWidth: 2, r: 4, fill: "var(--background)" }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "oklch(0.645 0.203 142)" }}
                        />
                      </LineChart>
                    )}
                  </ChartContainer>
                ) : (
                  <EmptyState
                    title="No monthly data"
                    description="Incoming logs will populate monthly graphs once collections begin."
                  />
                )}
              </CardContent>
            </Card>

            {/* Chart: Payment Methods */}
            <Card className="shadow-xs border hover:shadow-sm transition-shadow flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Payment Channels</CardTitle>
                <CardDescription>Percent share of collections by channel.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pb-6">
                {loading ? (
                  <ChartSkeleton />
                ) : stats.paymentMethods?.length ? (
                  <div className="flex flex-col gap-6 h-full justify-center">
                    <div className="relative mx-auto aspect-square h-48 flex items-center justify-center">
                      <ChartContainer
                        config={paymentChartConfig}
                        className="w-full h-full"
                      >
                        <PieChart>
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel formatter={(value) => `${value}%`} />}
                          />
                          <Pie
                            data={stats.paymentMethods}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {stats.paymentMethods.map((method, index) => (
                              <Cell
                                key={method.name}
                                fill={paymentColors[index % paymentColors.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      
                      {/* Center Content for Donut Hole */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Treasury</span>
                        <span className="text-lg font-extrabold tracking-tight text-foreground">
                          {formatCurrency((stats.totalRevenue ?? 1245000) / 100000).replace("₹", "")}L
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {stats.paymentMethods.map((method, index) => {
                        const channelKey = method.name.toLowerCase().includes("transfer") ? "bank" : method.name.toLowerCase()
                        const configColor = paymentColors[index % paymentColors.length]
                        
                        return (
                          <div
                            key={method.name}
                            className="flex flex-col gap-1 rounded-xl border bg-muted/10 p-2.5 transition-all hover:bg-muted/20"
                          >
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                              <span
                                className="size-2 rounded shrink-0"
                                style={{ backgroundColor: configColor }}
                              />
                              <span className="truncate">{method.name}</span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-sm font-bold">{method.value}%</span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {formatCurrency(Math.round(((stats.totalRevenue ?? 1245000) * method.value) / 100))}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No channels registered"
                    description="Payments structure details will show after deposits clear."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Ledger Records Table */}
        <TabsContent value="transactions" className="outline-hidden">
          <Card className="shadow-xs border">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">General Ledger Ledger</CardTitle>
                  <CardDescription>Inspect, query, and filter detailed accounts activities.</CardDescription>
                </div>
                
                {/* Search and Filters Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full max-w-[200px] md:w-[180px]">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search log..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-muted/20 hover:bg-muted/40"
                    />
                  </div>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-xs bg-muted/20 hover:bg-muted/40 w-[110px]">
                      <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="Flow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Flows</SelectItem>
                      <SelectItem value="income">Income (+)</SelectItem>
                      <SelectItem value="expense">Expense (-)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-xs bg-muted/20 hover:bg-muted/40 w-[120px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                    <SelectTrigger className="h-8 text-xs bg-muted/20 hover:bg-muted/40 w-[120px]">
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
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredTransactions.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-semibold text-xs py-3 pl-6">ID / Reference</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Description</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Category</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Mode</TableHead>
                        <TableHead className="font-semibold text-xs py-3">Date</TableHead>
                        <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((txn) => {
                        const isIncome = txn.amount > 0
                        return (
                          <TableRow key={txn.id} className="hover:bg-muted/10 transition-colors group">
                            <TableCell className="font-mono text-[11px] py-3 pl-6 text-muted-foreground">
                              {txn.id?.toString().startsWith("txn-") 
                                ? txn.id.toString().toUpperCase().substring(0, 10) 
                                : `TXN-${txn.id}`}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="font-medium text-foreground text-sm">{txn.description}</span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline" className={`${getCategoryBadgeStyles(txn.category)} text-[10px]`}>
                                {txn.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                              {txn.paymentMethod || "UPI"}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-muted-foreground">
                              {formatDate(txn.date)}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {isIncome ? "+" : "-"}
                                {formatCurrency(Math.abs(txn.amount))}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-75 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedTxn(txn)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                    View Receipt
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleDeleteTransaction(txn.id)}
                                    className="cursor-pointer"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Log
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 border-t">
                  <EmptyState
                    title="No records found matching filters"
                    description="Try checking for spelling issues or adjusting filter parameters."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dynamic Detail Dialog: Receipt Modal */}
      <Dialog open={selectedTxn !== null} onOpenChange={(open) => !open && setSelectedTxn(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border bg-background">
          {selectedTxn && (
            <div className="flex flex-col">
              {/* Header block with receipt motif */}
              <div className="bg-muted/50 p-6 border-b text-center relative">
                <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  {selectedTxn.status || "Cleared"}
                </span>
                <p className="text-xs font-bold text-primary tracking-widest uppercase">VidyaSchool Ledger Receipt</p>
                <div className={`mt-4 text-3xl font-extrabold ${selectedTxn.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedTxn.amount > 0 ? "+" : "-"} {formatCurrency(Math.abs(selectedTxn.amount))}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">
                  REF: {selectedTxn.id?.toString().toUpperCase()}
                </p>
              </div>

              {/* Receipt Parameters Grid */}
              <div className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-right font-medium">{selectedTxn.description}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Accounting Category</span>
                  <span className="text-right font-medium">
                    <Badge variant="secondary" className="px-2 font-medium">{selectedTxn.category}</Badge>
                  </span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Date of Log</span>
                  <span className="text-right font-medium">{formatDate(selectedTxn.date)}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="text-right font-medium">{selectedTxn.paymentMethod || "UPI"}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Admin Clerk</span>
                  <span className="text-right font-medium font-mono text-xs">{username}</span>
                </div>
              </div>

              {/* Action Buttons Footer */}
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
    </main>
  )
}
