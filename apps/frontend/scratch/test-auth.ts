// scratch/test-auth.ts
import { auth } from '../lib/auth'

async function run() {
  try {
    console.log("Calling getSession with empty headers...");
    const session = await auth.api.getSession({
      headers: new Headers()
    });
    console.log("Session result:", session);
  } catch (error: any) {
    console.error("Error occurred:", error);
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
  }
}

run();
