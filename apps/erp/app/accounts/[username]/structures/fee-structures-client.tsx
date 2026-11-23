"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Card,
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
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Layers,
  Loader2,
  Save,
  Bus,
  RefreshCw,
} from "lucide-react"

interface FeeComponent {
  id: string
  name: string
  amount: number
  billingPeriod: "Monthly" | "Quarterly" | "Annually"
}

interface ClassStructure {
  classKey: string
  classNum: number
  className: string
  components: FeeComponent[]
  transportFee: number
  updatedAt?: string
  dirty?: boolean // unsaved local changes
}

async function apiRequest(path: string, options: RequestInit = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
}

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

function calcMonthlyTotal(components: FeeComponent[], transportFee: number, includeTransport: boolean) {
  const base = components.reduce((sum, comp) => {
    if (comp.billingPeriod === "Monthly") return sum + comp.amount
    if (comp.billingPeriod === "Quarterly") return sum + Math.round(comp.amount / 3)
    if (comp.billingPeriod === "Annually") return sum + Math.round(comp.amount / 12)
    return sum
  }, 0)
  return base + (includeTransport ? transportFee : 0)
}

const PERIOD_COLORS: Record<string, string> = {
  Monthly: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Quarterly: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Annually: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
}

export function FeeStructuresClient({ username }: { username: string }) {
  const [structures, setStructures] = useState<ClassStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [activeClassKey, setActiveClassKey] = useState("Nursery")

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)

  const [selectedCompId, setSelectedCompId] = useState<string | null>(null)
  const [compName, setCompName] = useState("")
  const [compAmount, setCompAmount] = useState("")
  const [compPeriod, setCompPeriod] = useState<"Monthly" | "Quarterly" | "Annually">("Monthly")
  const [transportFeeInput, setTransportFeeInput] = useState("")

  const [applyYear, setApplyYear] = useState(new Date().getFullYear().toString())
  const [applyScope, setApplyScope] = useState<"current" | "all">("current")

  // ─── Load structures from backend ───────────────────────────────────────
  const loadStructures = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest("/api/admin/fee-structures")
      if (!res.ok) throw new Error("Failed to fetch fee structures")
      const data: ClassStructure[] = await res.json()
      setStructures(data.map((s) => ({ ...s, dirty: false })))
      if (data.length && !data.some(s => s.classKey === activeClassKey)) {
        setActiveClassKey(data[0].classKey || "Nursery")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load structures"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [activeClassKey])

  useEffect(() => {
    loadStructures()
  }, [loadStructures])

  const activeStructure = structures.find((s) => (s.classKey || String(s.classNum)) === activeClassKey) || structures[0]

  // keep transport fee input in sync when switching classes
  useEffect(() => {
    if (activeStructure) {
      setTransportFeeInput(activeStructure.transportFee.toString())
    }
  }, [activeClassKey, activeStructure?.transportFee])

  // ─── Mark structure as dirty on local edits ─────────────────────────────
  function mutateActive(fn: (s: ClassStructure) => ClassStructure) {
    setStructures((prev) =>
      prev.map((s) => ((s.classKey || String(s.classNum)) === activeClassKey ? { ...fn(s), dirty: true } : s))
    )
  }

  // ─── Save active class to backend ───────────────────────────────────────
  const handleSave = async () => {
    if (!activeStructure) return
    setSaving(true)
    const targetKey = activeStructure.classKey || String(activeStructure.classNum)
    try {
      const res = await apiRequest(`/api/admin/fee-structures/${targetKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          components: activeStructure.components,
          transportFee: activeStructure.transportFee,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const updated: ClassStructure = await res.json()
      setStructures((prev) =>
        prev.map((s) => ((s.classKey || String(s.classNum)) === targetKey ? { ...updated, dirty: false } : s))
      )
      toast.success(`${activeStructure.className || `Class ${targetKey}`} fee structure saved!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Apply to installments ───────────────────────────────────────────────
  const handleApplyConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)
    try {
      const classKeys = applyScope === "current" && activeStructure ? [activeStructure.classKey || String(activeStructure.classNum)] : []
      const res = await apiRequest("/api/admin/fee-structures/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classKeys, year: applyYear }),
      })
      if (!res.ok) throw new Error("Apply failed")
      const result = await res.json()
      setApplyOpen(false)
      toast.success(`Fee structures applied! Updated ${result.installmentsUpdated || 0} student installments.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Apply failed"
      toast.error(msg)
    } finally {
      setApplying(false)
    }
  }

  // ─── Add component ───────────────────────────────────────────────────────
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(compAmount)
    if (!compName.trim()) { toast.error("Name is required"); return }
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return }
    mutateActive((s) => ({
      ...s,
      components: [
        ...s.components,
        { id: `new-${Date.now()}`, name: compName, amount: amt, billingPeriod: compPeriod },
      ],
    }))
    toast.success(`"${compName}" added`)
    setAddOpen(false)
  }

  // ─── Edit component ──────────────────────────────────────────────────────
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(compAmount)
    if (!compName.trim()) { toast.error("Name is required"); return }
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return }
    mutateActive((s) => ({
      ...s,
      components: s.components.map((c) =>
        c.id === selectedCompId ? { ...c, name: compName, amount: amt, billingPeriod: compPeriod } : c
      ),
    }))
    toast.success("Component updated")
    setEditOpen(false)
    setSelectedCompId(null)
  }

  // ─── Delete component ────────────────────────────────────────────────────
  const handleDelete = (compId: string, name: string) => {
    mutateActive((s) => ({
      ...s,
      components: s.components.filter((c) => c.id !== compId),
    }))
    toast.warning(`Removed "${name}"`)
  }

  // ─── Update transport fee ────────────────────────────────────────────────
  const handleTransportFeeBlur = () => {
    const val = parseInt(transportFeeInput, 10)
    if (!isNaN(val) && val >= 0) {
      mutateActive((s) => ({ ...s, transportFee: val }))
    } else {
      setTransportFeeInput(activeStructure?.transportFee.toString() ?? "0")
    }
  }

  // ─── Open modals ─────────────────────────────────────────────────────────
  const openAdd = () => { setCompName(""); setCompAmount(""); setCompPeriod("Monthly"); setAddOpen(true) }
  const openEdit = (comp: FeeComponent) => {
    setSelectedCompId(comp.id)
    setCompName(comp.name)
    setCompAmount(comp.amount.toString())
    setCompPeriod(comp.billingPeriod)
    setEditOpen(true)
  }

  // ─── UI ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading fee structures...
      </div>
    )
  }

  const monthlyTotal = activeStructure
    ? calcMonthlyTotal(activeStructure.components, activeStructure.transportFee, false)
    : 0
  const monthlyWithTransport = activeStructure
    ? calcMonthlyTotal(activeStructure.components, activeStructure.transportFee, true)
    : 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Academic Fee Structures</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Configure fee components per class (1–12). Save changes, then apply to generate student installments.
            Transport fee is automatically added for students using school transport.
          </p>
        </div>
        <div className="flex gap-2.5 z-10 flex-wrap">
          <Button size="sm" onClick={openAdd} className="gap-1.5 shadow-xs font-semibold">
            <Plus className="size-4" /> Add Component
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saving || !activeStructure?.dirty}
            className="gap-1.5 font-semibold bg-background"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setApplyScope("current"); setApplyOpen(true) }}
            className="gap-1.5 font-semibold bg-background"
          >
            <FileCheck className="size-4" /> Apply to Students
          </Button>
          <Button size="sm" variant="ghost" onClick={loadStructures} title="Refresh" className="gap-1.5">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </section>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">

        {/* Left: Class Selector (Nursery, KG, 1–12) */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
            Classes (Nursery – 12)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {structures.map((s) => {
              const key = s.classKey || String(s.classNum)
              const isSelected = activeClassKey === key
              const total = calcMonthlyTotal(s.components, s.transportFee, false)
              const label = s.className || (key === "Nursery" || key === "KG" ? key : `Class ${s.classNum}`)
              return (
                <button
                  key={key}
                  onClick={() => setActiveClassKey(key)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 relative ${
                    isSelected
                      ? "bg-card border-primary shadow-sm ring-1 ring-primary/20"
                      : "bg-muted/10 hover:bg-muted/30 border-muted-foreground/10"
                  }`}
                >
                  {s.dirty && (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500" title="Unsaved changes" />
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {label}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {s.components.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">{formatCurrency(total)}/mo</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {activeStructure && (
          <Card className="shadow-xs">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    {activeStructure.className || `Class ${activeStructure.classNum}`} — Fee Components
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Edit fee components below. Changes are local until you click{" "}
                    <span className="font-semibold text-foreground">Save Changes</span>.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1.5 text-xs min-w-max">
                  <div className="px-3 py-1.5 rounded-lg border bg-muted/20 font-semibold flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Base Monthly Total</span>
                    <span className="text-emerald-600 font-bold">{formatCurrency(monthlyTotal)}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg border bg-blue-500/5 border-blue-500/20 font-semibold flex items-center justify-between gap-4">
                    <span className="text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <Bus className="size-3" /> With Transport
                    </span>
                    <span className="text-blue-700 dark:text-blue-400 font-bold">{formatCurrency(monthlyWithTransport)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-semibold text-xs py-3 pl-6">Fee Component</TableHead>
                      <TableHead className="font-semibold text-xs py-3">Billing Cycle</TableHead>
                      <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeStructure.components.map((comp) => (
                      <TableRow key={comp.id} className="hover:bg-muted/10">
                        <TableCell className="font-medium text-sm py-3 pl-6">{comp.name}</TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-2 font-medium ${PERIOD_COLORS[comp.billingPeriod] ?? ""}`}
                          >
                            {comp.billingPeriod}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right font-bold tabular-nums">
                          {formatCurrency(comp.amount)}
                        </TableCell>
                        <TableCell className="py-3 text-right pr-6 space-x-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => openEdit(comp)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleDelete(comp.id, comp.name)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeStructure.components.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                          No fee components yet. Click <strong>Add Component</strong> to start.
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Transport fee row (always visible, editable) */}
                    <TableRow className="bg-blue-500/3 hover:bg-blue-500/5 border-t border-blue-500/10">
                      <TableCell className="font-medium text-sm py-3 pl-6 text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <Bus className="size-3.5" /> School Transport Fee
                        <span className="text-[10px] text-muted-foreground font-normal">(for transport users only)</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`text-[10px] py-0 px-2 font-medium ${PERIOD_COLORS.Monthly}`}>
                          Monthly
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex justify-end">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                            <Input
                              type="number"
                              className="h-7 pl-6 text-right text-sm font-bold tabular-nums"
                              value={transportFeeInput}
                              onChange={(e) => setTransportFeeInput(e.target.value)}
                              onBlur={handleTransportFeeBlur}
                              min={0}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 pr-6" />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Dialog: Add Component ─────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee Component</DialogTitle>
            <DialogDescription>Add a new billing item to {activeStructure?.className || activeClassKey}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="compName">Component Name</Label>
              <Input
                id="compName"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="e.g. Science Laboratory Fee"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="compAmount">Amount (INR)</Label>
                <Input
                  id="compAmount"
                  type="number"
                  value={compAmount}
                  onChange={(e) => setCompAmount(e.target.value)}
                  placeholder="₹ 2000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compPeriod">Billing Cycle</Label>
                <Select value={compPeriod} onValueChange={(v: any) => setCompPeriod(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add Component</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Component ────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Fee Component</DialogTitle>
            <DialogDescription>Modify this billing item for {activeStructure?.className || activeClassKey}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="editCompName">Component Name</Label>
              <Input id="editCompName" value={compName} onChange={(e) => setCompName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="editCompAmount">Amount (INR)</Label>
                <Input id="editCompAmount" type="number" value={compAmount} onChange={(e) => setCompAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCompPeriod">Billing Cycle</Label>
                <Select value={compPeriod} onValueChange={(v: any) => setCompPeriod(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Apply to Students ─────────────────────────────────────── */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Fee Structure to Students</DialogTitle>
            <DialogDescription>
              Generates monthly installment records from the saved fee structures.
              Transport fee is automatically added for students whose transport mode is set.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplyConfirm} className="space-y-4 pt-2">
            {/* Warning */}
            <div className="bg-amber-500/5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 p-3.5 border border-amber-500/20 rounded-xl text-xs flex gap-2.5">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold">Before you apply</p>
                <p>Make sure all class structures are saved. Existing <strong>paid</strong> installments are never modified.
                Pending/overdue installments will be updated to match the current fee structure.</p>
              </div>
            </div>

            {/* Transport fee callout */}
            <div className="bg-blue-500/5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 p-3 border border-blue-500/20 rounded-xl text-xs flex gap-2.5">
              <Bus className="size-4 shrink-0 mt-0.5" />
              <p>
                Students with <strong>school transport</strong> will have the class transport fee
                (₹{activeStructure?.transportFee.toLocaleString("en-IN") ?? 0}/month) added to their installments automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="applyYear">Academic Year</Label>
                <Select value={applyYear} onValueChange={setApplyYear}>
                  <SelectTrigger id="applyYear"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="applyScope">Scope</Label>
                <Select value={applyScope} onValueChange={(v: any) => setApplyScope(v)}>
                  <SelectTrigger id="applyScope"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">{activeStructure?.className || activeClassKey} only</SelectItem>
                    <SelectItem value="all">All Classes (1–12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={applying} className="gap-1.5">
                {applying && <Loader2 className="size-4 animate-spin" />}
                Confirm & Apply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
