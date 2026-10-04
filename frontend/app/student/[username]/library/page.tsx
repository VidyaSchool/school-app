"use client"

import * as React from "react"
import { 
  BookOpen, 
  BookMarked, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Search, 
  X, 
  ShieldAlert, 
  Library 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import StudentLibrarySkeleton from "./skeleton"
import { getStudentCache, setStudentCache, isCacheFresh } from "@/lib/student-cache"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface BookIssue {
  id: string
  title: string
  author: string
  isbn: string
  issueDate: string
  dueDate: string
  returnDate?: string
  status: "active" | "overdue" | "returned"
  renewalsCount: number
}

export default function StudentLibraryPage() {
  const cachedIssues = React.useMemo(() => getStudentCache<BookIssue[]>("library"), [])
  const [issues, setIssues] = React.useState<BookIssue[]>(() => cachedIssues || [])
  const [loading, setLoading] = React.useState(() => !cachedIssues)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "overdue" | "returned">("all")
  
  const [renewingBook, setRenewingBook] = React.useState<BookIssue | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const fetchIssues = React.useCallback(async () => {
    try {
      const res = await fetch("/api/backend/api/student/borrowings")
      if (!res.ok) throw new Error("Failed to fetch library borrowings")
      const data = await res.json()
      setIssues(data)
      setStudentCache("library", data)
    } catch (err: any) {
      if (!getStudentCache("library")) {
        toast.error(err.message || "Failed to load library logs")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!isCacheFresh("library")) {
      fetchIssues()
    }
  }, [fetchIssues])

  // Calculations
  const activeCount = issues.filter(b => b.status === "active").length
  const overdueCount = issues.filter(b => b.status === "overdue").length
  const historyCount = issues.filter(b => b.status === "returned").length

  const handleRenew = async () => {
    if (!renewingBook) return
    setIsProcessing(true)
    
    try {
      const res = await fetch("/api/backend/api/student/borrowings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renewingBook.id }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to renew book")
      
      toast.success(`Book "${renewingBook.title}" renewed successfully`)
      fetchIssues()
      setRenewingBook(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to renew book")
    } finally {
      setIsProcessing(false)
    }
  }

  // Search & Filter items
  const filteredIssues = issues.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (statusFilter === "all") return matchesSearch
    return matchesSearch && book.status === statusFilter
  })


  if (loading) {
    return <StudentLibrarySkeleton />
  }

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background">
      
      {/* Page Title & Desc */}
      <div className="flex flex-col gap-1.5 px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Library Hub
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Manage your active borrowings, check due dates, renew titles, and review your historical library logs.
        </p>
      </div>

      {/* Metrics Summary Panels */}
      <div className="grid gap-4 md:grid-cols-3 px-6 lg:px-8">
        
        {/* Metric 1 */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Borrowings</p>
            <h3 className="text-2xl font-bold text-foreground">{activeCount} Title(s)</h3>
            <p className="text-[10px] text-muted-foreground">Within standard issue guidelines</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue Returns</p>
            <h3 className="text-2xl font-bold text-foreground">{overdueCount} Book(s)</h3>
            <p className="text-[10px] text-muted-foreground">
              {overdueCount > 0 ? "Requires immediate renewal/return" : "All books returned on time"}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Library Card Status</p>
            <h3 className="text-2xl font-bold text-foreground">Active Card</h3>
            <p className="text-[10px] text-muted-foreground">Valid till December 2027</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Library className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Book List Operations */}
      <div className="px-6 lg:px-8 space-y-4">
        
        {/* Controls Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
            <Input 
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/40 rounded-lg self-start">
            {(["all", "active", "overdue", "returned"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${statusFilter === tab ? "bg-card text-foreground shadow-xs border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Shadcn Table */}
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Book Details</TableHead>
                <TableHead className="font-semibold text-foreground">ISBN</TableHead>
                <TableHead className="font-semibold text-foreground">Issue Date</TableHead>
                <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length > 0 ? (
                filteredIssues.map((book) => {
                  const isActive = book.status === "active"

                  const isOverdue = book.status === "overdue"
                  const isReturned = book.status === "returned"

                  return (
                    <TableRow key={book.id} className="hover:bg-muted/10 transition-colors">
                      {/* Book Cover Icon & Details */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-8.5 rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground shrink-0 shadow-xs">
                            <BookMarked className="h-5.5 w-5.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground leading-tight">{book.title}</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{book.author}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{book.isbn}</TableCell>
                      
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(book.issueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      
                      <TableCell className="text-xs">
                        {isReturned ? (
                          <span className="text-muted-foreground">Returned</span>
                        ) : (
                          <span className={`font-medium ${isOverdue ? "text-red-500 font-semibold" : "text-foreground"}`}>
                            {new Date(book.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 animate-pulse">
                            <AlertCircle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            Returned
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {isReturned ? (
                          <span className="text-xs text-muted-foreground/60 block pr-4">
                            Returned on {new Date(book.returnDate!).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button 
                              onClick={() => setRenewingBook(book)}
                              className="text-xs h-8 font-semibold inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Renew
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No borrowing records found matching the criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* Renewal Dialog Modal */}
      <AnimatePresence>
        {renewingBook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRenewingBook(null)}
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
                  <h3 className="text-xl font-bold text-foreground">Renew Borrowing</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Extend the return timeline for this title</p>
                </div>
                <button 
                  onClick={() => setRenewingBook(null)}
                  className="rounded-full hover:bg-muted p-1 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Book Details Box */}
              <div className="rounded-lg bg-muted/30 p-4 border border-border/40 space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Title:</span>
                  <span className="font-semibold text-foreground text-sm mt-0.5 block">{renewingBook.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Author:</span>
                  <span className="font-medium text-foreground block">{renewingBook.author}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-border/60 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block">Current Due Date:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(renewingBook.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-emerald-600 dark:text-emerald-400">New Due Date:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(() => {
                        const d = new Date(renewingBook.dueDate)
                        d.setDate(d.getDate() + 14)
                        return d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-primary/5 border border-primary/10 rounded-lg p-2.5">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>Renewals extend the borrowing timeline by 14 days. Limit is 3 extensions per book issue.</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  variant="outline"
                  onClick={() => setRenewingBook(null)}
                  disabled={isProcessing}
                  className="flex-1 rounded-lg border-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRenew}
                  disabled={isProcessing}
                  className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Renewing...
                    </span>
                  ) : (
                    "Confirm Renewal"
                  )}
                </Button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
