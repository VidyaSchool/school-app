import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user as userTable, session as sessionTable, userDocument } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { generatePresignedUploadUrl, uploadBufferToS3, isS3Configured } from "@/lib/s3"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB limit

async function getAuthenticatedSession() {
  const hdrs = await headers()
  let session = null

  try {
    session = await auth.api.getSession({ headers: hdrs })
  } catch (e) {
    console.error("[api/documents] getSession error:", e)
  }

  if (!session?.user) {
    const authHeader = hdrs.get("authorization") || hdrs.get("Authorization") || ""
    const rawCookie = hdrs.get("cookie") || ""
    const cookieMatch = rawCookie.match(/(?:__Secure-better-auth\.session_token|better-auth\.session_token)=([^;]+)/)
    
    let tokenVal: string | null = null
    if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
      tokenVal = authHeader.replace(/^Bearer\s+/i, "").trim()
    } else if (authHeader.trim().length > 0) {
      tokenVal = authHeader.trim()
    } else if (cookieMatch) {
      tokenVal = cookieMatch[1]
    }

    if (tokenVal) {
      const cleanToken = decodeURIComponent(tokenVal).split(".")[0]
      try {
        const dbSession = await db.select().from(sessionTable).where(eq(sessionTable.token, cleanToken)).then(res => res[0])
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db.select().from(userTable).where(eq(userTable.id, dbSession.userId)).then(res => res[0])
          if (dbUser) {
            session = { user: dbUser, session: dbSession }
          }
        }
      } catch (err) {
        console.error("[api/documents] DB session fallback error:", err)
      }
    }
  }

  return session
}

// GET: Retrieve user's uploaded documents with secure authenticated serving URLs
export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get("userId") || session.user.id

  // Security: Non-admins and non-teachers can only view their own documents
  const isOwner = targetUserId === session.user.id
  const isAdmin = session.user.role === "admin"
  const isTeacher = session.user.role === "teacher"

  if (!isOwner && !isAdmin && !isTeacher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const docs = await db
      .select()
      .from(userDocument)
      .where(eq(userDocument.userId, targetUserId))

    // Map fileUrl to secure authenticated proxy endpoint
    const secureDocs = docs.map((doc) => ({
      ...doc,
      fileUrl: `/api/documents/serve?docId=${doc.id}`,
    }))

    return NextResponse.json(secureDocs)
  } catch (error: any) {
    console.error("Failed to fetch user documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// POST: Upload document (Presigned URL or direct FormData)
export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const contentType = req.headers.get("content-type") || ""

    // Mode 1: Presigned S3 URL Request
    if (contentType.includes("application/json")) {
      const body = await req.json()
      const { action, fileName, fileType, docType, docName } = body

      if (action === "get_presigned_url") {
        if (!fileName || !fileType || !docType) {
          return NextResponse.json(
            { error: "fileName, fileType, and docType are required" },
            { status: 400 }
          )
        }

        if (!ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
          return NextResponse.json(
            { error: `Unsupported file type: ${fileType}. Allowed: PDF, JPEG, PNG, WEBP` },
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
          folder: `documents/${session.user.role}/${session.user.id}/${docType}`,
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

      // Mode 1.5: Confirm upload & save record in DB
      if (action === "confirm_upload") {
        const { docType, docName, fileUrl, fileKey, fileName, fileType, fileSize } = body

        if (!docType || !fileUrl) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const existing = await db
          .select()
          .from(userDocument)
          .where(
            and(
              eq(userDocument.userId, session.user.id),
              eq(userDocument.docType, docType)
            )
          )

        if (existing.length > 0) {
          await db
            .update(userDocument)
            .set({
              fileUrl,
              fileKey: fileKey || null,
              fileName: fileName || "document",
              fileType: fileType || "application/pdf",
              fileSize: fileSize || 0,
              status: "uploaded",
              updatedAt: new Date(),
            })
            .where(eq(userDocument.id, existing[0].id))
        } else {
          await db.insert(userDocument).values({
            id: `doc-${crypto.randomUUID()}`,
            userId: session.user.id,
            docType,
            docName: docName || docType,
            fileUrl,
            fileKey: fileKey || null,
            fileName: fileName || "document",
            fileType: fileType || "application/pdf",
            fileSize: fileSize || 0,
            status: "uploaded",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }

        return NextResponse.json({ success: true, url: fileUrl })
      }
    }

    // Mode 2: Direct File Upload (FormData) - Stored Privately
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const rawDocType = formData.get("docType") || formData.get("doc_type")
    const rawDocName = formData.get("docName") || formData.get("doc_name")

    const docType = typeof rawDocType === "string" ? rawDocType.trim() : (rawDocType ? String(rawDocType).trim() : "")
    const docName = typeof rawDocName === "string" ? rawDocName.trim() : (rawDocName ? String(rawDocName).trim() : docType)

    if (!file || file.size === 0 || !docType) {
      return NextResponse.json(
        { error: "File and docType are required" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB size limit" },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: PDF, PNG, JPEG, WEBP` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let fileUrl: string
    let fileKey: string | null = null

    if (isS3Configured()) {
      const s3Upload = await uploadBufferToS3({
        buffer,
        fileName: file.name,
        fileType: file.type,
        folder: `documents/${session.user.role}/${session.user.id}/${docType}`,
      })

      if (s3Upload) {
        fileUrl = s3Upload.fileUrl
        fileKey = s3Upload.fileKey
      } else {
        throw new Error("Failed to upload document to AWS S3")
      }
    } else {
      // Data URI for universal serverless/mobile compatibility + local private storage fallback
      const mimeType = file.type || "application/pdf"
      const base64Data = buffer.toString("base64")
      fileUrl = `data:${mimeType};base64,${base64Data}`

      try {
        const uploadDir = path.join(process.cwd(), "private_uploads", "documents", session.user.id)
        await mkdir(uploadDir, { recursive: true })
        const ext = file.name.split(".").pop() || "pdf"
        const uniqueFilename = `${docType}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
        const filePath = path.join(uploadDir, uniqueFilename)
        await writeFile(filePath, buffer)
      } catch (err) {
        console.warn("[documents] Local disk write skipped:", err)
      }
    }

    // Upsert record into DB
    const existing = await db
      .select()
      .from(userDocument)
      .where(
        and(
          eq(userDocument.userId, session.user.id),
          eq(userDocument.docType, docType)
        )
      )

    let docId: string
    if (existing.length > 0) {
      docId = existing[0].id
      await db
        .update(userDocument)
        .set({
          fileUrl,
          fileKey,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          status: "uploaded",
          updatedAt: new Date(),
        })
        .where(eq(userDocument.id, existing[0].id))
    } else {
      docId = `doc-${crypto.randomUUID()}`
      await db.insert(userDocument).values({
        id: docId,
        userId: session.user.id,
        docType,
        docName: docName || docType,
        fileUrl,
        fileKey,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: "uploaded",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      url: `/api/documents/serve?docId=${docId}`,
      docType,
    })
  } catch (error: any) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    )
  }
}

// DELETE: Delete document by docType
export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const docType = searchParams.get("docType")

  if (!docType) {
    return NextResponse.json({ error: "docType is required" }, { status: 400 })
  }

  try {
    await db
      .delete(userDocument)
      .where(
        and(
          eq(userDocument.userId, session.user.id),
          eq(userDocument.docType, docType)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to delete document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
