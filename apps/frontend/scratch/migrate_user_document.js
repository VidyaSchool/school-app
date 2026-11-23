const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_ydhCfPMV17ov@ep-young-shadow-a1qa83me-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function run() {
  console.log('Running user_document table migration...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "user_document" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "doc_type" text NOT NULL,
        "doc_name" text NOT NULL,
        "file_url" text NOT NULL,
        "file_name" text NOT NULL,
        "file_type" text NOT NULL,
        "file_size" integer,
        "file_key" text,
        "status" text DEFAULT 'uploaded' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('Table user_document created/verified.');

    await sql`
      ALTER TABLE "user_document" ADD COLUMN IF NOT EXISTS "file_key" text;
    `;
    console.log('Column file_key added/verified successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
