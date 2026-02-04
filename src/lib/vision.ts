import { getMaxLength, truncateTweet } from "./settings";
import type { AdvancedSettings } from "./settings";
import { fetchWithRetry } from "./fetch";

export interface VisionAnalysisRequest {
  imageBase64: string;
  style: "viral" | "professional" | "casual" | "thread";
  includeHashtags: boolean;
  includeEmojis: boolean;
  customContext?: string;
  advancedSettings?: AdvancedSettings;
}

export interface VisionAnalysisResponse {
  description: string;
  tweet: string;
  location?: string;
  error?: string;
}

type VisionProvider = "openai" | "gemini" | "glm";

// Helper function to generate JWT token for Zhipu AI (GLM)
async function generateGLMToken(apiKey: string): Promise<string> {
  const [id, secret] = apiKey.split(".");
  const now = Date.now();
  const header = { alg: "HS256", sign_type: "SIGN" };
  const payload = {
    api_key: id,
    exp: now + 3600000,
    timestamp: now,
  };

  const base64UrlEncode = (obj: unknown) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const data = `${encodedHeader}.${encodedPayload}`;

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

const VISION_CONFIGS = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    envKey: "VITE_OPENAI_API_KEY",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-2.5-flash",
    envKey: "VITE_GEMINI_API_KEY",
  },
  glm: {
    url: "https://api.z.ai/api/coding/paas/v4/chat/completions",
    model: "GLM-4.5V",
    envKey: "VITE_GLM_API_KEY",
  },
};

function parseVisionJson(text: string): { description: string; tweet: string; location?: string } | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(stripped);
    if (parsed && (parsed.description || parsed.tweet)) {
      return {
        description: parsed.description || "",
        tweet: parsed.tweet || "",
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
      description: descriptionMatch ? descriptionMatch[1] : "",
      tweet: tweetMatch ? tweetMatch[1] : "",
      location: locationMatch ? locationMatch[1] : undefined,
    };
  }

  return null;
}

// Auto-detect which vision provider is available
function detectVisionProvider(): VisionProvider {
  const providers: VisionProvider[] = ["glm", "gemini", "openai"];

  for (const provider of providers) {
    const envKey = VISION_CONFIGS[provider].envKey;
    if (import.meta.env[envKey]) {
      return provider;
    }
  }

  return "glm"; // Default to GLM
}

/**
 * Analyze an image and generate a tweet using vision capabilities
 * Supports OpenAI GPT-4o or Google Gemini (free)
 */
export async function analyzeImageAndGenerateTweet(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResponse> {
  const provider = detectVisionProvider();
  const config = VISION_CONFIGS[provider];

  // Check for API key
  const envKey = config.envKey;
  const apiKey = import.meta.env[envKey];
  const { advancedSettings } = request;

  // Get max length for truncation (default to 280 if no advanced settings)
  const maxLength = advancedSettings ? getMaxLength(advancedSettings.length) : 280;

  if (!apiKey) {
    return {
      description: "",
      tweet: "",
      error: `No vision API key found. Please add one of these to your .env file:

- VITE_GLM_API_KEY (GLM-4.5V)
- VITE_GEMINI_API_KEY (Free tier available)
- VITE_OPENAI_API_KEY (Paid)

Get a free Gemini key: https://aistudio.google.com/app/apikey`,
    };
  }

  const { imageBase64, style, includeHashtags, includeEmojis, customContext } = request;

  const stylePrompts = {
    viral: "viral and engaging, optimized for retweets and likes",
    professional: "professional and informative, suitable for business networking",
    casual: "casual and friendly, like talking to a friend",
    thread: "formatted as a Twitter thread with numbered parts",
  };

  const prompt = customContext
    ? `Context: ${customContext}

Analyze this image and generate a ${style} tweet based on what you see.`
    : `Analyze this image and generate a ${style} tweet based on what you see.

Requirements:
- Describe what's in the image briefly
- Identify the location if visible (landmarks, scenery, street signs, building names, recognizable features, etc.)
- Create a ${style} tweet that relates to the image content
- Include the detected location naturally in the tweet when possible (e.g., "at [Location]", "visiting [Location]", "[Location] vibes", etc.)
- Under 280 characters for the tweet
- ${includeHashtags ? "Include relevant hashtags" : "No hashtags"}
- ${includeEmojis ? "Use appropriate emojis" : "No emojis"}
- Make it ${stylePrompts[style]}

Return only JSON matching this schema:
{ "description": string, "tweet": string, "location"?: string }`;

  try {
    let response: Response;
    let data: any;

    if (provider === "gemini") {
      // Google Gemini API - use proxy in development to avoid CORS
      const isDev = import.meta.env.DEV;
      const baseUrl = isDev ? "/gemini-api/v1beta/models" : config.url;
      const geminiUrl = `${baseUrl}/${config.model}:generateContent`;

      response = await fetchWithRetry(
        geminiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
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
              maxOutputTokens: 500,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  tweet: { type: "string" },
                  location: { type: "string" },
                },
                required: ["description", "tweet"],
                propertyOrdering: ["description", "tweet", "location"],
              },
            },
          }),
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          description: "",
          tweet: "",
          error: error.error?.message || "Failed to analyze image with Gemini",
        };
      }

      data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const content = parts.map((p: { text?: string }) => p.text || "").join("");

      const parsed = parseVisionJson(content);
      if (parsed) {
        return {
          description: parsed.description,
          tweet: truncateTweet(parsed.tweet, maxLength),
          location: parsed.location,
        };
      }

      // Try to find the tweet (usually after "Tweet:" or similar)
      const tweetMatch = content.match(/(?:Tweet:|generated tweet:|output:)\s*\n([^\n]+)/i);
      if (tweetMatch) {
        return {
          description: content,
          tweet: truncateTweet(tweetMatch[1].trim(), maxLength),
        };
      }

      return {
        description: content.substring(0, 200) + "...",
        tweet: truncateTweet(content.trim(), maxLength),
      };
    } else if (provider === "glm") {
      // GLM Vision API
      const token = await generateGLMToken(apiKey);
      response = await fetchWithRetry(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        maxRetries: 3,
        initialDelay: 1000,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          description: "",
          tweet: "",
          error: error.error?.message || error.message || "Failed to analyze image with GLM",
        };
      }

      data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      const parsed = parseVisionJson(content);
      if (parsed) {
        return {
          description: parsed.description,
          tweet: truncateTweet(parsed.tweet, maxLength),
          location: parsed.location,
        };
      }

      return {
        description: "Image analyzed successfully",
        tweet: truncateTweet(content, maxLength),
      };
    } else {
      // OpenAI API (original implementation)
      response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
        maxRetries: 3,
        initialDelay: 1000,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          description: "",
          tweet: "",
          error: error.error?.message || "Failed to analyze image with OpenAI",
        };
      }

      data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      const parsed = parseVisionJson(content);
      if (parsed) {
        return {
          description: parsed.description,
          tweet: truncateTweet(parsed.tweet, maxLength),
          location: parsed.location,
        };
      }

      // If not JSON, use the content as the tweet
      return {
        description: "Image analyzed successfully",
        tweet: truncateTweet(content, maxLength),
      };
    }
  } catch (error) {
    return {
      description: "",
      tweet: "",
      error:
        error instanceof Error
          ? error.message
          : `Failed to analyze image using ${provider}. Please try again.`,
    };
  }
}

// Helper function to check which vision provider is being used
export function getCurrentVisionProvider(): string {
  const provider = detectVisionProvider();

  const providerNames = {
    openai: `OpenAI (gpt-4o)`,
    gemini: `Google Gemini (free)`,
    glm: `GLM (GLM-4.5V)`,
  };

  return providerNames[provider] || provider;
}

/**
 * Convert a file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract a frame from a video file and convert to base64
 */
export async function extractVideoFrame(file: File, time: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.currentTime = time;
    video.muted = true;

    video.addEventListener("loadeddata", () => {
      video.play();
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        // Remove the data URL prefix
        const base64Data = base64.split(",")[1];
        URL.revokeObjectURL(video.src);
        resolve(base64Data);
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    });

    video.addEventListener("error", () => {
      reject(new Error("Failed to load video"));
    });
  });
}
