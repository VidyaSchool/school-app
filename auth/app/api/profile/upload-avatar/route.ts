import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { generatePresignedUploadUrl, uploadBufferToS3, isS3Configured } from "@/lib/s3"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB limit

export async function POST(req: NextRequest) {
  // Security Check: Verify user session
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
            { error: `Unsupported file type: ${fileType}. Allowed: JPEG, PNG, WEBP, GIF, AVIF` },
            { status: 400 }
          )
        }

        if (!isS3Configured()) {
          return NextResponse.json({
            configured: false,
            message: "AWS S3 is not configured yet. Falling back to server upload.",
          })
        }

        const presignedData = await generatePresignedUploadUrl({
          fileName,
          fileType,
          folder: `avatars/${session.user.id}`,
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

      // Mode 1.5: Confirm presigned S3 upload finished & update DB
      if (body.action === "confirm_upload" && body.url) {
        await db
          .update(user)
          .set({ image: body.url, updatedAt: new Date() })
          .where(eq(user.id, session.user.id))

        return NextResponse.json({
          success: true,
          url: body.url,
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
        { error: "File exceeds 5MB size limit" },
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
    let imageUrl: string

    if (isS3Configured()) {
      const s3Upload = await uploadBufferToS3({
        buffer,
        fileName: file.name,
        fileType: file.type,
        folder: `avatars/${session.user.id}`,
      })

      if (s3Upload) {
        imageUrl = s3Upload.fileUrl
      } else {
        throw new Error("Failed to upload avatar to AWS S3")
      }
    } else {
      // Local fallback
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars")
      await mkdir(uploadDir, { recursive: true })

      const ext = file.name.split(".").pop() || "jpg"
      const uniqueFilename = `${session.user.id}-${Date.now()}.${ext}`
      const filePath = path.join(uploadDir, uniqueFilename)

      await writeFile(filePath, buffer)
      imageUrl = `/uploads/avatars/${uniqueFilename}`
    }

    // Update user image URL in Database
    await db
      .update(user)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    return NextResponse.json({
      success: true,
      url: imageUrl,
    })
  } catch (error: any) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload avatar" },
      { status: 500 }
    )
  }
}
