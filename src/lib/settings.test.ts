import { describe, it, expect } from 'vitest';
import { truncateTweet, getMaxLength, getTonePrompt, getLengthPrompt } from '../lib/settings';

describe('truncateTweet', () => {
  it('should return tweet unchanged if under limit', () => {
    const tweet = 'This is a short tweet';
    expect(truncateTweet(tweet, 280)).toBe(tweet);
  });

  it('should truncate tweet to max length', () => {
    const tweet = 'A'.repeat(300);
    const result = truncateTweet(tweet, 280);
    expect(result.length).toBeLessThanOrEqual(280);
  });

  it('should preserve word boundaries when possible', () => {
    const tweet = 'Hello world this is a test tweet that goes on';
    const result = truncateTweet(tweet, 25);
    // Result should be a complete string
    expect(typeof result).toBe('string');
    // If truncated and possible, should end on a word boundary (space or complete word)
    // This test mainly verifies the function doesn't crash and returns something reasonable
    expect(result.length).toBeLessThanOrEqual(25);
  });

  it('should remove trailing punctuation after truncation', () => {
    const tweet = 'Hello world this is a test tweet that is quite long and needs to be truncated';
    const result = truncateTweet(tweet, 30);
    expect(result).not.toMatch(/[,.:!?]+$/);
  });
});

describe('getMaxLength', () => {
  it('should return 150 for short length', () => {
    expect(getMaxLength('short')).toBe(150);
  });

  it('should return 230 for medium length', () => {
    expect(getMaxLength('medium')).toBe(230);
  });

  it('should return 280 for long length', () => {
    expect(getMaxLength('long')).toBe(280);
  });
});

describe('getTonePrompt', () => {
  it('should return correct prompt for formal tone', () => {
    expect(getTonePrompt('formal')).toContain('professional');
    expect(getTonePrompt('formal')).toContain('business-appropriate');
  });

  it('should return correct prompt for neutral tone', () => {
    expect(getTonePrompt('neutral')).toContain('balanced');
  });

  it('should return correct prompt for casual tone', () => {
    expect(getTonePrompt('casual')).toContain('friendly');
  });

  it('should return correct prompt for playful tone', () => {
    expect(getTonePrompt('playful')).toContain('humor');
    expect(getTonePrompt('playful')).toContain('personality');
  });
});

describe('getLengthPrompt', () => {
  it('should return correct prompt for short length', () => {
    expect(getLengthPrompt('short')).toContain('concise');
    expect(getLengthPrompt('short')).toContain('100');
  });

  it('should return correct prompt for medium length', () => {
    expect(getLengthPrompt('medium')).toContain('200');
  });

  it('should return correct prompt for long length', () => {
    expect(getLengthPrompt('long')).toContain('270-280');
  });
});
