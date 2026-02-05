/**
 * Tweet Rewriting and Thread Expansion
 * Features for rewriting existing tweets and expanding them into threads
 */

import { getMoodPrompt, type TweetMood } from './mood';
import { getAudiencePrompt, type AudienceType } from './audience';
import { generateTweet, type TweetGenerationRequest } from './api';
import { truncateTweet } from './settings';

export interface RewriteOptions {
  originalTweet: string;
  newStyle?: 'viral' | 'professional' | 'casual' | 'humorous' | 'controversial';
  newMood?: TweetMood;
  newAudience?: AudienceType;
  shorter?: boolean;
  longer?: boolean;
  moreEngaging?: boolean;
  addCTA?: boolean;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  customInstructions?: string;
}

// Map humorous/controversial styles to appropriate moods for the API
function mapStyleToApi(style: string): { style: 'viral' | 'professional' | 'casual' | 'thread'; mood?: TweetMood } {
  switch (style) {
    case 'humorous':
      return { style: 'casual', mood: 'humorous' };
    case 'controversial':
      return { style: 'viral', mood: 'controversial' };
    default:
      return { style: style as 'viral' | 'professional' | 'casual' | 'thread' };
  }
}

export interface ThreadExpansionOptions {
  singleTweet: string;
  threadLength: 3 | 4 | 5 | 6 | 7;
  threadStyle?: 'story' | 'tutorial' | 'listicle' | 'argument' | 'chronological';
  hookFirstTweet?: boolean;
  conclusionLastTweet?: boolean;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  changes: string[];
}

export interface ThreadResult {
  tweets: string[];
  hook?: string;
  conclusion?: string;
  totalLength: number;
}

/**
 * Rewrite an existing tweet with different parameters
 */
export async function rewriteTweet(options: RewriteOptions): Promise<RewriteResult> {
  const {
    originalTweet,
    newStyle = 'casual',
    newMood,
    newAudience,
    shorter = false,
    longer = false,
    moreEngaging = false,
    addCTA = false,
    includeHashtags = true,
    includeEmojis = true,
    customInstructions,
  } = options;

  const changes: string[] = [];

  // Map style to API-compatible values
  const { style: apiStyle, mood: styleMood } = mapStyleToApi(newStyle);
  const finalMood = newMood || styleMood;

  // Build the rewrite prompt
  let prompt = `Rewrite the following tweet to be ${newStyle}.\n\n`;

  if (finalMood) {
    prompt += `The tone should be ${getMoodPrompt(finalMood)}. `;
    changes.push(`Mood: ${finalMood}`);
  }

  if (newAudience) {
    prompt += `Target audience: ${getAudiencePrompt(newAudience)}. `;
    changes.push(`Audience: ${newAudience}`);
  }

  if (shorter) {
    prompt += 'Make it more concise and to-the-point. ';
    changes.push('Shorter');
  }

  if (longer) {
    prompt += 'Expand on the ideas with more detail. ';
    changes.push('Longer');
  }

  if (moreEngaging) {
    prompt += 'Add more engagement hooks, questions, or thought-provoking elements. ';
    changes.push('More engaging');
  }

  if (addCTA) {
    prompt += 'Include a call-to-action at the end. ';
    changes.push('Added CTA');
  }

  if (customInstructions) {
    prompt += `\nAdditional instructions: ${customInstructions}\n`;
    changes.push('Custom');
  }

  prompt += `
Hashtags: ${includeHashtags ? 'Yes' : 'No'}
Emojis: ${includeEmojis ? 'Yes' : 'No'}

Original tweet: "${originalTweet}"

Output ONLY the rewritten tweet text, nothing else.`;

  const result = await generateTweet({
    topic: prompt,
    style: apiStyle,
    includeHashtags,
    includeEmojis,
    mood: finalMood,
    audience: newAudience,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    original: originalTweet,
    rewritten: truncateTweet(result.tweet, 280),
    changes,
  };
}

/**
 * Rewrite a tweet in multiple styles at once (A/B testing)
 */
export async function abTestRewrite(originalTweet: string, count: number = 3): Promise<RewriteResult[]> {
  const styles: Array<'viral' | 'professional' | 'casual' | 'humorous'> = ['viral', 'professional', 'casual', 'humorous'];
  const selectedStyles = styles.slice(0, count);

  const results = await Promise.all(
    selectedStyles.map(style =>
      rewriteTweet({
        originalTweet,
        newStyle: style,
      })
    )
  );

  return results;
}

/**
 * Expand a single tweet into a full thread
 */
export async function expandToThread(options: ThreadExpansionOptions): Promise<ThreadResult> {
  const {
    singleTweet,
    threadLength,
    threadStyle = 'story',
    hookFirstTweet = true,
    conclusionLastTweet = true,
    includeHashtags = true,
    includeEmojis = true,
  } = options;

  let prompt = `Expand this single tweet into a ${threadLength}-tweet thread in the "${threadStyle}" style.\n\n`;

  const styleInstructions = {
    story: 'Tell a compelling narrative with a clear beginning, middle, and end.',
    tutorial: 'Teach something step-by-step with actionable advice.',
    listicle: 'Present a numbered list with each tweet covering one point.',
    argument: 'Build a persuasive argument with logical progression.',
    chronological: 'Present events in chronological order with clear transitions.',
  };

  prompt += `Style: ${styleInstructions[threadStyle]}\n\n`;
  prompt += `Structure:\n`;
  prompt += `- Tweet 1${hookFirstTweet ? ' (with a strong hook)' : ''}: Introduction/setup\n`;
  prompt += `- Tweets 2-${threadLength - (conclusionLastTweet ? 1 : 0)}: Main content\n`;
  prompt += `- Tweet ${threadLength}${conclusionLastTweet ? ' (with a conclusion/takeaway)' : ''}: Closing\n\n`;

  prompt += `Format requirements:\n`;
  prompt += `- Each tweet must be under 280 characters\n`;
  prompt += `- Number each tweet like "1/", "2/", etc.\n`;
  prompt += `- Ensure smooth transitions between tweets\n`;
  prompt += `${includeHashtags ? '- Add relevant hashtags in the final tweet\n' : ''}`;
  prompt += `${includeEmojis ? '- Use appropriate emojis throughout\n' : ''}`;

  prompt += `\nOriginal tweet: "${singleTweet}"\n\n`;
  prompt += `Output each tweet on a separate line, numbered like "1/ [tweet text]"`;

  const response = await generateTweet({
    topic: prompt,
    style: 'thread',
    includeHashtags,
    includeEmojis,
  });

  if (response.error) {
    throw new Error(response.error);
  }

  // Parse the thread result
  const tweets = parseThreadResponse(response.tweet, threadLength);

  let totalLength = 0;
  for (const tweet of tweets) {
    totalLength += tweet.length;
  }

  return {
    tweets,
    hook: hookFirstTweet ? tweets[0] : undefined,
    conclusion: conclusionLastTweet ? tweets[tweets.length - 1] : undefined,
    totalLength,
  };
}

/**
 * Parse thread response from AI
 */
function parseThreadResponse(response: string, expectedLength: number): string[] {
  const tweets: string[] = [];

  // Try to parse numbered format (1/, 2/, etc.)
  const numberedMatches = response.match(/\d+\/\s*(.*?)(?=\n\d+\/|\n\n*$|$)/gs);
  if (numberedMatches) {
    for (const match of numberedMatches) {
      const tweet = match.replace(/^\d+\/\s*/, '').trim();
      if (tweet) {
        tweets.push(truncateTweet(tweet, 280));
      }
    }
  }

  // If that didn't work, try splitting by --- or newlines
  if (tweets.length === 0) {
    const parts = response.split(/---|\n\n+/);
    for (const part of parts) {
      const tweet = part.trim();
      if (tweet) {
        tweets.push(truncateTweet(tweet, 280));
      }
    }
  }

  // Ensure we have exactly expectedLength tweets
  while (tweets.length < expectedLength) {
    tweets.push('');
  }

  return tweets.slice(0, expectedLength);
}

/**
 * Add a call-to-action to a tweet
 */
export function addCTA(tweet: string, ctaType?: 'reply' | 'rt' | 'follow' | 'link' | 'custom', customCTA?: string): string {
  const ctas: Record<string, string> = {
    reply: '👇 Reply if you agree',
    rt: '🔄 RT if this resonates',
    follow: '✨ Follow for more',
    link: '🔗 Link in bio',
  };

  const cta = customCTA || ctas[ctaType || 'reply'] || '👇 What do you think?';

  const newTweet = `${tweet}\n\n${cta}`;
  return truncateTweet(newTweet, 280);
}

/**
 * Generate engaging CTAs based on tweet content
 */
export function generateCTA(tweet: string): string {
  const lowerTweet = tweet.toLowerCase();

  // Analyze tweet to suggest appropriate CTA
  if (lowerTweet.match(/question|why|how|what|opinion|think/)) {
    return '👇 What\'s your take?';
  }
  if (lowerTweet.match(/tip|advice|learn|how to|guide/)) {
    return '💾 Save this for later';
  }
  if (lowerTweet.match(/mistake|fail|error|wrong/)) {
    return '😅 What\'s your biggest mistake?';
  }
  if (lowerTweet.match(/agreement|true|real|facts/)) {
    return '🔄 RT if you agree';
  }
  if (lowerTweet.match(/story|experience|journey/)) {
    return '👇 Ever been through this?';
  }

  return '✨ Follow for more';
}

/**
 * Auto-generate thread continuation (next tweet in thread)
 */
export async function generateThreadContinuation(previousTweets: string[], options: {
  style?: TweetGenerationRequest['style'];
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}): Promise<string> {
  const context = previousTweets.join('\n\n');

  const prompt = `Write the next tweet in this thread.

Previous tweets:
${context}

Requirements:
- Continue naturally from the last tweet
- Under 280 characters
- ${options.includeHashtags ? 'Include relevant hashtags at the end' : 'No hashtags'}
- ${options.includeEmojis ? 'Use appropriate emojis' : 'No emojis'}
- Maintain the same tone and style

Output ONLY the next tweet text.`;

  const result = await generateTweet({
    topic: prompt,
    style: options.style || 'casual',
    includeHashtags: options.includeHashtags ?? false,
    includeEmojis: options.includeEmojis ?? true,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return truncateTweet(result.tweet, 280);
}
