interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number;
  initialDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Fetch with exponential backoff retry logic
 * Retries requests that fail with transient errors (429, 5xx, network errors)
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    onRetry,
    signal,
    ...fetchOptions
  } = options;
  const normalizedSignal = signal ?? undefined;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (normalizedSignal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    try {
      const response = await fetch(url, { ...fetchOptions, signal: normalizedSignal });

      // Don't retry on client errors (except 429 Too Many Requests)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // For 429 or 5xx errors, prepare for retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

      // If this is the last attempt, return the response anyway
      if (attempt === maxRetries) {
        return response;
      }

      // Extract retry delay from Retry-After header if present (for 429)
      let retryDelay = initialDelay * Math.pow(2, attempt); // Exponential backoff
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterSeconds)) {
          retryDelay = retryAfterSeconds * 1000;
        }
      }

      onRetry?.(attempt + 1, lastError);
      await sleep(retryDelay, normalizedSignal);

    } catch (error) {
      // Network errors or other exceptions
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, throw
      if (attempt === maxRetries) {
        throw lastError;
      }

      const retryDelay = initialDelay * Math.pow(2, attempt);
      onRetry?.(attempt + 1, lastError);
      await sleep(retryDelay, normalizedSignal);
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
