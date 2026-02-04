import { useState, useCallback, useRef } from "react";
import { generateTweetStream, type TweetGenerationRequest } from "./api";

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
    console.log("[useStreamingGeneration] Starting streaming with topic:", request.topic);
    setIsStreaming(true);
    setStreamedContent("");
    setError("");

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      let accumulatedContent = "";
      let chunkCount = 0;

      // Use real streaming API
      for await (const chunk of generateTweetStream(request)) {
        chunkCount++;
        accumulatedContent += chunk;
        setStreamedContent(accumulatedContent);
        onChunk?.(accumulatedContent);
      }

      console.log(`[useStreamingGeneration] Completed with ${chunkCount} chunks, total length: ${accumulatedContent.length}`);

      // Streaming completed
      setStreamedContent(accumulatedContent);
      if (!accumulatedContent) {
        console.error("[useStreamingGeneration] No content received!");
      }
      onComplete?.(accumulatedContent);
    } catch (err) {
      console.error("[useStreamingGeneration] Error:", err);
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled the request
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate tweet";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      console.log("[useStreamingGeneration] Finally block, setting isStreaming to false");
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
