import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

// Initialize S3 Client from environment variables
export function getS3Client() {
  const region = process.env.AWS_REGION || "ap-south-1"
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    return null
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export function getS3BucketName(): string | null {
  return process.env.AWS_S3_BUCKET_NAME || null
}

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )
}

// Canonical MIME type to safe extension mapping (strictly raster images, no executable formats or active XML SVGs)
export const SAFE_IMAGE_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
}

const ALLOWED_S3_PREFIXES = ["gallery", "slider", "documents", "uploads"]

/**
 * Validate image magic bytes from buffer to prevent MIME spoofing / Polyglot file attacks
 */
export function validateImageMagicBytes(buffer: Buffer): { valid: boolean; mimeType?: string; ext?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mimeType: "image/jpeg", ext: "jpg" }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, mimeType: "image/png", ext: "png" }
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { valid: true, mimeType: "image/gif", ext: "gif" }
  }

  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: "image/webp", ext: "webp" }
  }

  // AVIF: ftypavif or ftypavis
  if (buffer.length >= 16) {
    const ftyp = buffer.subarray(4, 8).toString("ascii")
    const brand = buffer.subarray(8, 12).toString("ascii")
    if (ftyp === "ftyp" && (brand === "avif" || brand === "avis" || brand === "mif1")) {
      return { valid: true, mimeType: "image/avif", ext: "avif" }
    }
  }

  return { valid: false }
}

/**
 * Generate a cryptographically secure, collision-resistant, and sanitized S3 key
 */
function buildSecureS3Key(folder: string, originalFileName: string, safeExt: string): string {
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "gallery"
  const sanitizedBase = originalFileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "photo"

  const uniqueId = crypto.randomUUID()
  return `${cleanFolder}/${Date.now()}-${uniqueId}-${sanitizedBase}.${safeExt}`
}

/**
 * Generate a presigned URL for direct client-side upload to S3
 */
export async function generatePresignedUploadUrl({
  fileName,
  fileType,
  folder = "gallery",
}: {
  fileName: string
  fileType: string
  folder?: string
}): Promise<{ presignedUrl: string; fileUrl: string; fileKey: string } | null> {
  const s3 = getS3Client()
  const bucket = getS3BucketName()

  if (!s3 || !bucket) {
    return null
  }

  const normalizedType = fileType.toLowerCase().trim()
  const safeExt = SAFE_IMAGE_MIME_TYPES[normalizedType]
  if (!safeExt) {
    console.warn(`[s3] Blocked presigned URL request for unapproved MIME type: ${fileType}`)
    return null
  }

  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "")
  if (!ALLOWED_S3_PREFIXES.includes(cleanFolder)) {
    console.warn(`[s3] Blocked presigned URL for unauthorized folder: ${folder}`)
    return null
  }

  const fileKey = buildSecureS3Key(cleanFolder, fileName, safeExt)

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: normalizedType,
    ContentDisposition: "inline",
  })

  // URL valid for 5 minutes (300 seconds) to minimize exposure window
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 })

  const region = process.env.AWS_REGION || "ap-south-1"
  const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN
  
  const fileUrl = customDomain
    ? `${customDomain.replace(/\/+$/, "")}/${fileKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`

  return { presignedUrl, fileUrl, fileKey }
}

/**
 * Upload file buffer directly to S3 from server after binary signature verification
 */
export async function uploadBufferToS3({
  buffer,
  fileName,
  fileType,
  folder = "gallery",
}: {
  buffer: Buffer
  fileName: string
  fileType: string
  folder?: string
}): Promise<{ fileUrl: string; fileKey: string } | null> {
  const s3 = getS3Client()
  const bucket = getS3BucketName()

  if (!s3 || !bucket) {
    return null
  }

  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "")
  if (!ALLOWED_S3_PREFIXES.includes(cleanFolder)) {
    console.warn(`[s3] Blocked upload to unauthorized folder: ${folder}`)
    return null
  }

  // Inspect magic bytes
  const magicResult = validateImageMagicBytes(buffer)
  if (!magicResult.valid || !magicResult.ext || !magicResult.mimeType) {
    console.warn(`[s3] Image buffer failed magic bytes validation for file: ${fileName}`)
    return null
  }

  const fileKey = buildSecureS3Key(cleanFolder, fileName, magicResult.ext)

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    Body: buffer,
    ContentType: magicResult.mimeType,
    ContentDisposition: "inline",
  })

  await s3.send(command)

  const region = process.env.AWS_REGION || "ap-south-1"
  const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN
  const fileUrl = customDomain
    ? `${customDomain.replace(/\/+$/, "")}/${fileKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`

  return { fileUrl, fileKey }
}

/**
 * Generate a short-lived presigned URL for downloading / viewing private S3 files (valid for 5 mins)
 */
export async function generatePresignedDownloadUrl(
  fileKey: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const s3 = getS3Client()
  const bucket = getS3BucketName()

  if (!s3 || !bucket || !fileKey) {
    return null
  }

  // Prevent path traversal
  if (fileKey.includes("..") || fileKey.startsWith("/")) {
    return null
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    })
    return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds })
  } catch (err) {
    console.error("Failed to generate presigned download URL:", err)
    return null
  }
}

/**
 * Delete a file permanently from S3 bucket with strict key and prefix validation
 */
export async function deleteFromS3(fileUrlOrKey: string): Promise<boolean> {
  const s3 = getS3Client()
  const bucket = getS3BucketName()

  if (!s3 || !bucket || !fileUrlOrKey) {
    return false
  }

  try {
    let fileKey = fileUrlOrKey
    if (fileUrlOrKey.includes(".amazonaws.com/")) {
      fileKey = fileUrlOrKey.split(".amazonaws.com/")[1]
    } else if (/^https?:\/\//i.test(fileUrlOrKey)) {
      const parsed = new URL(fileUrlOrKey)
      fileKey = parsed.pathname.replace(/^\/+/, "")
    }

    // Security checks: prevent path traversal or root bucket deletions
    fileKey = fileKey.replace(/^\/+/, "")
    if (fileKey.includes("..") || fileKey.includes("\0")) {
      console.warn(`[s3] Path traversal attempt blocked in deleteFromS3: ${fileKey}`)
      return false
    }

    // Ensure key starts with an allowed upload prefix
    const hasValidPrefix = ALLOWED_S3_PREFIXES.some(prefix => fileKey.startsWith(`${prefix}/`))
    if (!hasValidPrefix) {
      console.warn(`[s3] Unauthorized key deletion attempt blocked: ${fileKey}`)
      return false
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    })
    await s3.send(command)
    return true
  } catch (err) {
    console.error("Failed to delete object from S3:", err)
    return false
  }
}
