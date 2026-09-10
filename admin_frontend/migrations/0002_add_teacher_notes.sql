CREATE TABLE IF NOT EXISTS "teacher_note" (
  "id" text PRIMARY KEY NOT NULL,
  "teacher_id" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL DEFAULT '',
  "color" text NOT NULL DEFAULT 'default',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "teacher_note" ADD CONSTRAINT "teacher_note_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
