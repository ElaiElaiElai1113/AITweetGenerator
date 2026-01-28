import { useState, useCallback, useRef } from "react";
import { generateTweet, type TweetGenerationRequest } from "./api";

interface UseStreamingGenerationOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (result: string) => void;
  onError?: (error: string) => void;
}

export function useStreamingGeneration({
  onChunk,
  onComplete,
  onError,
}: UseStreamingGenerationOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async (request: TweetGenerationRequest) => {
    setIsStreaming(true);
    setStreamedContent("");
    setError("");

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // For now, we'll use the regular API and simulate streaming
      // In the future, this could use actual SSE from the API
      const response = await generateTweet(request);

      if (response.error) {
        setError(response.error);
        onError?.(response.error);
        return;
      }

      const tweet = response.tweet;

      // Simulate streaming by adding characters one at a time
      const streamSpeed = 20; // ms per character
      let currentText = "";

      for (let i = 0; i < tweet.length; i++) {
        currentText += tweet[i];
        setStreamedContent(currentText);
        onChunk?.(currentText);

        // Small delay for visual effect
        await new Promise((resolve) => setTimeout(resolve, streamSpeed));
      }

      setStreamedContent(tweet);
      onComplete?.(tweet);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate tweet";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsStreaming(false);
    }
  }, [onChunk, onComplete, onError]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setStreamedContent("");
    setError("");
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamedContent,
    error,
    startStreaming,
    stopStreaming,
    reset,
  };
}
