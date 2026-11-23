// scratch/test-db.ts
import { db } from '../lib/db'
import { session as sessionTable } from '../lib/schema'

async function run() {
  try {
    console.log("Querying database...");
    const result = await db.select().from(sessionTable).limit(1);
    console.log("Database result:", result);
  } catch (error: any) {
    console.error("Database query failed!");
    console.error(error);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

run();
