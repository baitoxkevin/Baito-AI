import { useState, useCallback, useRef } from 'react';

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

/**
 * Hook for implementing retry logic with exponential backoff
 * @param config Retry configuration options
 */
export function useRetry(config: RetryConfig = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
    shouldRetry = () => true,
  } = config;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Execute a function with retry logic
   */
  const executeWithRetry = useCallback(
    async <T,>(
      fn: (signal?: AbortSignal) => Promise<T>,
      customMaxRetries?: number
    ): Promise<T> => {
      const effectiveMaxRetries = customMaxRetries ?? maxRetries;
      let lastError: Error | null = null;

      // Create abort controller for this execution
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
        try {
          // Check if aborted
          if (signal.aborted) {
            throw new Error('Operation cancelled');
          }

          // Update state for retry
          if (attempt > 0) {
            setState({
              isRetrying: true,
              retryCount: attempt,
              lastError,
            });

            onRetry?.(attempt, lastError!);

            // Calculate delay with exponential backoff
            const delay = exponentialBackoff
              ? retryDelay * Math.pow(2, attempt - 1)
              : retryDelay;

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          // Execute the function
          const result = await fn(signal);

          // Success - reset state
          setState({
            isRetrying: false,
            retryCount: 0,
            lastError: null,
          });

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Check if we should retry this error
          if (!shouldRetry(lastError)) {
            setState({
              isRetrying: false,
              retryCount: attempt,
              lastError,
            });
            throw lastError;
          }

          // If this was the last attempt, throw the error
          if (attempt === effectiveMaxRetries) {
            setState({
              isRetrying: false,
              retryCount: attempt,
              lastError,
            });
            throw lastError;
          }

          // Otherwise, continue to next retry
          console.warn(
            `Attempt ${attempt + 1}/${effectiveMaxRetries + 1} failed:`,
            lastError.message
          );
        }
      }

      // Should never reach here, but TypeScript needs this
      throw lastError || new Error('Unknown error');
    },
    [maxRetries, retryDelay, exponentialBackoff, onRetry, shouldRetry]
  );

  /**
   * Cancel any ongoing retry attempts
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  /**
   * Reset retry state
   */
  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  return {
    executeWithRetry,
    cancel,
    reset,
    state,
  };
}

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors are typically retryable
  if (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout')
  ) {
    return true;
  }

  // Check for specific HTTP status codes that are retryable
  if ('status' in error) {
    const status = (error as any).status;
    // Retry on 5xx server errors and 429 too many requests
    return status >= 500 || status === 429;
  }

  // Default to not retrying
  return false;
}
