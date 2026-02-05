/**
 * Sentry Error Tracking Configuration
 *
 * To enable Sentry, add VITE_SENTRY_DSN to your .env file:
 * VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
 *
 * Get your DSN from: https://sentry.io/settings/projects/
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isDev = import.meta.env.DEV;

/**
 * Initialize Sentry for error tracking
 * Only initializes if a DSN is provided
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.log("[Sentry] No DSN provided, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: isDev ? "development" : "production",

    // Sample rates
    tracesSampleRate: isDev ? 1.0 : 0.1, // 10% of transactions in production
    profilesSampleRate: isDev ? 1.0 : 0.1,

    // Filter out development errors
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (isDev && import.meta.env.VITE_SENTRY_ENABLE_DEV !== "true") {
        return null;
      }

      // Filter out common development errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignore ResizeObserver errors (common browser extension issues)
          if (error.message.includes("ResizeObserver")) {
            return null;
          }
        }
      }

      return event;
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.extraErrorDataIntegration(),
    ],

    // Replay settings
    replaysSessionSampleRate: isDev ? 1.0 : 0.1, // 10% of sessions in production
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Breadcrumbs for better context
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
        // Don't log sensitive data
        if (breadcrumb.data) {
          delete breadcrumb.data.url;
        }
      }
      return breadcrumb;
    },

    // Initial scope - add app context
    initialScope: {
      tags: {
        app: "ai-tweet-generator",
      },
    },
  });

  console.log("[Sentry] Error tracking initialized");
}

/**
 * Log a custom message to Sentry
 * @param message The message to log
 * @param level Severity level (info, warning, error)
 * @param context Additional context data
 */
export function logToSentry(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>
) {
  if (!SENTRY_DSN) return;

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Log an exception to Sentry
 * @param error The error to log
 * @param context Additional context data
 */
export function logExceptionToSentry(
  error: Error | unknown,
  context?: Record<string, unknown>
) {
  if (!SENTRY_DSN) {
    console.error("[Error]", error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for Sentry
 * @param userId User identifier (could be a session ID or actual user ID)
 * @param additionalContext Additional user context
 */
export function setSentryUser(
  userId: string,
  additionalContext?: Record<string, unknown>
) {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    ...additionalContext,
  });
}

/**
 * Add a breadcrumb for better error context
 * @param category Breadcrumb category
 * @param message Breadcrumb message
 * @param data Additional data
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
  });
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return !!SENTRY_DSN && (!isDev || import.meta.env.VITE_SENTRY_ENABLE_DEV === "true");
}
