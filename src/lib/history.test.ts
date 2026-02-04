import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHistory,
  saveToHistory,
  deleteFromHistory,
  toggleFavorite,
  clearHistory,
  type SavedTweet,
} from '../lib/history';

describe('History Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock the window.location.reload
    vi.stubGlobal('location', { reload: vi.fn() });
  });

  it('should return empty array initially', () => {
    expect(getHistory()).toEqual([]);
  });

  it('should save tweet to history', () => {
    const tweet: SavedTweet = {
      id: '1',
      content: 'Test tweet',
      topic: 'Testing',
      style: 'viral',
      timestamp: Date.now(),
      favorite: false,
    };

    saveToHistory(tweet);
    const history = getHistory();

    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(tweet);
  });

  it('should add new tweet at the beginning', () => {
    const tweet1: SavedTweet = {
      id: '1',
      content: 'First tweet',
      topic: 'Test1',
      style: 'viral',
      timestamp: 1000,
      favorite: false,
    };

    const tweet2: SavedTweet = {
      id: '2',
      content: 'Second tweet',
      topic: 'Test2',
      style: 'professional',
      timestamp: 2000,
      favorite: false,
    };

    saveToHistory(tweet1);
    saveToHistory(tweet2);

    const history = getHistory();
    expect(history[0].id).toBe('2'); // Most recent first
    expect(history[1].id).toBe('1');
  });

  it('should delete tweet from history', () => {
    const tweet: SavedTweet = {
      id: '1',
      content: 'Test tweet',
      topic: 'Testing',
      style: 'viral',
      timestamp: Date.now(),
      favorite: false,
    };

    saveToHistory(tweet);
    let history = getHistory();
    expect(history).toHaveLength(1);

    deleteFromHistory('1');
    history = getHistory();
    expect(history).toHaveLength(0);
  });

  it('should toggle favorite status', () => {
    const tweet: SavedTweet = {
      id: '1',
      content: 'Test tweet',
      topic: 'Testing',
      style: 'viral',
      timestamp: Date.now(),
      favorite: false,
    };

    saveToHistory(tweet);
    let history = getHistory();
    expect(history[0].favorite).toBe(false);

    toggleFavorite('1');
    history = getHistory();
    expect(history[0].favorite).toBe(true);
  });

  it('should clear all history', () => {
    const tweet: SavedTweet = {
      id: '1',
      content: 'Test tweet',
      topic: 'Testing',
      style: 'viral',
      timestamp: Date.now(),
      favorite: false,
    };

    saveToHistory(tweet);
    expect(getHistory()).toHaveLength(1);

    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });
});
