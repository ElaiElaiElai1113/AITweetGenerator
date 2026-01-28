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

/**
 * Analyze an image and generate a tweet using OpenAI's vision capabilities
 * Requires VITE_OPENAI_API_KEY to be set
 */
export async function analyzeImageAndGenerateTweet(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return {
      description: "",
      tweet: "",
      error: `OpenAI API key required for vision features. Please add VITE_OPENAI_API_KEY to your .env file.

Get a free key: https://platform.openai.com/api-keys`,
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        error: error.error?.message || "Failed to analyze image",
      };
    }

    const data = await response.json();
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
  } catch (error) {
    return {
      description: "",
      tweet: "",
      error:
        error instanceof Error
          ? error.message
          : "Failed to analyze image. Please try again.",
    };
  }
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
