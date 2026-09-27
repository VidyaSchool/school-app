"use client"

import * as React from "react"
import { 
  GitPullRequest, 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  RefreshCw, 
  X,
  User,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/date-formatter"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Borrowing {
  id: string
  bookId: string
  userId: string
  issueDate: string
  dueDate: string
  returnDate: string | null
  renewalsCount: number
  status: "active" | "overdue" | "returned"
  bookTitle: string
  bookAuthor: string
  bookIsbn: string
  studentName: string
  studentEmail: string
  studentUsername: string | null
  studentClass: string | null
  studentSection: string | null
}

interface AvailableBook {
  id: string
  title: string
  author: string
  isbn: string
  availableQuantity: number
}

export default function LibrarianBorrowingsPage() {
  const [borrowings, setBorrowings] = React.useState<Borrowing[]>([])
  const [availableBooks, setAvailableBooks] = React.useState<AvailableBook[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "overdue" | "returned">("all")

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [studentIdentifier, setStudentIdentifier] = React.useState("")
  const [resolvedUser, setResolvedUser] = React.useState<any>(null)
  const [selectedBookId, setSelectedBookId] = React.useState("")
  const [selectedBookDetails, setSelectedBookDetails] = React.useState<any>(null)
  const [bookSearchQuery, setBookSearchQuery] = React.useState("")
  const [showBookRecommendations, setShowBookRecommendations] = React.useState(false)
  const [isSearchingIsbn, setIsSearchingIsbn] = React.useState(false)
  const [isbnNotice, setIsbnNotice] = React.useState<{ text: string; type: "success" | "info" | "error" } | null>(null)
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = React.useState(false)

  // Actions states
  const [isActionProcessing, setIsActionProcessing] = React.useState<string | null>(null)

  // Debounce hook to resolve student/teacher based on admission number, username, or email
  React.useEffect(() => {
    if (!studentIdentifier.trim()) {
      setResolvedUser(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/backend/api/librarian/resolve-user?q=${encodeURIComponent(studentIdentifier.trim())}`)
        if (res.ok) {
          const data = await res.json()
          if (data.found) {
            setResolvedUser(data.user)
          } else {
            setResolvedUser(null)
          }
        }
      } catch (err) {}
    }, 300)
    return () => clearTimeout(timer)
  }, [studentIdentifier])

  // Lookup Book details by ISBN (scans Redis -> DB -> OpenLibrary API with auto-persistence)
  const handleLookupIsbn = async (inputIsbn?: string) => {
    const raw = (inputIsbn !== undefined ? inputIsbn : bookSearchQuery).trim()
    const clean = raw.replace(/[^0-9X]/gi, '').toUpperCase()
    if (!clean || clean.length < 8) {
      setIsbnNotice({ text: "Please enter a valid 10 or 13-digit ISBN (e.g. 9780140328721).", type: "error" })
      return
    }

    setIsSearchingIsbn(true)
    setIsbnNotice(null)

    try {
      const res = await fetch(`/api/backend/api/librarian/books/lookup?isbn=${encodeURIComponent(clean)}`)
      const data = await res.json()
      if (res.ok && data.found && data.book) {
        setSelectedBookId(data.book.id)
        setSelectedBookDetails(data.book)
        setShowBookRecommendations(false)

        if (data.source === "openlibrary" || data.auto_registered) {
          setIsbnNotice({
            text: `Book fetched from OpenLibrary & stored in school DB! Ready to issue.`,
            type: "success"
          })
          toast.success("Retrieved from OpenLibrary and saved to database!", {
            description: `"${data.book.title}" by ${data.book.author}`
          })
        } else if (data.source === "redis_cache") {
          setIsbnNotice({
            text: `Retrieved from Redis Cache: in stock and ready to issue.`,
            type: "info"
          })
        } else {
          setIsbnNotice({
            text: `Found in school catalog: ${data.book.available_quantity ?? data.book.availableQuantity ?? 1} copies available.`,
            type: "info"
          })
        }
      } else {
        setIsbnNotice({
          text: data.message || `No book found for ISBN ${clean} in database or OpenLibrary.`,
          type: "error"
        })
      }
    } catch (err: any) {
      setIsbnNotice({
        text: "Error searching book catalog. Please verify your connection.",
        type: "error"
      })
    } finally {
      setIsSearchingIsbn(false)
    }
  }

  // Auto-detect ISBN entry (10 or 13 digits)
  React.useEffect(() => {
    const clean = bookSearchQuery.replace(/[^0-9X]/gi, '').toUpperCase()
    if ((clean.length === 10 || clean.length === 13) && !selectedBookId) {
      const timer = setTimeout(() => {
        handleLookupIsbn(clean)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [bookSearchQuery, selectedBookId])

  // Filter available books based on search query
  const bookRecommendations = React.useMemo(() => {
    if (!bookSearchQuery.trim()) return availableBooks
    return availableBooks.filter(book => 
      book.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase())
    )
  }, [bookSearchQuery, availableBooks])

  const fetchBorrowings = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings")
      if (!res.ok) throw new Error("Failed to fetch borrowings")
      const data = await res.json()
      setBorrowings(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load borrowings")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAvailableBooks = async () => {
    try {
      const res = await fetch("/api/backend/api/librarian/books")
      if (res.ok) {
        const data = await res.json()
        setAvailableBooks(data.filter((b: any) => (b.available_quantity ?? b.availableQuantity) > 0))
      }
    } catch (err) {}
  }

  React.useEffect(() => {
    fetchBorrowings()
  }, [fetchBorrowings])

  const handleOpenIssueModal = () => {
    setStudentIdentifier("")
    setResolvedUser(null)
    setSelectedBookId("")
    setSelectedBookDetails(null)
    setBookSearchQuery("")
    setShowBookRecommendations(false)
    setIsSearchingIsbn(false)
    setIsbnNotice(null)
    
    // Default due date: 14 days from today
    const fourteenDaysLater = new Date()
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14)
    setDueDate(fourteenDaysLater)
    
    fetchAvailableBooks()
    setIsFormOpen(true)
  }

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentIdentifier.trim() || !selectedBookId || !dueDate) {
      toast.error("Please fill in all fields (Borrower, ISBN/Book, Due Date)")
      return
    }

    if (resolvedUser && resolvedUser.canBorrow === false) {
      if (!confirm(`Warning: ${resolvedUser.statusNotice || "Student has borrowing restrictions"}. Proceed anyway?`)) {
        return
      }
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIdentifier: studentIdentifier.trim(),
          bookId: selectedBookId,
          dueDate: dueDate.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to issue book")

      toast.success(
        selectedBookDetails
          ? `Issued "${selectedBookDetails.title}" to ${resolvedUser?.name || studentIdentifier}`
          : "Book issued successfully to student"
      )
      setIsFormOpen(false)
      fetchBorrowings()
    } catch (err: any) {
      toast.error(err.message || "Failed to issue book")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReturn = async (id: string, title: string) => {
    if (!confirm(`Confirm return for "${title}"?`)) return
    
    setIsActionProcessing(id)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "return" }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to return book")

      toast.success(`Book "${title}" marked as returned`)
      fetchBorrowings()
    } catch (err: any) {
      toast.error(err.message || "Failed to complete return")
    } finally {
      setIsActionProcessing(null)
    }
  }

  const handleRenew = async (id: string, title: string) => {
    if (!confirm(`Extend borrowing for "${title}" by 14 days?`)) return

    setIsActionProcessing(id)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "renew" }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to renew book")

      toast.success(`Book "${title}" renewed successfully`)
      fetchBorrowings()
    } catch (err: any) {
      toast.error(err.message || "Failed to renew book")
    } finally {
      setIsActionProcessing(null)
    }
  }

  const filteredBorrowings = borrowings.filter((tx) => {
    const matchesSearch =
      tx.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.bookIsbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.studentUsername && tx.studentUsername.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || tx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculations
  const activeCount = borrowings.filter((b) => b.status === "active").length
  const overdueCount = borrowings.filter((b) => b.status === "overdue").length
  const returnedCount = borrowings.filter((b) => b.status === "returned").length

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <GitPullRequest className="h-8 w-8 text-primary" />
            Book Loan Administration
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Coordinate student requests, issue new library holdings, process returns, and manage renewal limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchBorrowings}
            variant="outline"
            size="sm"
            className="rounded-lg cursor-pointer flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenIssueModal} 
            className="rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Issue Book
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3 px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Loans</p>
            <h3 className="text-2xl font-bold text-foreground">{activeCount} Issue(s)</h3>
            <p className="text-[10px] text-muted-foreground">Borrowed within timeline</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Returns</p>
            <h3 className="text-2xl font-bold text-foreground">{overdueCount} Book(s)</h3>
            <p className="text-[10px] text-muted-foreground">Pending return timeline</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-muted text-muted-foreground"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Handled</p>
            <h3 className="text-2xl font-bold text-foreground">{borrowings.length} Transaction(s)</h3>
            <p className="text-[10px] text-muted-foreground">Historical checkout events</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search by student name, book title, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>

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

      {/* Table Section */}
      <div className="px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Student</TableHead>
                <TableHead className="font-semibold text-foreground">Book Checked Out</TableHead>
                <TableHead className="font-semibold text-foreground">Issue Date</TableHead>
                <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner size="lg" />
                      <span className="font-semibold text-xs text-muted-foreground mt-2">Loading transactions logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBorrowings.length > 0 ? (
                filteredBorrowings.map((tx) => {
                  const isActive = tx.status === "active"
                  const isOverdue = tx.status === "overdue"
                  const isReturned = tx.status === "returned"

                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/10 transition-colors">
                      {/* Student Profile Info */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-xs">{tx.studentName}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {tx.studentClass ? `Class ${tx.studentClass}-${tx.studentSection || "All"}` : tx.studentEmail}
                          </span>
                        </div>
                      </TableCell>

                      {/* Book Details */}
                      <TableCell className="py-3">
                        <div className="flex flex-col max-w-[220px]">
                          <span className="font-bold text-foreground text-xs truncate">{tx.bookTitle}</span>
                          <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{tx.bookIsbn}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.issueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>

                      <TableCell className="text-xs font-semibold">
                        {isReturned ? (
                          <span className="text-muted-foreground/60 font-medium">Returned</span>
                        ) : (
                          <span className={isOverdue ? "text-red-500 font-bold" : "text-foreground"}>
                            {new Date(tx.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Clock className="h-3 w-3" /> Active
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Returned
                          </span>
                        )}
                      </TableCell>

                      {/* Operations */}
                      <TableCell className="text-right">
                        {isReturned ? (
                          <span className="text-[10px] text-muted-foreground/50 pr-4">
                            Closed on {new Date(tx.returnDate!).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenew(tx.id, tx.bookTitle)}
                              disabled={isActionProcessing !== null}
                              className="text-[11px] h-8 font-semibold inline-flex items-center gap-1 rounded-lg hover:bg-muted cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" /> Renew ({tx.renewalsCount})
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleReturn(tx.id, tx.bookTitle)}
                              disabled={isActionProcessing !== null}
                              className="text-[11px] h-8 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Return
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border">
                    No borrowing transactions match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Issue Book Dialog Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFormOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Issue Book Transaction
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Assign a book checkout event to a registered student.
                  </p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full hover:bg-muted p-1 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleIssueBook} className="space-y-4 pt-2">
                {/* Borrower Resolution Input */}
                <div className="space-y-1.5">
                  <label htmlFor="student-id" className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Borrower (Admission No, Username, or Email) *</span>
                    {resolvedUser && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        VERIFIED
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                    <Input
                      id="student-id"
                      type="text"
                      placeholder="e.g. ADM-2024-001 or arjun_mehta or student email..."
                      value={studentIdentifier}
                      onChange={(e) => setStudentIdentifier(e.target.value)}
                      className="pl-9 h-10 rounded-lg border-border bg-card/60 text-xs"
                      required
                    />
                  </div>

                  {resolvedUser && (
                    <div className="mt-1.5 p-2.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-border text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {resolvedUser.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {resolvedUser.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {resolvedUser.admissionNumber && (
                          <span>ADM: {resolvedUser.admissionNumber}</span>
                        )}
                        {resolvedUser.class && (
                          <span>• Class {resolvedUser.class}{resolvedUser.section ? `-${resolvedUser.section}` : ""}</span>
                        )}
                        <span>• Active Loans: {resolvedUser.activeLoansCount ?? 0}/5</span>
                      </div>
                      {resolvedUser.statusNotice && (
                        <div className={cn(
                          "text-[10px] font-semibold mt-0.5",
                          resolvedUser.canBorrow ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        )}>
                          {resolvedUser.statusNotice}
                        </div>
                      )}
                    </div>
                  )}

                  {!resolvedUser && studentIdentifier.trim() && (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      No user found matching this admission number, username, or email.
                    </div>
                  )}
                </div>

                {/* Book ISBN Search & Lookup Input */}
                <div className="space-y-1.5 flex flex-col relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Select Available Book *
                    </label>
                    {bookSearchQuery.trim() && !selectedBookId && (
                      <button
                        type="button"
                        onClick={() => handleLookupIsbn()}
                        disabled={isSearchingIsbn}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSearchingIsbn ? <Spinner className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                        Fetch ISBN
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                    <Input
                      type="text"
                      placeholder="ISBN (e.g. 9780140328721, 0451524934 or book title)..."
                      value={bookSearchQuery}
                      onChange={(e) => {
                        setBookSearchQuery(e.target.value)
                        setShowBookRecommendations(true)
                        if (selectedBookId) {
                          setSelectedBookId("")
                          setSelectedBookDetails(null)
                        }
                        setIsbnNotice(null)
                      }}
                      onFocus={() => setShowBookRecommendations(true)}
                      onBlur={() => {
                        setTimeout(() => setShowBookRecommendations(false), 200)
                      }}
                      className="pl-9 pr-16 h-10 rounded-lg border-border bg-card/60 text-xs w-full font-mono"
                      required={!selectedBookId}
                    />
                    <div className="absolute right-2 top-2.5 flex items-center gap-1.5">
                      {isSearchingIsbn && <Spinner className="h-4 w-4 text-primary" />}
                      {selectedBookDetails && !isSearchingIsbn && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {bookSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setBookSearchQuery("")
                            setSelectedBookId("")
                            setSelectedBookDetails(null)
                            setIsbnNotice(null)
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ISBN Notice */}
                  {isbnNotice && (
                    <div className={cn(
                      "p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 mt-1",
                      isbnNotice.type === "success" && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                      isbnNotice.type === "info" && "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400",
                      isbnNotice.type === "error" && "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                    )}>
                      {isbnNotice.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                      {isbnNotice.type === "info" && <Clock className="h-3.5 w-3.5 shrink-0" />}
                      {isbnNotice.type === "error" && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                      <span>{isbnNotice.text}</span>
                    </div>
                  )}

                  {/* Selected Book Card Preview */}
                  {selectedBookDetails && (
                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-start gap-3 mt-1.5">
                      {selectedBookDetails.cover_url ? (
                        <img
                          src={selectedBookDetails.cover_url}
                          alt={selectedBookDetails.title}
                          className="h-14 w-10 object-cover rounded shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-10 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0 text-muted-foreground">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-foreground truncate">{selectedBookDetails.title}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-card">
                            ISBN: {selectedBookDetails.isbn}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">by {selectedBookDetails.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {selectedBookDetails.available_quantity ?? selectedBookDetails.availableQuantity ?? 1} Available
                          </span>
                          {selectedBookDetails.category && (
                            <span className="text-[10px] text-muted-foreground">
                              • {selectedBookDetails.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Dropdown */}
                  {showBookRecommendations && !selectedBookId && (
                    <div className="absolute z-50 left-0 right-0 top-16 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg divide-y divide-border/60">
                      {bookRecommendations.length > 0 ? (
                        bookRecommendations.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedBookId(book.id)
                              setSelectedBookDetails(book)
                              setBookSearchQuery(`${book.title} (ISBN: ${book.isbn})`)
                              setShowBookRecommendations(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex flex-col gap-0.5 cursor-pointer"
                          >
                            <span className="font-bold text-foreground">{book.title}</span>
                            <span className="text-[10px] text-muted-foreground">
                              by {book.author} • ISBN: {book.isbn} • {book.availableQuantity} available
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                          {bookSearchQuery.trim() ? "No local stock match. Tap 'Fetch ISBN' to search OpenLibrary." : "No matching books in stock"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Smart Borrower-Book Link Preview */}
                {resolvedUser && selectedBookDetails && (
                  <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3" /> Smart Loan Link
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">READY TO CHECKOUT</span>
                    </div>
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-foreground truncate">{selectedBookDetails.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">ISBN: {selectedBookDetails.isbn}</span>
                      </div>
                      <span className="text-muted-foreground font-bold">&rarr;</span>
                      <div className="flex flex-col items-end min-w-0">
                        <span className="font-bold text-foreground truncate">{resolvedUser.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {resolvedUser.class ? `Class ${resolvedUser.class}` : resolvedUser.role}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="due-date" className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Due Date *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left h-10 rounded-lg border-border bg-card/60 text-xs font-normal cursor-pointer",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/75" />
                        {dueDate ? formatDate(dueDate) : <span>Pick a due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-border mt-6">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    disabled={isSaving}
                    className="flex-1 rounded-lg border-border hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Issue Book</span>
                    {isSaving && (
                      <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
