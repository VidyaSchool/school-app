"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, ShieldCheck, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReceiptData {
  receipt_no: string
  student_name: string
  username: string | null
  admission_number: string | null
  class: string | null
  section: string | null
  month: string
  year: string
  amount: number
  paid_date: string | null
  payment_method: string | null
}

export default function FeeReceiptPage() {
  const { token } = useParams<{ token: string }>()
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
    fetch(`${backendUrl}/api/fees/receipt/${token}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then((data: ReceiptData | null) => {
        if (data) setReceipt(data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading receipt...</span>
        </div>
      </div>
    )
  }

  if (notFound || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full rounded-xl border border-destructive/30 bg-card p-8 text-center space-y-4 shadow-lg">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Receipt Not Found</h1>
          <p className="text-sm text-muted-foreground">This payment link is invalid or the receipt does not exist.</p>
        </div>
      </div>
    )
  }

  const classLabel = receipt.class
    ? `${receipt.class === "Nursery" || receipt.class === "KG" ? receipt.class : `Class ${receipt.class}`}${receipt.section ? ` - ${receipt.section}` : ""}`
    : "N/A"

  const rows: [string, string][] = [
    ["Student Name", receipt.student_name],
    ["Username", receipt.username ? `@${receipt.username}` : "N/A"],
    ["Admission No.", receipt.admission_number ?? "N/A"],
    ["Class", classLabel],
    ["Month Paid", `${receipt.month} ${receipt.year}`],
    ["Amount", `₹${receipt.amount.toLocaleString("en-IN")}`],
    ["Paid On", receipt.paid_date ? new Date(receipt.paid_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"],
    ["Payment Mode", receipt.payment_method ?? "—"],
    ["Receipt No.", receipt.receipt_no],
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-5 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Payment Verified</h1>
            <p className="text-xs text-muted-foreground">Vidya School — Official Fee Receipt</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground text-xs block">{label}</span>
                <span className="font-semibold text-foreground break-all">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Verified against the Vidya School database. No physical signature required.</span>
          </div>

          <Button
            onClick={() => window.print()}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
        </div>
      </div>
    </div>
  )
}
