import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateTweet, generateBatchTweets, getCurrentProvider } from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variables
    import.meta.env.VITE_GROQ_API_KEY = 'test-key-groq';
    import.meta.env.VITE_GLM_API_KEY = '';
  });

  describe('generateTweet', () => {
    it('generates tweet successfully with Groq', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test tweet generated #AI #Tech' } }]
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateTweet({
        topic: 'React tips',
        style: 'viral',
        includeHashtags: true,
        includeEmojis: true
      });

      expect(result.tweet).toBe('Test tweet generated #AI #Tech');
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: { message: 'API Error: Rate limit exceeded' } })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateTweet({
        topic: 'React tips',
        style: 'viral',
        includeHashtags: true,
        includeEmojis: true
      });

      expect(result.error).toBeDefined();
      expect(result.tweet).toBe('');
    });

    it('truncates tweets that exceed max length', async () => {
      const longTweet = 'a'.repeat(300);
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: longTweet } }]
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateTweet({
        topic: 'Test',
        style: 'casual',
        includeHashtags: false,
        includeEmojis: false
      });

      // Should be truncated to 280 characters
      expect(result.tweet.length).toBeLessThanOrEqual(280);
    });

    it('returns current provider information', () => {
      const provider = getCurrentProvider();
      expect(provider).toContain('groq');
      expect(typeof provider).toBe('string');
    });
  });

  describe('generateBatchTweets', () => {
    it('generates multiple tweets at once', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Tweet 1 ---\nTweet 2 ---\nTweet 3' } }]
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateBatchTweets({
        topic: 'Productivity tips',
        style: 'professional',
        includeHashtags: true,
        includeEmojis: false
      }, 3);

      expect(result.tweets).toBeDefined();
      expect(result.tweets.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('handles empty responses', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }]
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateBatchTweets({
        topic: 'Test',
        style: 'casual',
        includeHashtags: false,
        includeEmojis: false
      }, 2);

      expect(result.tweets).toEqual([]);
    });

    it('validates batch count limits', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Tweet 1 --- Tweet 2 --- Tweet 3 --- Tweet 4 --- Tweet 5' } }]
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateBatchTweets({
        topic: 'Test',
        style: 'casual',
        includeHashtags: false,
        includeEmojis: false
      }, 5);

      // Should respect requested count
      expect(result.tweets.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Provider Detection', () => {
    it('detects Groq when key is present', () => {
      import.meta.env.VITE_GROQ_API_KEY = 'groq-key';
      import.meta.env.VITE_GLM_API_KEY = '';
      const provider = getCurrentProvider();
      expect(provider).toContain('groq');
    });

    it('detects GLM when Groq is not available', () => {
      import.meta.env.VITE_GROQ_API_KEY = '';
      import.meta.env.VITE_GLM_API_KEY = 'glm-key';
      const provider = getCurrentProvider();
      expect(provider).toContain('glm');
    });

    it('defaults to Groq when no keys are available', () => {
      import.meta.env.VITE_GROQ_API_KEY = '';
      import.meta.env.VITE_GLM_API_KEY = '';
      const provider = getCurrentProvider();
      expect(provider).toContain('groq');
    });
  });

  describe('Error Scenarios', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await generateTweet({
        topic: 'Test',
        style: 'casual',
        includeHashtags: false,
        includeEmojis: false
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to generate tweet');
    });

    it('handles JSON parse errors', async () => {
      const mockResponse = {
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await generateTweet({
        topic: 'Test',
        style: 'casual',
        includeHashtags: false,
        includeEmojis: false
      });

      expect(result.tweet).toBe('');
    });

    it('handles missing API key gracefully', async () => {
      import.meta.env.VITE_GROQ_API_KEY = '';
      import.meta.env.VITE_GLM_API_KEY = '';
      import.meta.env.VITE_DEEPSEEK_API_KEY = '';
      import.meta.env.VITE_OPENAI_API_KEY = '';
      import.meta.env.VITE_TOGETHER_API_KEY = '';
      import.meta.env.VITE_GEMINI_API_KEY = '';
      import.meta.env.VITE_HUGGINGFACE_API_KEY = '';

      const result = await generateTweet({
        topic: 'Test',
        style: 'casual',
        includeHashtags: false,
        includeEmojis: false
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No API key found');
    });
  });
});
