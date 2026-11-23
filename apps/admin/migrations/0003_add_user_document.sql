-- Create user_document table
CREATE TABLE IF NOT EXISTS "user_document" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "doc_type" text NOT NULL,
  "doc_name" text NOT NULL,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" integer,
  "status" text DEFAULT 'uploaded' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_document_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "user_document" ADD CONSTRAINT "user_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
