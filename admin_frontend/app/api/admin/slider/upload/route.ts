import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generatePresignedUploadUrl, uploadBufferToS3, isS3Configured } from "@/lib/s3"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB limit

export async function POST(req: NextRequest) {
  // Security Check: Verify user session and admin role
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
  }

  // Check admin authorization
  const isUserAdmin = session.user.role === "admin" || (session.user as any).isAdmin
  if (!isUserAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
  }

  try {
    const contentType = req.headers.get("content-type") || ""

    // Mode 1: Presigned URL Request (JSON)
    if (contentType.includes("application/json")) {
      const body = await req.json()
      const { action, fileName, fileType } = body

      if (action === "get_presigned_url") {
        if (!fileName || !fileType) {
          return NextResponse.json(
            { error: "fileName and fileType are required" },
            { status: 400 }
          )
        }

        if (!ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
          return NextResponse.json(
            { error: `Unsupported file type: ${fileType}. Allowed formats: JPEG, PNG, WEBP, GIF, SVG, AVIF` },
            { status: 400 }
          )
        }

        if (!isS3Configured()) {
          return NextResponse.json({
            configured: false,
            message: "AWS S3 is not configured yet. Falling back to direct server upload.",
          })
        }

        const presignedData = await generatePresignedUploadUrl({
          fileName,
          fileType,
          folder: "sliders",
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
        { error: "File exceeds 10MB size limit" },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid image file type: ${file.type}` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // S3 configured -> Upload to AWS S3 Bucket
    if (isS3Configured()) {
      const s3Upload = await uploadBufferToS3({
        buffer,
        fileName: file.name,
        fileType: file.type,
        folder: "sliders",
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

    // Fallback: Store locally in public/uploads/sliders/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "sliders")
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split(".").pop() || "jpg"
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
    const uniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedBase}.${ext}`
    const filePath = path.join(uploadDir, uniqueFilename)

    await writeFile(filePath, buffer)
    const localUrl = `/uploads/sliders/${uniqueFilename}`

    return NextResponse.json({
      success: true,
      source: "local-fallback",
      url: localUrl,
      notice: "AWS S3 credentials not set in env. File saved to local server storage.",
    })
  } catch (error: any) {
    console.error("Slider upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process image upload" },
      { status: 500 }
    )
  }
}
