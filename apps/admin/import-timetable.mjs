// import-timetable.mjs
// 1. Creates teacher user accounts (if not already existing by name)
// 2. Inserts timetable rows from the CSV
// Run from: admin_frontend/

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_URL = process.env.DATABASE_URL;
const sql = neon(DB_URL);

// ─── helpers ──────────────────────────────────────────────────────────────────

function genId(len = 32) {
  return randomBytes(len).toString('base64url').slice(0, len);
}

function normalizeTeacherName(name) {
  return name.trim().toUpperCase();
}

// CSV columns: Teacher Name, Class, Period No., Sec, Day of the Week
// "Class" here is actually the SUBJECT CODE (numeric grade level)
// "Sec" is the section (A, B, C, etc.)
// Period 1-8

// Map numeric class values to subject label we'll store
// The CSV has Class as a number (grade level) + section separately
// We'll store class as the grade number, section as given

const CSV_PATH = resolve(__dirname, '../frontend/data/static-pages/timetableCSV.csv');

// ─── 1. Parse CSV ─────────────────────────────────────────────────────────────

const rawLines = readFileSync(CSV_PATH, 'utf-8')
  .split('\n')
  .map(l => l.replace(/\r/g, '').trim())
  .filter(Boolean);

const headers = rawLines[0].split(','); // Teacher Name,Class,Period No.,Sec,Day of the Week
console.log('CSV headers:', headers);

const rows = rawLines.slice(1).map(line => {
  const parts = line.split(',');
  return {
    teacherName: parts[0]?.trim() || '',
    classGrade:  parts[1]?.trim() || '',  // grade/class number
    periodNumber: parseInt(parts[2]?.trim(), 10),
    section:     parts[3]?.trim() || '',
    dayOfWeek:   parts[4]?.trim().toUpperCase() || '',
  };
}).filter(r => r.teacherName && r.dayOfWeek && !isNaN(r.periodNumber));

console.log(`Parsed ${rows.length} valid timetable rows`);

// ─── 2. Get unique teacher names ───────────────────────────────────────────────

const uniqueTeacherNames = [...new Set(rows.map(r => r.teacherName))].sort();
console.log(`\nUnique teachers: ${uniqueTeacherNames.length}`);

// ─── 3. Fetch existing users from DB ──────────────────────────────────────────

const existingUsers = await sql`SELECT id, name, email FROM "user"`;
// Build a map: NORMALIZED_NAME -> user
const nameToUser = new Map();
for (const u of existingUsers) {
  nameToUser.set(normalizeTeacherName(u.name), u);
}

// ─── 4. Create missing teacher accounts ───────────────────────────────────────

const teacherIdMap = new Map(); // NORMALIZED_NAME -> user_id

let created = 0;
let reused  = 0;

for (const name of uniqueTeacherNames) {
  const key = normalizeTeacherName(name);
  if (nameToUser.has(key)) {
    teacherIdMap.set(key, nameToUser.get(key).id);
    reused++;
    console.log(`  [SKIP] "${name}" already exists`);
    continue;
  }

  // Create a teacher user
  const userId  = genId(32);
  // Generate deterministic email from name
  const slug    = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  const email   = `${slug}@vidyaschool.edu`;
  const now     = new Date();

  await sql`
    INSERT INTO "user" (id, name, email, email_verified, role, teacher_approval_status, wing_id, weekly_proxy_count, created_at, updated_at)
    VALUES (${userId}, ${name}, ${email}, true, 'teacher', 'approved', 'General', 0, ${now}, ${now})
    ON CONFLICT (email) DO NOTHING
  `;

  teacherIdMap.set(key, userId);
  created++;
  console.log(`  [CREATE] "${name}" → ${userId} (${email})`);
}

console.log(`\nTeacher accounts: ${created} created, ${reused} reused`);

// ─── 5. Insert timetable rows ─────────────────────────────────────────────────

console.log('\nInserting timetable rows...');

// Clear existing timetable first (fresh import)
const existing = await sql`SELECT COUNT(*) as cnt FROM timetable`;
if (parseInt(existing[0].cnt) > 0) {
  console.log(`  Clearing ${existing[0].cnt} existing timetable rows...`);
  // Null out FK references in substitution_record first
  await sql`UPDATE substitution_record SET timetable_id = NULL, merged_with_timetable_id = NULL WHERE timetable_id IS NOT NULL OR merged_with_timetable_id IS NOT NULL`;
  await sql`DELETE FROM timetable`;
}

let inserted = 0;
let skipped  = 0;

// Build all insert values
const insertValues = [];
for (const row of rows) {
  const key = normalizeTeacherName(row.teacherName);
  const teacherId = teacherIdMap.get(key);
  if (!teacherId) {
    console.warn(`  [WARN] No teacher ID for "${row.teacherName}" — skipping`);
    skipped++;
    continue;
  }

  // Validate period number (1-8)
  if (row.periodNumber < 1 || row.periodNumber > 8) {
    console.warn(`  [WARN] Invalid period ${row.periodNumber} for "${row.teacherName}" on ${row.dayOfWeek} — skipping`);
    skipped++;
    continue;
  }

  insertValues.push({
    id:            genId(32),
    teacherId,
    periodNumber:  row.periodNumber,
    class_:        row.classGrade,    // use class_ to avoid JS reserved word
    section:       row.section,
    subject:       `Class ${row.classGrade}`,   // subject derived from class
    dayOfWeek:     row.dayOfWeek,
    room:          null,
  });
}

// Batch insert in chunks of 50
const CHUNK = 50;
for (let i = 0; i < insertValues.length; i += CHUNK) {
  const chunk = insertValues.slice(i, i + CHUNK);
  const now = new Date();
  for (const v of chunk) {
    await sql`
      INSERT INTO timetable (id, teacher_id, period_number, class, section, subject, day_of_week, start_time, end_time, room, created_at, updated_at)
      VALUES (
        ${v.id}, ${v.teacherId}, ${v.periodNumber},
        ${v.class_}, ${v.section}, ${v.subject},
        ${v.dayOfWeek}, NULL, NULL, ${v.room},
        ${now}, ${now}
      )
    `;
    inserted++;
  }
  console.log(`  Inserted ${Math.min(i + CHUNK, insertValues.length)} / ${insertValues.length}...`);
}

console.log(`\n✅ Done! ${inserted} timetable rows inserted, ${skipped} skipped`);

// ─── 6. Summary ───────────────────────────────────────────────────────────────

const counts = await sql`
  SELECT day_of_week, COUNT(*) as cnt
  FROM timetable
  GROUP BY day_of_week
  ORDER BY day_of_week
`;
console.log('\nRows per day:');
for (const r of counts) {
  console.log(`  ${r.day_of_week}: ${r.cnt}`);
}
