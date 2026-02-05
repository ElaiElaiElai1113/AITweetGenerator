import type { NextRequest } from '@vercel/node';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter for Edge Functions
// In production, consider using Vercel KV or Upstash Redis for distributed rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = {
  limit: 20, // 20 requests
  window: 60000, // per minute
};

function getClientIdentifier(request: NextRequest): string {
  // Try to get a unique identifier from the request
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.window;

  let timestamps = rateLimitMap.get(clientId) || [];
  timestamps = timestamps.filter(t => t > windowStart);

  const allowed = timestamps.length < RATE_LIMIT.limit;

  if (allowed) {
    timestamps.push(now);
  }

  rateLimitMap.set(clientId, timestamps);

  const remaining = Math.max(0, RATE_LIMIT.limit - timestamps.length);
  const retryAfter = allowed ? undefined : (timestamps[0] + RATE_LIMIT.window - now);

  return { allowed, remaining, retryAfter };
}

interface GenerateRequest {
  topic: string;
  style: 'viral' | 'professional' | 'casual' | 'thread';
  includeHashtags: boolean;
  includeEmojis: boolean;
  template?: string;
  advancedSettings?: {
    temperature?: number;
    tone?: 'neutral' | 'formal' | 'friendly' | 'witty';
    length?: 'short' | 'medium' | 'long';
  };
  useTemplate?: boolean;
}

// Provider configurations
const API_CONFIGS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
  },
  huggingface: {
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions',
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    envKey: 'HUGGINGFACE_API_KEY',
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  together: {
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    envKey: 'TOGETHER_API_KEY',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.5-flash',
    envKey: 'GEMINI_API_KEY',
  },
  glm: {
    url: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    model: 'GLM-4.7',
    envKey: 'GLM_API_KEY',
  },
};

type Provider = keyof typeof API_CONFIGS;

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

// Auto-detect which API key is available
function detectProvider(): Provider {
  const providers: Provider[] = ['glm', 'groq', 'deepseek', 'openai', 'together', 'gemini', 'huggingface'];

  for (const provider of providers) {
    const envKey = API_CONFIGS[provider].envKey;
    if (process.env[envKey]) {
      return provider;
    }
  }

  return 'groq'; // Default
}

function buildPrompt(request: GenerateRequest): string {
  const { topic, style, includeHashtags, includeEmojis, template, advancedSettings, useTemplate } = request;

  let basePrompt: string;
  if (useTemplate && template) {
    basePrompt = `Create a tweet following this template: "${template}"

Topic: ${topic}
Style: ${style}`;
  } else {
    basePrompt = `Generate a ${style} tweet about: "${topic}"`;
  }

  const stylePrompts = {
    viral: 'viral and engaging, optimized for retweets and likes',
    professional: 'professional and informative, suitable for business networking',
    casual: 'casual and friendly, like talking to a friend',
    thread: 'formatted as a Twitter thread with numbered parts',
  };

  const tonePrompt = advancedSettings?.tone
    ? `Use a ${advancedSettings.tone} tone.`
    : '';

  const lengthPrompt = advancedSettings?.length
    ? `Keep it ${advancedSettings.length} (${advancedSettings.length === 'short' ? 'under 200' : advancedSettings.length === 'medium' ? '200-250' : '250-280'} characters).`
    : '';

  return `${basePrompt}

Requirements:
- ${lengthPrompt || 'Under 280 characters total'}
- ${includeHashtags ? 'Include relevant hashtags at the end' : 'No hashtags'}
- ${includeEmojis ? 'Use appropriate emojis to make it engaging' : 'No emojis'}
- Make it ${stylePrompts[style]}
- ${tonePrompt}
- For threads: format as numbered tweets (1/, 2/, etc.) with each under 280 characters${advancedSettings ? '' : '\n'}${lengthPrompt}

Output ONLY the tweet text, no explanations or extra commentary.`;
}

export async function POST(request: NextRequest) {
  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        tweet: '',
        error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.retryAfter || 0) / 1000)} seconds.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(Date.now() + (rateLimit.retryAfter || 0)).toISOString(),
          'Retry-After': Math.ceil((rateLimit.retryAfter || 0) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body: GenerateRequest = await request.json();
    const { topic, style, includeHashtags, includeEmojis, template, advancedSettings, useTemplate } = body;

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { tweet: '', error: 'Topic is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (topic.length > 500) {
      return NextResponse.json(
        { tweet: '', error: 'Topic must be under 500 characters' },
        { status: 400 }
      );
    }

    const provider = detectProvider();
    const config = API_CONFIGS[provider];
    const apiKey = process.env[config.envKey];

    if (!apiKey) {
      return NextResponse.json(
        {
          tweet: '',
          error: `No API key configured. Please contact administrator.`,
        },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(body);
    const temperature = advancedSettings?.temperature ?? 0.7;

    // Build request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let requestBody: any;

    if (provider === 'gemini') {
      headers['x-goog-api-key'] = apiKey;
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: `You are a viral Twitter content creator who specializes in creating engaging tweets that resonate with audiences.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 1000,
        },
      };
    } else if (provider === 'glm') {
      const token = await generateGLMToken(apiKey);
      headers['Authorization'] = `Bearer ${token}`;
      requestBody = {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a viral Twitter content creator who specializes in creating engaging tweets that resonate with audiences.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 1000,
      };
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      requestBody = {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a viral Twitter content creator who specializes in creating engaging tweets that resonate with audiences.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: 1000,
      };
    }

    // Make API call
    const response = await fetch(
      provider === 'gemini' ? `${config.url}/${config.model}:generateContent` : config.url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[API] Error response:', error);
      return NextResponse.json(
        {
          tweet: '',
          error: error.error?.message || error.message || `Failed to generate tweet using ${provider}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    let tweet = '';

    if (provider === 'gemini') {
      tweet = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      tweet = data.choices?.[0]?.message?.content || '';
    }

    if (!tweet) {
      return NextResponse.json(
        { tweet: '', error: 'Failed to generate tweet - empty response' },
        { status: 500 }
      );
    }

    // Truncate to max length
    const maxLength = advancedSettings
      ? (advancedSettings.length === 'short' ? 200 : advancedSettings.length === 'medium' ? 250 : 280)
      : 280;

    const truncatedTweet = tweet.trim().slice(0, maxLength);

    return NextResponse.json({ tweet: truncatedTweet });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      {
        tweet: '',
        error: error instanceof Error ? error.message : 'Failed to generate tweet. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Edge function config
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // US East
};
