import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import {
  generatePresignedUploadUrl,
  uploadBufferToS3,
  isS3Configured,
  SAFE_IMAGE_MIME_TYPES,
  validateImageMagicBytes,
} from "@/lib/s3"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB limit for high-res gallery photos

export async function POST(req: NextRequest) {
  // Security Check 1: Verify user session and admin role
  const session = await getAuthenticatedSession(req)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
  }

  // Security Check 2: Check admin authorization
  const user = session.user as any
  const isUserAdmin = user.role === "admin" || user.isAdmin === true
  if (!isUserAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
  }

  try {
    const contentType = req.headers.get("content-type") || ""

    // Mode 1: Presigned S3 URL Request (JSON)
    if (contentType.includes("application/json")) {
      const body = await req.json()
      const { action, fileName, fileType } = body

      if (action === "get_presigned_url") {
        if (!fileName || !fileType || typeof fileName !== "string" || typeof fileType !== "string") {
          return NextResponse.json(
            { error: "Valid fileName and fileType strings are required" },
            { status: 400 }
          )
        }

        const normalizedType = fileType.toLowerCase().trim()
        if (!SAFE_IMAGE_MIME_TYPES[normalizedType]) {
          return NextResponse.json(
            { error: `Unsupported image format. Allowed formats: JPEG, PNG, WEBP, GIF, AVIF` },
            { status: 400 }
          )
        }

        if (!isS3Configured()) {
          return NextResponse.json({
            configured: false,
            message: "AWS S3 is not configured in env. Falling back to server upload.",
          })
        }

        const presignedData = await generatePresignedUploadUrl({
          fileName,
          fileType: normalizedType,
          folder: "gallery",
        })

        if (!presignedData) {
          return NextResponse.json(
            { error: "Failed to generate presigned S3 URL" },
            { status: 500 }
          )
        }

        return NextResponse.json({
          configured: true,
          presignedUrl: presignedData.presignedUrl,
          fileUrl: presignedData.fileUrl,
          fileKey: presignedData.fileKey,
        })
      }
    }

    // Mode 2: Direct File Upload (FormData)
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit (20MB)" },
        { status: 400 }
      )
    }

    const claimedType = (file.type || "").toLowerCase().trim()
    if (!SAFE_IMAGE_MIME_TYPES[claimedType]) {
      return NextResponse.json(
        { error: "Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF, AVIF" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Security Check 3: Binary Signature (Magic Bytes) Verification
    const magicVerification = validateImageMagicBytes(buffer)
    if (!magicVerification.valid || !magicVerification.ext || !magicVerification.mimeType) {
      return NextResponse.json(
        { error: "Security validation failed: File binary header does not match valid image signature." },
        { status: 400 }
      )
    }

    // Upload directly to AWS S3 Bucket
    if (isS3Configured()) {
      const s3Upload = await uploadBufferToS3({
        buffer,
        fileName: file.name,
        fileType: magicVerification.mimeType,
        folder: "gallery",
      })

      if (s3Upload) {
        return NextResponse.json({
          success: true,
          source: "aws-s3",
          url: s3Upload.fileUrl,
          key: s3Upload.fileKey,
        })
      }
    }

    // Fallback: Store locally in public/uploads/gallery/ with strictly sanitized filename and derived safe extension
    const uploadDir = path.join(process.cwd(), "public", "uploads", "gallery")
    await mkdir(uploadDir, { recursive: true })

    const safeExt = magicVerification.ext
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "photo"

    const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}-${sanitizedBase}.${safeExt}`
    const filePath = path.join(uploadDir, uniqueFilename)

    await writeFile(filePath, buffer)
    const localUrl = `/uploads/gallery/${uniqueFilename}`

    return NextResponse.json({
      success: true,
      source: "local-fallback",
      url: localUrl,
      notice: "Stored in local fallback directory.",
    })
  } catch (error: any) {
    console.error("Gallery image upload error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while processing the upload." },
      { status: 500 }
    )
  }
}
