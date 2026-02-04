// Supported AI providers
type AIProvider =
  | "groq"
  | "huggingface"
  | "openai"
  | "deepseek"
  | "together"
  | "gemini"
  | "glm";

import type { AdvancedSettings } from "./settings";
import { getTonePrompt, getLengthPrompt, getMaxLength, truncateTweet } from "./settings";
import { fetchWithRetry } from "./fetch";

// Helper function to generate JWT token for Zhipu AI (GLM)
async function generateGLMToken(apiKey: string): Promise<string> {
  const [id, secret] = apiKey.split(".");
  const now = Date.now();
  const header = { alg: "HS256", sign_type: "SIGN" };
  const payload = {
    api_key: id,
    exp: now + 3600000, // 1 hour expiry
    timestamp: now,
  };

  // Simple base64url encoding
  const base64UrlEncode = (obj: unknown) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const data = `${encodedHeader}.${encodedPayload}`;

  // Sign using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${data}.${signatureBase64}`;
}

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
  glm: {
    url: "https://api.z.ai/api/coding/paas/v4/chat/completions",
    model: "GLM-4.7",
    envKey: "VITE_GLM_API_KEY",
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
    "glm",
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

- VITE_GLM_API_KEY (GLM-4.7)
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
    } else if (provider === "glm") {
      const token = await generateGLMToken(apiKey);
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Use custom temperature if provided, otherwise default
    const temperature = advancedSettings?.temperature ?? 0.7;

    const isGemini = provider === "gemini";
    const response = await fetchWithRetry(
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
        maxRetries: 3,
        initialDelay: 1000,
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

    // Truncate to max character limit based on length setting
    const maxLength = advancedSettings ? getMaxLength(advancedSettings.length) : 280;
    const truncatedTweet = truncateTweet(tweet.trim(), maxLength);

    return { tweet: truncatedTweet };
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

- VITE_GLM_API_KEY (GLM-4.7)
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

    const response = await fetchWithRetry(
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
        maxRetries: 3,
        initialDelay: 1000,
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

    // Get max length for truncation
    const maxLength = request.advancedSettings ? getMaxLength(request.advancedSettings.length) : 280;

    // Parse the response to extract individual tweets
    const tweets = content
      .split("---")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .map((t: string) => truncateTweet(t, maxLength)) // Truncate each tweet
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

// Generate tweet with real streaming (SSE) support
export async function* generateTweetStream(
  request: TweetGenerationRequest
): AsyncGenerator<string, void, unknown> {
  const provider = detectProvider();
  const config = API_CONFIGS[provider];

  // Check for API key
  const envKeys = Object.values(API_CONFIGS).map((c) => c.envKey);
  const hasAnyKey = envKeys.some((key) => import.meta.env[key]);

  if (!hasAnyKey) {
    throw new Error(`No API key found. Please add one of these to your .env file:

- VITE_GLM_API_KEY (GLM-4.7)
- VITE_GROQ_API_KEY (Recommended - Free, unlimited, fast)
- VITE_DEEPSEEK_API_KEY (Free tier available)
- VITE_OPENAI_API_KEY ($5 free credit)
- VITE_TOGETHER_API_KEY ($25 free credit)
- VITE_HUGGINGFACE_API_KEY (30K free requests/month)
- VITE_GEMINI_API_KEY (Google AI Studio)

Get a free Groq key: https://console.groq.com/keys`);
  }

  const { topic, style, includeHashtags, includeEmojis, template, advancedSettings, useTemplate } = request;

  // Build the prompt
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
    } else if (provider === "glm") {
      const token = await generateGLMToken(apiKey);
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Use custom temperature if provided, otherwise default
    const temperature = advancedSettings?.temperature ?? 0.7;

    // Check if provider supports streaming
    const supportsStreaming = ["groq", "openai", "deepseek", "together"].includes(provider);

    if (supportsStreaming) {
      // Use real streaming for supported providers
      const response = await fetchWithRetry(
        config.url,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
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
            stream: true, // Enable streaming
          }),
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error?.message ||
            error.message ||
            `Failed to generate tweet using ${provider}`
        );
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let chunksReceived = 0;

      console.log("[Stream] Starting to read stream...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`[Stream] Complete. Total chunks: ${chunksReceived}`);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              console.log("[Stream] Received [DONE] signal");
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                chunksReceived++;
                console.log(`[Stream] Chunk ${chunksReceived}:`, content.substring(0, 30) + "...");
                yield content;
              }
            } catch (e) {
              console.log("[Stream] Failed to parse line:", data.substring(0, 100));
            }
          }
        }
      }

      if (chunksReceived === 0) {
        console.warn("[Stream] No content chunks received from stream");
      }
    } else {
      // Fallback to non-streaming for providers that don't support it
      console.log("[Stream] Provider doesn't support streaming, using fallback");
      const response = await generateTweet(request);
      if (response.error) {
        throw new Error(response.error);
      }
      // Yield the entire result at once
      console.log("[Stream] Fallback result:", response.tweet.substring(0, 50) + "...");
      yield response.tweet;
    }
  } catch (error) {
    console.error("[Stream] Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate tweet. Please try again.");
  }
}
