export interface AnalyticsData {
  totalTweetsGenerated: number;
  tweetsByStyle: Record<string, number>;
  tweetsByDay: Record<string, number>;
  favoriteCount: number;
  mostUsedTemplates: string[];
  mostUsedTopics: string[];
  historySize: number;
  lastUpdated: number;
}

const ANALYTICS_KEY = "tweet_generator_analytics";

// Get analytics data
export function getAnalytics(): AnalyticsData {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fall through to default
  }

  return {
    totalTweetsGenerated: 0,
    tweetsByStyle: {},
    tweetsByDay: {},
    favoriteCount: 0,
    mostUsedTemplates: [],
    mostUsedTopics: [],
    historySize: 0,
    lastUpdated: Date.now(),
  };
}

// Update analytics when a tweet is generated
export function trackTweetGeneration(
  style: string,
  template?: string,
  topic?: string
): void {
  const analytics = getAnalytics();

  analytics.totalTweetsGenerated++;
  analytics.tweetsByStyle[style] = (analytics.tweetsByStyle[style] || 0) + 1;

  // Track by day
  const today = new Date().toISOString().split("T")[0];
  analytics.tweetsByDay[today] = (analytics.tweetsByDay[today] || 0) + 1;

  // Track templates
  if (template) {
    if (!analytics.mostUsedTemplates.includes(template)) {
      analytics.mostUsedTemplates.push(template);
    }
  }

  // Track topics
  if (topic) {
    const topicLower = topic.toLowerCase();
    const existingIndex = analytics.mostUsedTopics.findIndex(
      (t) => t.toLowerCase() === topicLower
    );
    if (existingIndex >= 0) {
      // Update count (simplified - just tracking occurrence)
    } else {
      analytics.mostUsedTopics.push(topic);
    }
  }

  analytics.lastUpdated = Date.now();
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
}

// Update analytics when a tweet is favorited
export function trackFavorite(isFavorited: boolean): void {
  const analytics = getAnalytics();
  if (isFavorited) {
    analytics.favoriteCount++;
  } else {
    analytics.favoriteCount = Math.max(0, analytics.favoriteCount - 1);
  }
  analytics.lastUpdated = Date.now();
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
}

// Reset analytics
export function resetAnalytics(): void {
  localStorage.removeItem(ANALYTICS_KEY);
}

// Get daily statistics for the last 7 days
export function getDailyStats(lastDays: number = 7): Array<{ date: string; count: number }> {
  const analytics = getAnalytics();
  const stats: Array<{ date: string; count: number }> = [];

  for (let i = lastDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    stats.push({
      date: dateStr,
      count: analytics.tweetsByDay[dateStr] || 0,
    });
  }

  return stats;
}

// Get usage streak (consecutive days with at least one tweet)
export function getUsageStreak(): number {
  const analytics = getAnalytics();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (analytics.tweetsByDay[dateStr] > 0) {
      streak++;
    } else if (i > 0) {
      // Break streak if there's a gap and we're not checking today (i=0)
      break;
    }
  }

  return streak;
}

// Get most active time of day
export function getMostActiveTime(): string {
  // This would need to be tracked with timestamps
  // For now, return a placeholder
  return "Not tracked";
}
