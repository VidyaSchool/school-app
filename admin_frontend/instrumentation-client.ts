"use client";

import * as Sentry from "@sentry/browser";
import { captureRouterTransitionStart } from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f5c57bb78c3e83f04d987a143ab32543@o4511647082872832.ingest.de.sentry.io/4511647094210640",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  }
});

export const onRouterTransitionStart = captureRouterTransitionStart;

