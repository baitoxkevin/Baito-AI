import { supabase } from './supabase';
import type { Project } from './types';

/**
 * Optimized project fetching with better query performance
 */
export async function fetchProjectsOptimized(): Promise<Project[]> {
  const storedUser = localStorage.getItem('test_user');
  if (!storedUser) {
    throw new Error('User not logged in');
  }

  const userId = JSON.parse(storedUser).user.id;

  // Optimized query with selective fields and pagination
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      start_date,
      end_date,
      event_type,
      working_hours_start,
      working_hours_end,
      crew_count,
      filled_positions,
      venue_address,
      client:clients (
        id,
        full_name
      ),
      color,
      status,
      priority,
      schedule_type,
      recurrence_days,
      recurrence_end_date
    `)
    .eq('user_id', userId)
    .order('start_date', { ascending: true })
    .limit(500); // Limit to prevent memory issues

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data || [];
}

/**
 * Optimized fetch by month with date indexing
 */
export async function fetchProjectsByMonthOptimized(month: number, year?: number): Promise<Project[]> {
  const storedUser = localStorage.getItem('test_user');
  if (!storedUser) {
    throw new Error('User not logged in');
  }

  const userId = JSON.parse(storedUser).user.id;
  
  // Calculate year if not provided
  const targetYear = year ?? new Date().getFullYear();
  
  // Create date range for the month
  const startDate = new Date(targetYear, month, 1);
  const endDate = new Date(targetYear, month + 1, 0, 23, 59, 59);
  
  // Format dates for Supabase query
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`[Optimized] Fetching projects for ${month}/${targetYear} (${startDateStr} to ${endDateStr})`);

  // Use optimized query with proper date filtering
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      start_date,
      end_date,
      event_type,
      working_hours_start,
      working_hours_end,
      crew_count,
      filled_positions,
      venue_address,
      client:clients (
        id,
        full_name
      ),
      color,
      status,
      priority,
      schedule_type,
      recurrence_days,
      recurrence_end_date
    `)
    .eq('user_id', userId)
    .or(`and(start_date.lte.${endDateStr},or(end_date.gte.${startDateStr},end_date.is.null))`)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[Optimized] Error fetching projects by month:', error);
    throw error;
  }

  // Filter for projects that actually fall within the month
  const filteredData = (data || []).filter(project => {
    const projectStart = new Date(project.start_date);
    const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
    
    // Check if project overlaps with the month
    return (
      (projectStart <= endDate && projectEnd >= startDate) ||
      (projectStart >= startDate && projectStart <= endDate) ||
      (projectEnd >= startDate && projectEnd <= endDate)
    );
  });

  console.log(`[Optimized] Found ${filteredData.length} projects for month ${month}/${targetYear}`);
  return filteredData;
}

/**
 * Batch delete multiple projects efficiently
 */
export async function deleteMultipleProjectsOptimized(
  projectIds: string[], 
  userId: string
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  if (projectIds.length === 0) {
    return { success, failed };
  }

  try {
    // Batch delete in a single query
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .in('id', projectIds)
      .select('id');

    if (error) {
      console.error('[Optimized] Batch delete error:', error);
      // If batch fails, try individual deletes
      for (const id of projectIds) {
        try {
          const { error: singleError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

          if (singleError) {
            failed.push(id);
          } else {
            success.push(id);
          }
        } catch {
          failed.push(id);
        }
      }
    } else {
      // All successful
      success.push(...(data?.map(d => d.id) || projectIds));
    }
  } catch (error) {
    console.error('[Optimized] Delete operation error:', error);
    failed.push(...projectIds);
  }

  return { success, failed };
}