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

// Export history as JSON file
export function exportHistory(): void {
  const history = getHistory();
  const dataStr = JSON.stringify(history, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tweet-history-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import history from JSON file
export function importHistory(file: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target?.result as string);
      if (Array.isArray(imported)) {
        const currentHistory = getHistory();
        // Merge without duplicates (by ID)
        const existingIds = new Set(currentHistory.map((t) => t.id));
        const newTweets = imported.filter((t: SavedTweet) => !existingIds.has(t.id));
        const merged = [...imported, ...currentHistory.filter((t) => !imported.some((i: SavedTweet) => i.id === t.id))];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
        // Update favorites
        const favorites = merged.filter((t) => t.favorite);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        alert(`Successfully imported ${newTweets.length} tweets.`);
      }
    } catch {
      alert("Failed to import history. Please check the file format.");
    }
  };
  reader.readAsText(file);
}
