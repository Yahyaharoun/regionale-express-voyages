import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% sampling in production — prevents runaway Sentry costs.
  // Increase temporarily for debugging via NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE.
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),

  debug: false,
});
