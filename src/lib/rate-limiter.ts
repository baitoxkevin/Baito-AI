/**
 * Rate Limiter for API calls and sensitive operations
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  constructor(private config: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000 // 1 minute
  }) {}

  /**
   * Check if a request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get time until reset in ms
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different operations
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
});

export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 5 * 60 * 1000 // 5 minutes
});

export const searchRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000 // 1 minute
});

// Cleanup expired entries every 5 minutes
setInterval(() => {
  authRateLimiter.clearExpired();
  apiRateLimiter.clearExpired();
  uploadRateLimiter.clearExpired();
  searchRateLimiter.clearExpired();
}, 5 * 60 * 1000);

export default RateLimiter;