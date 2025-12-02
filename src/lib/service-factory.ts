/**
 * Generic Service Factory
 *
 * Creates type-safe CRUD services for Supabase tables.
 * Reduces code duplication across service files.
 *
 * Usage:
 * ```typescript
 * // Define your entity type
 * interface Candidate {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * // Create service
 * const candidateService = createService<Candidate>('candidates');
 *
 * // Use service
 * const candidates = await candidateService.findAll();
 * const candidate = await candidateService.findById('123');
 * await candidateService.create({ name: 'John', email: 'john@example.com' });
 * await candidateService.update('123', { name: 'Jane' });
 * await candidateService.delete('123');
 * ```
 */

import { supabase } from './supabase';
import { logger } from './logger';

// Generic entity with ID
interface Entity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// Query options for findAll
interface QueryOptions<T> {
  select?: string;
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  filters?: Partial<Record<keyof T, unknown>>;
}

// Service result type
interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

interface ServiceListResult<T> {
  data: T[];
  error: Error | null;
  count?: number;
}

// Generic service interface
interface GenericService<T extends Entity> {
  findAll: (options?: QueryOptions<T>) => Promise<ServiceListResult<T>>;
  findById: (id: string) => Promise<ServiceResult<T>>;
  findOne: (filters: Partial<T>) => Promise<ServiceResult<T>>;
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<ServiceResult<T>>;
  createMany: (data: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>) => Promise<ServiceListResult<T>>;
  update: (id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>) => Promise<ServiceResult<T>>;
  delete: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  deleteMany: (ids: string[]) => Promise<{ success: boolean; error: Error | null }>;
  count: (filters?: Partial<T>) => Promise<{ count: number; error: Error | null }>;
  exists: (id: string) => Promise<boolean>;
}

/**
 * Create a type-safe CRUD service for a Supabase table
 */
export function createService<T extends Entity>(tableName: string): GenericService<T> {
  const logContext = `Service:${tableName}`;

  return {
    /**
     * Find all records with optional filtering, ordering, and pagination
     */
    async findAll(options: QueryOptions<T> = {}): Promise<ServiceListResult<T>> {
      try {
        let query = supabase
          .from(tableName)
          .select(options.select || '*', { count: 'exact' });

        // Apply filters
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (options.orderBy) {
          query = query.order(options.orderBy as string, {
            ascending: options.orderDirection !== 'desc',
          });
        }

        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return { data: data || [], error: null, count: count || undefined };
      } catch (error) {
        logger.error(`${logContext}.findAll failed:`, error);
        return { data: [], error: error as Error };
      }
    },

    /**
     * Find a single record by ID
     */
    async findById(id: string): Promise<ServiceResult<T>> {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return { data, error: null };
      } catch (error) {
        logger.error(`${logContext}.findById failed:`, error);
        return { data: null, error: error as Error };
      }
    },

    /**
     * Find a single record by custom filters
     */
    async findOne(filters: Partial<T>): Promise<ServiceResult<T>> {
      try {
        let query = supabase.from(tableName).select('*');

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        const { data, error } = await query.limit(1).single();

        if (error && error.code !== 'PGRST116') throw error;

        return { data, error: null };
      } catch (error) {
        logger.error(`${logContext}.findOne failed:`, error);
        return { data: null, error: error as Error };
      }
    },

    /**
     * Create a new record
     */
    async create(
      data: Omit<T, 'id' | 'created_at' | 'updated_at'>
    ): Promise<ServiceResult<T>> {
      try {
        const { data: result, error } = await supabase
          .from(tableName)
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        logger.info(`${logContext}.create: Created record ${result.id}`);
        return { data: result, error: null };
      } catch (error) {
        logger.error(`${logContext}.create failed:`, error);
        return { data: null, error: error as Error };
      }
    },

    /**
     * Create multiple records
     */
    async createMany(
      data: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<ServiceListResult<T>> {
      try {
        const { data: result, error } = await supabase
          .from(tableName)
          .insert(data)
          .select();

        if (error) throw error;

        logger.info(`${logContext}.createMany: Created ${result?.length || 0} records`);
        return { data: result || [], error: null };
      } catch (error) {
        logger.error(`${logContext}.createMany failed:`, error);
        return { data: [], error: error as Error };
      }
    },

    /**
     * Update an existing record
     */
    async update(
      id: string,
      data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<ServiceResult<T>> {
      try {
        const { data: result, error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        logger.info(`${logContext}.update: Updated record ${id}`);
        return { data: result, error: null };
      } catch (error) {
        logger.error(`${logContext}.update failed:`, error);
        return { data: null, error: error as Error };
      }
    },

    /**
     * Delete a record
     */
    async delete(id: string): Promise<{ success: boolean; error: Error | null }> {
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);

        if (error) throw error;

        logger.info(`${logContext}.delete: Deleted record ${id}`);
        return { success: true, error: null };
      } catch (error) {
        logger.error(`${logContext}.delete failed:`, error);
        return { success: false, error: error as Error };
      }
    },

    /**
     * Delete multiple records
     */
    async deleteMany(ids: string[]): Promise<{ success: boolean; error: Error | null }> {
      try {
        const { error } = await supabase.from(tableName).delete().in('id', ids);

        if (error) throw error;

        logger.info(`${logContext}.deleteMany: Deleted ${ids.length} records`);
        return { success: true, error: null };
      } catch (error) {
        logger.error(`${logContext}.deleteMany failed:`, error);
        return { success: false, error: error as Error };
      }
    },

    /**
     * Count records with optional filters
     */
    async count(filters?: Partial<T>): Promise<{ count: number; error: Error | null }> {
      try {
        let query = supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true });

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        const { count, error } = await query;

        if (error) throw error;

        return { count: count || 0, error: null };
      } catch (error) {
        logger.error(`${logContext}.count failed:`, error);
        return { count: 0, error: error as Error };
      }
    },

    /**
     * Check if a record exists
     */
    async exists(id: string): Promise<boolean> {
      const { data } = await this.findById(id);
      return data !== null;
    },
  };
}

// Pre-built services for common tables
export const projectService = createService<{
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string;
  venue_address?: string;
  color?: string;
  crew_count?: number;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}>('projects');

export const candidateService = createService<{
  id: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  skills?: string[];
  created_at?: string;
  updated_at?: string;
}>('candidates');

export const expenseClaimService = createService<{
  id: string;
  user_id: string;
  project_id?: string;
  amount: number;
  description: string;
  status: string;
  receipt_url?: string;
  created_at?: string;
  updated_at?: string;
}>('expense_claims');

export const paymentService = createService<{
  id: string;
  batch_id?: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
}>('payments');
