/**
 * Optimized Projects Service with Caching
 * This replaces the standard projects.ts with cached version
 */

import { supabase } from './supabase';
import { cacheManager, cacheInvalidator } from './cache-manager';
import type { Project, User, Client } from './types';
import { getUser } from './auth';

// Event colors configuration
const eventColors = {
  'nestle': '#FCA5A5',
  'ribena': '#DDD6FE',
  'mytown': '#FDA4AF',
  'warrior': '#93C5FD',
  'diy': '#FEF08A',
  'blackmores': '#E2E8F0',
  'lapasar': '#F9A8D4',
  'spritzer': '#BBF7D0',
  'redoxon': '#FDBA74',
  'double-mint': '#67E8F9',
  'softlan': '#E2E8F0',
  'colgate': '#FED7AA',
  'hsbc': '#FCA5A5',
  'asw': '#93C5FD',
  'lee-frozen': '#E2E8F0',
  'maggle': '#E2E8F0',
  'unifi': '#FEF9C3',
  'brands': '#BBF7D0',
  'oppo': '#93C5FD',
  'chrissy': '#F9A8D4',
  'xiao-mi': '#E2E8F0',
  'mcd': '#DDD6FE',
  'te': '#F472B6',
  'cpoc': '#86EFAC',
  'drora': '#FEF9C3',
  'default': '#CBD5E1',
};

/**
 * Fetch all projects with caching
 * Cache TTL: 5 minutes
 */
export async function fetchProjects(): Promise<Project[]> {
  const cacheKey = 'projects:all';

  try {
    // Try cache first
    return await cacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .is('deleted_at', null)
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching projects:', error);
          throw new Error(error.message);
        }

        // Apply event colors
        const projects = (data || []).map(project => ({
          ...project,
          color: getProjectColor(project)
        }));

        return projects;
      },
      300 // 5 minute cache
    );
  } catch (error) {
    console.error('Error in fetchProjects:', error);
    // On error, try to return cached data even if stale
    const cachedData = await cacheManager.get<Project[]>(cacheKey);
    if (cachedData) {
      console.log('Returning stale cache due to error');
      return cachedData;
    }
    return [];
  }
}

/**
 * Fetch projects with filter optimization
 */
export async function fetchProjectsWithFilter(filter: {
  status?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Project[]> {
  const cacheKey = `projects:filter:${JSON.stringify(filter)}`;

  return await cacheManager.getOrSet(
    cacheKey,
    async () => {
      let query = supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null);

      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.clientId) {
        query = query.eq('client_id', filter.clientId);
      }
      if (filter.startDate) {
        query = query.gte('start_date', filter.startDate);
      }
      if (filter.endDate) {
        query = query.lte('end_date', filter.endDate);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(project => ({
        ...project,
        color: getProjectColor(project)
      }));
    },
    300 // 5 minute cache
  );
}

/**
 * Get project by ID with deep caching
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const cacheKey = `project:${id}`;

  return await cacheManager.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:organizations(id, name, logo_url),
          project_staff(
            id,
            status,
            candidate:candidates(id, full_name, ic_number, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        ...data,
        color: getProjectColor(data)
      };
    },
    600 // 10 minute cache for individual projects
  );
}

/**
 * Get active projects for dashboard
 */
export async function getActiveProjects(): Promise<Project[]> {
  const cacheKey = 'projects:active';

  return await cacheManager.getOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('start_date', { ascending: true })
        .limit(20);

      if (error) throw error;

      return (data || []).map(project => ({
        ...project,
        color: getProjectColor(project)
      }));
    },
    180 // 3 minute cache for active projects (updates more frequently)
  );
}

/**
 * Get project statistics with heavy caching
 */
export async function getProjectStats(projectId: string): Promise<{
  totalStaff: number;
  confirmedStaff: number;
  totalExpenses: number;
  totalPayments: number;
  completionRate: number;
}> {
  const cacheKey = `project:${projectId}:stats`;

  return await cacheManager.getOrSet(
    cacheKey,
    async () => {
      // Parallel fetch all statistics
      const [staffData, expenseData, paymentData] = await Promise.all([
        supabase
          .from('project_staff')
          .select('status')
          .eq('project_id', projectId),

        supabase
          .from('expense_claims')
          .select('amount')
          .eq('project_id', projectId)
          .eq('status', 'approved'),

        supabase
          .from('payments')
          .select('amount')
          .eq('project_id', projectId)
          .eq('status', 'completed')
      ]);

      const totalStaff = staffData.data?.length || 0;
      const confirmedStaff = staffData.data?.filter(s => s.status === 'confirmed').length || 0;
      const totalExpenses = expenseData.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const totalPayments = paymentData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const completionRate = totalStaff > 0 ? (confirmedStaff / totalStaff) * 100 : 0;

      return {
        totalStaff,
        confirmedStaff,
        totalExpenses,
        totalPayments,
        completionRate
      };
    },
    3600 // 1 hour cache for statistics
  );
}

/**
 * Create project with cache invalidation
 */
export async function createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...project,
      color: getProjectColor(project)
    })
    .select()
    .single();

  if (error) throw error;

  // Invalidate related caches
  await cacheManager.invalidate('projects:*');

  return data;
}

/**
 * Update project with cache invalidation
 */
export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Invalidate project-specific and list caches
  await cacheInvalidator.onProjectUpdate(id);

  return data;
}

/**
 * Delete project (soft delete) with cache invalidation
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  // Invalidate all project caches
  await cacheInvalidator.onProjectUpdate(id);
}

/**
 * Batch update projects
 */
export async function batchUpdateProjects(
  updates: Array<{ id: string; data: Partial<Project> }>
): Promise<void> {
  // Execute updates in parallel batches of 5
  const batchSize = 5;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await Promise.all(
      batch.map(({ id, data }) =>
        supabase
          .from('projects')
          .update(data)
          .eq('id', id)
      )
    );
  }

  // Invalidate all project caches
  for (const { id } of updates) {
    await cacheInvalidator.onProjectUpdate(id);
  }
}

/**
 * Get project color based on title or client
 */
function getProjectColor(project: Partial<Project>): string {
  const title = (project.title || '').toLowerCase();

  for (const [key, color] of Object.entries(eventColors)) {
    if (title.includes(key)) {
      return color;
    }
  }

  return project.color || eventColors.default;
}

/**
 * Prefetch and cache projects for better performance
 */
export async function prefetchProjects(): Promise<void> {
  try {
    // Prefetch active projects
    await getActiveProjects();

    // Prefetch all projects
    await fetchProjects();

    console.log('Projects prefetched and cached');
  } catch (error) {
    console.error('Error prefetching projects:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return cacheManager.getStats();
}