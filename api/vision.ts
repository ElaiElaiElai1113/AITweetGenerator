import type { NextRequest } from '@vercel/node';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter for Edge Functions
const visionRateLimitMap = new Map<string, number[]>();
const VISION_RATE_LIMIT = {
  limit: 10, // 10 requests (more restrictive for vision)
  window: 60000, // per minute
};

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkVisionRateLimit(clientId: string): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - VISION_RATE_LIMIT.window;

  let timestamps = visionRateLimitMap.get(clientId) || [];
  timestamps = timestamps.filter(t => t > windowStart);

  const allowed = timestamps.length < VISION_RATE_LIMIT.limit;

  if (allowed) {
    timestamps.push(now);
  }

  visionRateLimitMap.set(clientId, timestamps);

  const remaining = Math.max(0, VISION_RATE_LIMIT.limit - timestamps.length);
  const retryAfter = allowed ? undefined : (timestamps[0] + VISION_RATE_LIMIT.window - now);

  return { allowed, remaining, retryAfter };
}

interface VisionAnalysisRequest {
  imageBase64: string;
  style: 'viral' | 'professional' | 'casual' | 'thread';
  includeHashtags: boolean;
  includeEmojis: boolean;
  customContext?: string;
  advancedSettings?: {
    temperature?: number;
    tone?: 'neutral' | 'formal' | 'friendly' | 'witty';
    length?: 'short' | 'medium' | 'long';
  };
}

interface VisionAnalysisResponse {
  description: string;
  tweet: string;
  location?: string;
  error?: string;
}

const VISION_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.5-flash',
    envKey: 'GEMINI_API_KEY',
  },
  glm: {
    url: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    model: 'GLM-4.5V',
    envKey: 'GLM_API_KEY',
  },
};

type VisionProvider = 'openai' | 'gemini' | 'glm';

// Helper function to generate JWT token for Zhipu AI (GLM)
async function generateGLMToken(apiKey: string): Promise<string> {
  const [id, secret] = apiKey.split('.');
  const now = Date.now();
  const header = { alg: 'HS256', sign_type: 'SIGN' };
  const payload = {
    api_key: id,
    exp: now + 3600000,
    timestamp: now,
  };

  const base64UrlEncode = (obj: unknown) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const data = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${data}.${signatureBase64}`;
}

function getMaxLength(length?: 'short' | 'medium' | 'long'): number {
  switch (length) {
    case 'short':
      return 200;
    case 'medium':
      return 250;
    case 'long':
      return 280;
    default:
      return 280;
  }
}

function truncateTweet(tweet: string, maxLength: number): string {
  if (tweet.length <= maxLength) return tweet;
  return tweet.slice(0, maxLength - 3) + '...';
}

function parseVisionJson(text: string): { description: string; tweet: string; location?: string } | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(stripped);
    if (parsed && (parsed.description || parsed.tweet)) {
      return {
        description: parsed.description || '',
        tweet: parsed.tweet || '',
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
      description: descriptionMatch ? descriptionMatch[1] : '',
      tweet: tweetMatch ? tweetMatch[1] : '',
      location: locationMatch ? locationMatch[1] : undefined,
    };
  }

  return null;
}

// Auto-detect which vision provider is available
function detectVisionProvider(): VisionProvider {
  const providers: VisionProvider[] = ['glm', 'gemini', 'openai'];

  for (const provider of providers) {
    const envKey = VISION_CONFIGS[provider].envKey;
    if (process.env[envKey]) {
      return provider;
    }
  }

  return 'glm'; // Default to GLM
}

export async function POST(request: NextRequest) {
  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkVisionRateLimit(clientId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        description: '',
        tweet: '',
        error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.retryAfter || 0) / 1000)} seconds.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': VISION_RATE_LIMIT.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(Date.now() + (rateLimit.retryAfter || 0)).toISOString(),
          'Retry-After': Math.ceil((rateLimit.retryAfter || 0) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body: VisionAnalysisRequest = await request.json();
    const { imageBase64, style, includeHashtags, includeEmojis, customContext, advancedSettings } = body;

    // Validate input
    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      return NextResponse.json(
        { description: '', tweet: '', error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Limit base64 size (approximately 5MB)
    if (imageBase64.length > 5_000_000) {
      return NextResponse.json(
        { description: '', tweet: '', error: 'Image size too large. Maximum 5MB.' },
        { status: 400 }
      );
    }

    const provider = detectVisionProvider();
    const config = VISION_CONFIGS[provider];
    const apiKey = process.env[config.envKey];

    if (!apiKey) {
      return NextResponse.json(
        {
          description: '',
          tweet: '',
          error: 'No vision API configured. Please contact administrator.',
        },
        { status: 500 }
      );
    }

    const maxLength = advancedSettings ? getMaxLength(advancedSettings.length) : 280;

    const stylePrompts = {
      viral: 'viral and engaging, optimized for retweets and likes',
      professional: 'professional and informative, suitable for business networking',
      casual: 'casual and friendly, like talking to a friend',
      thread: 'formatted as a Twitter thread with numbered parts',
    };

    const prompt = customContext
      ? `Context: ${customContext}\n\nAnalyze this image and generate a ${style} tweet based on what you see.`
      : `Analyze this image and generate a ${style} tweet based on what you see.

Requirements:
- Describe what's in the image briefly
- Identify the location if visible (landmarks, scenery, street signs, building names, recognizable features, etc.)
- Create a ${style} tweet that relates to the image content
- Include the detected location naturally in the tweet when possible (e.g., "at [Location]", "visiting [Location]", "[Location] vibes", etc.)
- Under 280 characters for the tweet
- ${includeHashtags ? 'Include relevant hashtags' : 'No hashtags'}
- ${includeEmojis ? 'Use appropriate emojis' : 'No emojis'}
- Make it ${stylePrompts[style]}

Return only JSON matching this schema:
{ "description": string, "tweet": string, "location"?: string }`;

    let response: Response;

    if (provider === 'gemini') {
      // Google Gemini API
      response = await fetch(
        `${config.url}/${config.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: imageBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  tweet: { type: 'string' },
                  location: { type: 'string' },
                },
                required: ['description', 'tweet'],
                propertyOrdering: ['description', 'tweet', 'location'],
              },
            },
          }),
          signal: AbortSignal.timeout(60000), // 60 second timeout for vision
        }
      );
    } else if (provider === 'glm') {
      // GLM Vision API
      const token = await generateGLMToken(apiKey);
      response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(60000),
      });
    } else {
      // OpenAI API
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(60000),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          description: '',
          tweet: '',
          error: error.error?.message || error.message || 'Failed to analyze image',
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    let content = '';

    if (provider === 'gemini') {
      const parts = data.candidates?.[0]?.content?.parts || [];
      content = parts.map((p: { text?: string }) => p.text || '').join('');
    } else if (provider === 'glm') {
      // GLM may return content in different fields
      content = data.choices?.[0]?.message?.content || '';

      // Check for reasoning_content field (GLM-4.5V for vision)
      if (!content && data.choices?.[0]?.message?.reasoning_content) {
        content = data.choices[0].message.reasoning_content;
      }
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    const parsed = parseVisionJson(content);
    if (parsed) {
      return NextResponse.json({
        description: parsed.description,
        tweet: truncateTweet(parsed.tweet, maxLength),
        location: parsed.location,
      });
    }

    // Fallback: use content directly
    return NextResponse.json({
      description: 'Image analyzed successfully',
      tweet: truncateTweet(content.trim(), maxLength),
    });
  } catch (error) {
    console.error('[Vision API] Error:', error);
    return NextResponse.json(
      {
        description: '',
        tweet: '',
        error: error instanceof Error ? error.message : 'Failed to analyze image. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Edge function config
export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};
