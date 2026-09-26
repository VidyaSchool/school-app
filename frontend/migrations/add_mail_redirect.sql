-- Add email redirection and disable/enable fields to user_profile
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "is_mail_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "mail_redirect_email" TEXT;
