"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CameraIcon, CloudIcon, Loader2Icon, UploadCloudIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProfileAvatarUploadProps {
  currentImage?: string | null
  userName: string
  onAvatarUpdated?: (newUrl: string) => void
  size?: "md" | "lg" | "xl"
}

export function ProfileAvatarUpload({
  currentImage,
  userName,
  onAvatarUpdated,
  size = "lg",
}: ProfileAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(
    currentImage || undefined
  )
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    setAvatarUrl(currentImage || undefined)
  }, [currentImage])

  const getInitials = (name: string) => {
    if (!name) return "US"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, WEBP, GIF, AVIF)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image must be smaller than 5MB")
      return
    }

    // Optimistic local preview
    const localPreview = URL.createObjectURL(file)
    setAvatarUrl(localPreview)
    setUploading(true)

    try {
      // Step 1: Request S3 presigned URL
      const presignedRes = await fetch("/api/profile/upload-avatar", {
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
          // Direct S3 Upload
          const uploadRes = await fetch(presignedData.presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          })

          if (uploadRes.ok) {
            // Confirm upload to update database
            const confirmRes = await fetch("/api/profile/upload-avatar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "confirm_upload",
                url: presignedData.fileUrl,
              }),
            })

            if (confirmRes.ok) {
              const confirmData = await confirmRes.json()
              const finalUrl = confirmData.url || presignedData.fileUrl
              setAvatarUrl(finalUrl)
              toast.success("Profile photo uploaded to AWS S3!")
              if (onAvatarUpdated) onAvatarUpdated(finalUrl)
              router.refresh()
              return
            }
          }
        }
      }

      // Step 2: Fallback to FormData Upload
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (uploadRes.ok) {
        const data = await uploadRes.json()
        if (data.url) {
          setAvatarUrl(data.url)
          toast.success("Profile photo updated successfully!")
          if (onAvatarUpdated) onAvatarUpdated(data.url)
          router.refresh()
          return
        }
      }

      const errorData = await uploadRes.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(errorData.error || "Failed to upload profile picture")
    } catch (err: any) {
      console.error("Avatar upload error:", err)
      toast.error(err.message || "Failed to update profile photo")
      setAvatarUrl(currentImage || undefined)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const avatarSizeClasses = {
    md: "h-16 w-16 text-base",
    lg: "h-20 w-20 text-lg",
    xl: "h-24 w-24 text-xl",
  }[size]

  return (
    <div className="relative group inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <Avatar className={`${avatarSizeClasses} border-2 border-border shadow-sm transition-transform group-hover:scale-105`}>
        <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
        <AvatarFallback className="font-semibold bg-primary/10 text-primary">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>

      {/* Upload Overlay button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload profile picture"
        className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2Icon className="h-5 w-5 animate-spin text-white" />
        ) : (
          <>
            <CameraIcon className="h-5 w-5 text-white" />
            <span className="text-[10px] font-medium text-white mt-0.5">S3 Upload</span>
          </>
        )}
      </button>

      {/* S3 Badge Indicator */}
      <Badge
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        className="absolute -bottom-1 -right-1 cursor-pointer gap-1 px-1.5 py-0.5 text-[10px] shadow-sm hover:bg-secondary/80"
      >
        {uploading ? (
          <Loader2Icon className="h-3 w-3 animate-spin text-primary" />
        ) : (
          <CloudIcon className="h-3 w-3 text-primary" />
        )}
      </Badge>
    </div>
  )
}
