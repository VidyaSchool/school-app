import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://42fb3541f8375e80add25a786495678f@o4511647082872832.ingest.de.sentry.io/4511647092179024",
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  includeLocalVariables: true,
  enableLogs: true,
});
