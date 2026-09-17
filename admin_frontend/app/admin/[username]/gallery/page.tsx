"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Upload,
  ImageIcon,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  Search,
  X,
  Cloud,
  Maximize2,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"

export interface GalleryPhoto {
  id: string
  title: string
  description?: string
  category: string
  src: string
  aspectRatio: string
  location?: string
  date?: string
  order: number
  createdAt?: string
  updatedAt?: string
}

const CATEGORIES = [
  "Campus & Life",
  "Academics & Labs",
  "Arts & Music",
  "STEM & Robotics",
  "Sports & Athletics",
  "Leadership",
  "Events & Celebrations",
]

const ASPECT_RATIOS = [
  { value: "aspect-[4/3]", label: "4:3 (Standard Photo)" },
  { value: "aspect-[16/9]", label: "16:9 (Widescreen / Banner)" },
  { value: "aspect-square", label: "1:1 (Square)" },
]

export default function AdminGalleryPage() {
  const params = useParams()
  const username = params?.username as string

  const [photos, setPhotos] = React.useState<GalleryPhoto[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [filePreviews, setFilePreviews] = React.useState<string[]>([])
  const [uploadCategory, setUploadCategory] = React.useState("Campus & Life")
  const [uploadAspectRatio, setUploadAspectRatio] = React.useState("aspect-[4/3]")
  const [uploadLocation, setUploadLocation] = React.useState("Main Campus, Gurugram")
  const [uploadDate, setUploadDate] = React.useState(new Date().getFullYear().toString())
  const [uploadDescription, setUploadDescription] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgressText, setUploadProgressText] = React.useState("")

  // Edit modal states
  const [editingPhoto, setEditingPhoto] = React.useState<GalleryPhoto | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isSavingEdit, setIsSavingEdit] = React.useState(false)

  // Delete modal states
  const [deletingPhoto, setDeletingPhoto] = React.useState<GalleryPhoto | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Lightbox preview state
  const [previewPhoto, setPreviewPhoto] = React.useState<GalleryPhoto | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Fetch gallery photos from API
  const fetchPhotos = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/gallery")
      if (!res.ok) {
        throw new Error("Failed to load gallery photos")
      }
      const data = await res.json()
      if (data.success && Array.isArray(data.images)) {
        setPhotos(data.images)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load gallery")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const ALLOWED_MIMES = React.useMemo(() => [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ], [])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const rawFiles = Array.from(e.target.files)
    if (rawFiles.length === 0) return

    const validFiles: File[] = []
    for (const f of rawFiles) {
      if (!ALLOWED_MIMES.includes(f.type.toLowerCase())) {
        toast.error(`"${f.name}" is not an accepted image format. Allowed: JPEG, PNG, WEBP, GIF, AVIF`)
        continue
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds the 20MB size limit`)
        continue
      }
      validFiles.push(f)
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    // Revoke old object URLs to prevent memory leaks
    filePreviews.forEach((url) => URL.revokeObjectURL(url))

    setSelectedFiles(validFiles)

    // Generate local preview URLs
    const previews = validFiles.map((file) => URL.createObjectURL(file))
    setFilePreviews(previews)
  }

  // Upload file to S3
  const uploadSingleFileToS3 = async (file: File): Promise<string> => {
    // Attempt Presigned S3 direct upload
    try {
      const presignedRes = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_presigned_url",
          fileName: file.name,
          fileType: file.type,
        }),
      })

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json()
        if (presignedData.configured && presignedData.presignedUrl) {
          try {
            const putRes = await fetch(presignedData.presignedUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            })
            if (putRes.ok) {
              return presignedData.fileUrl
            }
          } catch (putErr) {
            console.warn("Direct S3 PUT failed, falling back to server buffer upload:", putErr)
          }
        }
      }
    } catch (err) {
      console.warn("Presigned URL generation failed, falling back to server upload:", err)
    }

    // Server buffer upload fallback
    const formData = new FormData()
    formData.append("file", file)

    const formRes = await fetch("/api/admin/gallery/upload", {
      method: "POST",
      body: formData,
    })

    if (!formRes.ok) {
      const err = await formRes.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(err.error || `Upload failed for ${file.name}`)
    }

    const formResult = await formRes.json()
    if (!formResult.url) {
      throw new Error(`Upload failed for ${file.name}`)
    }

    return formResult.url
  }

  // Submit multiple photos upload
  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image file")
      return
    }

    setIsUploading(true)
    const uploadedRecords: any[] = []

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setUploadProgressText(`Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}...`)

        const s3Url = await uploadSingleFileToS3(file)

        const title = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())

        uploadedRecords.push({
          title,
          description: uploadDescription,
          category: uploadCategory,
          src: s3Url,
          aspectRatio: uploadAspectRatio,
          location: uploadLocation,
          date: uploadDate,
          order: photos.length + i,
        })
      }

      setUploadProgressText("Saving records to gallery database...")

      const saveRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadedRecords),
      })

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({ error: "Database save failed" }))
        throw new Error(err.error || "Failed to save photos to database")
      }

      toast.success(`Successfully uploaded ${uploadedRecords.length} photo(s) to AWS S3!`)
      setIsUploadOpen(false)
      setSelectedFiles([])
      setFilePreviews([])
      setUploadDescription("")
      fetchPhotos()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to complete upload")
    } finally {
      setIsUploading(false)
      setUploadProgressText("")
    }
  }

  // Edit photo submission
  const handleSaveEdit = async () => {
    if (!editingPhoto) return
    setIsSavingEdit(true)

    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPhoto),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to update photo" }))
        throw new Error(err.error || "Failed to update photo")
      }

      toast.success("Photo details updated successfully")
      setIsEditOpen(false)
      setEditingPhoto(null)
      fetchPhotos()
    } catch (err: any) {
      toast.error(err.message || "Failed to update photo")
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Delete photo submission
  const handleConfirmDelete = async () => {
    if (!deletingPhoto) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(deletingPhoto.id)}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to delete photo" }))
        throw new Error(err.error || "Failed to delete photo")
      }

      toast.success("Photo permanently deleted from gallery and AWS S3")
      setDeletingPhoto(null)
      fetchPhotos()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete photo")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered photos
  const filteredPhotos = React.useMemo(() => {
    return photos.filter((photo) => {
      const matchesCategory = activeCategory === "All" || photo.category === activeCategory
      const matchesSearch =
        searchQuery === "" ||
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (photo.description && photo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (photo.location && photo.location.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [photos, activeCategory, searchQuery])

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              Media &amp; Campus Assets
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AWS S3 Bucket Connected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ImageIcon className="size-7 text-primary" />
            Campus Photo Gallery
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Upload high-resolution school images stored securely in AWS S3 and dynamically presented on the public gallery.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPhotos}
            disabled={loading}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 cursor-pointer text-xs">
            <a
              href={`${process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000"}/gallery`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" />
              View Public Gallery
            </a>
          </Button>

          <Button
            onClick={() => setIsUploadOpen(true)}
            size="sm"
            className="gap-1.5 cursor-pointer text-xs font-semibold shadow-xs"
          >
            <Plus className="size-4" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-xl border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Total Photos</div>
          <div className="text-2xl font-bold text-foreground mt-1">{photos.length}</div>
        </Card>
        <Card className="p-4 rounded-xl border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Campus &amp; Life</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {photos.filter((p) => p.category === "Campus & Life").length}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border bg-card">
          <div className="text-xs font-medium text-muted-foreground">STEM &amp; Robotics</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {photos.filter((p) => p.category === "STEM & Robotics").length}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Arts &amp; Music</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {photos.filter((p) => p.category === "Arts & Music").length}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border rounded-2xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={activeCategory === "All" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory("All")}
            className="h-8 text-xs font-medium rounded-lg cursor-pointer"
          >
            All ({photos.length})
          </Button>
          {CATEGORIES.map((cat) => {
            const count = photos.filter((p) => p.category === cat).length
            return (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="h-8 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
              >
                {cat} ({count})
              </Button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading gallery from cloud storage...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl p-8 space-y-3">
          <div className="size-12 rounded-full bg-muted/40 mx-auto flex items-center justify-center text-muted-foreground">
            <ImageIcon className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No photos found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || activeCategory !== "All"
              ? "Try adjusting your search query or selected category filter."
              : "No gallery photos uploaded yet. Click the upload button to add photos to AWS S3."}
          </p>
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="gap-1.5 cursor-pointer text-xs mt-2"
          >
            <Upload className="size-3.5" />
            Upload Photos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="group overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Container */}
              <div
                className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30 cursor-pointer"
                onClick={() => setPreviewPhoto(photo)}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white">
                  <span className="text-xs font-semibold flex items-center gap-1">
                    <Maximize2 className="size-3.5" /> View Full
                  </span>
                  <a
                    href={photo.src}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-white hover:text-primary transition-colors"
                    title="Open S3 link"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
                <Badge
                  variant="secondary"
                  className="absolute top-2.5 left-2.5 text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs border-0"
                >
                  {photo.category}
                </Badge>
              </div>

              {/* Details & Actions */}
              <CardContent className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1" title={photo.title}>
                    {photo.title}
                  </h4>
                  {photo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {photo.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 truncate" title={photo.location}>
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{photo.location || "Gurugram"}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="size-3" />
                      {photo.date || "2026"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPhoto({ ...photo })
                        setIsEditOpen(true)
                      }}
                      className="h-7 px-2 text-xs gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPhoto(photo)}
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1 cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => !isUploading && setIsUploadOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="size-5 text-primary" />
              Upload Photos to AWS S3 Gallery
            </DialogTitle>
            <DialogDescription>
              Select one or more high-resolution images. Files are uploaded directly to the S3 bucket under the gallery folder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/20 space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Click to browse or drag and drop images</p>
                <p className="text-xs text-muted-foreground mt-0.5">Supports PNG, JPG, WEBP, GIF up to 25MB per photo</p>
              </div>
            </div>

            {/* Selected Previews */}
            {filePreviews.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Selected Files ({selectedFiles.length}):
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles([])
                      setFilePreviews([])
                    }}
                    className="h-6 text-[11px] text-muted-foreground"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-1 border rounded-xl">
                  {filePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 right-1 text-[9px] font-medium text-white bg-black/70 px-1 py-0.5 rounded truncate">
                        {selectedFiles[i]?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Category</label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Aspect Ratio</label>
                <Select value={uploadAspectRatio} onValueChange={setUploadAspectRatio}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Location</label>
                <Input
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  placeholder="e.g. Main Campus, Gurugram"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Date / Year</label>
                <Input
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  placeholder="e.g. 2026"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Default Description (Optional)</label>
              <Textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Add context or details for these photos..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {isUploading && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{uploadProgressText || "Uploading files..."}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              disabled={isUploading}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={isUploading || selectedFiles.length === 0}
              className="gap-1.5 cursor-pointer text-xs font-semibold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""} to S3
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Photo Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !isSavingEdit && setIsEditOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Photo Information</DialogTitle>
            <DialogDescription>Update caption, category, or location metadata.</DialogDescription>
          </DialogHeader>

          {editingPhoto && (
            <div className="space-y-3.5 py-2">
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border bg-muted">
                <img src={editingPhoto.src} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Photo Title</label>
                <Input
                  value={editingPhoto.title}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Category</label>
                  <Select
                    value={editingPhoto.category}
                    onValueChange={(val) => setEditingPhoto({ ...editingPhoto, category: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Aspect Ratio</label>
                  <Select
                    value={editingPhoto.aspectRatio}
                    onValueChange={(val) => setEditingPhoto({ ...editingPhoto, aspectRatio: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Location</label>
                  <Input
                    value={editingPhoto.location || ""}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, location: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Date / Year</label>
                  <Input
                    value={editingPhoto.date || ""}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, date: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Description</label>
                <Textarea
                  value={editingPhoto.description || ""}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, description: e.target.value })}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={isSavingEdit}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="gap-1.5 cursor-pointer text-xs font-semibold"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deletingPhoto)} onOpenChange={(open) => !open && setDeletingPhoto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertCircle className="size-5" />
              Delete Photo Permanently
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <b>&quot;{deletingPhoto?.title}&quot;</b>? This will permanently remove the record from the database and delete the file from the AWS S3 storage bucket.
            </DialogDescription>
          </DialogHeader>

          {deletingPhoto && (
            <div className="py-2">
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border bg-muted">
                <img src={deletingPhoto.src} alt="To delete" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingPhoto(null)}
              disabled={isDeleting}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5 cursor-pointer text-xs font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" /> Confirm Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Lightbox Preview */}
      {previewPhoto && (
        <Dialog open={Boolean(previewPhoto)} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 text-white border-white/10">
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-full max-h-[75vh] flex items-center justify-center p-2">
                <img
                  src={previewPhoto.src}
                  alt={previewPhoto.title}
                  className="max-h-[72vh] w-auto object-contain rounded-lg"
                />
              </div>

              <div className="w-full bg-black/80 px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{previewPhoto.title}</h3>
                  <p className="text-xs text-white/70 mt-0.5">{previewPhoto.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {previewPhoto.category}
                  </Badge>
                  <a
                    href={previewPhoto.src}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
