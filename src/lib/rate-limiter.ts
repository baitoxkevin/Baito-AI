/**
 * Client-side Rate Limiter
 * Implements token bucket algorithm for API rate limiting
 * Follows OWASP rate limiting best practices
 */

import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

interface RateLimitStore {
  tokens: number;
  lastRefill: number;
  requestQueue: Array<{
    resolve: (value: boolean) => void;
    timestamp: number;
  }>;
}

class RateLimiter {
  private limits: Map<string, RateLimitStore> = new Map();
  private defaultConfig: RateLimitConfig = {
    maxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_REQUESTS || '100'),
    windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  };

  /**
   * Check if request is allowed under rate limit
   */
  async checkLimit(config?: Partial<RateLimitConfig>): Promise<boolean> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const identifier = finalConfig.identifier || 'global';
    
    // Get or create limit store
    let store = this.limits.get(identifier);
    if (!store) {
      store = {
        tokens: finalConfig.maxRequests,
        lastRefill: Date.now(),
        requestQueue: [],
      };
      this.limits.set(identifier, store);
    }

    // Refill tokens based on time passed
    const now = Date.now();
    const timePassed = now - store.lastRefill;
    const tokensToAdd = Math.floor(timePassed / finalConfig.windowMs * finalConfig.maxRequests);
    
    if (tokensToAdd > 0) {
      store.tokens = Math.min(finalConfig.maxRequests, store.tokens + tokensToAdd);
      store.lastRefill = now;
    }

    // Check if we have tokens available
    if (store.tokens > 0) {
      store.tokens--;
      return true;
    }

    // Log rate limit hit
    logger.warn('Rate limit exceeded', {
      identifier,
      maxRequests: finalConfig.maxRequests,
      windowMs: finalConfig.windowMs,
    });

    // Optional: Queue the request
    if (import.meta.env.VITE_ENABLE_REQUEST_QUEUING === 'true') {
      return this.queueRequest(store, finalConfig);
    }

    return false;
  }

  /**
   * Queue request for later processing
   */
  private queueRequest(store: RateLimitStore, config: RateLimitConfig): Promise<boolean> {
    return new Promise((resolve) => {
      // Add to queue
      store.requestQueue.push({
        resolve,
        timestamp: Date.now(),
      });

      // Process queue when tokens are available
      const checkQueue = setInterval(() => {
        if (store.tokens > 0 && store.requestQueue.length > 0) {
          const request = store.requestQueue.shift();
          if (request) {
            store.tokens--;
            request.resolve(true);
            clearInterval(checkQueue);
          }
        }
        
        // Clean up old requests (timeout after 30 seconds)
        store.requestQueue = store.requestQueue.filter(req => 
          Date.now() - req.timestamp < 30000
        );
        
        if (store.requestQueue.length === 0) {
          clearInterval(checkQueue);
        }
      }, 100);
    });
  }

  /**
   * Get remaining tokens for identifier
   */
  getRemainingTokens(identifier: string = 'global'): number {
    const store = this.limits.get(identifier);
    return store?.tokens || this.defaultConfig.maxRequests;
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string = 'global'): void {
    this.limits.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limited fetch wrapper
 */
export async function rateLimitedFetch(
  url: string, 
  options?: RequestInit,
  rateLimitConfig?: Partial<RateLimitConfig>
): Promise<Response> {
  // Check rate limit
  const allowed = await rateLimiter.checkLimit({
    ...rateLimitConfig,
    identifier: new URL(url).hostname,
  });

  if (!allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Perform the fetch
  return fetch(url, options);
}

/**
 * Decorator for rate limiting class methods
 */
export function rateLimit(config?: Partial<RateLimitConfig>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const identifier = `${target.constructor.name}.${propertyKey}`;
      const allowed = await rateLimiter.checkLimit({
        ...config,
        identifier,
      });

      if (!allowed) {
        throw new Error(`Rate limit exceeded for ${identifier}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(identifier: string, config?: Partial<RateLimitConfig>) {
  const checkLimit = async (): Promise<boolean> => {
    return rateLimiter.checkLimit({
      ...config,
      identifier,
    });
  };

  const getRemainingTokens = (): number => {
    return rateLimiter.getRemainingTokens(identifier);
  };

  const reset = (): void => {
    rateLimiter.reset(identifier);
  };

  return {
    checkLimit,
    getRemainingTokens,
    reset,
  };
}