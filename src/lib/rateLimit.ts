/**
 * Rate limiting utilities
 *
 * For client-side: Prevents excessive API calls from the UI
 * For server-side: Limits requests per IP/session (in Edge Functions)
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  window: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** When the limit will reset (timestamp) */
  resetAt: number;
  /** Time until reset in milliseconds */
  retryAfter?: number;
}

/**
 * In-memory rate limiter for client-side usage
 * Uses a Map to track request counts per key
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed
   * @param key Unique identifier for the rate limit (e.g., userId, IP, session)
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.window;

    // Get existing timestamps for this key
    let timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside the current window
    timestamps = timestamps.filter((t) => t > windowStart);

    // Check if limit is exceeded
    const allowed = timestamps.length < this.config.limit;

    if (allowed) {
      // Add current request timestamp
      timestamps.push(now);
    }

    // Update the map
    this.requests.set(key, timestamps);

    const remaining = Math.max(0, this.config.limit - timestamps.length);
    const oldestInWindow = timestamps[0] || now;
    const resetAt = oldestInWindow + this.config.window;

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : resetAt - now,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.window;

    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((t) => t > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

/**
 * Sliding window rate limiter (more accurate than fixed window)
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.window;

    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    const allowed = timestamps.length < this.config.limit;

    if (allowed) {
      timestamps.push(now);
    }

    this.requests.set(key, timestamps);

    // Calculate reset time (when oldest request in window expires)
    const resetAt = timestamps.length > 0 ? timestamps[0] + this.config.window : now + this.config.window;

    return {
      allowed,
      remaining: Math.max(0, this.config.limit - timestamps.length),
      resetAt,
      retryAfter: allowed ? undefined : resetAt - now,
    };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitPresets = {
  /** Tweet generation: 10 requests per minute */
  tweetGeneration: { limit: 10, window: 60 * 1000 },

  /** Vision analysis: 5 requests per minute (more expensive) */
  visionAnalysis: { limit: 5, window: 60 * 1000 },

  /** Batch generation: 3 requests per minute */
  batchGeneration: { limit: 3, window: 60 * 1000 },

  /** General API: 20 requests per minute */
  general: { limit: 20, window: 60 * 1000 },
} as const;

/**
 * Client-side rate limiter instance
 * Uses session ID as the key
 */
class ClientRateLimiter {
  private tweetLimiter = new RateLimiter(RateLimitPresets.tweetGeneration);
  private visionLimiter = new RateLimiter(RateLimitPresets.visionAnalysis);
  private batchLimiter = new RateLimiter(RateLimitPresets.batchGeneration);

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('rate_limit_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('rate_limit_session', sessionId);
    }
    return sessionId;
  }

  /**
   * Check if tweet generation is allowed
   */
  checkTweetGeneration(): RateLimitResult {
    return this.tweetLimiter.check(this.getSessionId());
  }

  /**
   * Check if vision analysis is allowed
   */
  checkVisionAnalysis(): RateLimitResult {
    return this.visionLimiter.check(this.getSessionId());
  }

  /**
   * Check if batch generation is allowed
   */
  checkBatchGeneration(): RateLimitResult {
    return this.batchLimiter.check(this.getSessionId());
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    const sessionId = this.getSessionId();
    this.tweetLimiter.reset(sessionId);
    this.visionLimiter.reset(sessionId);
    this.batchLimiter.reset(sessionId);
  }
}

/**
 * Global client-side rate limiter instance
 */
export const clientRateLimiter = new ClientRateLimiter();

/**
 * Format retry-after time as a human-readable string
 */
export function formatRetryAfter(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Create a rate limit error message
 */
export function createRateLimitError(result: RateLimitResult, endpoint: string): string {
  if (result.allowed) {
    return '';
  }

  const retryAfter = formatRetryAfter(result.retryAfter!);
  return `Rate limit exceeded for ${endpoint}. Please try again in ${retryAfter}.`;
}
