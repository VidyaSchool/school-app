// fetch-users.mjs — fetch all teacher users from DB
import { neon } from '@neondatabase/serverless';

const DB_URL = process.env.DATABASE_URL;
const sql = neon(DB_URL);

const users = await sql`
  SELECT u.id, u.name, u.email, u.role
  FROM "user" u
  ORDER BY u.name
`;

console.log(`Total users in DB: ${users.length}`);
console.log(JSON.stringify(users, null, 2));
