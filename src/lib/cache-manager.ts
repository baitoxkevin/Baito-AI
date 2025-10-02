/**
 * Cache Manager for Baito-AI
 * Implements Redis caching with fallback to in-memory cache
 */

// Redis client types (optional - only used in Node.js environments)
type RedisClientType = any;

interface CacheConfig {
  ttl: {
    user: number;
    project: number;
    staff: number;
    analytics: number;
    reports: number;
    static: number;
  };
  keys: {
    user: (id: string) => string;
    userProjects: (userId: string) => string;
    project: (id: string) => string;
    projectStaff: (projectId: string) => string;
    projectStats: (projectId: string) => string;
    staffAvailability: (date: string) => string;
    analytics: (type: string, period: string) => string;
    apiRateLimit: (userId: string) => string;
  };
}

export const cacheConfig: CacheConfig = {
  ttl: {
    user: 900,           // 15 minutes
    project: 300,        // 5 minutes
    staff: 600,          // 10 minutes
    analytics: 3600,     // 1 hour
    reports: 7200,       // 2 hours
    static: 86400        // 24 hours
  },

  keys: {
    user: (id) => `user:${id}`,
    userProjects: (userId) => `user:${userId}:projects`,
    project: (id) => `project:${id}`,
    projectStaff: (projectId) => `project:${projectId}:staff`,
    projectStats: (projectId) => `project:${projectId}:stats`,
    staffAvailability: (date) => `staff:available:${date}`,
    analytics: (type, period) => `analytics:${type}:${period}`,
    apiRateLimit: (userId) => `ratelimit:${userId}`
  }
};

/**
 * In-memory cache fallback for development
 */
class InMemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return JSON.stringify(entry.data);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expires = Date.now() + (ttl ? ttl * 1000 : 300000);
    this.cache.set(key, {
      data: JSON.parse(value),
      expires
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expires = Date.now() + ttl * 1000;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Main Cache Manager
 */
export class CacheManager {
  private redis: RedisClientType | null = null;
  private fallbackCache: InMemoryCache;
  private isRedisAvailable = false;
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  constructor(config: CacheConfig = cacheConfig) {
    this.config = config;
    this.fallbackCache = new InMemoryCache();
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    // Skip Redis initialization in browser environment
    if (typeof window !== 'undefined') {
      console.log('[Cache] Browser environment detected, using in-memory cache');
      return;
    }

    try {
      // Only attempt Redis connection in Node.js environment
      const redisUrl = import.meta.env.REDIS_URL || import.meta.env.UPSTASH_REDIS_URL;

      if (!redisUrl) {
        console.log('[Cache] No Redis URL found, using in-memory cache');
        return;
      }

      // Dynamic import to avoid loading in browser
      const { createClient } = await import('redis').catch(() => ({ createClient: null }));

      if (!createClient) {
        console.log('[Cache] Redis client not available, using in-memory cache');
        return;
      }

      this.redis = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 3) {
              console.error('[Cache] Max Redis reconnection attempts reached');
              this.isRedisAvailable = false;
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redis.on('error', (err: any) => {
        console.error('[Cache] Redis error:', err);
        this.isRedisAvailable = false;
        this.stats.errors++;
      });

      this.redis.on('connect', () => {
        console.log('[Cache] Redis connected');
        this.isRedisAvailable = true;
      });

      await this.redis.connect();
    } catch (error) {
      console.error('[Cache] Failed to initialize Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.isRedisAvailable ? this.redis : this.fallbackCache;
      const data = await client!.get(key);

      if (data) {
        this.stats.hits++;
        return JSON.parse(data as string);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const client = this.isRedisAvailable ? this.redis : this.fallbackCache;

      if (this.isRedisAvailable && this.redis) {
        if (ttl) {
          await this.redis.setEx(key, ttl, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
      } else {
        await this.fallbackCache.set(key, serialized, ttl);
      }
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      const client = this.isRedisAvailable ? this.redis : this.fallbackCache;
      await client!.del(key);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Invalidate keys matching pattern
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const client = this.isRedisAvailable ? this.redis : this.fallbackCache;
      const keys = await client!.keys(pattern);

      if (keys.length > 0) {
        for (const key of keys) {
          await this.del(key);
        }
      }
    } catch (error) {
      console.error(`[Cache] Error invalidating pattern ${pattern}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Cache-aside pattern implementation
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Try to get from cache first
    let data = await this.get<T>(key);

    if (data === null) {
      // Cache miss - fetch from source
      data = await factory();

      // Store in cache for next time
      await this.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Write-through cache pattern
   */
  async writeThrough<T>(
    key: string,
    value: T,
    persist: (value: T) => Promise<void>,
    ttl: number
  ): Promise<void> {
    // Write to both cache and persistent storage in parallel
    await Promise.all([
      this.set(key, value, ttl),
      persist(value)
    ]);
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results = await Promise.all(
      keys.map(key => this.get<T>(key))
    );
    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, ttl }) => this.set(key, value, ttl))
    );
  }

  /**
   * Get cache statistics
   */
  getStats(): typeof this.stats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate
    };
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.flushAll();
      }
      this.fallbackCache = new InMemoryCache();
    } catch (error) {
      console.error('[Cache] Error flushing cache:', error);
      this.stats.errors++;
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    this.fallbackCache.destroy();
  }
}

/**
 * Cache invalidation helper
 */
export class CacheInvalidator {
  constructor(private cache: CacheManager) {}

  async onProjectUpdate(projectId: string): Promise<void> {
    await this.cache.invalidate(`project:${projectId}*`);
    await this.cache.invalidate('analytics:*');
  }

  async onStaffUpdate(staffId: string): Promise<void> {
    await this.cache.invalidate(`staff:${staffId}*`);
    await this.cache.invalidate('staff:available:*');
  }

  async onPaymentCreated(projectId: string): Promise<void> {
    await this.cache.invalidate(`project:${projectId}:stats`);
    await this.cache.invalidate('analytics:payment:*');
  }

  async onExpenseUpdate(projectId: string): Promise<void> {
    await this.cache.invalidate(`project:${projectId}:expenses`);
    await this.cache.invalidate('analytics:expense:*');
  }

  async onUserUpdate(userId: string): Promise<void> {
    await this.cache.invalidate(`user:${userId}*`);
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
export const cacheInvalidator = new CacheInvalidator(cacheManager);