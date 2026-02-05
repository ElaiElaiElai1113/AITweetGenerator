// Vercel Edge Function for tweet generation
// Uses standard Web API types (not Next.js)

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

// Simple in-memory rate limiter for Edge Functions
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = {
  limit: 20,
  window: 60000,
};

function getClientIdentifier(request: Request): string {
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

  return 'groq';
}

const stylePrompts = {
  viral: 'viral and engaging, optimized for retweets and likes',
  professional: 'professional and informative, suitable for business networking',
  casual: 'casual and friendly, like talking to a friend',
  thread: 'formatted as a Twitter thread with numbered parts, diving deep into the topic',
};

export default async function handler(request: Request) {
  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        tweet: '',
        error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.retryAfter || 0) / 1000)} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
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
      return new Response(
        JSON.stringify({ tweet: '', error: 'Topic is required and must be a non-empty string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (topic.length > 500) {
      return new Response(
        JSON.stringify({ tweet: '', error: 'Topic must be under 500 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const provider = detectProvider();
    const config = API_CONFIGS[provider];
    const apiKey = process.env[config.envKey];

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          tweet: '',
          error: 'No API key configured. Please contact administrator.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt based on template or topic
    let basePrompt: string;
    if (useTemplate && template) {
      basePrompt = `Create a tweet following this template: "${template}"

Topic: ${topic}
Style: ${style}`;
    } else {
      basePrompt = `Generate a ${style} tweet about: "${topic}"`;
    }

    // Add advanced settings to prompt
    let advancedPrompt = '';
    if (advancedSettings) {
      const toneMap = {
        neutral: 'Use a balanced, neutral tone.',
        formal: 'Use a professional, business-appropriate tone.',
        friendly: 'Use a friendly, conversational tone.',
        witty: 'Use humor and wit in your response.',
      };
      const lengthMap = {
        short: 'Keep it concise and punchy. Aim for around 100 characters.',
        medium: 'Provide moderate detail. Aim for around 200 characters.',
        long: 'Use the full space available. Aim for 270-280 characters.',
      };
      advancedPrompt = `
Additional requirements:
- ${toneMap[advancedSettings.tone || 'neutral']}
- ${lengthMap[advancedSettings.length || 'medium']}`;
    }

    const prompt = `${basePrompt}

Requirements:
- Under 280 characters total
- ${includeHashtags ? 'Include relevant hashtags at the end' : 'No hashtags'}
- ${includeEmojis ? 'Use appropriate emojis to make it engaging' : 'No emojis'}
- Make it ${stylePrompts[style]}
${advancedPrompt}

Output ONLY the tweet text, no explanations or extra commentary.`;

    // Use custom temperature if provided, otherwise default
    const temperature = advancedSettings?.temperature ?? 0.7;

    let response: Response;
    const isGemini = provider === 'gemini';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const envKey = config.envKey;
    const apiKeyValue = process.env[envKey]!;

    if (isGemini) {
      headers['x-goog-api-key'] = apiKeyValue;
    } else if (provider === 'glm') {
      const token = await generateGLMToken(apiKeyValue);
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${apiKeyValue}`;
    }

    response = await fetch(
      isGemini ? `${config.url}/${config.model}:generateContent` : config.url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(
          isGemini
            ? {
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
              }
            : {
                model: config.model,
                messages: [
                  {
                    role: 'system',
                    content:
                      'You are a viral Twitter content creator who specializes in creating engaging tweets that resonate with audiences.',
                  },
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
                temperature,
                max_tokens: 1000,
              },
        ),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          tweet: '',
          error: error.error?.message || error.message || `Failed to generate tweet using ${provider}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const tweet = isGemini
      ? data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      : data.choices?.[0]?.message?.content || '';

    // Truncate to 280 characters
    const truncatedTweet = tweet.length > 280 ? tweet.slice(0, 277) + '...' : tweet;

    return new Response(
      JSON.stringify({ tweet: truncatedTweet }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        tweet: '',
        error: error instanceof Error ? error.message : 'Failed to generate tweet. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
