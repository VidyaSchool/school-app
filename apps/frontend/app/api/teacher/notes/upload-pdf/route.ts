import { NextRequest, NextResponse } from "next/server"
import { uploadBufferToS3, deleteFromS3, isS3Configured } from "@/lib/s3"
import { mkdir, writeFile, unlink } from "fs/promises"
import path from "path"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const noteId = formData.get("noteId") as string | null
    const oldPdfUrl = formData.get("oldPdfUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Delete previous version permanently if oldPdfUrl exists
    if (oldPdfUrl) {
      try {
        if (isS3Configured()) {
          await deleteFromS3(oldPdfUrl)
        } else if (oldPdfUrl.startsWith("/uploads/notes/")) {
          const localPath = path.join(process.cwd(), "public", oldPdfUrl.replace(/^\//, ""))
          await unlink(localPath).catch(() => {})
        }
      } catch (delErr) {
        console.error("Failed to delete previous PDF version:", delErr)
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name || `note-${noteId || Date.now()}.pdf`
    let pdfUrl: string

    if (isS3Configured()) {
      const s3Upload = await uploadBufferToS3({
        buffer,
        fileName,
        fileType: "application/pdf",
        folder: "notes-pdf",
      })
      if (s3Upload) {
        pdfUrl = s3Upload.fileUrl
      } else {
        throw new Error("S3 upload returned null")
      }
    } else {
      // Fallback local storage served publicly
      const uploadDir = path.join(process.cwd(), "public", "uploads", "notes")
      await mkdir(uploadDir, { recursive: true })
      const uniqueName = `note-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.pdf`
      const filePath = path.join(uploadDir, uniqueName)
      await writeFile(filePath, buffer)
      pdfUrl = `/uploads/notes/${uniqueName}`
    }

    return NextResponse.json({ success: true, pdfUrl })
  } catch (error: any) {
    console.error("PDF upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
