import { supabase } from "./supabase";
import { format, parseISO } from "date-fns";

interface CandidateScheduleConflict {
  date: Date;
  projectId: string;
  projectTitle: string;
}

/**
 * Check for scheduling conflicts when assigning a candidate to specific dates
 * 
 * @param candidateId - The ID of the candidate
 * @param workingDates - Array of dates to check
 * @param projectId - Optional: Current project ID (to exclude from conflict check)
 * @returns Object containing conflict information
 */
export async function checkCandidateScheduleConflicts(
  candidateId: string,
  workingDates: Date[] | string[],
  projectId?: string
): Promise<{ hasConflicts: boolean; conflicts: CandidateScheduleConflict[] }> {
  try {
    // Validate inputs
    if (!candidateId || !workingDates || !Array.isArray(workingDates) || workingDates.length === 0) {
      console.warn("Invalid inputs for candidate schedule conflict check", { candidateId, workingDates });
      return { hasConflicts: false, conflicts: [] };
    }

    // Format dates for checking
    const dateStrings = workingDates.map(d => {
      if (typeof d === 'string') {
        return d;
      }
      return format(d, 'yyyy-MM-dd');
    });

    console.log(`Checking conflicts for candidate ${candidateId} on dates:`, dateStrings);

    // First try using the RPC function
    try {
      const { data, error } = await supabase.rpc('check_candidate_schedule_conflicts', {
        p_candidate_id: candidateId,
        p_working_dates: dateStrings,
        p_exclude_project_id: projectId || null
      });

      if (!error && data) {
        console.log("RPC candidate conflict check results:", data);
        
        // Format the conflicts into our return structure
        const conflicts = data.map((conflict: any) => ({
          date: parseISO(conflict.date),
          projectId: conflict.project_id,
          projectTitle: conflict.project_title || 'Unknown Project'
        }));

        return {
          hasConflicts: conflicts.length > 0,
          conflicts
        };
      }

      // If error is not about missing function, log it
      if (error && !error.message.includes('Could not find the function')) {
        console.error('Error checking candidate schedule conflicts via RPC:', error);
      } else {
        console.warn('RPC function not available, falling back to batch check');
      }
    } catch (rpcError) {
      console.warn('RPC call failed, falling back to batch check:', rpcError);
    }

    // Try the batch check function
    try {
      const { data, error } = await supabase.rpc('batch_check_candidate_availability', {
        p_candidate_id: candidateId,
        p_check_dates: dateStrings
      });

      if (!error && data) {
        console.log("Batch candidate availability check results:", data);
        
        // Format the conflicts into our return structure
        const conflicts = data
          .filter((item: any) => !item.is_available)
          .map((conflict: any) => ({
            date: parseISO(conflict.check_date),
            projectId: conflict.conflict_project_id || 'unknown',
            projectTitle: conflict.conflict_project_title || 'Unknown Project'
          }));

        return {
          hasConflicts: conflicts.length > 0,
          conflicts
        };
      }

      if (error) {
        console.error('Error checking candidate availability via batch check:', error);
      }
    } catch (batchError) {
      console.warn('Batch check failed:', batchError);
    }

    // Fallback: Manual conflict check
    // This would require querying the project_staff table and checking for conflicts manually
    // Since we've implemented proper database functions, this fallback should not be necessary
    // but is included for completeness

    console.warn("Falling back to manual candidate conflict check");
    
    // Get all projects this candidate is assigned to
    const { data: candidateProjects, error: candidateError } = await supabase
      .from('project_staff')
      .select(`
        id,
        project_id,
        working_dates,
        projects:project_id (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq('candidate_id', candidateId);

    if (candidateError) {
      console.error('Error fetching candidate projects:', candidateError);
      return { hasConflicts: false, conflicts: [] };
    }

    if (!candidateProjects || candidateProjects.length === 0) {
      console.log(`No existing projects found for candidate ${candidateId}`);
      return { hasConflicts: false, conflicts: [] };
    }

    console.log(`Found ${candidateProjects.length} projects for candidate ${candidateId}`);

    // Check for conflicts by examining each date
    const conflicts: CandidateScheduleConflict[] = [];

    for (const dateStr of dateStrings) {
      const checkDate = typeof dateStr === 'string' 
        ? parseISO(dateStr) 
        : new Date(dateStr);
      
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');

      // Check each project
      for (const candidateProject of candidateProjects) {
        // Skip if this is the current project we're updating
        if (projectId && candidateProject.project_id === projectId) {
          continue;
        }

        // Skip if project data is missing
        if (!candidateProject.projects) {
          continue;
        }

        // Extract project details
        const projectTitle = candidateProject.projects.title || 'Unknown Project';
        
        // Check if the candidate is assigned to this date in this project
        if (candidateProject.working_dates && Array.isArray(candidateProject.working_dates)) {
          const assignedToDate = candidateProject.working_dates.some(existingDate => {
            const existingDateStr = format(new Date(existingDate), 'yyyy-MM-dd');
            return existingDateStr === checkDateStr;
          });

          if (assignedToDate) {
            conflicts.push({
              date: checkDate,
              projectId: candidateProject.project_id,
              projectTitle
            });
          }
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  } catch (error) {
    console.error('Exception checking candidate schedule conflicts:', error);
    return { hasConflicts: false, conflicts: [] };
  }
}

/**
 * Check if a candidate is available on a specific date
 * 
 * @param candidateId - The ID of the candidate
 * @param date - The date to check
 * @returns A boolean indicating if the candidate is available
 */
export async function isCandidateAvailable(
  candidateId: string,
  date: Date | string
): Promise<boolean> {
  try {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    
    // Try the is_candidate_available function
    try {
      const { data, error } = await supabase.rpc('is_candidate_available', {
        p_candidate_id: candidateId,
        p_check_date: dateStr
      });

      if (!error) {
        return !!data;
      }
    } catch (error) {
      console.warn('Error using is_candidate_available function:', error);
    }
    
    // Fallback to batch check
    const { hasConflicts } = await checkCandidateScheduleConflicts(candidateId, [dateStr]);
    return !hasConflicts;
  } catch (error) {
    console.error('Error checking candidate availability:', error);
    return false;
  }
}

/**
 * Get all available candidates on a specific date
 * 
 * @param date - The date to check
 * @returns Array of available candidate IDs and info
 */
export async function getAvailableCandidatesOnDate(
  date: Date | string
): Promise<Array<{ id: string; full_name: string; ic_number: string; phone_number: string }>> {
  try {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    
    // Try the get_available_candidates_on_date function
    try {
      const { data, error } = await supabase.rpc('get_available_candidates_on_date', {
        p_date: dateStr
      });

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.warn('Error using get_available_candidates_on_date function:', error);
    }
    
    // Fallback to manual query
    // Get all candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, full_name, ic_number, phone_number')
      .eq('is_banned', false);
    
    if (candidatesError || !candidates) {
      console.error('Error fetching candidates:', candidatesError);
      return [];
    }
    
    // Filter to only available candidates
    const availableCandidates = [];
    
    for (const candidate of candidates) {
      const isAvailable = await isCandidateAvailable(candidate.id, dateStr);
      if (isAvailable) {
        availableCandidates.push(candidate);
      }
    }
    
    return availableCandidates;
  } catch (error) {
    console.error('Error getting available candidates:', error);
    return [];
  }
}