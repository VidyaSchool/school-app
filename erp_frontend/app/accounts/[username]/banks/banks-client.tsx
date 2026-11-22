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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Plus,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Clock,
  Briefcase,
  AlertCircle,
  FileCheck2,
} from "lucide-react"

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  accountType: "Savings" | "Current" | "Escrow" | "Petty Cash"
  balance: number
  branch: string
}

interface BankTransfer {
  id: string
  fromAccountName: string
  toAccountName: string
  amount: number
  date: string
  referenceId: string
  status: "Completed" | "Pending"
}

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: "bank-1", bankName: "State Bank of India", accountName: "VidyaSchool Main Operations", accountNumber: "XXXX-XXXX-8924", accountType: "Current", balance: 645000, branch: "Connaught Place, Delhi" },
  { id: "bank-2", bankName: "HDFC Bank", accountName: "VidyaSchool Student Fees Collector", accountNumber: "XXXX-XXXX-4105", accountType: "Current", balance: 325000, branch: "Dwarka Sector 10, Delhi" },
  { id: "bank-3", bankName: "ICICI Bank", accountName: "STEM Endowment Escrow Fund", accountNumber: "XXXX-XXXX-3341", accountType: "Escrow", balance: 500000, branch: "Vasant Kunj, Delhi" },
  { id: "bank-4", bankName: "Cash Vault Reserve", accountName: "Petty Cash Chest", accountNumber: "N/A - Cashbox", accountType: "Petty Cash", balance: 18400, branch: "Administrative Office Vault" },
]

const INITIAL_TRANSFERS: BankTransfer[] = [
  { id: "trf-1", fromAccountName: "VidyaSchool Student Fees Collector", toAccountName: "VidyaSchool Main Operations", amount: 150000, date: "2024-06-25", referenceId: "FT241770029", status: "Completed" },
  { id: "trf-2", fromAccountName: "VidyaSchool Main Operations", toAccountName: "Petty Cash Chest", amount: 10000, date: "2024-06-22", referenceId: "FT241740921", status: "Completed" },
  { id: "trf-3", fromAccountName: "STEM Endowment Escrow Fund", toAccountName: "VidyaSchool Main Operations", amount: 50000, date: "2024-06-18", referenceId: "FT241701294", status: "Completed" },
]

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function BanksClient({ username }: { username: string }) {
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS)
  const [transfers, setTransfers] = useState<BankTransfer[]>(INITIAL_TRANSFERS)

  // Transfer Dialog states
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferFrom, setTransferFrom] = useState(INITIAL_ACCOUNTS[1].id) // Fees collector default
  const [transferTo, setTransferTo] = useState(INITIAL_ACCOUNTS[0].id) // Main operations default
  const [transferAmount, setTransferAmount] = useState("")

  const totalBankBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(transferAmount)

    if (transferFrom === transferTo) {
      toast.error("Source and destination accounts must be different.")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid transfer amount.")
      return
    }

    const fromAcc = accounts.find((a) => a.id === transferFrom)
    const toAcc = accounts.find((a) => a.id === transferTo)

    if (!fromAcc || !toAcc) return

    if (fromAcc.balance < amt) {
      toast.error(`Insufficient balance in ${fromAcc.accountName}! Current Balance: ${formatCurrency(fromAcc.balance)}`)
      return
    }

    // Update balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === transferFrom) return { ...acc, balance: acc.balance - amt }
        if (acc.id === transferTo) return { ...acc, balance: acc.balance + amt }
        return acc
      })
    )

    // Log transfer
    const newTransfer: BankTransfer = {
      id: `trf-${Date.now()}`,
      fromAccountName: fromAcc.accountName,
      toAccountName: toAcc.accountName,
      amount: amt,
      date: new Date().toISOString().split("T")[0],
      referenceId: `FT${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: "Completed",
    }

    setTransfers((prev) => [newTransfer, ...prev])
    toast.success(`Transferred ${formatCurrency(amt)} from ${fromAcc.bankName} to ${toAcc.bankName}!`)
    setTransferOpen(false)
    setTransferAmount("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Bank Accounts & Treasury</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Audit school bank vaults, track deposits, reconcile accounts, and initiate internal cash transfers.
          </p>
        </div>
        <div className="flex gap-2.5 z-10">
          <Button size="sm" onClick={() => setTransferOpen(true)} className="gap-1.5 shadow-xs font-semibold">
            <ArrowRightLeft className="size-4" /> Transfer Funds
          </Button>
        </div>
      </section>

      {/* Overview balance card */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Combined Bank Reserves</CardTitle>
            <CardAction>
              <TrendingUp className="size-4 text-emerald-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(totalBankBalance)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated balance of operations, fees collector, and escrow vaults</p>
          </CardContent>
        </Card>

        <Card size="sm" className="relative overflow-hidden border">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Active Bank Vaults</CardTitle>
            <CardAction>
              <Building2 className="size-4 text-indigo-500" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{accounts.length} Accounts</p>
            <p className="text-[10px] text-muted-foreground mt-1">Reconciliation active</p>
          </CardContent>
        </Card>
      </section>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1.5fr]">
        
        {/* Accounts Roster list */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Accounts Roster</p>
          {accounts.map((acc) => (
            <Card key={acc.id} className="shadow-xs border transition-shadow hover:shadow-md">
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-semibold">{acc.accountName}</CardTitle>
                  <CardDescription className="text-[11px]">{acc.bankName} | Branch: {acc.branch}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold">{acc.accountType}</Badge>
              </CardHeader>
              <CardContent className="mt-1 flex justify-between items-baseline">
                <span className="font-mono text-xs text-muted-foreground">Acc: {acc.accountNumber}</span>
                <span className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(acc.balance)}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent internal transfers */}
        <Card className="shadow-xs border flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="size-4 text-primary" /> Internal Transfer Logs
            </CardTitle>
            <CardDescription>Recent transfers between treasury accounts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {transfers.length ? (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 pl-6">Reference ID</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Source & Destination</TableHead>
                    <TableHead className="font-semibold text-xs py-3">Date</TableHead>
                    <TableHead className="font-semibold text-xs py-3 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((trf) => (
                    <TableRow key={trf.id} className="hover:bg-muted/10">
                      <TableCell className="font-mono text-[10px] py-3 pl-6 text-muted-foreground">
                        {trf.referenceId}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-xs space-y-0.5">
                          <p className="font-medium text-foreground text-xs truncate max-w-[150px]">{trf.fromAccountName}</p>
                          <p className="text-[10px] text-muted-foreground">to {trf.toAccountName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {trf.date}
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold text-foreground tabular-nums">
                        {formatCurrency(trf.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No transfer logs found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Transfer Funds */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Treasury Funds</DialogTitle>
            <DialogDescription>
              Move balances internally between school vaults.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransferSubmit} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="sourceAcc">Source Account</Label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountName} ({formatCurrency(a.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destAcc">Destination Account</Label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountName} ({formatCurrency(a.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="trfAmount">Transfer Amount (INR)</Label>
              <Input
                id="trfAmount"
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="₹"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Transfer Funds</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
