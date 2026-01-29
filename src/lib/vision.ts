export interface VisionAnalysisRequest {
  imageBase64: string;
  style: "viral" | "professional" | "casual" | "thread";
  includeHashtags: boolean;
  includeEmojis: boolean;
  customContext?: string;
}

export interface VisionAnalysisResponse {
  description: string;
  tweet: string;
  error?: string;
}

type VisionProvider = "openai" | "gemini";

const VISION_CONFIGS = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    envKey: "VITE_OPENAI_API_KEY",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generate-content",
    envKey: "VITE_GEMINI_API_KEY",
  },
};

// Auto-detect which vision provider is available
function detectVisionProvider(): VisionProvider {
  const providers: VisionProvider[] = ["gemini", "openai"];

  for (const provider of providers) {
    const envKey = VISION_CONFIGS[provider].envKey;
    if (import.meta.env[envKey]) {
      return provider;
    }
  }

  return "gemini"; // Default to Gemini (has free tier)
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

  if (!apiKey) {
    return {
      description: "",
      tweet: "",
      error: `No vision API key found. Please add one of these to your .env file:

- VITE_GEMINI_API_KEY (Recommended - Free tier available)
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
- Create a ${style} tweet that relates to the image content
- Under 280 characters for the tweet
- ${includeHashtags ? "Include relevant hashtags" : "No hashtags"}
- ${includeEmojis ? "Use appropriate emojis" : "No emojis"}
- Make it ${stylePrompts[style]}

Respond in JSON format:
{
  "description": "brief description of what's in the image",
  "tweet": "the generated tweet"
}`;

  try {
    let response: Response;
    let data: any;

    if (provider === "gemini") {
      // Google Gemini API
      response = await fetch(
        `${config.url}?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
              responseMimeType: "text/plain",
            },
          }),
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
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Gemini returns plain text, extract tweet from it
      // Try to find the tweet (usually after "Tweet:" or similar)
      const tweetMatch = content.match(/(?:Tweet:|generated tweet:|output:)\s*\n([^\n]+)/i);
      if (tweetMatch) {
        return {
          description: content,
          tweet: tweetMatch[1].trim(),
        };
      }

      return {
        description: content.substring(0, 200) + "...",
        tweet: content.trim(),
      };
    } else {
      // OpenAI API (original implementation)
      response = await fetch("https://api.openai.com/v1/chat/completions", {
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

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(content);
        return {
          description: parsed.description || "",
          tweet: parsed.tweet || "",
        };
      } catch {
        // If not JSON, use the content as the tweet
        return {
          description: "Image analyzed successfully",
          tweet: content,
        };
      }
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
  const config = VISION_CONFIGS[provider];

  const providerNames = {
    openai: `OpenAI (${config.model})`,
    gemini: `Google Gemini (free)`,
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
