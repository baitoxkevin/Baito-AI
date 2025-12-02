/**
 * Optimized Project Service with Caching
 */

import { supabase } from '@/lib/supabase';
import { cacheManager, cacheInvalidator, cacheConfig } from '@/lib/cache-manager';
import type { Database } from '@/lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export interface ProjectStats {
  totalStaff: number;
  confirmedStaff: number;
  avgStaffRating: number;
  totalExpenses: number;
  totalPayments: number;
  completionRate: number;
  attendanceRate: number;
}

export interface ProjectFilters {
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ProjectService {
  /**
   * Get project by ID with caching
   */
  async getById(id: string): Promise<Project | null> {
    const cacheKey = cacheConfig.keys.project(id);

    return cacheManager.getOrSet(
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

        if (error) throw error;
        return data;
      },
      cacheConfig.ttl.project
    );
  }

  /**
   * Get all projects with filters and pagination
   */
  async getAll(filters: ProjectFilters = {}): Promise<{
    data: Project[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      clientId,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20
    } = filters;

    // Build cache key from filters
    const cacheKey = `projects:list:${JSON.stringify(filters)}`;

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:organizations(id, name),
            project_staff(count)
          `, { count: 'exact' });

        // Apply filters
        if (status) query = query.eq('status', status);
        if (clientId) query = query.eq('client_id', clientId);
        if (dateFrom) query = query.gte('start_date', dateFrom);
        if (dateTo) query = query.lte('end_date', dateTo);
        if (search) {
          query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`);
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          data: data || [],
          total: count || 0,
          page,
          limit
        };
      },
      cacheConfig.ttl.project
    );
  }

  /**
   * Get project statistics with heavy caching
   */
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const cacheKey = cacheConfig.keys.projectStats(projectId);

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        // Parallel fetch all required data
        const [staffData, expenseData, paymentData, attendanceData] = await Promise.all([
          // Staff statistics
          supabase
            .from('project_staff')
            .select(`
              status,
              candidate:candidates(rating)
            `)
            .eq('project_id', projectId),

          // Expense statistics
          supabase
            .from('expense_claims')
            .select('amount')
            .eq('project_id', projectId)
            .eq('status', 'approved'),

          // Payment statistics
          supabase
            .from('payments')
            .select('amount')
            .eq('project_id', projectId)
            .eq('status', 'completed'),

          // Attendance statistics
          supabase
            .from('attendance')
            .select('status, project_staff!inner(project_id)')
            .eq('project_staff.project_id', projectId)
        ]);

        // Calculate statistics
        const totalStaff = staffData.data?.length || 0;
        const confirmedStaff = staffData.data?.filter(s => s.status === 'confirmed').length || 0;
        const ratings = staffData.data
          ?.map(s => s.candidate?.rating)
          .filter(r => r != null) as number[] || [];
        const avgStaffRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

        const totalExpenses = expenseData.data?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const totalPayments = paymentData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const totalAttendance = attendanceData.data?.length || 0;
        const presentAttendance = attendanceData.data?.filter(a => a.status === 'present').length || 0;
        const attendanceRate = totalAttendance > 0
          ? (presentAttendance / totalAttendance) * 100
          : 0;

        const completionRate = totalStaff > 0
          ? (confirmedStaff / totalStaff) * 100
          : 0;

        return {
          totalStaff,
          confirmedStaff,
          avgStaffRating,
          totalExpenses,
          totalPayments,
          completionRate,
          attendanceRate
        };
      },
      cacheConfig.ttl.analytics // 1 hour cache for statistics
    );
  }

  /**
   * Create new project
   */
  async create(data: ProjectInsert): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Automatically create default schedule for the project
    try {
      const { error: scheduleError } = await supabase
        .from('project_schedules')
        .insert({
          project_id: project.id,
          start_date: project.start_date || new Date().toISOString(),
          end_date: project.end_date || project.start_date || new Date().toISOString(),
          location: data.venue_address || 'TBD',
          shift_start_time: '09:00', // Default shift start time
          shift_end_time: '17:00',   // Default shift end time
          is_active: true
        });

      if (scheduleError) {
        console.error('Failed to create default schedule:', scheduleError);
        // Don't throw - project creation succeeded, schedule is optional
      }
    } catch (scheduleCreationError) {
      console.error('Error creating default schedule:', scheduleCreationError);
      // Don't throw - project creation succeeded
    }

    // Invalidate list cache
    await cacheManager.invalidate('projects:list:*');

    return project;
  }

  /**
   * Update project
   */
  async update(id: string, data: ProjectUpdate): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate related caches
    await cacheInvalidator.onProjectUpdate(id);

    return project;
  }

  /**
   * Delete project (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;

    // Invalidate caches
    await cacheInvalidator.onProjectUpdate(id);

    return true;
  }

  /**
   * Get project timeline data
   */
  async getProjectTimeline(projectId: string): Promise<any[]> {
    const cacheKey = `project:${projectId}:timeline`;

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('entity_type', 'project')
          .eq('entity_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      },
      cacheConfig.ttl.project
    );
  }

  /**
   * Batch update projects
   */
  async batchUpdate(updates: Array<{ id: string; data: ProjectUpdate }>): Promise<void> {
    // Use transaction for consistency
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('projects')
        .update(data)
        .eq('id', id)
    );

    await Promise.all(promises);

    // Invalidate all project caches
    for (const { id } of updates) {
      await cacheInvalidator.onProjectUpdate(id);
    }
  }

  /**
   * Get active projects for dashboard
   */
  async getActiveProjects(): Promise<Project[]> {
    const cacheKey = 'projects:active';

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:organizations(name),
            _count:project_staff(count)
          `)
          .eq('status', 'active')
          .order('start_date', { ascending: true })
          .limit(10);

        if (error) throw error;
        return data || [];
      },
      cacheConfig.ttl.project
    );
  }

  /**
   * Search projects with full-text search
   */
  async searchProjects(query: string): Promise<Project[]> {
    const cacheKey = `projects:search:${query}`;

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .or(`title.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(20);

        if (error) throw error;
        return data || [];
      },
      300 // 5 minutes cache for search results
    );
  }
}

// Export singleton instance
export const projectService = new ProjectService();