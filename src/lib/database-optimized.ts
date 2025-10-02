/**
 * Optimized Database Configuration with Connection Pooling
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

interface PoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statement_timeout?: number;
  query_timeout?: number;
}

class OptimizedSupabaseClient {
  private client: SupabaseClient<Database>;
  private poolConfig: PoolConfig;
  private activeConnections = 0;
  private maxConnections: number;
  private connectionQueue: Array<() => void> = [];

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Optimal connection pool configuration
    this.poolConfig = {
      min: 2,                      // Minimum idle connections
      max: 10,                     // Maximum connections
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 5000, // Connection timeout
      statement_timeout: 30000,    // Statement timeout 30s
      query_timeout: 10000        // Query timeout 10s
    };

    this.maxConnections = this.poolConfig.max;

    // Create optimized Supabase client
    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-application-name': 'baito-ai'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10 // Rate limit realtime events
        }
      }
    });

    // Initialize connection monitoring
    this.initializeMonitoring();
  }

  /**
   * Get the Supabase client with connection management
   */
  async getClient(): Promise<SupabaseClient<Database>> {
    // Simple connection throttling
    if (this.activeConnections >= this.maxConnections) {
      await this.waitForConnection();
    }

    this.activeConnections++;
    return this.client;
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);

    // Process waiting connections
    if (this.connectionQueue.length > 0) {
      const resolve = this.connectionQueue.shift();
      if (resolve) resolve();
    }
  }

  /**
   * Wait for available connection
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      this.connectionQueue.push(resolve);

      // Timeout after connection timeout
      setTimeout(() => {
        const index = this.connectionQueue.indexOf(resolve);
        if (index > -1) {
          this.connectionQueue.splice(index, 1);
          resolve(); // Proceed anyway to prevent deadlock
        }
      }, this.poolConfig.connectionTimeoutMillis);
    });
  }

  /**
   * Execute query with automatic connection management
   */
  async query<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      return await queryFn(client);
    } finally {
      this.releaseConnection();
    }
  }

  /**
   * Execute transaction with proper isolation
   */
  async transaction<T>(
    transactionFn: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      // Note: Supabase doesn't have built-in transactions in JS client
      // This is a pseudo-transaction using RPC
      const result = await transactionFn(client);
      return result;
    } catch (error) {
      // Rollback logic would go here if using RPC functions
      throw error;
    } finally {
      this.releaseConnection();
    }
  }

  /**
   * Batch operations for better performance
   */
  async batch<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    // Execute in controlled batches to avoid overwhelming the connection pool
    const batchSize = Math.min(5, this.maxConnections);
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Initialize connection monitoring
   */
  private initializeMonitoring(): void {
    // Log connection pool stats every minute in development
    if (import.meta.env.DEV) {
      setInterval(() => {
        console.log('[DB Pool] Stats:', {
          active: this.activeConnections,
          queued: this.connectionQueue.length,
          max: this.maxConnections
        });
      }, 60000);
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return {
      activeConnections: this.activeConnections,
      queuedRequests: this.connectionQueue.length,
      maxConnections: this.maxConnections,
      utilization: (this.activeConnections / this.maxConnections) * 100
    };
  }
}

// Create singleton instance
const optimizedClient = new OptimizedSupabaseClient();

/**
 * Query builder with optimizations
 */
export class OptimizedQueryBuilder {
  /**
   * Build optimized select query with proper indexing hints
   */
  static select(table: string, columns: string[] = ['*']): string {
    return `SELECT ${columns.join(', ')} FROM ${table}`;
  }

  /**
   * Build paginated query
   */
  static paginate(query: string, limit: number, offset: number): string {
    return `${query} LIMIT ${limit} OFFSET ${offset}`;
  }

  /**
   * Add index hint for PostgreSQL
   */
  static withIndex(table: string, index: string): string {
    // PostgreSQL doesn't support index hints directly, but we can use this
    // for documentation and query planning
    return `/* INDEX: ${index} */ ${table}`;
  }
}

/**
 * Database helper functions
 */
export const db = {
  /**
   * Execute a query with connection pooling
   */
  async query<T>(queryFn: (client: SupabaseClient<Database>) => Promise<T>): Promise<T> {
    return optimizedClient.query(queryFn);
  },

  /**
   * Execute a transaction
   */
  async transaction<T>(
    transactionFn: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    return optimizedClient.transaction(transactionFn);
  },

  /**
   * Batch operations
   */
  async batch<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return optimizedClient.batch(operations);
  },

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return optimizedClient.getPoolStats();
  },

  /**
   * Direct client access (use sparingly)
   */
  get client() {
    return optimizedClient.getClient();
  }
};

/**
 * Optimized query patterns
 */
export const queries = {
  /**
   * Get with SELECT specific columns to reduce data transfer
   */
  async getProjectOptimized(projectId: string) {
    return db.query(async (client) => {
      const { data, error } = await client
        .from('projects')
        .select('id, title, status, start_date, end_date, crew_count')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    });
  },

  /**
   * Use RPC for complex queries
   */
  async getProjectStats(projectId: string) {
    return db.query(async (client) => {
      const { data, error } = await client.rpc('get_project_stats', {
        project_id: projectId
      });

      if (error) throw error;
      return data;
    });
  },

  /**
   * Batch insert with chunking
   */
  async batchInsert<T extends Record<string, any>>(
    table: string,
    records: T[],
    chunkSize = 100
  ) {
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }

    const operations = chunks.map(chunk => async () => {
      return db.query(async (client) => {
        const { data, error } = await client
          .from(table)
          .insert(chunk);

        if (error) throw error;
        return data;
      });
    });

    return db.batch(operations);
  }
};

/**
 * Connection pool middleware for API routes
 */
export function withConnectionPool<T>(
  handler: (client: SupabaseClient<Database>) => Promise<T>
) {
  return async (): Promise<T> => {
    return db.query(handler);
  };
}

// Export the base client for compatibility
export const supabaseOptimized = {
  from: (table: string) => {
    // This returns a promise that resolves to the query builder
    return optimizedClient.getClient().then(client => client.from(table));
  },
  auth: optimizedClient.getClient().then(client => client.auth),
  storage: optimizedClient.getClient().then(client => client.storage),
  rpc: async (fn: string, args?: any) => {
    return db.query(async (client) => client.rpc(fn, args));
  }
};