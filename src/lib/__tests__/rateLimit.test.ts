/**
 * Tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, SlidingWindowRateLimiter, RateLimitPresets } from '../rateLimit';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create a rate limiter with 5 requests per 100ms for testing
    rateLimiter = new RateLimiter({ limit: 5, window: 100 });
  });

  it('should allow requests within the limit', () => {
    const result = rateLimiter.check('user1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should deny requests when limit is exceeded', () => {
    // Make 5 requests (exactly the limit)
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.check('user1').allowed).toBe(true);
    }

    // The 6th request should be denied
    const result = rateLimiter.check('user1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset limit after window expires', async () => {
    // Make 5 requests to reach the limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('user1');
    }

    // Should be denied
    expect(rateLimiter.check('user1').allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be allowed again
    const result = rateLimiter.check('user1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should track different users independently', () => {
    // User 1 makes 5 requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('user1');
    }

    // User 1 should be rate limited
    expect(rateLimiter.check('user1').allowed).toBe(false);

    // User 2 should still be allowed
    expect(rateLimiter.check('user2').allowed).toBe(true);
  });

  it('should reset specific user', () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.check('user1');
    }

    // Should be denied
    expect(rateLimiter.check('user1').allowed).toBe(false);

    // Reset the user
    rateLimiter.reset('user1');

    // Should be allowed again
    expect(rateLimiter.check('user1').allowed).toBe(true);
  });

  it('should provide correct reset timestamp', () => {
    const beforeTime = Date.now();
    const result = rateLimiter.check('user1');
    const afterTime = Date.now();

    expect(result.resetAt).toBeGreaterThanOrEqual(beforeTime);
    expect(result.resetAt).toBeLessThanOrEqual(afterTime + 100);
  });

  it('should cleanup old entries', () => {
    // Add some requests for user1
    for (let i = 0; i < 3; i++) {
      rateLimiter.check('user1');
    }

    // Add some requests for user2
    for (let i = 0; i < 2; i++) {
      rateLimiter.check('user2');
    }

    // Wait for window to expire
    return new Promise(resolve => {
      setTimeout(() => {
        rateLimiter.cleanup();

        // After cleanup, users should be able to make requests again
        expect(rateLimiter.check('user1').allowed).toBe(true);
        expect(rateLimiter.check('user2').allowed).toBe(true);
        resolve(undefined);
      }, 150);
    });
  });
});

describe('SlidingWindowRateLimiter', () => {
  let rateLimiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    rateLimiter = new SlidingWindowRateLimiter({ limit: 3, window: 100 });
  });

  it('should allow requests within sliding window', () => {
    expect(rateLimiter.check('user1').allowed).toBe(true);
    expect(rateLimiter.check('user1').allowed).toBe(true);
    expect(rateLimiter.check('user1').allowed).toBe(true);
    expect(rateLimiter.check('user1').allowed).toBe(false);
  });

  it('should slide window correctly', async () => {
    // Make 3 requests
    rateLimiter.check('user1');
    rateLimiter.check('user1');
    rateLimiter.check('user1');

    // Wait for more than the window (100ms)
    await new Promise(resolve => setTimeout(resolve, 120));

    // All previous requests should have expired
    expect(rateLimiter.check('user1').allowed).toBe(true);
  });
});

describe('RateLimitPresets', () => {
  it('should have all required presets', () => {
    expect(RateLimitPresets.tweetGeneration).toBeDefined();
    expect(RateLimitPresets.visionAnalysis).toBeDefined();
    expect(RateLimitPresets.batchGeneration).toBeDefined();
    expect(RateLimitPresets.general).toBeDefined();
  });

  it('should have reasonable limits', () => {
    // Batch should be most restrictive (generates multiple tweets)
    expect(RateLimitPresets.batchGeneration.limit).toBeLessThan(RateLimitPresets.visionAnalysis.limit);
    expect(RateLimitPresets.batchGeneration.limit).toBeLessThan(RateLimitPresets.tweetGeneration.limit);

    // Vision should be more restrictive than regular tweets
    expect(RateLimitPresets.visionAnalysis.limit).toBeLessThan(RateLimitPresets.tweetGeneration.limit);

    // All should have windows defined
    expect(RateLimitPresets.tweetGeneration.window).toBeGreaterThan(0);
    expect(RateLimitPresets.visionAnalysis.window).toBeGreaterThan(0);
    expect(RateLimitPresets.batchGeneration.window).toBeGreaterThan(0);
    expect(RateLimitPresets.general.window).toBeGreaterThan(0);
  });
});
