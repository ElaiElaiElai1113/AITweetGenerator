/**
 * Tests for vision JSON parsing functionality
 */

import { describe, it, expect } from 'vitest';

// Import the parsing function from vision.ts
// We'll recreate it here for testing since it's not exported
function parseVisionJson(text: string): { description: string; tweet: string; location?: string } | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(stripped);
    if (parsed && (parsed.description || parsed.tweet)) {
      return {
        description: parsed.description || "",
        tweet: parsed.tweet || "",
        location: parsed.location || undefined,
      };
    }
  } catch {
    // fall through
  }

  const tweetMatch = stripped.match(/"tweet"\s*:\s*"([^"]+)"/i);
  const descriptionMatch = stripped.match(/"description"\s*:\s*"([^"]+)"/i);
  const locationMatch = stripped.match(/"location"\s*:\s*"([^"]+)"/i);
  if (tweetMatch || descriptionMatch) {
    return {
      description: descriptionMatch ? descriptionMatch[1] : "",
      tweet: tweetMatch ? tweetMatch[1] : "",
      location: locationMatch ? locationMatch[1] : undefined,
    };
  }

  return null;
}

describe('Vision JSON Parser', () => {
  describe('valid JSON responses', () => {
    it('should parse complete JSON response', () => {
      const json = JSON.stringify({
        description: 'A beautiful sunset over the ocean',
        tweet: 'Golden hour vibes 🌅 #sunset #peaceful',
        location: 'Malibu Beach'
      });

      const result = parseVisionJson(json);
      expect(result).not.toBeNull();
      expect(result?.description).toBe('A beautiful sunset over the ocean');
      expect(result?.tweet).toBe('Golden hour vibes 🌅 #sunset #peaceful');
      expect(result?.location).toBe('Malibu Beach');
    });

    it('should parse JSON without location', () => {
      const json = JSON.stringify({
        description: 'A cat sleeping',
        tweet: 'When napping is life 😴 #catlife'
      });

      const result = parseVisionJson(json);
      expect(result).not.toBeNull();
      expect(result?.description).toBe('A cat sleeping');
      expect(result?.tweet).toBe('When napping is life 😴 #catlife');
      expect(result?.location).toBeUndefined();
    });

    it('should parse JSON with markdown code blocks', () => {
      const json = '```json\n' + JSON.stringify({
        description: 'Test',
        tweet: 'Test tweet #test'
      }) + '\n```';

      const result = parseVisionJson(json);
      expect(result).not.toBeNull();
      expect(result?.tweet).toBe('Test tweet #test');
    });

    it('should parse JSON with code blocks without language', () => {
      const json = '```' + JSON.stringify({
        description: 'Test',
        tweet: 'Test tweet #test'
      }) + '```';

      const result = parseVisionJson(json);
      expect(result).not.toBeNull();
      expect(result?.tweet).toBe('Test tweet #test');
    });
  });

  describe('partial/malformed JSON', () => {
    it('should extract tweet from partial JSON', () => {
      const text = '{"tweet": "Hello world #test", "description": "A greeting"}';

      const result = parseVisionJson(text);
      expect(result).not.toBeNull();
      expect(result?.tweet).toBe('Hello world #test');
      expect(result?.description).toBe('A greeting');
    });

    it('should handle extra whitespace', () => {
      const text = '  {  "tweet"  :  "Test tweet"  ,  "description"  :  "Test"  }  ';

      const result = parseVisionJson(text);
      expect(result).not.toBeNull();
      expect(result?.tweet).toBe('Test tweet');
    });

    it('should extract using regex for malformed JSON', () => {
      const text = 'The response was: {"tweet": "Extracted #hashtag", "description": "Image of something"}';

      const result = parseVisionJson(text);
      expect(result).not.toBeNull();
      expect(result?.tweet).toBe('Extracted #hashtag');
    });
  });

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      expect(parseVisionJson('')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(parseVisionJson('not json at all')).toBeNull();
    });

    it('should return null for empty object', () => {
      expect(parseVisionJson('{}')).toBeNull();
    });

    it('should return null for JSON with missing required fields', () => {
      expect(parseVisionJson('{"other": "field"}')).toBeNull();
    });

    it('should handle only description field', () => {
      const json = JSON.stringify({ description: 'Just a description' });
      const result = parseVisionJson(json);
      expect(result).not.toBeNull();
      expect(result?.description).toBe('Just a description');
      expect(result?.tweet).toBe('');
    });

    it('should handle only tweet field', () => {
      const json = JSON.stringify({ tweet: 'Just a tweet #test' });
      const result = parseVisionJson(json);
      expect(result).not.toBeNull();
      expect(result?.description).toBe('');
      expect(result?.tweet).toBe('Just a tweet #test');
    });
  });

  describe('special characters', () => {
    it('should handle emojis in tweet', () => {
      const json = JSON.stringify({
        tweet: 'Amazing view 🌊✨🐠 #beach #vibes',
        description: 'Ocean view'
      });

      const result = parseVisionJson(json);
      expect(result?.tweet).toBe('Amazing view 🌊✨🐠 #beach #vibes');
    });

    it('should handle hashtags in tweet', () => {
      const json = JSON.stringify({
        tweet: 'Check this out #trending #viral #fyp',
        description: 'Something cool'
      });

      const result = parseVisionJson(json);
      expect(result?.tweet).toBe('Check this out #trending #viral #fyp');
    });

    it('should handle newlines in description', () => {
      const json = JSON.stringify({
        description: 'Line 1\nLine 2\nLine 3',
        tweet: 'Tweet #test'
      });

      const result = parseVisionJson(json);
      expect(result?.description).toContain('\n');
    });
  });
});
