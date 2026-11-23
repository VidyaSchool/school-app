import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth-helpers"
import { uploadBufferToS3, generatePresignedUploadUrl, isS3Configured } from "@/lib/s3"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

// ── Route Segment Config ──────────────────────────────────────────────────────
export const maxDuration = 60 // seconds — allow time for S3 upload on slow connections
export const dynamic = "force-dynamic"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "jpeg", "jpg", "png", "webp", "gif", "avif",
  "mp4", "webm", "ogg", "doc", "docx", "xls", "xlsx"
])

const DANGEROUS_EXTENSIONS = new Set([
  "html", "htm", "svg", "exe", "bat", "cmd", "sh", "php", "js", "ts", "vbs", "ps1", "jsp", "asp", "aspx"
])

function isValidExtension(fileName: string): boolean {
  const ext = (fileName.split(".").pop() || "").toLowerCase()
  return !DANGEROUS_EXTENSIONS.has(ext) && ALLOWED_EXTENSIONS.has(ext)
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB limit for PDFs, Videos & Assets

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 })
    }
    const user = session.user as any
    const isUserAdmin = user.role === "admin" || user.isAdmin === true
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const contentType = req.headers.get("content-type") || ""

    // Mode 1: Presigned URL Request (JSON) - Direct S3 client-side upload
    if (contentType.includes("application/json")) {
      const body = await req.json()
      const { action, fileName, fileType } = body

      if (action === "get_presigned_url") {
        if (!fileName || !fileType) {
          return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 })
        }

        if (!isValidExtension(fileName)) {
          return NextResponse.json(
            { error: "File extension not permitted. Executables, HTML, and SVG files are strictly prohibited." },
            { status: 400 }
          )
        }

        if (!ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
          return NextResponse.json(
            { error: `Invalid file format (${fileType}). Allowed: PDF, PNG, JPG, WEBP, GIF, MP4, Documents` },
            { status: 400 }
          )
        }

        if (!isS3Configured()) {
          return NextResponse.json({
            configured: false,
            message: "AWS S3 credentials not set.",
          })
        }

        const folder = fileType.includes("pdf") ? "page-builder/pdfs" : "page-builder/images"
        const presignedData = await generatePresignedUploadUrl({
          fileName,
          fileType,
          folder,
        })

        if (!presignedData) {
          return NextResponse.json({ error: "Failed to generate S3 presigned URL" }, { status: 500 })
        }

        return NextResponse.json({
          configured: true,
          presignedUrl: presignedData.presignedUrl,
          fileUrl: presignedData.fileUrl,
          fileKey: presignedData.fileKey,
        })
      }
    }

    // Mode 2: FormData direct file upload fallback
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 50MB size limit" },
        { status: 400 }
      )
    }

    if (!isValidExtension(file.name)) {
      return NextResponse.json(
        { error: "File extension not permitted. Executables, HTML, and SVG files are strictly prohibited." },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid file format (${file.type}). Allowed: PDF, PNG, JPG, WEBP, GIF, MP4, Documents` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 1. Upload to AWS S3 Bucket
    if (isS3Configured()) {
      try {
        const folder = file.type.includes("pdf") ? "page-builder/pdfs" : "page-builder/images"
        const s3Upload = await uploadBufferToS3({
          buffer,
          fileName: file.name,
          fileType: file.type,
          folder,
        })

        if (s3Upload) {
          return NextResponse.json({
            success: true,
            source: "aws-s3",
            url: s3Upload.fileUrl,
            key: s3Upload.fileKey,
            filename: file.name,
          })
        }
      } catch (s3Err: unknown) {
        console.error("S3 upload failed, falling back to serverless/local storage:", s3Err)
      }
    }

    // 2. Local Fallback Storage or Serverless Data URI
    try {
      const subfolder = file.type.includes("pdf") ? "pdfs" : "images"
      const uploadDir = path.join(process.cwd(), "public", "uploads", "page-builder", subfolder)
      await mkdir(uploadDir, { recursive: true })

      const ext = file.name.split(".").pop() || "bin"
      const sanitizedBase = file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
      const uniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedBase}.${ext}`
      const filePath = path.join(uploadDir, uniqueFilename)

      await writeFile(filePath, buffer)
      const localUrl = `/uploads/page-builder/${subfolder}/${uniqueFilename}`

      return NextResponse.json({
        success: true,
        source: "local-fallback",
        url: localUrl,
        filename: file.name,
        notice: "AWS S3 credentials not configured in env. File saved to local server storage.",
      })
    } catch (fsErr: unknown) {
      console.warn("Local filesystem write failed (likely serverless deployment). Converting to Data URI fallback:", fsErr)
      // 3. Serverless (Vercel) fallback: convert file buffer to Data URI
      const base64Data = buffer.toString("base64")
      const dataUrl = `data:${file.type};base64,${base64Data}`

      return NextResponse.json({
        success: true,
        source: "data-uri-fallback",
        url: dataUrl,
        filename: file.name,
        notice: "Serverless read-only filesystem. File stored as Data URI.",
      })
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to process file upload"
    console.error("Page Builder file upload error:", error)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
