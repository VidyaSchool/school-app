'use client'

import * as React from "react"
import { 
  CircleDollarSign, 
  Users, 
  Search, 
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Percent,
  X,
  CreditCard,
  Building2,
  DollarSign
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/date-formatter"

// Import Evil Chart components
import { 
  EvilBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Grid, 
  Tooltip, 
  Legend 
} from "@/components/evilcharts/charts/bar-chart"

interface Installment {
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

interface ClientProps {
  initialInstallments: Installment[]
  adminUsername: string
}

export function FeeManagementClient({ initialInstallments, adminUsername }: ClientProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [classFilter, setClassFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filters logic
  const filteredInstallments = initialInstallments.filter(inst => {
    const matchesSearch = 
      inst.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inst.studentId.toLowerCase().includes(search.toLowerCase())

    const matchesClass = 
      classFilter === "all" || 
      inst.class === classFilter

    const matchesStatus = 
      statusFilter === "all" || 
      inst.status === statusFilter

    return matchesSearch && matchesClass && matchesStatus
  })

  // Summary Metrics calculations based on filtered set
  const totalCollected = initialInstallments
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0)

  const totalOutstanding = initialInstallments
    .filter(i => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0)

  const efficiency = totalCollected + totalOutstanding > 0 
    ? Math.round((totalCollected / (totalCollected + totalOutstanding)) * 100) 
    : 0

  const activeDefaulters = React.useMemo(() => {
    const defaulters = new Set(
      initialInstallments
        .filter(i => i.status === "overdue" || i.status === "pending")
        .map(i => i.studentId)
    )
    return defaulters.size
  }, [initialInstallments])

  // Unique Classes list for dropdown filter
  const classesList = React.useMemo(() => {
    return Array.from(new Set(initialInstallments.map(i => i.class).filter(Boolean))).sort((a, b) => {
      if (a === "Nursery") return -1
      if (b === "Nursery") return 1
      if (a === "KG") return -1
      if (b === "KG") return 1
      return parseInt(a!) - parseInt(b!)
    })
  }, [initialInstallments])

  // ─── EVIL CHART DATA 1: Class-Wise Payments (Stacked Paid vs Pending) ───
  const classChartData = React.useMemo(() => {
    const classes = Array.from(new Set(initialInstallments.map(i => i.class).filter(Boolean)))
    const dataMap: Record<string, { class: string; paid: number; pending: number }> = {}

    classes.forEach(c => {
      dataMap[c!] = { class: c === "Nursery" || c === "KG" ? c : `Class ${c}`, paid: 0, pending: 0 }
    })

    initialInstallments.forEach(inst => {
      if (!inst.class) return
      const entry = dataMap[inst.class]
      if (!entry) return
      if (inst.status === "paid") {
        entry.paid += inst.amount
      } else {
        entry.pending += inst.amount
      }
    })

    return Object.values(dataMap).sort((a, b) => {
      if (a.class.includes("Nursery")) return -1
      if (b.class.includes("Nursery")) return 1
      if (a.class.includes("KG")) return -1
      if (b.class.includes("KG")) return 1
      return a.class.localeCompare(b.class, undefined, { numeric: true })
    })
  }, [initialInstallments])

  // ─── EVIL CHART DATA 2: Monthly Trends (Horizontal Bar Chart) ───
  const monthlyChartData = React.useMemo(() => {
    const monthOrder = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    const monthlyMap: Record<string, { month: string; amount: number; rawMonth: string; rawYear: number }> = {}

    initialInstallments.forEach(inst => {
      if (inst.status !== "paid") return
      const label = `${inst.month} ${inst.year}`
      if (!monthlyMap[label]) {
        monthlyMap[label] = {
          month: label,
          amount: 0,
          rawMonth: inst.month,
          rawYear: parseInt(inst.year)
        }
      }
      monthlyMap[label].amount += inst.amount
    })

    return Object.values(monthlyMap).sort((a, b) => {
      if (a.rawYear !== b.rawYear) return a.rawYear - b.rawYear
      return monthOrder.indexOf(a.rawMonth) - monthOrder.indexOf(b.rawMonth)
    })
  }, [initialInstallments])

  // ─── EVIL CHART DATA 3: Top Students with Dues (Duotone Bar Chart) ───
  const topDuesStudents = React.useMemo(() => {
    const studentDuesMap: Record<string, { name: string; class: string; dues: number }> = {}

    initialInstallments.forEach(inst => {
      if (inst.status === "paid") return
      if (!studentDuesMap[inst.studentId]) {
        studentDuesMap[inst.studentId] = {
          name: inst.studentName,
          class: inst.class ? `Class ${inst.class}` : "No Class",
          dues: 0
        }
      }
      studentDuesMap[inst.studentId].dues += inst.amount
    })

    return Object.values(studentDuesMap)
      .sort((a, b) => b.dues - a.dues)
      .slice(0, 7)
  }, [initialInstallments])

  const classChartConfig = {
    paid: { 
      label: "Collected Fees", 
      colors: {
        light: ["#10b981", "#34d399"],
        dark: ["#059669", "#10b981"]
      }
    },
    pending: { 
      label: "Unpaid Dues", 
      colors: {
        light: ["#f43f5e", "#fb7185"],
        dark: ["#e11d48", "#f43f5e"]
      }
    }
  }

  const monthlyChartConfig = {
    amount: { 
      label: "Total Received", 
      colors: {
        light: ["#6366f1", "#818cf8"],
        dark: ["#4f46e5", "#6366f1"]
      }
    }
  }

  const studentChartConfig = {
    dues: { 
      label: "Total Outstanding", 
      colors: {
        light: ["#f59e0b", "#fbbf24"],
        dark: ["#d97706", "#f59e0b"]
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full shrink-0 cursor-pointer" 
            onClick={() => router.push(`/admin/${adminUsername}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CircleDollarSign className="h-8 w-8 text-primary animate-pulse" />
              Fee Dashboard & Visualizer
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor class collections, examine payment efficiency, and highlight outstanding defaulter list using visual insights.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-xs border-muted/50 bg-card/40 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Collected
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalCollected.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Received and cleared payments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-muted/50 bg-card/40 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Outstanding Dues
            </CardTitle>
            <Clock className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              ₹{totalOutstanding.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Pending & overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-muted/50 bg-card/40 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Collection Efficiency
            </CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {efficiency}%
            </div>
            <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-500" 
                style={{ width: `${efficiency}%` }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-muted/50 bg-card/40 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Defaulters
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {activeDefaulters}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Students with pending bills
            </p>
          </CardContent>
        </Card>
      </div>

      {/* EVIL CHARTS VISUALIZATION GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Card 1: Class-Wise Stacked Bar Chart */}
        <Card className="shadow-xs border-muted/50 bg-card/20 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              Class Collections Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">Stacked visualization showing Paid vs Pending collections for each grade level</p>
          </div>
          <div className="h-[280px] w-full mt-2">
            {isMounted ? (
              <EvilBarChart
                data={classChartData}
                config={classChartConfig}
                barRadius={4}
                stackType="stacked"
                animationType="center-out"
                className="h-full w-full"
              >
                <Grid />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend isClickable={true} />
                <Bar 
                  dataKey="paid" 
                  variant="gradient"
                  glowing={true}
                  enableHoverHighlight={true}
                />
                <Bar 
                  dataKey="pending" 
                  variant="hatched"
                  enableHoverHighlight={true}
                />
              </EvilBarChart>
            ) : (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                Analyzing class data...
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Monthly Trends Horizontal Chart */}
        <Card className="shadow-xs border-muted/50 bg-card/20 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-chart-1" />
              Monthly Revenue Inflow
            </h3>
            <p className="text-xs text-muted-foreground">Horizontal bars depicting chronological fee collection volume</p>
          </div>
          <div className="h-[280px] w-full mt-2">
            {isMounted ? (
              <EvilBarChart
                data={monthlyChartData}
                config={monthlyChartConfig}
                barRadius={4}
                layout="horizontal"
                animationType="left-to-right"
                className="h-full w-full"
              >
                <Grid />
                <XAxis type="number" />
                <YAxis type="category" dataKey="month" width={80} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  variant="stripped"
                  glowing={true}
                  enableHoverHighlight={true}
                />
              </EvilBarChart>
            ) : (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                Compiling monthly revenue...
              </div>
            )}
          </div>
        </Card>

        {/* Card 3: Defaulter Leaderboard Chart (Full Span) */}
        <Card className="shadow-xs border-muted/50 bg-card/20 p-6 flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-chart-5" />
              Outstanding Defaulters List
            </h3>
            <p className="text-xs text-muted-foreground">Top students ordered by total pending tuition and registration dues (Duotone pattern)</p>
          </div>
          <div className="h-[260px] w-full mt-2">
            {isMounted ? (
              <EvilBarChart
                data={topDuesStudents}
                config={studentChartConfig}
                barRadius={6}
                animationType="edges-in"
                className="h-full w-full"
              >
                <Grid />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="dues" 
                  variant="duotone"
                  enableHoverHighlight={true}
                  isClickable={true}
                />
              </EvilBarChart>
            ) : (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                Retrieving defaulter list...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* FILTER & DATA TABLE CARD */}
      <Card className="shadow-xs border-muted/50 bg-card/10">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-5 w-5 text-primary" />
              Detailed Installment Invoices
            </CardTitle>
            <CardDescription className="text-xs">
              Search and filter across all logged student payments and pending installment profiles
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
              <Input
                placeholder="Search student or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card/50 text-xs h-9 rounded-lg border-border"
              />
            </div>
            
            {/* Class Filter */}
            <div className="w-36">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="bg-card/50 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classesList.map((cls) => (
                    <SelectItem key={cls} value={cls || ""}>
                      {cls === "Nursery" || cls === "KG" ? cls : `Class ${cls}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-card/50 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/80 bg-card/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-foreground text-xs">Student ID</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Student Name</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Class & Section</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Period</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Amount</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Due Date</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Paid Date & Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.length > 0 ? (
                  filteredInstallments.map((inst) => (
                    <TableRow key={inst.id} className="hover:bg-muted/5 transition-colors text-xs">
                      <TableCell className="font-mono text-[11px] font-semibold text-muted-foreground">
                        {inst.studentId}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {inst.studentName}
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {inst.class ? (
                          inst.class === "Nursery" || inst.class === "KG" 
                            ? `${inst.class} ${inst.section ? `- ${inst.section}` : ""}`
                            : `Class ${inst.class} ${inst.section ? `- ${inst.section}` : ""}`
                        ) : (
                          <span className="italic text-[11px]">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {inst.month} {inst.year}
                      </TableCell>
                      <TableCell className="font-bold text-foreground text-sm">
                        ₹{inst.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {inst.status === "paid" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 rounded-full text-[10px] font-semibold">
                            <CheckCircle className="h-3 w-3" /> Paid
                          </Badge>
                        ) : inst.status === "overdue" ? (
                          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 gap-1 rounded-full text-[10px] font-semibold">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </Badge>
                        ) : inst.status === "pending" ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 rounded-full text-[10px] font-semibold">
                            <Clock className="h-3 w-3" /> Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 rounded-full text-[10px] font-semibold">
                            <Calendar className="h-3 w-3" /> Upcoming
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {inst.dueDate ? formatDate(inst.dueDate) : "Not Set"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {inst.status === "paid" ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{inst.paidDate ? formatDate(inst.paidDate) : "Completed"}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <CreditCard className="h-3 w-3" /> {inst.paymentMethod || "Online"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 italic text-[11px]">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm font-medium">
                      No matching installment records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
