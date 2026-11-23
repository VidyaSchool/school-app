// fix-timetable-nullable.mjs — make start_time/end_time nullable in timetable
import { neon } from '@neondatabase/serverless';

const DB_URL = process.env.DATABASE_URL;
const sql = neon(DB_URL);

// Check current constraints
const cols = await sql`
  SELECT column_name, is_nullable, data_type, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'timetable'
  ORDER BY ordinal_position
`;
console.log('Current timetable columns:');
for (const c of cols) {
  console.log(`  ${c.column_name}: ${c.data_type} nullable=${c.is_nullable} default=${c.column_default}`);
}

// Drop NOT NULL from start_time and end_time (they are now native time type, allow null)
await sql`ALTER TABLE timetable ALTER COLUMN start_time DROP NOT NULL`;
await sql`ALTER TABLE timetable ALTER COLUMN end_time DROP NOT NULL`;

console.log('\n✅ start_time and end_time are now nullable');
