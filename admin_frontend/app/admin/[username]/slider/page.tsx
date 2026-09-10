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
  UsersIcon,
  GraduationCapIcon,
  UserCheckIcon,
  CheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface SliderImage {
  id: number
  url: string
  title: string
  enabled: boolean
  targetAudience?: string  // "all", "students", "teachers"
  targetClasses?: string   // "all" or comma-separated: "1,2,3,4,5,6,7,8,9,10,11,12"
}

// Icon helper for target audience
function TargetAudienceIcon({ target, className = "h-4 w-4" }: { target?: string; className?: string }) {
  switch (target) {
    case "students":
      return <GraduationCapIcon className={className} />
    case "teachers":
      return <UserCheckIcon className={className} />
    default:
      return <UsersIcon className={className} />
  }
}

function getTargetAudienceLabel(target?: string) {
  switch (target) {
    case "students":
      return "Students"
    case "teachers":
      return "Teachers"
    default:
      return "All Users"
  }
}

function isS3Url(url: string) {
  return url.includes("amazonaws.com") || url.includes("s3.") || url.includes("/sliders/")
}

export default function SliderManagementPage() {
  const [images, setImages] = React.useState<SliderImage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newTitle, setNewTitle] = React.useState("")
  const [newUrl, setNewUrl] = React.useState("")
  const [newTargetAudience, setNewTargetAudience] = React.useState<string>("all")
  const [newTargetClasses, setNewTargetClasses] = React.useState<string>("all")
  const [saving, setSaving] = React.useState(false)

  // Upload state
  const [uploadTab, setUploadTab] = React.useState<"file" | "url">("file")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Available classes (1-12)
  const availableClasses = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

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
      const res = await fetch("/api/backend/api/admin/slider-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedList),
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || updatedList)
        toast.success("Slider banners saved successfully")
      } else {
        toast.error("Failed to save changes")
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

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json()

        if (presignedData.configured && presignedData.presignedUrl) {
          setUploadStatus("Uploading image directly to AWS S3...")
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

  // Change target audience
  const handleTargetAudienceChange = (id: number, targetAudience: string) => {
    const updatedList = images.map((img) =>
      img.id === id ? { ...img, targetAudience, targetClasses: targetAudience === "students" ? img.targetClasses || "all" : "all" } : img
    )
    setImages(updatedList)
    saveImages(updatedList)
  }

  // Change target classes (for students only)
  const handleTargetClassesChange = (id: number, targetClasses: string) => {
    const updatedList = images.map((img) =>
      img.id === id ? { ...img, targetClasses } : img
    )
    setImages(updatedList)
    saveImages(updatedList)
  }

  // Toggle individual class selection
  const toggleClass = (id: number, classNum: string) => {
    const img = images.find(i => i.id === id)
    if (!img) return

    const currentClasses = img.targetClasses || "all"
    let newClasses: string

    if (currentClasses === "all") {
      newClasses = classNum
    } else {
      const classList = currentClasses.split(",")
      if (classList.includes(classNum)) {
        const filtered = classList.filter(c => c !== classNum)
        newClasses = filtered.length === 0 ? "all" : filtered.join(",")
      } else {
        classList.push(classNum)
        newClasses = classList.join(",")
      }
    }

    handleTargetClassesChange(id, newClasses)
  }

  // Delete image
  const handleDelete = (id: number) => {
    const updatedList = images.filter((img) => img.id !== id)
    setImages(updatedList)
    saveImages(updatedList)
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
      targetAudience: newTargetAudience,
      targetClasses: newTargetAudience === "students" ? newTargetClasses : "all",
    }

    const updatedList = [...images, newImage]
    setImages(updatedList)
    await saveImages(updatedList)

    // Reset form
    setNewTitle("")
    setNewUrl("")
    handleClearFile()
    setNewTargetAudience("all")
    setNewTargetClasses("all")
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
            Manage app carousel banners with role targeting and direct AWS S3 uploads.
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1 text-xs">
          <CloudIcon className="h-3.5 w-3.5 text-primary" />
          AWS S3 Storage Integrated
        </Badge>
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
              View, target audience, toggle visibility, or delete slider banners.
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
              <div className="divide-y divide-border">
                {images.map((img) => (
                  <div key={img.id} className="flex flex-col py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        {/* Thumbnail */}
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold leading-none">{img.title}</h4>
                            {isS3Url(img.url) && (
                              <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                                <CloudIcon className="h-2.5 w-2.5 text-primary" /> S3
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TargetAudienceIcon target={img.targetAudience} className="h-3.5 w-3.5 text-muted-foreground" />
                              {getTargetAudienceLabel(img.targetAudience)}
                            </span>
                            {img.targetAudience === "students" && img.targetClasses !== "all" && (
                              <span>• Classes: {img.targetClasses}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        {/* Target Audience Selector */}
                        <Select
                          value={img.targetAudience || "all"}
                          onValueChange={(val) => handleTargetAudienceChange(img.id, val)}
                          disabled={saving}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue placeholder="Audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              <span className="flex items-center gap-2">
                                <UsersIcon className="h-3.5 w-3.5" /> All Users
                              </span>
                            </SelectItem>
                            <SelectItem value="students">
                              <span className="flex items-center gap-2">
                                <GraduationCapIcon className="h-3.5 w-3.5" /> Students
                              </span>
                            </SelectItem>
                            <SelectItem value="teachers">
                              <span className="flex items-center gap-2">
                                <UserCheckIcon className="h-3.5 w-3.5" /> Teachers
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={img.enabled}
                            onCheckedChange={(checked) => handleToggle(img.id, checked)}
                            disabled={saving}
                            id={`switch-${img.id}`}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(img.id)}
                          disabled={saving}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Class Selector - Show only if Students is selected */}
                    {img.targetAudience === "students" && (
                      <div className="pl-0 sm:pl-28 space-y-2 pt-1 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">Target Classes</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTargetClassesChange(img.id, "all")}
                            disabled={saving}
                            className="h-5 text-[11px] px-2"
                          >
                            Select All
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {availableClasses.map((classNum) => {
                            const isSelected = img.targetClasses === "all" || img.targetClasses?.split(",").includes(classNum)
                            return (
                              <Button
                                key={classNum}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleClass(img.id, classNum)}
                                disabled={saving}
                                className="h-6 w-8 text-xs p-0"
                              >
                                {classNum}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={newTargetAudience === "all" ? "default" : "outline"}
                    onClick={() => setNewTargetAudience("all")}
                    className="gap-1.5 h-9"
                  >
                    <UsersIcon className="h-3.5 w-3.5" /> All
                  </Button>
                  <Button
                    type="button"
                    variant={newTargetAudience === "students" ? "default" : "outline"}
                    onClick={() => setNewTargetAudience("students")}
                    className="gap-1.5 h-9"
                  >
                    <GraduationCapIcon className="h-3.5 w-3.5" /> Students
                  </Button>
                  <Button
                    type="button"
                    variant={newTargetAudience === "teachers" ? "default" : "outline"}
                    onClick={() => setNewTargetAudience("teachers")}
                    className="gap-1.5 h-9"
                  >
                    <UserCheckIcon className="h-3.5 w-3.5" /> Teachers
                  </Button>
                </div>
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
