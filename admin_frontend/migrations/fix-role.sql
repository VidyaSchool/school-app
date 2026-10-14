-- Drop existing enum if it exists
DROP TYPE IF EXISTS "role" CASCADE;

-- Create enum type
CREATE TYPE "role" AS ENUM('student', 'teacher', 'admin', 'account', 'librarian');

-- Add column if not exists
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" "role" DEFAULT 'student' NOT NULL;

-- Update existing users to have student role
UPDATE "user" SET "role" = 'student' WHERE "role" IS NULL;
