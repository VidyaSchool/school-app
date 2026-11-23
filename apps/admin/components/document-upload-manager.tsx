"use client"

import * as React from "react"
import {
  FileTextIcon,
  UploadCloudIcon,
  EyeIcon,
  Trash2Icon,
  CloudIcon,
  CheckCircle2Icon,
  Loader2Icon,
  FileIcon,
  RefreshCwIcon,
  XIcon,
  FileCheckIcon,
  ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export interface DocumentSlot {
  type: string
  title: string
  description: string
  required?: boolean
  acceptTypes?: string
}

export interface UserDocumentItem {
  id: string
  docType: string
  docName: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize?: number
  status: string
  createdAt?: string
}

interface DocumentUploadManagerProps {
  role: "student" | "teacher" | "admin"
  documentSlots: DocumentSlot[]
  userId?: string
}

export function DocumentUploadManager({
  role,
  documentSlots,
  userId,
}: DocumentUploadManagerProps) {
  const [documents, setDocuments] = React.useState<Record<string, UserDocumentItem>>({})
  const [loading, setLoading] = React.useState(true)
  const [uploadingState, setUploadingState] = React.useState<Record<string, boolean>>({})
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, string>>({})
  const [dragOverState, setDragOverState] = React.useState<Record<string, boolean>>({})
  const [previewDoc, setPreviewDoc] = React.useState<UserDocumentItem | null>(null)
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({})

  // Fetch uploaded documents from API
  const fetchDocuments = React.useCallback(async () => {
    try {
      const url = userId ? `/api/documents?userId=${userId}` : "/api/documents"
      const res = await fetch(url)
      if (res.ok) {
        const data: UserDocumentItem[] = await res.json()
        const docMap: Record<string, UserDocumentItem> = {}
        data.forEach((doc) => {
          docMap[doc.docType] = doc
        })
        setDocuments(docMap)
      }
    } catch (err) {
      console.error("Failed to fetch documents", err)
      toast.error("Failed to load document records")
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Handle document file upload to S3 / Local
  const handleUpload = async (slot: DocumentSlot, file: File) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ]

    const isPdf = file.type.toLowerCase() === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const isImg = file.type.toLowerCase().startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name)

    if (!isPdf && !isImg && !allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Please select a valid PDF document or Image file (JPG, PNG, WEBP)")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB")
      return
    }

    setUploadingState((prev) => ({ ...prev, [slot.type]: true }))
    setUploadProgress((prev) => ({ ...prev, [slot.type]: "Preparing upload..." }))

    try {
      // Step 1: Request presigned upload URL from S3 if configured
      const presignedRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_presigned_url",
          fileName: file.name,
          fileType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          docType: slot.type,
          docName: slot.title,
        }),
      })

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json()

        if (presignedData.configured && presignedData.presignedUrl) {
          setUploadProgress((prev) => ({ ...prev, [slot.type]: "Uploading file to AWS S3..." }))
          const uploadRes = await fetch(presignedData.presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || (isPdf ? "application/pdf" : "image/jpeg"),
            },
            body: file,
          })

          if (uploadRes.ok) {
            setUploadProgress((prev) => ({ ...prev, [slot.type]: "Saving document record..." }))
            const confirmRes = await fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "confirm_upload",
                docType: slot.type,
                docName: slot.title,
                fileUrl: presignedData.fileUrl,
                fileName: file.name,
                fileType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
                fileSize: file.size,
              }),
            })

            if (confirmRes.ok) {
              toast.success(`${slot.title} uploaded successfully!`)
              fetchDocuments()
              return
            }
          }
        }
      }

      // Step 2: Fallback to direct FormData Upload
      setUploadProgress((prev) => ({ ...prev, [slot.type]: "Uploading file to server..." }))
      const formData = new FormData()
      formData.append("file", file)
      formData.append("docType", slot.type)
      formData.append("docName", slot.title)

      const formRes = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      if (formRes.ok) {
        toast.success(`${slot.title} uploaded successfully!`)
        fetchDocuments()
        return
      }

      const errorData = await formRes.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(errorData.error || "Failed to upload document")
    } catch (err: any) {
      console.error("Document upload error:", err)
      toast.error(err.message || `Failed to upload ${slot.title}`)
    } finally {
      setUploadingState((prev) => ({ ...prev, [slot.type]: false }))
      setUploadProgress((prev) => ({ ...prev, [slot.type]: "" }))
      if (fileInputRefs.current[slot.type]) {
        fileInputRefs.current[slot.type]!.value = ""
      }
    }
  }

  // Handle document delete
  const handleDelete = async (docType: string, title: string) => {
    try {
      const res = await fetch(`/api/documents?docType=${docType}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(`${title} removed`)
        fetchDocuments()
      } else {
        toast.error("Failed to remove document")
      }
    } catch (err) {
      console.error("Delete error:", err)
      toast.error("Failed to remove document")
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const completedCount = documentSlots.filter((s) => documents[s.type]).length
  const totalCount = documentSlots.length
  const completionPercentage = Math.round((completedCount / (totalCount || 1)) * 100)

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header & Status Summary Card */}
      <Card className="bg-gradient-to-r from-muted/50 via-background to-muted/30 border">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCheckIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold tracking-tight">Required Profile Documents</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Please upload clear PDF documents or scanned images (JPEG, PNG, WEBP up to 10MB).
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-xs px-2.5 py-0.5">
                {completedCount} of {totalCount} Uploaded
              </Badge>
              <Badge variant="outline" className="gap-1 px-2 text-[11px]">
                <CloudIcon className="h-3 w-3 text-primary" />
                Secure Storage
              </Badge>
            </div>
            <div className="w-full sm:w-48 bg-muted rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Document Slots */}
      <div className="grid gap-4 md:grid-cols-2">
        {documentSlots.map((slot) => {
          const doc = documents[slot.type]
          const isUploading = uploadingState[slot.type]
          const progressMsg = uploadProgress[slot.type]
          const isDragging = dragOverState[slot.type]

          return (
            <Card
              key={slot.type}
              className={`relative overflow-hidden transition-all duration-200 ${
                isDragging ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOverState((prev) => ({ ...prev, [slot.type]: true }))
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOverState((prev) => ({ ...prev, [slot.type]: false }))
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOverState((prev) => ({ ...prev, [slot.type]: false }))
                const files = e.dataTransfer.files
                if (files && files.length > 0) {
                  handleUpload(slot, files[0])
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`rounded-lg p-2 ${
                        doc
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doc ? (
                        <CheckCircle2Icon className="h-5 w-5" />
                      ) : (
                        <FileTextIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        {slot.title}
                        {slot.required && (
                          <span className="text-[10px] font-normal text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {slot.description}
                      </CardDescription>
                    </div>
                  </div>

                  {doc ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] gap-1 shrink-0"
                    >
                      <CheckCircle2Icon className="h-3 w-3" /> Uploaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[11px] shrink-0">
                      Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <input
                  ref={(el) => {
                    fileInputRefs.current[slot.type] = el
                  }}
                  type="file"
                  accept={slot.acceptTypes || "application/pdf,image/jpeg,image/png,image/webp,image/gif,image/avif"}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(slot, file)
                  }}
                />

                {doc ? (
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5 text-xs">
                    <div className="flex items-center gap-2.5 truncate max-w-[200px] sm:max-w-[240px]">
                      {doc.fileType.includes("pdf") ? (
                        <FileTextIcon className="h-5 w-5 shrink-0 text-red-500" />
                      ) : (
                        <ImageIcon className="h-5 w-5 shrink-0 text-blue-500" />
                      )}
                      <div className="truncate">
                        <p className="font-medium truncate text-foreground">{doc.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.fileType.includes("pdf") ? "PDF Document" : "Image"} •{" "}
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewDoc(doc)}
                        title="Preview Document"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRefs.current[slot.type]?.click()}
                        title="Replace Document"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCwIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(slot.type, slot.title)}
                        title="Delete Document"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.current[slot.type]?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition-all ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-accent/40"
                    }`}
                  >
                    <UploadCloudIcon className="h-6 w-6 text-muted-foreground mb-1.5" />
                    <p className="text-xs font-medium text-foreground">
                      Click or drag & drop {slot.title} here
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Accepts PDF or Image files (Max 10MB)
                    </p>
                  </div>
                )}

                {isUploading && (
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    <span className="truncate">{progressMsg}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Preview Dialog Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl w-[92vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
            <div>
              <DialogTitle className="text-base font-semibold">
                {previewDoc?.docName || previewDoc?.fileName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {previewDoc?.fileName} • {formatFileSize(previewDoc?.fileSize)}
              </p>
            </div>
            {previewDoc?.fileUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs mr-6"
                onClick={() => window.open(previewDoc.fileUrl, "_blank")}
              >
                Open in New Tab
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto py-4 flex items-center justify-center min-h-[400px]">
            {previewDoc?.fileType?.includes("pdf") || previewDoc?.fileUrl?.endsWith(".pdf") ? (
              <iframe
                src={previewDoc.fileUrl}
                className="w-full h-[65vh] rounded-md border"
                title={previewDoc.docName}
              />
            ) : (
              <img
                src={previewDoc?.fileUrl}
                alt={previewDoc?.docName || "Document"}
                className="max-h-[65vh] max-w-full object-contain rounded-md border shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
