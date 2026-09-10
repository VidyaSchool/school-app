-- Add preferredRole and teacherApprovalStatus to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "preferred_role" TEXT,
ADD COLUMN IF NOT EXISTS "teacher_approval_status" TEXT DEFAULT 'pending';

-- Create teacher_request table
CREATE TABLE IF NOT EXISTS "teacher_request" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "admin_id" TEXT REFERENCES "user"("id"),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "teacher_request_user_id_idx" ON "teacher_request"("user_id");
CREATE INDEX IF NOT EXISTS "teacher_request_status_idx" ON "teacher_request"("status");
