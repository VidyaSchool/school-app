// scratch/test-headers.ts
import { auth } from '../lib/auth'

async function testHeaders(label: string, headersObj: Record<string, string>) {
  try {
    console.log(`\n--- Testing: ${label} ---`);
    const headers = new Headers();
    for (const [key, val] of Object.entries(headersObj)) {
      headers.set(key, val);
    }
    const session = await auth.api.getSession({
      headers
    });
    console.log("Result: Success, session is:", session);
  } catch (error: any) {
    console.error("Result: FAILED!");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

async function run() {
  // Test 1: Empty headers
  await testHeaders("Empty headers", {});

  // Test 2: Host header matching BETTER_AUTH_URL
  await testHeaders("Host: localhost:3000", { host: "localhost:3000" });

  // Test 3: Host header mismatch (e.g. if accessed via 127.0.0.1)
  await testHeaders("Host: 127.0.0.1:3000", { host: "127.0.0.1:3000" });

  // Test 4: Host header from dynamic address (e.g. no port)
  await testHeaders("Host: my-app.com", { host: "my-app.com" });

  // Test 5: Standard Next.js/Browser headers (cookie + user-agent + accept + host)
  await testHeaders("Full Browser-like Headers", {
    host: "localhost:3000",
    "user-agent": "Mozilla/5.0",
    accept: "*/*",
    cookie: "better-auth.session_token=123"
  });
}

run();
