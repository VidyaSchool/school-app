-- ============================================================
-- MIGRATION: Timetable & Substitution System Refactor
-- Date: 2026-10-13
-- All affected tables (timetable, substitution_record) have 0 rows
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- STEP 1: Create teacher_profiles table
-- ──────────────────────────────────────────────────────────────
CREATE TABLE "teacher_profiles" (
  "id"                 varchar PRIMARY KEY,
  "user_id"            varchar NOT NULL UNIQUE,
  "wing_id"            varchar DEFAULT 'General',
  "weekly_proxy_count" integer DEFAULT 0,
  "daily_free_count"   integer DEFAULT 0,
  CONSTRAINT "teacher_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);

-- ──────────────────────────────────────────────────────────────
-- STEP 2: Refactor timetable table
-- ──────────────────────────────────────────────────────────────

-- Drop obsolete columns
ALTER TABLE "timetable" DROP COLUMN IF EXISTS "start_time";
ALTER TABLE "timetable" DROP COLUMN IF EXISTS "end_time";
ALTER TABLE "timetable" DROP COLUMN IF EXISTS "room";

-- Add period_number (NOT NULL; table is empty so no USING needed)
ALTER TABLE "timetable" ADD COLUMN "period_number" smallint NOT NULL DEFAULT 0;

-- Give subject a default empty string
ALTER TABLE "timetable" ALTER COLUMN "subject" SET DEFAULT '';

-- Composite index for substitution matrix lookups
CREATE INDEX "ix_timetable_day_period"
  ON "timetable" ("day_of_week", "period_number");

-- ──────────────────────────────────────────────────────────────
-- STEP 3: Refactor substitution_record table
-- ──────────────────────────────────────────────────────────────

-- Drop obsolete columns
ALTER TABLE "substitution_record" DROP COLUMN IF EXISTS "start_time";
ALTER TABLE "substitution_record" DROP COLUMN IF EXISTS "end_time";
ALTER TABLE "substitution_record" DROP COLUMN IF EXISTS "period_name";

-- Change date from varchar → native date type
-- (table is empty so no USING cast risk)
ALTER TABLE "substitution_record"
  ALTER COLUMN "date" TYPE date USING "date"::date;

-- Add period_number
ALTER TABLE "substitution_record"
  ADD COLUMN "period_number" smallint NOT NULL DEFAULT 0;

-- Add merged_with_timetable_id (nullable FK to timetable)
ALTER TABLE "substitution_record"
  ADD COLUMN "merged_with_timetable_id" varchar;

ALTER TABLE "substitution_record"
  ADD CONSTRAINT "sub_record_merged_timetable_fkey"
  FOREIGN KEY ("merged_with_timetable_id") REFERENCES "timetable"("id");

-- Composite index on (date, period_number) for fast daily lookups
CREATE INDEX "ix_substitution_record_date_period"
  ON "substitution_record" ("date", "period_number");

COMMIT;
