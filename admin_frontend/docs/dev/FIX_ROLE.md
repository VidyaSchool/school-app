# Fix Role Column Error

## Issue
The `role` column doesn't exist in the existing user table.

## Solution

Go to your Neon dashboard (https://console.neon.tech) and run this SQL:

```sql
-- Drop existing enum if it exists
DROP TYPE IF EXISTS "role" CASCADE;

-- Create enum type
CREATE TYPE "role" AS ENUM('student', 'teacher', 'admin', 'account', 'librarian');

-- Drop existing column if it exists
ALTER TABLE "user" DROP COLUMN IF EXISTS "role";

-- Add column with proper type
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'student' NOT NULL;
```

## OR Reset Everything (Will delete all users)

If you want a fresh start:

```sql
-- See reset-db.sql file for complete reset script
```

Then copy contents of `reset-db.sql` and run in Neon SQL Editor.

## After Running SQL

1. Restart your dev server
2. Try logging in again
3. The role field should now work properly
