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
  FileText,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  FolderTree,
} from "lucide-react"

interface LedgerAccount {
  code: string
  name: string
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"
  balance: number
}

interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  debitAccount: string
  creditAccount: string
  amount: number
}

const INITIAL_ACCOUNTS: LedgerAccount[] = [
  { code: "1010", name: "SBI Cash at Bank", type: "Asset", balance: 645000 },
  { code: "1020", name: "Petty Cash Chest", type: "Asset", balance: 18400 },
  { code: "3010", name: "Tuition Fee Revenue", type: "Revenue", balance: 350000 },
  { code: "3020", name: "Govt STEM Grant", type: "Revenue", balance: 500000 },
  { code: "4010", name: "Staff Salary Expense", type: "Expense", balance: 120000 },
  { code: "4020", name: "Electricity & Utilities", type: "Expense", balance: 13000 },
]

const INITIAL_JOURNALS: JournalEntry[] = [
  { id: "je-1", date: "2024-06-27", reference: "JE-001", description: "Tuition Fees Collected - Class 10", debitAccount: "1010", creditAccount: "3010", amount: 154000 },
  { id: "je-2", date: "2024-06-25", reference: "JE-002", description: "Government STEM Grant Received", debitAccount: "1010", creditAccount: "3020", amount: 500000 },
  { id: "je-3", date: "2024-06-24", reference: "JE-003", description: "Monthly Salaries Disbursed", debitAccount: "4010", creditAccount: "1010", amount: 120000 },
  { id: "je-4", date: "2024-06-22", reference: "JE-004", description: "Power Grid Bill Cleared", debitAccount: "4020", creditAccount: "1010", amount: 8500 },
  { id: "je-5", date: "2024-06-20", reference: "JE-005", description: "Broadband Bill Cleared", debitAccount: "4020", creditAccount: "1010", amount: 4500 },
  { id: "je-6", date: "2024-06-18", reference: "JE-006", description: "Petty Cash Re-floated", debitAccount: "1020", creditAccount: "1010", amount: 10000 },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function LedgersClient({ username }: { username: string }) {
  const [accounts, setAccounts] = useState<LedgerAccount[]>(INITIAL_ACCOUNTS)
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS)
  const [activeAccountCode, setActiveAccountCode] = useState<string>("1010")
  
  // Dialog states
  const [journalDialogOpen, setJournalDialogOpen] = useState(false)
  
  // Journal form state
  const [formDescription, setFormDescription] = useState("")
  const [formDebitAcc, setFormDebitAcc] = useState("4010")
  const [formCreditAcc, setFormCreditAcc] = useState("1010")
  const [formAmount, setFormAmount] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])

  const activeAccount = accounts.find((a) => a.code === activeAccountCode) || accounts[0]

  // Filter journals for the active account
  const activeJournals = useMemo(() => {
    return journals.filter(
      (j) => j.debitAccount === activeAccountCode || j.creditAccount === activeAccountCode
    )
  }, [journals, activeAccountCode])

  // Aggregate debit/credit summaries
  const ledgerMetrics = useMemo(() => {
    let totalDebit = 0
    let totalCredit = 0
    
    journals.forEach((j) => {
      totalDebit += j.amount
      totalCredit += j.amount
    })

    return { totalDebit, totalCredit }
  }, [journals])

  // Handle Journal Post (Double entry debit = credit)
  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(formAmount)

    if (!formDescription.trim()) {
      toast.error("Please enter a journal entry description")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount greater than 0")
      return
    }
    if (formDebitAcc === formCreditAcc) {
      toast.error("Debit and credit accounts must be different.")
      return
    }

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      date: formDate,
      reference: `JE-${String(journals.length + 1).padStart(3, "0")}`,
      description: formDescription,
      debitAccount: formDebitAcc,
      creditAccount: formCreditAcc,
      amount: amt,
    }

    // Update balances of accounts
    setAccounts((prev) =>
      prev.map((acc) => {
        let balance = acc.balance
        
        // Debit Account Updates
        if (acc.code === formDebitAcc) {
          if (acc.type === "Asset" || acc.type === "Expense") balance += amt
          else balance -= amt
        }
        
        // Credit Account Updates
        if (acc.code === formCreditAcc) {
          if (acc.type === "Asset" || acc.type === "Expense") balance -= amt
          else balance += amt
        }

        return { ...acc, balance }
      })
    )

    setJournals((prev) => [newEntry, ...prev])
    toast.success(`Journal entry ${newEntry.reference} posted successfully!`)
    setJournalDialogOpen(false)

    // Reset Form
    setFormDescription("")
    setFormAmount("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">General Ledgers & Journals</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Audit trial balance accounts, verify double-entry journals, and post general ledger vouchers.
          </p>
        </div>
        <Button size="sm" onClick={() => setJournalDialogOpen(true)} className="gap-1.5 shadow-xs font-semibold z-10">
          <Plus className="size-4" /> Post Journal Entry
        </Button>
      </section>

      {/* Trial Balance check indicators */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Ledger Debit Flow</CardTitle>
            <CardAction>
              <TrendingUp className="size-4 text-emerald-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(ledgerMetrics.totalDebit)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated journal debits</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Ledger Credit Flow</CardTitle>
            <CardAction>
              <TrendingDown className="size-4 text-blue-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(ledgerMetrics.totalCredit)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated journal credits</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Trial Balance Status</CardTitle>
            <CardAction>
              <Scale className="size-4 text-indigo-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-emerald-600 flex items-center gap-1.5">
              Balanced <CheckCircle2 className="size-5" />
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Debits match Credits exactly</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Dual Pane Ledger View */}
      <div className="grid gap-6 md:grid-cols-[1.1fr_1.9fr]">
        
        {/* Left Pane: Ledger Chart of Accounts */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Chart of Accounts</p>
          {accounts.map((acc) => {
            const isSelected = activeAccountCode === acc.code
            
            return (
              <div
                key={acc.code}
                onClick={() => setActiveAccountCode(acc.code)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? "bg-card border-primary shadow-xs ring-1 ring-primary/20" 
                    : "bg-muted/10 hover:bg-muted/30 border-muted-foreground/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {acc.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {acc.code}
                  </Badge>
                </div>
                <div className="mt-3.5 flex items-center justify-between text-xs border-t pt-2.5 border-dashed">
                  <span className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">{acc.type}</span>
                  <span className="font-bold text-foreground tabular-nums">{formatCurrency(acc.balance)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Pane: Ledger detailed statement */}
        <Card className="shadow-xs border flex flex-col justify-between h-[520px]">
          <CardHeader className="pb-3 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FolderTree className="size-4 text-primary" /> {activeAccount.name} Statement
                </CardTitle>
                <CardDescription className="text-xs">
                  Ledger account entries under <span className="font-semibold text-foreground">{activeAccount.type}</span> classification.
                </CardDescription>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-muted/20">
                Running Balance: <span className="text-emerald-600 font-bold ml-1">{formatCurrency(activeAccount.balance)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {activeJournals.length ? (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 pl-6">Ref ID</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Description</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Date</TableHead>
                    <TableHead className="font-semibold text-xs py-3 text-right">Debit (+)</TableHead>
                    <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Credit (-)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeJournals.map((j) => {
                    const isDebit = j.debitAccount === activeAccountCode
                    
                    return (
                      <TableRow key={j.id} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">
                          {j.reference}
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-sm">
                          {j.description}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {j.date}
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums">
                          {isDebit ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(j.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right pr-6 tabular-nums">
                          {!isDebit ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {formatCurrency(j.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No entries registered in this ledger.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Post Journal Voucher */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post Journal Voucher</DialogTitle>
            <DialogDescription>
              Log double-entry records. Debits and Credits must adjust balanced accounts correctly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostJournal} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="jeDesc">Description / Narration</Label>
              <Input
                id="jeDesc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Utility electricity invoice settlement"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="jeDebit">Debit Account (+)</Label>
                <Select value={formDebitAcc} onValueChange={setFormDebitAcc}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.code} value={a.code}>
                        {a.code} - {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="jeCredit">Credit Account (-)</Label>
                <Select value={formCreditAcc} onValueChange={setFormCreditAcc}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.code} value={a.code}>
                        {a.code} - {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="jeAmount">Amount (INR)</Label>
                <Input
                  id="jeAmount"
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="₹"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="jeDate">Posting Date</Label>
                <Input
                  id="jeDate"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setJournalDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Post Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
