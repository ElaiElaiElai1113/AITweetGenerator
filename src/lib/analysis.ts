/**
 * Tweet Analysis
 * Post-generation analysis features including readability, sentiment, and engagement prediction
 */

import { detectMoodFromText } from './mood';
import { suggestAudience } from './audience';

export interface TweetAnalysis {
  characterCount: number;
  readabilityScore: number;
  readabilityLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  sentiment: 'positive' | 'neutral' | 'negative';
  mood?: string;
  suggestedAudience?: string;
  engagementFactors: EngagementFactor[];
  warnings: string[];
  suggestions: string[];
  hashtags: {
    count: number;
    list: string[];
  };
  emojis: {
    count: number;
    list: string[];
  };
  mentions: {
    count: number;
    list: string[];
  };
}

export interface EngagementFactor {
  factor: string;
  score: number; // 0-100
  reason: string;
}

/**
 * Analyze a tweet for various quality metrics
 */
export function analyzeTweet(tweet: string): TweetAnalysis {
  const analysis: TweetAnalysis = {
    characterCount: tweet.length,
    readabilityScore: calculateReadability(tweet),
    readabilityLevel: 'Good',
    sentiment: analyzeSentiment(tweet),
    engagementFactors: [],
    warnings: [],
    suggestions: [],
    hashtags: extractHashtags(tweet),
    emojis: extractEmojis(tweet),
    mentions: extractMentions(tweet),
  };

  // Determine readability level
  if (analysis.readabilityScore >= 80) {
    analysis.readabilityLevel = 'Excellent';
  } else if (analysis.readabilityScore >= 60) {
    analysis.readabilityLevel = 'Good';
  } else if (analysis.readabilityScore >= 40) {
    analysis.readabilityLevel = 'Fair';
  } else {
    analysis.readabilityLevel = 'Poor';
  }

  // Detect mood
  const detectedMood = detectMoodFromText(tweet);
  if (detectedMood) {
    analysis.mood = detectedMood;
  }

  // Suggest audience
  const suggestedAudience = suggestAudience(tweet);
  if (suggestedAudience) {
    analysis.suggestedAudience = suggestedAudience;
  }

  // Analyze engagement factors
  analysis.engagementFactors = calculateEngagementFactors(tweet, analysis);

  // Generate warnings
  analysis.warnings = generateWarnings(tweet, analysis);

  // Generate suggestions
  analysis.suggestions = generateSuggestions(tweet, analysis);

  return analysis;
}

/**
 * Calculate readability score using Flesch-Kincaid-like metric for tweets
 */
function calculateReadability(text: string): number {
  // Simplified readability for short texts
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = countSyllables(text);

  if (words.length === 0) return 0;

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : words.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch Reading Ease
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Normalize to 0-100 for tweets
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in text (approximation)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let count = 0;

  for (const word of words) {
    if (word.length <= 3) {
      count += 1;
      continue;
    }

    const vowels = word.match(/[aeiouy]+/g);
    if (vowels) {
      count += vowels.length;
    }

    // Subtract silent e
    if (word.endsWith('e')) {
      count -= 1;
    }
  }

  return Math.max(1, count);
}

/**
 * Analyze sentiment (basic)
 */
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['amazing', 'great', 'love', 'best', 'awesome', 'incredible', 'happy', 'excited', 'thank', 'beautiful', 'perfect', 'success'];
  const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'awful', 'horrible', 'sad', 'angry', 'disappointed', 'fail', 'wrong', 'problem'];

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveScore++;
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeScore++;
  }

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

/**
 * Calculate engagement factors
 */
function calculateEngagementFactors(tweet: string, analysis: TweetAnalysis): EngagementFactor[] {
  const factors: EngagementFactor[] = [];
  const lowerTweet = tweet.toLowerCase();

  // Question factor
  if (lowerTweet.includes('?')) {
    factors.push({
      factor: 'Question',
      score: 75,
      reason: 'Asks a question which encourages replies',
    });
  }

  // Hook factor
  const hooks = ['unpopular opinion', 'hot take', 'tell me i\'m wrong', 'nobody talks about', 'the secret to', 'stop doing'];
  for (const hook of hooks) {
    if (lowerTweet.includes(hook)) {
      factors.push({
        factor: 'Strong Hook',
        score: 85,
        reason: `Uses "${hook}" hook pattern`,
      });
      break;
    }
  }

  // Emoji factor (optimal is 1-2)
  if (analysis.emojis.count >= 1 && analysis.emojis.count <= 2) {
    factors.push({
      factor: 'Emoji Usage',
      score: 70,
      reason: 'Uses emojis effectively without overdoing it',
    });
  } else if (analysis.emojis.count > 3) {
    factors.push({
      factor: 'Emoji Usage',
      score: 40,
      reason: 'Too many emojis may appear spammy',
    });
  }

  // Hashtag factor (optimal is 1-3)
  if (analysis.hashtags.count >= 1 && analysis.hashtags.count <= 3) {
    factors.push({
      factor: 'Hashtag Usage',
      score: 75,
      reason: 'Good use of relevant hashtags',
    });
  } else if (analysis.hashtags.count > 4) {
    factors.push({
      factor: 'Hashtag Usage',
      score: 45,
      reason: 'Too many hashtags may reduce engagement',
    });
  }

  // Length factor (optimal is 180-240)
  if (analysis.characterCount >= 180 && analysis.characterCount <= 240) {
    factors.push({
      factor: 'Optimal Length',
      score: 80,
      reason: 'In the optimal character range for retweets',
    });
  } else if (analysis.characterCount < 100) {
    factors.push({
      factor: 'Length',
      score: 55,
      reason: 'Might be too short to convey full message',
    });
  }

  // Number factor (lists get more engagement)
  if (/\d+/.test(tweet)) {
    factors.push({
      factor: 'Number/List',
      score: 72,
      reason: 'Numbers/lists tend to get more engagement',
    });
  }

  // CTA factor
  const ctas = ['follow for more', 'rt if', 'reply if', 'link in bio', 'subscribe'];
  for (const cta of ctas) {
    if (lowerTweet.includes(cta)) {
      factors.push({
        factor: 'Call-to-Action',
        score: 78,
        reason: 'Includes a clear call-to-action',
      });
      break;
    }
  }

  return factors;
}

/**
 * Generate warnings for potential issues
 */
function generateWarnings(tweet: string, analysis: TweetAnalysis): string[] {
  const warnings: string[] = [];
  const lowerTweet = tweet.toLowerCase();

  // Too long
  if (analysis.characterCount > 280) {
    warnings.push(`Tweet exceeds 280 characters by ${analysis.characterCount - 280} characters`);
  }

  // Too many hashtags
  if (analysis.hashtags.count > 4) {
    warnings.push('Too many hashtags - consider reducing to 2-3');
  }

  // Too many emojis
  if (analysis.emojis.count > 4) {
    warnings.push('Too many emojis - consider reducing to 1-2');
  }

  // All caps
  if (tweet === tweet.toUpperCase() && tweet.length > 10) {
    warnings.push('Tweet is in all caps which may appear aggressive');
  }

  // Multiple links
  const linkCount = (tweet.match(/https?:\/\//g) || []).length;
  if (linkCount > 1) {
    warnings.push('Multiple links may reduce engagement');
  }

  // Check for potentially sensitive topics
  const sensitiveTopics = ['politics', 'religion', 'controversial'];
  for (const topic of sensitiveTopics) {
    if (lowerTweet.includes(topic)) {
      warnings.push(`Tweet touches on ${topic} which may polarize audience`);
      break;
    }
  }

  return warnings;
}

/**
 * Generate suggestions for improvement
 */
function generateSuggestions(tweet: string, analysis: TweetAnalysis): string[] {
  const suggestions: string[] = [];

  // No hashtags
  if (analysis.hashtags.count === 0) {
    suggestions.push('Consider adding 1-2 relevant hashtags');
  }

  // No emojis
  if (analysis.emojis.count === 0) {
    suggestions.push('Consider adding an emoji to increase visual appeal');
  }

  // No CTA
  const hasCTA = tweet.toLowerCase().match(/follow|rt|reply|link|subscribe|check out/i);
  if (!hasCTA) {
    suggestions.push('Consider adding a call-to-action to boost engagement');
  }

  // No hook
  const hasHook = tweet.toLowerCase().match(/unpopular|hot take|nobody|secret|stop|the best|worst/i);
  if (!hasHook && analysis.characterCount < 150) {
    suggestions.push('Consider starting with a stronger hook to grab attention');
  }

  // Too short
  if (analysis.characterCount < 100) {
    suggestions.push('Tweet is quite short - consider adding more context or detail');
  }

  // No numbers
  if (!/\d+/.test(tweet)) {
    suggestions.push('Consider including a number (e.g., "5 tips") to increase engagement');
  }

  return suggestions;
}

/**
 * Extract hashtags from tweet
 */
function extractHashtags(tweet: string): { count: number; list: string[] } {
  const matches = tweet.match(/#\w+/g) || [];
  return {
    count: matches.length,
    list: matches,
  };
}

/**
 * Extract emojis from tweet
 */
function extractEmojis(tweet: string): { count: number; list: string[] } {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const matches = tweet.match(emojiRegex) || [];
  return {
    count: matches.length,
    list: matches,
  };
}

/**
 * Extract mentions from tweet
 */
function extractMentions(tweet: string): { count: number; list: string[] } {
  const matches = tweet.match(/@\w+/g) || [];
  return {
    count: matches.length,
    list: matches,
  };
}

/**
 * Check if tweet might be controversial
 */
export function isHotTake(tweet: string): boolean {
  const hotTakeIndicators = [
    'unpopular opinion',
    'hot take',
    'controversial',
    'tell me i\'m wrong',
    'nobody talks about',
    'will age poorly',
    'cancelled',
    'fight me',
    'change my mind',
  ];

  const lowerTweet = tweet.toLowerCase();
  return hotTakeIndicators.some(indicator => lowerTweet.includes(indicator));
}

/**
 * Get engagement prediction (0-100)
 */
export function predictEngagement(tweet: string): number {
  const analysis = analyzeTweet(tweet);

  let score = 50; // Base score

  // Add points for positive factors
  for (const factor of analysis.engagementFactors) {
    score += (factor.score - 50) * 0.3;
  }

  // Subtract points for warnings
  score -= analysis.warnings.length * 5;

  // Add points for readability
  score += (analysis.readabilityScore - 50) * 0.2;

  // Add points for optimal length
  if (analysis.characterCount >= 180 && analysis.characterCount <= 240) {
    score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get tweet grade (A-F)
 */
export function getTweetGrade(tweet: string): { grade: string; score: number; feedback: string } {
  const score = predictEngagement(tweet);

  let grade = 'F';
  let feedback = 'Significant improvements needed';

  if (score >= 90) {
    grade = 'A+';
    feedback = 'Excellent! This tweet has high engagement potential.';
  } else if (score >= 80) {
    grade = 'A';
    feedback = 'Great tweet with good engagement potential.';
  } else if (score >= 70) {
    grade = 'B';
    feedback = 'Good tweet, but could use some tweaks.';
  } else if (score >= 60) {
    grade = 'C';
    feedback = 'Average tweet. Consider the suggestions for improvement.';
  } else if (score >= 50) {
    grade = 'D';
    feedback = 'Below average. Multiple improvements recommended.';
  }

  return { grade, score, feedback };
}
