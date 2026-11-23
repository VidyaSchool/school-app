const { neon } = require('@neondatabase/serverless');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);

async function run() {
  console.log("Running custom migration script for timetable table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "timetable" (
      "id" text PRIMARY KEY NOT NULL,
      "teacher_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
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
  `;
  console.log("Migration completed successfully!");
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
