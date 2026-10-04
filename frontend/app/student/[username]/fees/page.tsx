"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  CreditCard, 
  X, 
  Printer, 
  ShieldCheck, 
  CircleDollarSign, 
  Clock, 
  GraduationCap,
  Loader2Icon,
  Share2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import StudentFeesSkeleton from "./skeleton"

interface FeeMonth {
  id: string
  month: string
  year: string
  amount: number
  dueDate: string
  status: "paid" | "pending" | "overdue" | "upcoming"
  paidDate?: string
  receiptNo?: string
  paymentMethod?: string
  qrDataUrl?: string
}

interface FeeApiRecord {
  id: string
  month: string
  year: string
  amount: number
  due_date: string
  status: "paid" | "pending" | "overdue" | "upcoming"
  paid_date?: string | null
  receipt_no?: string | null
  payment_method?: string | null
  qr_data_url?: string | null
}

interface RazorpayOrderResponse {
  detail?: string
  key_id?: string
  order_id?: string
  amount?: number
  currency?: string
  mock_payment?: boolean
}

interface RazorpayVerificationResponse {
  detail?: string
}

// Arranged calendar-chronologically from January to December 2026
const BACKEND_URL = "/api/backend"

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "An unexpected error occurred."
}

const formatClassSection = (cls?: string, sec?: string) => {
  if (!cls) return "N/A"
  const classStr = cls === "Nursery" || cls === "KG" ? cls : `Class ${cls}`
  return sec ? `${classStr} - Section ${sec}` : classStr
}

export default function StudentFeesPage() {
  const [months, setMonths] = React.useState<FeeMonth[]>([])
  const [selectedMonths, setSelectedMonths] = React.useState<string[]>([])
  const [studentProfile, setStudentProfile] = React.useState<{ name: string; admissionNumber: string; class: string; section: string } | null>(null)
  
  const [checkoutData, setCheckoutData] = React.useState<{ ids: string[]; amount: number; title: string; subtitle: string } | null>(null)
  const [receiptMonth, setReceiptMonth] = React.useState<FeeMonth | null>(null)
  const [isPaying, setIsPaying] = React.useState(false)
  const [paymentMessage, setPaymentMessage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const razorpayScriptLoaded = React.useRef(false)

  const loadRazorpayScript = React.useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("Payment gateway is unavailable in this environment")
    }

    if ((window as Window & { Razorpay?: unknown }).Razorpay) {
      return
    }

    if (razorpayScriptLoaded.current) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector("script[src*='checkout.razorpay.com']") as HTMLScriptElement | null
      if (existingScript) {
        if (existingScript.dataset.loaded === "true") {
          resolve()
          return
        }

        existingScript.addEventListener("load", () => resolve(), { once: true })
        existingScript.addEventListener("error", () => reject(new Error("Unable to load the Razorpay payment gateway. Please refresh and try again.")), { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => {
        script.dataset.loaded = "true"
        razorpayScriptLoaded.current = true
        resolve()
      }
      script.onerror = () => {
        reject(new Error("Unable to load the Razorpay payment gateway. Please refresh and try again."))
      }
      document.body.appendChild(script)
    })
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      // 1. Fetch student info from frontend '/api/account'
      const accountRes = await fetch("/api/account")
      if (!accountRes.ok) {
        throw new Error("Failed to load student profile details")
      }
      const accountData = await accountRes.json() as {
        user?: { name?: string }
        profile?: { admissionNumber?: string; class?: string; section?: string }
      }
      setStudentProfile({
        name: accountData.user?.name || "Student",
        admissionNumber: accountData.profile?.admissionNumber || "N/A",
        class: accountData.profile?.class || "",
        section: accountData.profile?.section || "",
      })

      // 2. Fetch fees from API (Next.js /api/fees with direct Drizzle DB resolution)
      let feesRes = await fetch('/api/fees')
      if (!feesRes.ok) {
        feesRes = await fetch(`${BACKEND_URL}/api/fees`, { credentials: "include" })
      }
      if (!feesRes.ok) {
        throw new Error("Failed to load fee installments")
      }
      const feesData = await feesRes.json() as FeeApiRecord[]
      
      const mappedFees: FeeMonth[] = feesData.map((inst) => ({
        id: inst.id,
        month: inst.month,
        year: inst.year,
        amount: inst.amount,
        dueDate: inst.due_date,
        status: inst.status,
        paidDate: inst.paid_date ?? undefined,
        receiptNo: inst.receipt_no ?? undefined,
        paymentMethod: inst.payment_method ?? undefined,
        qrDataUrl: inst.qr_data_url ?? undefined,
      }))
      setMonths(mappedFees)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const initializePage = async () => {
      try {
        await loadRazorpayScript()
        await fetchData()
      } catch (err) {
        setError(getErrorMessage(err))
      }
    }

    void initializePage()
  }, [loadRazorpayScript])

  // Calculations
  const totalPaid = months.filter(m => m.status === "paid").reduce((acc, m) => acc + m.amount, 0)
  const totalOutstanding = months.filter(m => m.status === "pending" || m.status === "overdue").reduce((acc, m) => acc + m.amount, 0)
  const pendingMonths = months.filter(m => m.status === "pending" || m.status === "overdue")
  const pendingCount = pendingMonths.length

  const handlePay = async () => {
    if (!checkoutData) return
    setIsPaying(true)
    setError("")
    setPaymentMessage(null)

    try {
      await loadRazorpayScript()

      const orderRes = await fetch(`${BACKEND_URL}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          installment_ids: checkoutData.ids,
          amount: checkoutData.amount * 100,
          receipt: `FEE-${checkoutData.ids.join("")}-${Date.now()}`
        })
      })

      const orderData = await orderRes.json() as RazorpayOrderResponse
      if (!orderRes.ok) {
        throw new Error(orderData.detail || "Unable to start Razorpay checkout")
      }

      const isDarkMode = document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency ?? "INR",
        name: "Vidya School",
        description: checkoutData.subtitle,
        order_id: orderData.order_id,
        prefill: {
          name: studentProfile?.name || "Student",
          contact: "9999999999"
        },
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                installment_ids: checkoutData.ids,
                payment_method: "Razorpay"
              })
            })

            const verifyData = await verifyRes.json() as RazorpayVerificationResponse
            if (!verifyRes.ok) {
              throw new Error(verifyData.detail || "Payment verification failed")
            }

            await fetchData()
            setSelectedMonths([])
            setCheckoutData(null)
            setPaymentMessage("Payment successful. Your receipt is ready.")
          } catch (err) {
            setError(getErrorMessage(err) || "Payment verification failed")
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentMessage("Payment cancelled. No charges were made.")
          }
        },
        theme: {
          color: isDarkMode ? "#0f172a" : "#2563eb"
        }
      }

      const razorpay = new ((window as Window & { Razorpay?: new (options: unknown) => { open: () => void } }).Razorpay as new (options: unknown) => { open: () => void })(options)
      razorpay.open()
    } catch (err) {
      setError(getErrorMessage(err) || "Payment failed")
    } finally {
      setIsPaying(false)
    }
  }

  // Checkbox toggle logic
  const handleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedMonths(prev => [...prev, id])
    } else {
      setSelectedMonths(prev => prev.filter(mid => mid !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMonths(pendingMonths.map(m => m.id))
    } else {
      setSelectedMonths([])
    }
  }

  if (loading) {
    return <StudentFeesSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background">
      
      {/* Page Title & Desc */}
      <div className="flex flex-col gap-1.5 px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Fee Management
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Monitor your tuition invoices, print payment receipts, and select pending installments to clear school dues.
        </p>
      </div>

      {error && (
        <div className="mx-6 lg:mx-8 p-3 text-sm rounded-lg bg-destructive/15 text-destructive font-medium border border-destructive/25 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Summary Panels */}
      <div className="grid gap-4 md:grid-cols-3 px-6 lg:px-8">
            
            {/* Metric 1 */}
            <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Fees Paid</p>
                <h3 className="text-2xl font-bold text-foreground">₹{totalPaid.toLocaleString("en-IN")}</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Clear balance record</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Dues</p>
                <h3 className="text-2xl font-bold text-foreground">
                  ₹{totalOutstanding.toLocaleString("en-IN")}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {pendingCount > 0 ? `${pendingCount} month(s) pending` : "All current installments cleared"}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${pendingCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enrolled Grade</p>
                <h3 className="text-2xl font-bold text-foreground truncate max-w-[200px]" title={studentProfile ? formatClassSection(studentProfile.class, studentProfile.section) : ""}>
                  {studentProfile ? formatClassSection(studentProfile.class, studentProfile.section) : "N/A"}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Student ID: {studentProfile?.admissionNumber || "N/A"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* Fee Instalments Table */}
          <div className="px-6 lg:px-8 space-y-4">
            
            {/* Table Title and Actions bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-foreground">Instalment Schedule</h2>
              {selectedMonths.length > 0 && (
                <Button
                  onClick={() => {
                    const totalAmount = months.filter(m => selectedMonths.includes(m.id)).reduce((acc, m) => acc + m.amount, 0)
                    const names = months.filter(m => selectedMonths.includes(m.id)).map(m => m.month).join(", ")
                    setCheckoutData({
                      ids: selectedMonths,
                      amount: totalAmount,
                      title: "Pay Selected Dues",
                      subtitle: `Pay tuition installments for: ${names}`
                    })
                  }}
                  className="text-xs h-8.5 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1.5 rounded-lg shadow-md self-start"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Pay Selected (₹{selectedMonths.reduce((acc, id) => acc + (months.find(m => m.id === id)?.amount || 0), 0).toLocaleString("en-IN")})
                </Button>
              )}
            </div>
            
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">
                      <Checkbox 
                        checked={pendingCount > 0 && selectedMonths.length === pendingCount}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        disabled={pendingCount === 0}
                        aria-label="Select all pending instalments"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">Month</TableHead>
                    <TableHead className="font-semibold text-foreground">Academic Year</TableHead>
                    <TableHead className="font-semibold text-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {months.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm font-medium">
                        No fee installments scheduled yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    months.map((month) => {
                      const isPaid = month.status === "paid"
                      const isPending = month.status === "pending"
                      const isOverdue = month.status === "overdue"
                      const isUpcoming = month.status === "upcoming"

                      return (
                        <TableRow key={month.id} className="hover:bg-muted/10 transition-colors">
                          {/* Checkbox column */}
                          <TableCell className="text-center">
                            {isPaid ? (
                              <Checkbox checked={true} disabled aria-label={`${month.month} paid`} />
                            ) : isUpcoming ? (
                              <Checkbox checked={false} disabled aria-label={`${month.month} upcoming`} />
                            ) : (
                              <Checkbox 
                                checked={selectedMonths.includes(month.id)}
                                onCheckedChange={(checked) => handleSelectRow(!!checked, month.id)}
                                aria-label={`Select ${month.month}`}
                              />
                            )}
                          </TableCell>
                          
                          <TableCell className="font-bold text-foreground">{month.month}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{month.year}</TableCell>
                          <TableCell className="font-semibold text-foreground">₹{month.amount.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(month.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <AlertCircle className="h-3 w-3 animate-pulse" /> Pending
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 animate-pulse">
                                <AlertCircle className="h-3 w-3" /> Overdue
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                Upcoming
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isPaid ? (
                              <Button 
                                variant="outline"
                                onClick={() => setReceiptMonth(month)}
                                className="text-xs h-8 font-medium inline-flex items-center gap-1.5 rounded-lg border-border hover:bg-muted"
                              >
                                <Receipt className="h-3.5 w-3.5" /> View Receipt
                              </Button>
                            ) : isPending || isOverdue ? (
                              <Button 
                                onClick={() => setCheckoutData({
                                  ids: [month.id],
                                  amount: month.amount,
                                  title: "Clear Dues",
                                  subtitle: `Clear tuition installment for ${month.month} ${month.year}`
                                })}
                                className="text-xs h-8 font-semibold inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground"
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Pay Now
                              </Button>
                            ) : (
                              <Button 
                                disabled
                                variant="outline"
                                className="text-xs h-8 rounded-lg border-border bg-transparent text-muted-foreground/50 opacity-60 cursor-not-allowed"
                              >
                                Locked
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

      {/* Checkout Dialog Modal */}
      <AnimatePresence>
        {checkoutData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCheckoutData(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{checkoutData.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{checkoutData.subtitle}</p>
                </div>
                <button 
                  onClick={() => setCheckoutData(null)}
                  className="rounded-full hover:bg-muted p-1 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Order breakdown */}
              <div className="rounded-lg bg-muted/30 p-4 border border-border/40 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tuition Fees:</span>
                  <span className="font-medium text-foreground">₹{checkoutData.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax / Gateway Fee:</span>
                  <span className="font-medium text-foreground">₹0</span>
                </div>
                <div className="pt-2 border-t border-border/65 flex justify-between text-base font-bold">
                  <span className="text-foreground">Total Dues:</span>
                  <span className="text-foreground">₹{checkoutData.amount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Payment Button */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secure Checkout</h4>
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  You will be redirected to Razorpay&apos;s secure payment page to complete this fee payment.
                </div>
              </div>

              {/* Secure Info */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Your payment session is fully encrypted and secured by Vidya School Payment System.</span>
              </div>

              {paymentMessage && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                  {paymentMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  variant="outline"
                  onClick={() => setCheckoutData(null)}
                  disabled={isPaying}
                  className="flex-1 rounded-lg border-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePay}
                  disabled={isPaying}
                  className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-1.5"
                >
                  {isPaying ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Preparing payment...
                    </span>
                  ) : (
                    `Pay ₹${checkoutData.amount.toLocaleString("en-IN")}`
                  )}
                </Button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Dialog Modal */}
      <AnimatePresence>
        {receiptMonth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReceiptMonth(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Receipt Title */}
              <div className="flex items-start justify-between pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Official Fee Receipt</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Vidya School Academic Billing</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      const url = `${window.location.origin}/fee/payment/${receiptMonth.receiptNo}`
                      if (navigator.share) {
                        navigator.share({ title: "Fee Payment Receipt", text: `Fee receipt for ${receiptMonth.month} ${receiptMonth.year}`, url })
                      } else {
                        navigator.clipboard.writeText(url)
                      }
                    }}
                    className="h-8.5 w-8.5 rounded-lg border-border hover:bg-muted"
                    title="Share receipt link"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.print()}
                    className="h-8.5 w-8.5 rounded-lg border-border hover:bg-muted"
                    title="Print receipt"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <button 
                    onClick={() => setReceiptMonth(null)}
                    className="rounded-full hover:bg-muted p-1 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Student Name:</span>
                  <span className="font-semibold text-foreground block mt-0.5">{studentProfile?.name || "Student"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Receipt Number:</span>
                  <span className="font-mono font-semibold text-foreground block mt-0.5">{receiptMonth.receiptNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Enrollment ID:</span>
                  <span className="font-semibold text-foreground block mt-0.5">{studentProfile?.admissionNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Paid Date:</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {receiptMonth.paidDate ? new Date(receiptMonth.paidDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Grade / Class:</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {studentProfile ? formatClassSection(studentProfile.class, studentProfile.section) : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Payment Mode:</span>
                  <span className="font-semibold text-foreground block mt-0.5">{receiptMonth.paymentMethod || "-"}</span>
                </div>
              </div>

              {/* Receipt QR temporarily disabled */}

              {/* Billing Breakdowns */}
              <div className="rounded-lg border border-border/80 overflow-hidden text-xs mt-6">
                <div className="grid grid-cols-12 bg-muted/40 px-4 py-2 border-b border-border/80 font-semibold text-muted-foreground">
                  <div className="col-span-8">Description</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>
                
                <div className="grid grid-cols-12 px-4 py-3 border-b border-border/40">
                  <div className="col-span-8 font-medium text-foreground">
                    Tuition Fees - {receiptMonth.month} {receiptMonth.year}
                  </div>
                  <div className="col-span-4 text-right font-semibold text-foreground">
                    ₹{receiptMonth.amount.toLocaleString("en-IN")}.00
                  </div>
                </div>

                <div className="grid grid-cols-12 px-4 py-3 border-b border-border/40">
                  <div className="col-span-8 font-medium text-foreground">
                    Development Charges
                  </div>
                  <div className="col-span-4 text-right font-semibold text-foreground">
                    ₹0.00
                  </div>
                </div>

                <div className="grid grid-cols-12 bg-muted/20 px-4 py-3 font-bold text-foreground">
                  <div className="col-span-8 uppercase tracking-wider text-[10px] text-muted-foreground flex items-center">Total Paid</div>
                  <div className="col-span-4 text-right text-base text-emerald-600 dark:text-emerald-400">
                    ₹{receiptMonth.amount.toLocaleString("en-IN")}.00
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="flex flex-col items-center justify-center text-center space-y-2 pt-4 border-t border-border/60">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <p className="text-xs font-semibold text-foreground">Payment Fully Received</p>
                <p className="text-[10px] text-muted-foreground max-w-sm">
                  This is a computer generated receipt of Vidya School. No physical signature is required.
                </p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
