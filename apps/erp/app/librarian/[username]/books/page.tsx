"use client"

import * as React from "react"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  MapPin, 
  Layers, 
  BookMarked,
  X,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  quantity: number
  availableQuantity: number
  location: string | null
  createdAt: string
}

export default function LibrarianBooksPage() {
  const [books, setBooks] = React.useState<Book[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All")

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingBook, setEditingBook] = React.useState<Book | null>(null)
  
  // Fields
  const [title, setTitle] = React.useState("")
  const [author, setAuthor] = React.useState("")
  const [isbn, setIsbn] = React.useState("")
  const [category, setCategory] = React.useState("General")
  const [quantity, setQuantity] = React.useState("1")
  const [location, setLocation] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const fetchBooks = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/backend/api/librarian/books")
      if (!res.ok) throw new Error("Failed to fetch books")
      const data = await res.json()
      setBooks(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load library catalog")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleOpenAddModal = () => {
    setEditingBook(null)
    setTitle("")
    setAuthor("")
    setIsbn("")
    setCategory("General")
    setQuantity("1")
    setLocation("")
    setIsFormOpen(true)
  }

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book)
    setTitle(book.title)
    setAuthor(book.author)
    setIsbn(book.isbn)
    setCategory(book.category)
    setQuantity(book.quantity.toString())
    setLocation(book.location || "")
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: editingBook?.id,
        title,
        author,
        isbn,
        category,
        quantity: parseInt(quantity) || 1,
        location: location.trim() || null
      }

      const method = editingBook ? "PATCH" : "POST"
      const res = await fetch("/api/backend/api/librarian/books", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to save book")

      toast.success(editingBook ? "Book updated successfully" : "Book added to catalog")
      setIsFormOpen(false)
      fetchBooks()
    } catch (err: any) {
      toast.error(err.message || "Failed to save book")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the catalog? This will remove all associated issue records.`)) {
      return
    }

    try {
      const res = await fetch("/api/backend/api/librarian/books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })

      if (!res.ok) throw new Error("Failed to delete book")
      toast.success(`"${name}" removed from catalog`)
      fetchBooks()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete book")
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "All" || book.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Get distinct categories for filters
  const categories = ["All", ...Array.from(new Set(books.map(b => b.category)))]

  return (
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Catalog Management
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Add new library assets, inspect availability logs, update publication identifiers, and coordinate stock levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchBooks}
            variant="outline"
            size="sm"
            className="rounded-lg cursor-pointer flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenAddModal} 
            className="rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Book
          </Button>
        </div>
      </div>

      {/* Search & Filter Panels */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat)}
              size="sm"
              className="text-xs rounded-lg cursor-pointer shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div>
        <div className="rounded-xl border border-border bg-card/30 overflow-x-auto shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Book Details</TableHead>
                <TableHead className="font-semibold text-foreground">ISBN</TableHead>
                <TableHead className="font-semibold text-foreground">Category</TableHead>
                <TableHead className="font-semibold text-foreground">Shelf / Location</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Available Stock</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner size="lg" />
                      <span className="font-semibold text-xs text-muted-foreground mt-2">Loading library catalog...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBooks.length > 0 ? (
                filteredBooks.map((book) => {
                  const outOfStock = book.availableQuantity === 0
                  return (
                    <TableRow key={book.id} className="hover:bg-muted/10 transition-colors">
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
                      <TableCell className="font-mono text-xs text-muted-foreground">{book.isbn}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold">
                          {book.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {book.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/70" />
                            {book.location}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-bold ${outOfStock ? "text-red-500" : "text-foreground"}`}>
                            {book.availableQuantity} / {book.quantity}
                          </span>
                          <span className="text-[9px] text-muted-foreground mt-0.5">copies ready</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditModal(book)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(book.id, book.title)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border">
                    No books found in the catalog matching the criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Dialog Modal */}
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
              className="relative max-w-lg w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[min(90vh,calc(100%-2rem))] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {editingBook ? "Edit Book Details" : "Add Book to Catalog"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingBook ? "Update metadata details for this record" : "Introduce a new reference book to student streams"}
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
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="book-title" className="text-xs font-semibold text-foreground">Book Title *</label>
                  <Input
                    id="book-title"
                    type="text"
                    placeholder="e.g. Introduction to Algorithms"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 rounded-lg border-border bg-card/60 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="book-author" className="text-xs font-semibold text-foreground">Author *</label>
                    <Input
                      id="book-author"
                      type="text"
                      placeholder="e.g. Thomas H. Cormen"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="h-10 rounded-lg border-border bg-card/60 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="book-isbn" className="text-xs font-semibold text-foreground">ISBN Identifier *</label>
                    <Input
                      id="book-isbn"
                      type="text"
                      placeholder="e.g. 978-0262033848"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="h-10 rounded-lg border-border bg-card/60 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-semibold text-foreground">Category *</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-10 rounded-lg border-border bg-card/60 text-xs cursor-pointer">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Literature">Literature</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="book-quantity" className="text-xs font-semibold text-foreground">Total Copies (Stock) *</label>
                    <Input
                      id="book-quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-10 rounded-lg border-border bg-card/60 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="book-location" className="text-xs font-semibold text-foreground">Shelf / Room Location</label>
                    <Input
                      id="book-location"
                      type="text"
                      placeholder="e.g. Shelf A-3"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-10 rounded-lg border-border bg-card/60 text-xs"
                    />
                  </div>
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
                    className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Confirm Book"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
