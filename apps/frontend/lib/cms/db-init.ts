import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

let tablesInitialized = false

/**
 * Ensures all CMS tables, indices, and relationships exist in PostgreSQL.
 * Safe to execute multiple times (idempotent).
 */
export async function ensureCmsTablesExist() {
  if (tablesInitialized) return

  try {
    // 1. Pages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cms_pages" (
        "id" text PRIMARY KEY,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "type" text NOT NULL DEFAULT 'page_builder',
        "status" text NOT NULL DEFAULT 'draft',
        "seo_title" text,
        "seo_description" text,
        "og_image" text,
        "canonical_url" text,
        "no_index" boolean NOT NULL DEFAULT false,
        "author_id" text,
        "updated_by_id" text,
        "published_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // Unique index on lowercase slug
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "cms_pages_slug_unique_idx" ON "cms_pages" (LOWER("slug"));
    `)

    // 2. Sections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cms_page_sections" (
        "id" text PRIMARY KEY,
        "page_id" text NOT NULL REFERENCES "cms_pages"("id") ON DELETE CASCADE,
        "type" text NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "props" text NOT NULL DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT NOW(),
        "updated_at" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "cms_sections_page_order_idx" ON "cms_page_sections" ("page_id", "order");
    `)

    // 3. Media table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cms_media" (
        "id" text PRIMARY KEY,
        "filename" text NOT NULL,
        "url" text NOT NULL,
        "alt_text" text,
        "file_size" integer,
        "mime_type" text,
        "width" integer,
        "height" integer,
        "uploaded_by_id" text,
        "created_at" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    // 4. Versions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cms_page_versions" (
        "id" text PRIMARY KEY,
        "page_id" text NOT NULL REFERENCES "cms_pages"("id") ON DELETE CASCADE,
        "version_number" integer NOT NULL,
        "snapshot" text NOT NULL,
        "created_by_id" text,
        "created_at" timestamp NOT NULL DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "cms_versions_page_idx" ON "cms_page_versions" ("page_id", "version_number" DESC);
    `)

    tablesInitialized = true
  } catch (error) {
    console.error("Failed to initialize CMS tables in PostgreSQL:", error)
  }
}
