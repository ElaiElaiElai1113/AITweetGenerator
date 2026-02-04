export interface ScheduledTweet {
  id: string;
  content: string;
  scheduledFor: Date;
  topic: string;
  style: "viral" | "professional" | "casual" | "thread";
  createdAt: number;
  status: "pending" | "posted" | "failed";
  postId?: string;
}

const SCHEDULED_KEY = "tweet_generator_scheduled";

// Get all scheduled tweets
export function getScheduledTweets(): ScheduledTweet[] {
  try {
    const stored = localStorage.getItem(SCHEDULED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((t: ScheduledTweet) => ({
        ...t,
        scheduledFor: new Date(t.scheduledFor),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// Save a scheduled tweet
export function scheduleTweet(tweet: Omit<ScheduledTweet, "id" | "createdAt">): ScheduledTweet {
  const scheduled: ScheduledTweet = {
    ...tweet,
    id: `scheduled-${Date.now()}`,
    createdAt: Date.now(),
  };

  const scheduledTweets = getScheduledTweets();
  localStorage.setItem(
    SCHEDULED_KEY,
    JSON.stringify([...scheduledTweets, scheduled])
  );

  return scheduled;
}

// Update scheduled tweet status
export function updateScheduledTweet(
  id: string,
  updates: Partial<ScheduledTweet>
): ScheduledTweet[] {
  const scheduledTweets = getScheduledTweets();
  const updated = scheduledTweets.map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(updated));
  return updated;
}

// Delete scheduled tweet
export function deleteScheduledTweet(id: string): ScheduledTweet[] {
  const scheduledTweets = getScheduledTweets().filter((t) => t.id !== id);
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(scheduledTweets));
  return scheduledTweets;
}

// Get tweets due to be posted (for polling)
export function getDueTweets(): ScheduledTweet[] {
  const now = Date.now();
  return getScheduledTweets().filter(
    (t) => t.status === "pending" && new Date(t.scheduledFor).getTime() <= now
  );
}

// Check if any tweets are overdue
export function getOverdueTweets(): ScheduledTweet[] {
  const now = Date.now();
  return getScheduledTweets().filter(
    (t) => t.status === "pending" && new Date(t.scheduledFor).getTime() < now
  );
}
