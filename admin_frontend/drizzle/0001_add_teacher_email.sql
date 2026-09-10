CREATE TABLE IF NOT EXISTS "teacher_email" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"folder" text NOT NULL DEFAULT 'inbox',
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"cc_address" text,
	"subject" text NOT NULL DEFAULT '(no subject)',
	"body_html" text,
	"body_text" text NOT NULL DEFAULT '',
	"resend_id" text,
	"is_read" boolean NOT NULL DEFAULT false,
	"is_starred" boolean NOT NULL DEFAULT false,
	"raw_payload" text,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);