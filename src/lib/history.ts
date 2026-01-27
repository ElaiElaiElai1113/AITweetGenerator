export interface SavedTweet {
  id: string;
  content: string;
  topic: string;
  style: "viral" | "professional" | "casual" | "thread";
  timestamp: number;
  favorite: boolean;
}

const HISTORY_KEY = "tweet_generator_history";
const FAVORITES_KEY = "tweet_generator_favorites";

// Get all saved tweets from localStorage
export function getHistory(): SavedTweet[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save a tweet to history
export function saveToHistory(tweet: SavedTweet): void {
  const history = getHistory();
  // Remove if already exists (for regenerations)
  const filtered = history.filter((t) => t.id !== tweet.id);
  // Add new tweet at the beginning
  localStorage.setItem(HISTORY_KEY, JSON.stringify([tweet, ...filtered]));
}

// Get favorite tweets
export function getFavorites(): SavedTweet[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Toggle favorite status
export function toggleFavorite(tweetId: string): SavedTweet[] {
  const history = getHistory();
  const updated = history.map((tweet) =>
    tweet.id === tweetId ? { ...tweet, favorite: !tweet.favorite } : tweet
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

  // Update favorites list
  const favorites = updated.filter((t) => t.favorite);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

  return updated;
}

// Delete a tweet from history
export function deleteFromHistory(tweetId: string): SavedTweet[] {
  const history = getHistory();
  const filtered = history.filter((t) => t.id !== tweetId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  return filtered;
}

// Clear all history
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
