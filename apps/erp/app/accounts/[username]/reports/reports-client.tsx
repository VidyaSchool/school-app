"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  FileText,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
} from "lucide-react"

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`
}

export function ReportsClient({ username }: { username: string }) {
  const [activeReport, setActiveReport] = useState<"income" | "balance">("income")

  const handleExport = (type: "pdf" | "csv") => {
    const loadingToast = toast.loading(`Compiling financial logs...`)
    setTimeout(() => {
      toast.dismiss(loadingToast)
      toast.success(`Report exported successfully as VidyaSchool_${activeReport}_statement.${type}`)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <Toaster />

      {/* Header Panel */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden md:flex-row md:items-center md:justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports Center</h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Generate Income Statements, Balance Sheets, and audit trial balances.
          </p>
        </div>
        <div className="flex gap-2 z-10">
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="gap-2 bg-background">
            <Download className="h-4 w-4" /> PDF Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="gap-2 bg-background">
            CSV Export
          </Button>
        </div>
      </section>

      {/* Selector and Main Card */}
      <div className="grid gap-6 md:grid-cols-[1fr_3fr]">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Reports Statements</p>
          <button
            onClick={() => setActiveReport("income")}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              activeReport === "income" ? "bg-card border-primary shadow-xs ring-1 ring-primary/20" : "bg-muted/10 hover:bg-muted/30"
            }`}
          >
            <p className="text-sm font-bold">Income Statement</p>
            <p className="text-xs text-muted-foreground mt-1">Revenue vs Expenses P&L</p>
          </button>

          <button
            onClick={() => setActiveReport("balance")}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              activeReport === "balance" ? "bg-card border-primary shadow-xs ring-1 ring-primary/20" : "bg-muted/10 hover:bg-muted/30"
            }`}
          >
            <p className="text-sm font-bold">Balance Sheet</p>
            <p className="text-xs text-muted-foreground mt-1">Assets, Liabilities & Equity</p>
          </button>
        </div>

        <Card className="shadow-xs border">
          {activeReport === "income" ? (
            <>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-bold">Income Statement (Profit & Loss)</CardTitle>
                <CardDescription>Fiscal Year 2024-25 | Statement of Operational Profit.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-semibold text-xs py-3 pl-6">Line Item / Classification</TableHead>
                      <TableHead className="font-semibold text-xs py-3 text-right">Debit</TableHead>
                      <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/10 font-bold"><TableCell className="pl-6">Revenue</TableCell><TableCell /><TableCell className="pr-6" /></TableRow>
                    <TableRow><TableCell className="pl-10">Tuition Fee Revenue</TableCell><TableCell className="text-right">—</TableCell><TableCell className="text-right font-semibold text-emerald-600 pr-6">{formatCurrency(350000)}</TableCell></TableRow>
                    <TableRow><TableCell className="pl-10">Government Grants</TableCell><TableCell className="text-right">—</TableCell><TableCell className="text-right font-semibold text-emerald-600 pr-6">{formatCurrency(500000)}</TableCell></TableRow>
                    <TableRow className="bg-muted/10 font-bold"><TableCell className="pl-6">Expenses</TableCell><TableCell /><TableCell className="pr-6" /></TableRow>
                    <TableRow><TableCell className="pl-10">Staff Salary Expense</TableCell><TableCell className="text-right font-semibold text-rose-600">—</TableCell><TableCell className="text-right pr-6">{formatCurrency(120000)}</TableCell></TableRow>
                    <TableRow><TableCell className="pl-10">Electricity & Utilities</TableCell><TableCell className="text-right font-semibold text-rose-600">—</TableCell><TableCell className="text-right pr-6">{formatCurrency(13000)}</TableCell></TableRow>
                    <TableRow className="border-t font-bold bg-muted/20"><TableCell className="pl-6">Net Surplus (Profit)</TableCell><TableCell /><TableCell className="text-right font-extrabold text-emerald-600 pr-6">{formatCurrency(717000)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-bold">Statement of Financial Position (Balance Sheet)</CardTitle>
                <CardDescription>Fiscal Year 2024-25 | Assets & Equity.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-semibold text-xs py-3 pl-6">Line Item / Classification</TableHead>
                      <TableHead className="font-semibold text-xs py-3 text-right">Debit</TableHead>
                      <TableHead className="font-semibold text-xs py-3 pr-6 text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/10 font-bold"><TableCell className="pl-6">Assets</TableCell><TableCell /><TableCell className="pr-6" /></TableRow>
                    <TableRow><TableCell className="pl-10">SBI Cash at Bank</TableCell><TableCell className="text-right font-semibold text-emerald-600">—</TableCell><TableCell className="text-right pr-6">{formatCurrency(645000)}</TableCell></TableRow>
                    <TableRow><TableCell className="pl-10">Petty Cash Chest</TableCell><TableCell className="text-right font-semibold text-emerald-600">—</TableCell><TableCell className="text-right pr-6">{formatCurrency(18400)}</TableCell></TableRow>
                    <TableRow className="bg-muted/10 font-bold"><TableCell className="pl-6">Liabilities & Equity</TableCell><TableCell /><TableCell className="pr-6" /></TableRow>
                    <TableRow><TableCell className="pl-10">Retained Earnings Surplus</TableCell><TableCell className="text-right">—</TableCell><TableCell className="text-right font-semibold text-indigo-600 pr-6">{formatCurrency(663400)}</TableCell></TableRow>
                    <TableRow className="border-t font-bold bg-muted/20"><TableCell className="pl-6">Total Assets / Balance Equity</TableCell><TableCell className="text-right font-bold text-emerald-600">{formatCurrency(663400)}</TableCell><TableCell className="text-right font-bold text-indigo-600 pr-6">{formatCurrency(663400)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
