-- Create timetable table
CREATE TABLE IF NOT EXISTS "timetable" (
  "id" text PRIMARY KEY NOT NULL,
  "teacher_id" text NOT NULL,
  "class" text NOT NULL,
  "section" text NOT NULL,
  "subject" text NOT NULL,
  "day_of_week" text NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "room" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "timetable" ADD CONSTRAINT "timetable_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
