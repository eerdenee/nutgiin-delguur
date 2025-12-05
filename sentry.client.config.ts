// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1, // 10% of transactions

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Only send errors in production
    enabled: process.env.NODE_ENV === "production",

    // Ignore common browser errors
    ignoreErrors: [
        // Random browser extensions
        "top.GLOBALS",
        // Facebook borance
        "fb_xd_fragment",
        // Chrome extensions
        "chrome-extension",
        // Common network errors
        "Network request failed",
        "Failed to fetch",
        "Load failed",
        // User cancelled
        "AbortError",
    ],
});
