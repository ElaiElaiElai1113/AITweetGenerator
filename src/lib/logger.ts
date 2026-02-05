/**
 * Conditional logger that only logs in development
 * In production, debug logs are silenced but errors are still logged to Sentry
 */

import { logExceptionToSentry, isSentryEnabled } from "./sentry";

const isDev = import.meta.env.DEV;

export const logger = {
  /** Debug logs - only shown in development */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[Debug]', ...args);
    }
  },

  /** Info logs - only shown in development */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[Info]', ...args);
    }
  },

  /** Warning logs - only shown in development */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[Warn]', ...args);
    }
  },

  /** Error logs - always shown, even in production, and sent to Sentry if enabled */
  error: (...args: unknown[]) => {
    console.error('[Error]', ...args);

    // Send to Sentry if enabled
    if (isSentryEnabled()) {
      const error = args[0];
      if (error instanceof Error) {
        logExceptionToSentry(error, {
          context: args.slice(1),
        });
      } else if (typeof error === "string") {
        logExceptionToSentry(new Error(error), {
          additionalArgs: args.slice(1),
        });
      }
    }
  },

  /** Group start - only in development */
  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },

  /** Group end - only in development */
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },

  /** Time measurement - only in development */
  time: (label: string) => {
    if (isDev) {
      console.time(label);
    }
  },

  /** Time end - only in development */
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },
};

/** Vision-specific logger with prefix */
export const visionLogger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[Vision]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[Vision Error]', ...args);

    if (isSentryEnabled()) {
      const error = args[0];
      if (error instanceof Error) {
        logExceptionToSentry(error, {
          component: 'vision',
          context: args.slice(1),
        });
      } else if (typeof error === "string") {
        logExceptionToSentry(new Error(`[Vision] ${error}`), {
          component: 'vision',
          additionalArgs: args.slice(1),
        });
      }
    }
  },
};

/** API-specific logger with prefix */
export const apiLogger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[API]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[API Error]', ...args);

    if (isSentryEnabled()) {
      const error = args[0];
      if (error instanceof Error) {
        logExceptionToSentry(error, {
          component: 'api',
          context: args.slice(1),
        });
      } else if (typeof error === "string") {
        logExceptionToSentry(new Error(`[API] ${error}`), {
          component: 'api',
          additionalArgs: args.slice(1),
        });
      }
    }
  },
};

/** Stream-specific logger with prefix */
export const streamLogger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[Stream]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[Stream Error]', ...args);

    if (isSentryEnabled()) {
      const error = args[0];
      if (error instanceof Error) {
        logExceptionToSentry(error, {
          component: 'stream',
          context: args.slice(1),
        });
      } else if (typeof error === "string") {
        logExceptionToSentry(new Error(`[Stream] ${error}`), {
          component: 'stream',
          additionalArgs: args.slice(1),
        });
      }
    }
  },
};
