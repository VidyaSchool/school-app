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
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Users,
} from "lucide-react"

interface ScholarshipAllocation {
  id: string
  studentName: string
  classSection: string
  schemeName: "Merit Scholarship" | "EWS Fee Concession" | "Sports Scholarship" | "Alumni Sponsor Fund"
  amount: number
  status: "Active" | "Pending"
  allocationDate: string
}

const INITIAL_SCHOLARSHIPS: ScholarshipAllocation[] = [
  { id: "SCH-001", studentName: "Rohan Gupta", classSection: "Class 12-A", schemeName: "Merit Scholarship", amount: 15000, status: "Active", allocationDate: "2024-06-25" },
  { id: "SCH-002", studentName: "Preeti Sahay", classSection: "Class 10-B", schemeName: "EWS Fee Concession", amount: 12000, status: "Active", allocationDate: "2024-06-20" },
  { id: "SCH-003", studentName: "Karan Singh", classSection: "Class 11-C", schemeName: "Sports Scholarship", amount: 8000, status: "Pending", allocationDate: "2024-06-27" },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function ScholarshipsClient({ username }: { username: string }) {
  const [scholarships, setScholarships] = useState<ScholarshipAllocation[]>(INITIAL_SCHOLARSHIPS)
  const [searchQuery, setSearchQuery] = useState("")
  const [schemeFilter, setSchemeFilter] = useState("all")

  // Dialog state
  const [allocDialogOpen, setAllocDialogOpen] = useState(false)

  // Form state
  const [formStudent, setFormStudent] = useState("")
  const [formClass, setFormClass] = useState("Class 10-A")
  const [formScheme, setFormScheme] = useState<"Merit Scholarship" | "EWS Fee Concession" | "Sports Scholarship" | "Alumni Sponsor Fund">("Merit Scholarship")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])

  // Filtered list
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      const matchQuery = s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchScheme = schemeFilter === "all" || s.schemeName === schemeFilter
      return matchQuery && matchScheme
    })
  }, [scholarships, searchQuery, schemeFilter])

  // Aggregate stats
  const stats = useMemo(() => {
    let activeDisbursed = 0
    let pendingAlloc = 0
    scholarships.forEach((s) => {
      if (s.status === "Active") activeDisbursed += s.amount
      else pendingAlloc += s.amount
    })
    return { activeDisbursed, pendingAlloc, count: scholarships.length }
  }, [scholarships])

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)

    if (!formStudent.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid student name and amount")
      return
    }

    const newAlloc: ScholarshipAllocation = {
      id: `SCH-${String(scholarships.length + 1).padStart(3, "0")}`,
      studentName: formStudent,
      classSection: formClass,
      schemeName: formScheme,
      amount: amt,
      status: "Pending",
      allocationDate: formDate,
    }

    setScholarships((prev) => [newAlloc, ...prev])
    toast.success(`Scholarship ${newAlloc.id} allocated to ${formStudent}`)
    setAllocDialogOpen(false)

    // Reset Form
    setFormStudent("")
    setFormAmount("")
  }

  const handleDeleteAllocation = (id: string, name: string) => {
    setScholarships((prev) => prev.filter((s) => s.id !== id))
    toast.warning(`Withdrawn scholarship allocation for ${name}`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Scholarships & Concessions</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Administer student merit waivers, sports sponsorships, and financial concessions.
          </p>
        </div>
        <Button size="sm" onClick={() => setAllocDialogOpen(true)} className="gap-1.5 shadow-xs font-semibold z-10">
          <Plus className="size-4" /> Allocate Scholarship
        </Button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Active Disbursements</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums text-emerald-600">{formatCurrency(stats.activeDisbursed)}</p></CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Pending Allocation</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums text-amber-600">{formatCurrency(stats.pendingAlloc)}</p></CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground">Beneficiaries Count</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-bold tabular-nums">{stats.count} Students</p></CardContent>
        </Card>
      </section>

      {/* Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Scholarship Registry</CardTitle>
              <CardDescription>Verify waivers allocations.</CardDescription>
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
                value={schemeFilter}
                onChange={(e) => setSchemeFilter(e.target.value)}
                className="h-8 text-xs bg-muted/20 rounded-lg border px-2 py-1 outline-hidden"
              >
                <option value="all">All Schemes</option>
                <option value="Merit Scholarship">Merit Scholarship</option>
                <option value="EWS Fee Concession">EWS Concession</option>
                <option value="Sports Scholarship">Sports Scholarship</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredScholarships.length ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold text-xs py-3 pl-6">ID</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Student Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Class Bracket</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Scheme Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Allocation Date</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Benefit Value</TableHead>
                  <TableHead className="font-semibold text-xs py-3 text-right">Status</TableHead>
                  <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScholarships.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/10 group">
                    <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">{s.id}</TableCell>
                    <TableCell className="py-3 font-semibold text-sm">{s.studentName}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{s.classSection}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-medium">{s.schemeName}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{s.allocationDate}</TableCell>
                    <TableCell className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(s.amount)}</TableCell>
                    <TableCell className="py-3 text-right">
                      {s.status === "Active" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] animate-pulse">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAllocation(s.id, s.studentName)} className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-75 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">No scholarships allocated.</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Allocate Scholarship */}
      <Dialog open={allocDialogOpen} onOpenChange={setAllocDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Waiver Concession</DialogTitle>
            <DialogDescription>Submit student details for fee concessions or merit sponsorships.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAllocate} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="allocName">Student Name</Label>
              <Input id="allocName" value={formStudent} onChange={(e) => setFormStudent(e.target.value)} placeholder="e.g. John Doe" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="allocClass">Class Bracket</Label>
                <Select value={formClass} onValueChange={setFormClass}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class 10-A">Class 10-A</SelectItem>
                    <SelectItem value="Class 11-C">Class 11-C</SelectItem>
                    <SelectItem value="Class 12-A">Class 12-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="allocAmount">Waiver Value (INR)</Label>
                <Input id="allocAmount" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="₹" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="allocScheme">Scholarship Scheme</Label>
              <Select value={formScheme} onValueChange={(val: any) => setFormScheme(val)}>
                <SelectTrigger><SelectValue placeholder="Scheme" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Merit Scholarship">Merit Scholarship</SelectItem>
                  <SelectItem value="EWS Fee Concession">EWS Fee Concession</SelectItem>
                  <SelectItem value="Sports Scholarship">Sports Scholarship</SelectItem>
                  <SelectItem value="Alumni Sponsor Fund">Alumni Sponsor Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="allocDate">Allocation Date</Label>
              <Input id="allocDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAllocDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Allocate waiver</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
