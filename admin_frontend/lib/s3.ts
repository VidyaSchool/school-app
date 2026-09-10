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

/**
 * Generate a presigned URL for direct client-side upload to S3
 */
export async function generatePresignedUploadUrl({
  fileName,
  fileType,
  folder = "documents",
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

  const ext = fileName.split(".").pop() || "pdf"
  const sanitizedBaseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
  const fileKey = `${folder}/${Date.now()}-${crypto.randomUUID()}-${sanitizedBaseName}.${ext}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: fileType,
  })

  // URL valid for 15 minutes (900 seconds)
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 900 })

  const region = process.env.AWS_REGION || "ap-south-1"
  const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN
  
  const fileUrl = customDomain
    ? `${customDomain.replace(/\/+$/, "")}/${fileKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`

  return { presignedUrl, fileUrl, fileKey }
}

/**
 * Upload file buffer directly to S3 from server
 */
export async function uploadBufferToS3({
  buffer,
  fileName,
  fileType,
  folder = "documents",
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

  const ext = fileName.split(".").pop() || "pdf"
  const sanitizedBaseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
  const fileKey = `${folder}/${Date.now()}-${crypto.randomUUID()}-${sanitizedBaseName}.${ext}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    Body: buffer,
    ContentType: fileType,
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
 * Generate a short-lived presigned URL for downloading / viewing private S3 files (valid for 15 mins)
 */
export async function generatePresignedDownloadUrl(
  fileKey: string,
  expiresInSeconds = 900
): Promise<string | null> {
  const s3 = getS3Client()
  const bucket = getS3BucketName()

  if (!s3 || !bucket || !fileKey) {
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
 * Delete a file permanently from S3 bucket using fileKey or S3 URL
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
