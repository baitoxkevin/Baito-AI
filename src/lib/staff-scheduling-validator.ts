import { supabase } from "./supabase";
import { WorkingDateWithSalary } from "@/components/ui/working-date-picker";
import { format, isWithinInterval, parseISO } from "date-fns";

interface ScheduleConflict {
  date: Date;
  projectId: string;
  projectTitle: string;
}

/**
 * Check for scheduling conflicts when assigning a staff member to specific dates
 * 
 * @param staffId - The ID of the staff member
 * @param workingDates - Array of dates with salary information to check
 * @param projectId - Optional: Current project ID (to exclude from conflict check)
 * @returns Object containing conflict information
 */
export async function checkStaffScheduleConflicts(
  staffId: string,
  workingDates: WorkingDateWithSalary[],
  projectId?: string
): Promise<{ hasConflicts: boolean; conflicts: ScheduleConflict[] }> {
  try {
    // Validate inputs
    if (!staffId || !workingDates || !Array.isArray(workingDates) || workingDates.length === 0) {
      console.warn("Invalid inputs for schedule conflict check", { staffId, workingDates });
      return { hasConflicts: false, conflicts: [] };
    }

    // Format dates for checking
    const dateStrings = workingDates.map(d => {
      const dateStr = typeof d.date === 'string' 
        ? d.date 
        : format(d.date, 'yyyy-MM-dd');
      return dateStr;
    });

    console.log(`Checking conflicts for staff ${staffId} on dates:`, dateStrings);

    // First try using the RPC function if available
    try {
      const { data, error } = await supabase.rpc('check_staff_schedule_conflicts', {
        p_staff_id: staffId,
        p_working_dates: dateStrings,
        p_exclude_project_id: projectId || null
      });

      if (!error && data) {
        console.log("RPC conflict check results:", data);
        
        // Format the conflicts into our return structure
        const conflicts = data.map((conflict: unknown) => ({
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
        console.error('Error checking schedule conflicts via RPC:', error);
      } else {
        console.warn('RPC function not available, falling back to manual check');
      }
    } catch (rpcError) {
      console.warn('RPC call failed, falling back to manual check:', rpcError);
    }

    // Fallback: Manual conflict check
    // Get all projects this staff is assigned to
    const { data: staffProjects, error: staffError } = await supabase
      .from('project_staff')
      .select(`
        id,
        project_id,
        working_dates_with_salary,
        projects:project_id (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq('id', staffId);

    if (staffError) {
      console.error('Error fetching staff projects:', staffError);
      return { hasConflicts: false, conflicts: [] };
    }

    if (!staffProjects || staffProjects.length === 0) {
      console.log(`No existing projects found for staff ${staffId}`);
      return { hasConflicts: false, conflicts: [] };
    }

    console.log(`Found ${staffProjects.length} projects for staff ${staffId}`);

    // Check for conflicts by examining each date
    const conflicts: ScheduleConflict[] = [];

    for (const dateInfo of workingDates) {
      const checkDate = typeof dateInfo.date === 'string' 
        ? parseISO(dateInfo.date) 
        : new Date(dateInfo.date);
      
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');

      // Check each project
      for (const staffProject of staffProjects) {
        // Skip if this is the current project we're updating
        if (projectId && staffProject.project_id === projectId) {
          continue;
        }

        // Skip if project data is missing
        if (!staffProject.projects) {
          continue;
        }

        // Extract project details
        const projectTitle = staffProject.projects.title || 'Unknown Project';
        
        // Check if the staff member is assigned to this date in this project
        if (staffProject.working_dates_with_salary && Array.isArray(staffProject.working_dates_with_salary)) {
          const assignedToDate = staffProject.working_dates_with_salary.some(existingDate => {
            const existingDateStr = typeof existingDate.date === 'string' 
              ? existingDate.date 
              : format(existingDate.date, 'yyyy-MM-dd');
            
            return existingDateStr === checkDateStr;
          });

          if (assignedToDate) {
            conflicts.push({
              date: checkDate,
              projectId: staffProject.project_id,
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
    console.error('Exception checking staff schedule conflicts:', error);
    return { hasConflicts: false, conflicts: [] };
  }
}

/**
 * Get all staffing schedule conflicts for a project
 * 
 * @param projectId - The project ID to check
 * @param staffList - Optional list of staff IDs to check (if not provided, checks all staff)
 * @returns Object containing staff conflicts by ID
 */
export async function getProjectStaffConflicts(
  projectId: string,
  staffList?: string[]
): Promise<Record<string, { 
  staffId: string, 
  staffName: string, 
  conflicts: ScheduleConflict[] 
}>> {
  try {
    if (!projectId) {
      console.error('Invalid project ID for conflict check');
      return {};
    }

    // Get project details including dates and staff
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        start_date,
        end_date,
        project_staff (
          id,
          name,
          working_dates_with_salary
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project details:', projectError);
      return {};
    }

    const conflicts: Record<string, { 
      staffId: string, 
      staffName: string, 
      conflicts: ScheduleConflict[] 
    }> = {};

    // Filter staff list if provided
    const staffToCheck = staffList 
      ? project.project_staff.filter(staff => staffList.includes(staff.id))
      : project.project_staff;

    // Check each staff member
    for (const staff of staffToCheck) {
      if (!staff.working_dates_with_salary || !Array.isArray(staff.working_dates_with_salary)) {
        continue;
      }

      const { hasConflicts, conflicts: staffConflicts } = await checkStaffScheduleConflicts(
        staff.id,
        staff.working_dates_with_salary,
        projectId
      );

      if (hasConflicts) {
        conflicts[staff.id] = {
          staffId: staff.id,
          staffName: staff.name,
          conflicts: staffConflicts
        };
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Exception checking project staff conflicts:', error);
    return {};
  }
}