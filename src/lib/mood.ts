/**
 * Mood and Sentiment Control
 * Controls the emotional tone and psychological triggers in tweets
 */

export type TweetMood = 'optimistic' | 'controversial' | 'humorous' | 'urgent' | 'nostalgic' | 'motivational' | 'critical' | 'curious';

export interface MoodConfig {
  mood: TweetMood;
  prompt: string;
  emojiSuggestions: string[];
  keywords: string[];
  description: string;
}

export const moodConfigs: Record<TweetMood, MoodConfig> = {
  optimistic: {
    mood: 'optimistic',
    prompt: 'uplifting, hopeful, future-focused, positive outlook, silver lining perspective',
    emojiSuggestions: ['✨', '🌟', '💫', '🚀', '🌈', '😊', '🌅', '💪', '🔮', '✅'],
    keywords: ['excited', 'believe', 'hope', 'amazing', 'incredible', 'brighter', 'future', 'possibility', 'opportunity', 'growth'],
    description: 'Uplifting and hopeful content',
  },
  controversial: {
    mood: 'controversial',
    prompt: 'thought-provoking, debate-starter, challenges conventional wisdom, takes a strong stance, divisive but respectful',
    emojiSuggestions: ['🤔', '⚡', '🔥', '💭', '🎯', '⚠️', '📢', '🗣️', '💪', '🎪'],
    keywords: ['unpopular', 'opinion', 'wrong', 'truth', 'myth', 'lie', 'real', 'actually', 'controversial', 'debate'],
    description: 'Sparks discussion and debate',
  },
  humorous: {
    mood: 'humorous',
    prompt: 'funny, witty, meme-worthy, relatable humor, lighthearted, makes people laugh, comedic timing',
    emojiSuggestions: ['😂', '💀', '🤣', '😭', '🤪', '😜', '🙃', '💀', '😏', '🎭'],
    keywords: ['funny', 'hilarious', 'literally', 'me', 'same', 'cant', 'dead', 'why', 'help', 'struggle'],
    description: 'Funny and entertaining content',
  },
  urgent: {
    mood: 'urgent',
    prompt: 'time-sensitive, FOMO-inducing, act now, limited time, immediate action required, breaking news feel',
    emojiSuggestions: ['🚨', '⏰', '🔴', '📢', '⚡', '🔥', '🚀', '📈', '💥', '⚠️'],
    keywords: ['now', 'today', 'breaking', 'urgent', 'hurry', 'limited', 'ending', 'announcement', 'happening', 'don\'t miss'],
    description: 'Creates urgency and immediate action',
  },
  nostalgic: {
    mood: 'nostalgic',
    prompt: 'reflective, looks back fondly, remembers the good old days, emotional, warm and fuzzy feelings',
    emojiSuggestions: ['💭', '✨', '🌟', '🕰️', '📷', '💫', '🌙', '🎞️', '🎵', '🎮'],
    keywords: ['remember', 'used to', 'back then', 'the days', 'old', 'memories', 'vintage', 'classic', 'throwback', 'when'],
    description: 'Reflective and sentimental content',
  },
  motivational: {
    mood: 'motivational',
    prompt: 'inspiring, empowering, encourages action, focuses on growth and achievement, builds confidence',
    emojiSuggestions: ['💪', '🚀', '🔥', '⚡', '🌟', '🎯', '💫', '🏆', '🌈', '✨'],
    keywords: ['believe', 'achieve', 'success', 'grind', 'hustle', 'goal', 'dream', 'push', 'never', 'possible'],
    description: 'Inspiring and action-oriented',
  },
  critical: {
    mood: 'critical',
    prompt: 'analytical, skeptical, questions assumptions, points out flaws, constructive criticism, calls out nonsense',
    emojiSuggestions: ['🤔', '🧐', '❌', '⚠️', '📉', '🚩', '🔍', '💡', '📊', '🎯'],
    keywords: ['wrong', 'problem', 'issue', 'bad', 'terrible', 'doesn\'t', 'fails', 'broken', 'why', 'how'],
    description: 'Analytical and skeptical content',
  },
  curious: {
    mood: 'curious',
    prompt: 'inquisitive, seeks knowledge, asks questions, invites discussion, explores possibilities, open-ended',
    emojiSuggestions: ['🤔', '❓', '💭', '🔍', '💡', '🌟', '📚', '🧠', '❓', '🔬'],
    keywords: ['why', 'how', 'what', 'wonder', 'curious', 'think', 'question', 'anyone', 'explain', 'someone'],
    description: 'Questions and invites discussion',
  },
};

/**
 * Get mood prompt for tweet generation
 */
export function getMoodPrompt(mood: TweetMood): string {
  return moodConfigs[mood]?.prompt || '';
}

/**
 * Get emoji suggestions for a mood
 */
export function getMoodEmojis(mood: TweetMood): string[] {
  return moodConfigs[mood]?.emojiSuggestions || [];
}

/**
 * Get mood description
 */
export function getMoodDescription(mood: TweetMood): string {
  return moodConfigs[mood]?.description || '';
}

/**
 * Get keywords associated with a mood
 */
export function getMoodKeywords(mood: TweetMood): string[] {
  return moodConfigs[mood]?.keywords || [];
}

/**
 * Enhance prompt with mood context
 */
export function addMoodToPrompt(basePrompt: string, mood: TweetMood): string {
  const moodConfig = moodConfigs[mood];
  if (!moodConfig) return basePrompt;

  return `${basePrompt}

Emotional Tone:
- Make the content ${moodConfig.prompt}
- Use language that evokes ${moodConfig.description.toLowerCase()}
`;
}

/**
 * Detect likely mood from text
 */
export function detectMoodFromText(text: string): TweetMood | null {
  const lowerText = text.toLowerCase();

  // Score each mood based on keyword matches
  const scores: Record<TweetMood, number> = {
    optimistic: 0,
    controversial: 0,
    humorous: 0,
    urgent: 0,
    nostalgic: 0,
    motivational: 0,
    critical: 0,
    curious: 0,
  };

  for (const [mood, config] of Object.entries(moodConfigs)) {
    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword)) {
        scores[mood as TweetMood]++;
      }
    }
  }

  // Find mood with highest score
  let maxScore = 0;
  let detectedMood: TweetMood | null = null;

  for (const [mood, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedMood = mood as TweetMood;
    }
  }

  // Only return if there's at least one keyword match
  return maxScore > 0 ? detectedMood : null;
}

/**
 * Get all available moods with their descriptions
 */
export function getAllMoods(): Array<{ value: TweetMood; label: string; description: string; emojis: string[] }> {
  return Object.entries(moodConfigs).map(([mood, config]) => ({
    value: mood as TweetMood,
    label: mood.charAt(0).toUpperCase() + mood.slice(1),
    description: config.description,
    emojis: config.emojiSuggestions.slice(0, 3),
  }));
}
