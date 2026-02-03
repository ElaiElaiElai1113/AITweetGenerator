// Supported AI providers
type AIProvider =
  | "groq"
  | "huggingface"
  | "openai"
  | "deepseek"
  | "together"
  | "gemini";

import type { AdvancedSettings } from "./settings";
import { getTonePrompt, getLengthPrompt } from "./settings";

const API_CONFIGS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    envKey: "VITE_GROQ_API_KEY",
    useProxy: false,
  },
  huggingface: {
    url: "/api/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions",
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    envKey: "VITE_HUGGINGFACE_API_KEY",
    useProxy: true,
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    envKey: "VITE_OPENAI_API_KEY",
    useProxy: false,
  },
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    envKey: "VITE_DEEPSEEK_API_KEY",
    useProxy: false,
  },
  together: {
    url: "https://api.together.xyz/v1/chat/completions",
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    envKey: "VITE_TOGETHER_API_KEY",
    useProxy: false,
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-2.5-flash",
    envKey: "VITE_GEMINI_API_KEY",
    useProxy: false,
  },
};

export interface TweetGenerationRequest {
  topic: string;
  style: "viral" | "professional" | "casual" | "thread";
  includeHashtags: boolean;
  includeEmojis: boolean;
  template?: string; // Template prompt to use
  advancedSettings?: AdvancedSettings; // Temperature, tone, length
  useTemplate?: boolean; // Whether to use template instead of topic
}

export interface TweetGenerationResponse {
  tweet: string;
  error?: string;
}

export interface BatchTweetResponse {
  tweets: string[];
  error?: string;
}

const stylePrompts = {
  viral: "viral and engaging, optimized for retweets and likes",
  professional:
    "professional and informative, suitable for business networking",
  casual: "casual and friendly, like talking to a friend",
  thread:
    "formatted as a Twitter thread with numbered parts, diving deep into the topic",
};

// Auto-detect which API key is available
function detectProvider(): AIProvider {
  const providers: AIProvider[] = [
    "groq",
    "deepseek",
    "openai",
    "together",
    "gemini",
    "huggingface",
  ];

  for (const provider of providers) {
    const envKey = API_CONFIGS[provider].envKey;
    if (import.meta.env[envKey]) {
      return provider;
    }
  }

  return "groq"; // Default to Groq (free, unlimited)
}

export async function generateTweet(
  request: TweetGenerationRequest,
): Promise<TweetGenerationResponse> {
  const provider = detectProvider();
  const config = API_CONFIGS[provider];

  // Check for API key
  const envKeys = Object.values(API_CONFIGS).map((c) => c.envKey);
  const hasAnyKey = envKeys.some((key) => import.meta.env[key]);

  if (!hasAnyKey) {
    return {
      tweet: "",
      error: `No API key found. Please add one of these to your .env file:

- VITE_GROQ_API_KEY (Recommended - Free, unlimited, fast)
- VITE_DEEPSEEK_API_KEY (Free tier available)
- VITE_OPENAI_API_KEY ($5 free credit)
- VITE_TOGETHER_API_KEY ($25 free credit)
- VITE_HUGGINGFACE_API_KEY (30K free requests/month)
- VITE_GEMINI_API_KEY (Google AI Studio)

Get a free Groq key: https://console.groq.com/keys`,
    };
  }

  const { topic, style, includeHashtags, includeEmojis, template, advancedSettings, useTemplate } = request;

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
  let advancedPrompt = "";
  if (advancedSettings) {
    advancedPrompt = `
Additional requirements:
- ${getTonePrompt(advancedSettings.tone)}
- ${getLengthPrompt(advancedSettings.length)}`;
  }

  const prompt = `${basePrompt}

Requirements:
- Under 280 characters total
- ${includeHashtags ? "Include relevant hashtags at the end" : "No hashtags"}
- ${includeEmojis ? "Use appropriate emojis to make it engaging" : "No emojis"}
- Make it ${stylePrompts[style]}
- For threads: format as numbered tweets (1/, 2/, etc.) with each under 280 characters
${advancedPrompt}

Output ONLY the tweet text, no explanations or extra commentary.`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization based on provider
    const envKey = config.envKey;
    const apiKey = import.meta.env[envKey];

    if (provider === "gemini") {
      headers["x-goog-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Use custom temperature if provided, otherwise default
    const temperature = advancedSettings?.temperature ?? 0.7;

    const isGemini = provider === "gemini";
    const response = await fetch(
      isGemini ? `${config.url}/${config.model}:generateContent` : config.url,
      {
        method: "POST",
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
                    role: "system",
                    content:
                      "You are a viral Twitter content creator who specializes in creating engaging tweets that resonate with audiences.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                temperature,
                max_tokens: 1000,
              },
        ),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        tweet: "",
        error:
          error.error?.message ||
          error.message ||
          `Failed to generate tweet using ${provider}`,
      };
    }

    const data = await response.json();
    const tweet = isGemini
      ? data.candidates?.[0]?.content?.parts?.[0]?.text || ""
      : data.choices?.[0]?.message?.content || "";

    return { tweet: tweet.trim() };
  } catch (error) {
    return {
      tweet: "",
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate tweet. Please try again.",
    };
  }
}

// Helper function to check which provider is being used
export function getCurrentProvider(): string {
  const provider = detectProvider();
  const config = API_CONFIGS[provider];
  return `${provider} (${config.model})`;
}

// Generate multiple tweet variations at once
export async function generateBatchTweets(
  request: TweetGenerationRequest,
  count: number = 3
): Promise<BatchTweetResponse> {
  const provider = detectProvider();
  const config = API_CONFIGS[provider];

  // Check for API key
  const envKeys = Object.values(API_CONFIGS).map((c) => c.envKey);
  const hasAnyKey = envKeys.some((key) => import.meta.env[key]);

  if (!hasAnyKey) {
    return {
      tweets: [],
      error: `No API key found. Please add one of these to your .env file:

- VITE_GROQ_API_KEY (Recommended - Free, unlimited, fast)
- VITE_DEEPSEEK_API_KEY (Free tier available)
- VITE_OPENAI_API_KEY ($5 free credit)
- VITE_TOGETHER_API_KEY ($25 free credit)
- VITE_HUGGINGFACE_API_KEY (30K free requests/month)
- VITE_GEMINI_API_KEY (Google AI Studio)

Get a free Groq key: https://console.groq.com/keys`,
    };
  }

  const { topic, style, includeHashtags, includeEmojis } = request;

  const prompt = `Generate ${count} different ${style} tweets about: "${topic}"

Requirements:
- Each tweet should be unique and varied in approach
- Under 280 characters each
- ${includeHashtags ? "Include relevant hashtags at the end" : "No hashtags"}
- ${includeEmojis ? "Use appropriate emojis to make it engaging" : "No emojis"}
- Make each one ${stylePrompts[style]}
- For threads: format as numbered tweets (1/, 2/, etc.) with each under 280 characters

Output format: Return each tweet on a separate line, separated by "---". No numbering, no explanations.`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const envKey = config.envKey;
    const apiKey = import.meta.env[envKey];
    const isGemini = provider === "gemini";
    if (isGemini) {
      headers["x-goog-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(
      isGemini ? `${config.url}/${config.model}:generateContent` : config.url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(
          isGemini
            ? {
                contents: [
                  {
                    parts: [
                      {
                        text: `You are a viral Twitter content creator who specializes in creating engaging, diverse tweets that resonate with audiences.\n\n${prompt}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.9,
                  maxOutputTokens: 2000,
                },
              }
            : {
                model: config.model,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a viral Twitter content creator who specializes in creating engaging, diverse tweets that resonate with audiences.",
                  },
                  {
                    role: "user",
                    content: prompt,
                  },
                ],
                temperature: 0.9, // Higher temperature for more variety
                max_tokens: 2000,
              },
        ),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        tweets: [],
        error:
          error.error?.message ||
          error.message ||
          `Failed to generate tweets using ${provider}`,
      };
    }

    const data = await response.json();
    const content = isGemini
      ? data.candidates?.[0]?.content?.parts?.[0]?.text || ""
      : data.choices?.[0]?.message?.content || "";

    // Parse the response to extract individual tweets
    const tweets = content
      .split("---")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .slice(0, count); // Ensure we only return the requested count

    return { tweets };
  } catch (error) {
    return {
      tweets: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate tweets. Please try again.",
    };
  }
}
