/**
 * Tests for history management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveToHistory, getHistory, clearHistory, toggleFavorite, deleteFromHistory, type SavedTweet } from '../history';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('History Management', () => {
  const mockTweet: SavedTweet = {
    id: '123',
    content: 'Test tweet content',
    timestamp: Date.now(),
    style: 'viral',
    topic: 'test topic',
    favorite: false,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveToHistory', () => {
    it('should save a tweet to history', () => {
      saveToHistory(mockTweet);
      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockTweet);
    });

    it('should save multiple tweets', () => {
      const tweet2: SavedTweet = { ...mockTweet, id: '456', content: 'Another tweet' };
      saveToHistory(mockTweet);
      saveToHistory(tweet2);

      const history = getHistory();
      expect(history).toHaveLength(2);
    });

    it('should store tweets in reverse chronological order', () => {
      const olderTweet: SavedTweet = { ...mockTweet, id: '1', timestamp: 1000 };
      const newerTweet: SavedTweet = { ...mockTweet, id: '2', timestamp: 2000 };

      saveToHistory(olderTweet);
      saveToHistory(newerTweet);

      const history = getHistory();
      expect(history[0].id).toBe('2');
      expect(history[1].id).toBe('1');
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history', () => {
      const history = getHistory();
      expect(history).toEqual([]);
      expect(history).toHaveLength(0);
    });

    it('should return all saved tweets', () => {
      saveToHistory(mockTweet);
      saveToHistory({ ...mockTweet, id: '456' });

      const history = getHistory();
      expect(history).toHaveLength(2);
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('tweet_generator_history', 'invalid json');
      const history = getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      saveToHistory(mockTweet);
      expect(getHistory()).toHaveLength(1);

      clearHistory();
      expect(getHistory()).toHaveLength(0);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', () => {
      saveToHistory(mockTweet);
      expect(getHistory()[0].favorite).toBe(false);

      toggleFavorite(mockTweet.id);
      expect(getHistory()[0].favorite).toBe(true);

      toggleFavorite(mockTweet.id);
      expect(getHistory()[0].favorite).toBe(false);
    });

    it('should do nothing if tweet not found', () => {
      saveToHistory(mockTweet);
      const historyBefore = getHistory();

      toggleFavorite('non-existent-id');
      expect(getHistory()).toEqual(historyBefore);
    });
  });

  describe('deleteFromHistory', () => {
    it('should delete tweet by id', () => {
      const tweet1: SavedTweet = { ...mockTweet, id: '1' };
      const tweet2: SavedTweet = { ...mockTweet, id: '2' };
      const tweet3: SavedTweet = { ...mockTweet, id: '3' };

      saveToHistory(tweet1);
      saveToHistory(tweet2);
      saveToHistory(tweet3);

      expect(getHistory()).toHaveLength(3);

      deleteFromHistory('2');
      const history = getHistory();
      expect(history).toHaveLength(2);
      expect(history.find(t => t.id === '2')).toBeUndefined();
    });

    it('should do nothing if tweet not found', () => {
      saveToHistory(mockTweet);
      const historyBefore = getHistory();

      deleteFromHistory('non-existent-id');
      expect(getHistory()).toEqual(historyBefore);
    });
  });
});
