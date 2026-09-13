"use client"

import * as React from "react"
import {
  ImageIcon,
  Trash2Icon,
  PlusIcon,
  Loader2Icon,
  UploadCloudIcon,
  CloudIcon,
  LinkIcon,
  XIcon,
  CheckIcon,
  PencilIcon,
  GripVerticalIcon,
} from "lucide-react"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface SliderImage {
  id: number
  url: string
  title: string
  enabled: boolean
  targetAudience?: string
  targetClasses?: string
}

function isS3Url(url: string) {
  return url.includes("amazonaws.com") || url.includes("s3.") || url.includes("/sliders/")
}

interface SortableBannerItemProps {
  img: SliderImage
  index: number
  isEditing: boolean
  editingTitle: string
  saving: boolean
  onStartEdit: (img: SliderImage) => void
  onCancelEdit: () => void
  onSaveTitle: (id: number) => void
  onEditingTitleChange: (val: string) => void
  onToggle: (id: number, enabled: boolean) => void
  onDelete: (id: number) => void
}

function SortableBannerItem({
  img,
  index,
  isEditing,
  editingTitle,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveTitle,
  onEditingTitleChange,
  onToggle,
  onDelete,
}: SortableBannerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col py-3.5 px-2 rounded-lg transition-colors ${
        isDragging
          ? "z-30 opacity-70 bg-accent/70 shadow-md ring-1 ring-primary/20"
          : "hover:bg-muted/40"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
          {/* Drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/60 hover:text-foreground rounded touch-none shrink-0"
            title="Drag to rearrange ranking"
            aria-label="Drag to rearrange ranking"
          >
            <GripVerticalIcon className="h-4 w-4" />
          </button>

          {/* Ranking index badge */}
          <Badge
            variant="outline"
            className="shrink-0 h-6 w-6 rounded-full p-0 flex items-center justify-center font-mono text-[11px] font-semibold text-muted-foreground bg-background"
            title={`Rank #${index + 1}`}
          >
            {index + 1}
          </Badge>

          {/* Thumbnail */}
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.title}
              className="h-full w-full object-cover select-none pointer-events-none"
            />
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1.5 w-full max-w-sm">
                <Input
                  value={editingTitle}
                  onChange={(e) => onEditingTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveTitle(img.id)
                    if (e.key === "Escape") onCancelEdit()
                  }}
                  className="h-8 text-sm"
                  autoFocus
                  disabled={saving}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onSaveTitle(img.id)}
                  disabled={saving}
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shrink-0 cursor-pointer"
                  title="Save title"
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onCancelEdit}
                  disabled={saving}
                  className="h-8 w-8 text-muted-foreground hover:bg-muted shrink-0 cursor-pointer"
                  title="Cancel"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold leading-none">{img.title}</h4>
                {isS3Url(img.url) && (
                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                    <CloudIcon className="h-2.5 w-2.5 text-primary" /> Cloud
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onStartEdit(img)}
                  disabled={saving}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Edit slide title"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {img.url}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
          <div className="flex items-center space-x-2">
            <Switch
              checked={img.enabled}
              onCheckedChange={(checked) => onToggle(img.id, checked)}
              disabled={saving}
              id={`switch-${img.id}`}
              aria-label={img.enabled ? "Disable banner" : "Enable banner"}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(img.id)}
            disabled={saving}
            className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Delete banner"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SliderManagementPage() {
  const [images, setImages] = React.useState<SliderImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newTitle, setNewTitle] = React.useState("")
  const [newUrl, setNewUrl] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Title editing state
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editingTitle, setEditingTitle] = React.useState("")

  // Upload state
  const [uploadTab, setUploadTab] = React.useState<"file" | "url">("file")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Available classes (1-12)
  // Fetch slider images
  const fetchImages = React.useCallback(async () => {
    try {
      const res = await fetch("/api/backend/api/public/slider-images")
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (err) {
      console.error("Failed to fetch slider images", err)
      toast.error("Failed to load slider images")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Save full image list
  const saveImages = async (updatedList: SliderImage[]) => {
    setSaving(true)
    try {
      const payload = updatedList.map((img) => ({
        id: img.id,
        url: img.url,
        title: img.title,
        enabled: img.enabled,
        target_audience: "all",
        target_classes: "all",
      }))
      const res = await fetch("/api/backend/api/admin/slider-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || updatedList)
        toast.success("Slider banners saved successfully")
      } else {
        const errJson = await res.json().catch(() => null)
        toast.error(errJson?.detail || errJson?.error || "Failed to save changes")
      }
    } catch (err) {
      console.error("Failed to save slider images", err)
      toast.error("Error saving slider images")
    } finally {
      setSaving(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WEBP, GIF, SVG)")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB")
      return
    }

    setSelectedFile(file)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    if (!newTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      const formattedName = nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)
      setNewTitle(formattedName)
    }
  }

  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Secure S3 upload handler
  const uploadToS3 = async (file: File): Promise<string | null> => {
    setUploading(true)
    setUploadStatus("Preparing secure AWS S3 upload...")

    try {
      const presignedRes = await fetch("/api/admin/slider/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_presigned_url",
          fileName: file.name,
          fileType: file.type,
        }),
      })

      if (presignedRes.status === 401 || presignedRes.status === 403) {
        const errorData = await presignedRes.json().catch(() => ({ error: "Unauthorized access" }))
        throw new Error(errorData.error || "Unauthorized: Admin session required")
      }

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json()

        if (presignedData.configured && presignedData.presignedUrl) {
          setUploadStatus("Uploading image directly to AWS S3...")
          try {
            const uploadRes = await fetch(presignedData.presignedUrl, {
              method: "PUT",
              headers: {
                "Content-Type": file.type,
              },
              body: file,
            })

            if (uploadRes.ok) {
              setUploadStatus("Upload successful!")
              return presignedData.fileUrl
            }
            console.warn("Direct S3 PUT returned non-200 status:", uploadRes.status)
          } catch (directS3Err) {
            console.warn("Direct S3 PUT failed (likely CORS on S3 bucket). Falling back to server upload:", directS3Err)
          }
        }
      }

      setUploadStatus("Uploading to server storage...")
      const formData = new FormData()
      formData.append("file", file)

      const formRes = await fetch("/api/admin/slider/upload", {
        method: "POST",
        body: formData,
      })

      if (formRes.ok) {
        const formDataResult = await formRes.json()
        if (formDataResult.url) {
          setUploadStatus("Upload complete!")
          if (formDataResult.notice) {
            toast.info(formDataResult.notice)
          }
          return formDataResult.url
        }
      }

      const errorData = await formRes.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(errorData.error || "Upload failed")
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Failed to upload image")
      return null
    } finally {
      setUploading(false)
      setUploadStatus(null)
    }
  }

  // Toggle image enabled status
  const handleToggle = (id: number, enabled: boolean) => {
    const updatedList = images.map((img) =>
      img.id === id ? { ...img, enabled } : img
    )
    setImages(updatedList)
    saveImages(updatedList)
  }

  // Title editing handlers
  const handleStartEdit = (img: SliderImage) => {
    setEditingId(img.id)
    setEditingTitle(img.title)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const handleSaveTitle = async (id: number) => {
    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty")
      return
    }
    const updatedList = images.map((img) =>
      img.id === id ? { ...img, title: editingTitle.trim() } : img
    )
    setImages(updatedList)
    setEditingId(null)
    await saveImages(updatedList)
  }

  // Delete image
  const handleDelete = (id: number) => {
    const updatedList = images.filter((img) => img.id !== id)
    setImages(updatedList)
    saveImages(updatedList)
  }

  // DND sensors and drag end handler
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(images, oldIndex, newIndex)
    setImages(reordered)
    await saveImages(reordered)
  }

  // Add new banner card
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error("Please enter a title for the banner")
      return
    }

    let finalImageUrl = newUrl.trim()

    if (uploadTab === "file") {
      if (!selectedFile) {
        toast.error("Please select an image file to upload")
        return
      }

      const uploadedUrl = await uploadToS3(selectedFile)
      if (!uploadedUrl) return
      finalImageUrl = uploadedUrl
    } else {
      if (!finalImageUrl) {
        toast.error("Please enter an image URL")
        return
      }
    }

    const nextId = images.length > 0 ? Math.max(...images.map((img) => img.id)) + 1 : 1
    const newImage: SliderImage = {
      id: nextId,
      url: finalImageUrl,
      title: newTitle.trim(),
      enabled: true,
      targetAudience: "all",
      targetClasses: "all",
    }

    const updatedList = [...images, newImage]
    setImages(updatedList)
    await saveImages(updatedList)

    // Reset form
    setNewTitle("")
    setNewUrl("")
    handleClearFile()
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Slider Banners</h2>
          <p className="text-muted-foreground text-sm">
            Manage app carousel banners, drag to rearrange rankings, and edit titles.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Current Slider Images (7 Columns) */}
        <Card className="lg:col-span-7 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Banner Cards</CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {images.length} {images.length === 1 ? "banner" : "banners"}
              </Badge>
            </div>
            <CardDescription>
              Drag to rearrange ranking, edit titles, toggle visibility, or delete banners.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {images.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground">No slider banners available</p>
                <p className="text-xs text-muted-foreground/80 mt-1">Use the panel on the right to upload your first banner.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-border">
                    {images.map((img, index) => (
                      <SortableBannerItem
                        key={img.id}
                        img={img}
                        index={index}
                        isEditing={editingId === img.id}
                        editingTitle={editingTitle}
                        saving={saving}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveTitle={handleSaveTitle}
                        onEditingTitleChange={setEditingTitle}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Right Side: Add New Slider Banner with AWS S3 Upload (5 Columns) */}
        <Card className="lg:col-span-5 h-fit">
          <CardHeader>
            <CardTitle>Add New Banner</CardTitle>
            <CardDescription>
              Upload an image to AWS S3 storage or enter a URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banner-title">Banner Title</Label>
                <Input
                  id="banner-title"
                  type="text"
                  placeholder="e.g. Science Fair 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              {/* Upload Mode Tabs */}
              <div className="space-y-2">
                <Label>Image Source</Label>
                <Tabs value={uploadTab} onValueChange={(val) => setUploadTab(val as "file" | "url")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file" className="gap-1.5">
                      <UploadCloudIcon className="h-3.5 w-3.5" />
                      AWS S3 Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5" />
                      External URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="pt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />

                    {previewUrl ? (
                      <div className="relative overflow-hidden rounded-lg border bg-muted p-2 space-y-2">
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Upload preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs truncate max-w-[180px] font-medium text-foreground">
                            {selectedFile?.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFile}
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <XIcon className="mr-1 h-3.5 w-3.5" /> Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDragOver(true)
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDragOver(false)
                          const file = e.dataTransfer.files?.[0]
                          if (file) handleFileSelect(file)
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                          isDragOver
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <div className="rounded-full bg-primary/10 p-3 mb-2">
                          <CloudIcon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-semibold">
                          Drop image here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPEG, WEBP, GIF, SVG up to 10MB
                        </p>
                      </div>
                    )}

                    {uploadStatus && (
                      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground mt-2">
                        <Loader2Icon className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>{uploadStatus}</span>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="pt-2">
                    <Input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      required={uploadTab === "url"}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={saving || uploading}>
                {uploading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Uploading to AWS S3...
                  </>
                ) : saving ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Saving Banner...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" />
                    Upload & Add Banner Card
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
