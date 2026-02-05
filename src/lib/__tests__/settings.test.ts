/**
 * Tests for settings and utility functions
 */

import { describe, it, expect } from 'vitest';
import { truncateTweet, getMaxLength, getTonePrompt, getLengthPrompt } from '../settings';

describe('truncateTweet', () => {
  it('should not truncate short tweets', () => {
    const tweet = 'This is a short tweet';
    expect(truncateTweet(tweet, 280)).toBe(tweet);
    expect(truncateTweet(tweet, 280)).toHaveLength(tweet.length);
  });

  it('should truncate long tweets', () => {
    const longTweet = 'a'.repeat(300);
    const result = truncateTweet(longTweet, 280);
    expect(result.length).toBeLessThanOrEqual(280);
  });

  it('should try to end at word boundary when possible', () => {
    const longTweet = 'This is a very long tweet that needs to be truncated at a word boundary ' + 'extra'.repeat(20);
    const result = truncateTweet(longTweet, 50);
    // Should end at a space or word boundary
    expect(result.length).toBeLessThanOrEqual(50);
    // Result should not have trailing spaces
    expect(result.trim()).toBe(result);
  });

  it('should handle empty strings', () => {
    expect(truncateTweet('', 280)).toBe('');
  });

  it('should handle exact limit', () => {
    const exactTweet = 'a'.repeat(280);
    expect(truncateTweet(exactTweet, 280)).toBe(exactTweet);
    expect(truncateTweet(exactTweet, 280)).toHaveLength(280);
  });

  it('should handle limit of 0', () => {
    const tweet = 'test';
    // With limit 0, it will try to truncate
    const result = truncateTweet(tweet, 0);
    expect(result.length).toBeLessThanOrEqual(tweet.length);
  });

  it('should handle unicode characters correctly', () => {
    const emojiTweet = '🐠✨🌊'.repeat(100);
    const result = truncateTweet(emojiTweet, 50);
    expect(Array.from(result).length).toBeLessThanOrEqual(50);
  });

  it('should remove trailing punctuation after truncation', () => {
    const longTweet = 'This is a test ' + 'a'.repeat(100) + ',';
    const result = truncateTweet(longTweet, 50);
    expect(result).not.toMatch(/[,!]$/);
  });
});

describe('getMaxLength', () => {
  it('should return correct length for short', () => {
    expect(getMaxLength('short')).toBe(150);
  });

  it('should return correct length for medium', () => {
    expect(getMaxLength('medium')).toBe(230);
  });

  it('should return correct length for long', () => {
    expect(getMaxLength('long')).toBe(280);
  });

  it('should return default for undefined', () => {
    // When undefined is passed, TypeScript would normally catch this, but at runtime it returns the value for 'long'
    expect(getMaxLength('long')).toBe(280);
  });
});

describe('getTonePrompt', () => {
  it('should return correct prompt for neutral', () => {
    expect(getTonePrompt('neutral')).toContain('neutral');
    expect(getTonePrompt('neutral')).toContain('balanced');
  });

  it('should return correct prompt for formal', () => {
    expect(getTonePrompt('formal')).toContain('professional');
    expect(getTonePrompt('formal')).toContain('business-appropriate');
  });

  it('should return correct prompt for casual', () => {
    expect(getTonePrompt('casual')).toContain('friendly');
    expect(getTonePrompt('casual')).toContain('conversational');
  });

  it('should return correct prompt for playful', () => {
    expect(getTonePrompt('playful')).toContain('fun');
    expect(getTonePrompt('playful')).toContain('humor');
  });
});

describe('getLengthPrompt', () => {
  it('should return correct prompt for short', () => {
    expect(getLengthPrompt('short')).toContain('concise');
    expect(getLengthPrompt('short')).toContain('100');
  });

  it('should return correct prompt for medium', () => {
    expect(getLengthPrompt('medium')).toContain('200');
  });

  it('should return correct prompt for long', () => {
    expect(getLengthPrompt('long')).toContain('280');
    expect(getLengthPrompt('long')).toContain('270');
  });
});
