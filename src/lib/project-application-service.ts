import { supabase } from '@/lib/supabase';
import type { Database } from './database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectStaff = Database['public']['Tables']['project_staff']['Row'];

export interface ProjectApplicationData {
  project_id: string;
  candidate_id: string;
  designation: string;
  apply_type?: 'applied' | 'invited' | 'assigned';
  status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Check if a project is open for applications
 * A project is considered open if:
 * 1. Status is 'planning' or 'active'
 * 2. Start date is in the future
 * 3. It has not reached full capacity (filled_positions < crew_count)
 */
export function isProjectOpen(project: Partial<Project>): boolean {
  if (!project.status || !project.start_date) {
    return false;
  }

  // Check if status allows applications
  const allowedStatuses = ['planning', 'active'];
  if (!allowedStatuses.includes(project.status)) {
    return false;
  }

  // Check if start date is in the future
  const startDate = new Date(project.start_date);
  const now = new Date();
  if (startDate <= now) {
    return false;
  }

  // Check if there's still capacity
  const filledPositions = project.filled_positions || 0;
  const crewCount = project.crew_count || 0;
  if (crewCount > 0 && filledPositions >= crewCount) {
    return false;
  }

  return true;
}

/**
 * Get open projects that candidates can apply to
 */
export async function getOpenProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['planning', 'active'])
      .gt('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;

    // Filter projects that still have capacity
    const openProjects = data?.filter(project => {
      const filledPositions = project.filled_positions || 0;
      const crewCount = project.crew_count || 0;
      return crewCount === 0 || filledPositions < crewCount;
    });

    return { data: openProjects, error: null };
  } catch (error) {
    console.error('Error fetching open projects:', error);
    return { data: null, error };
  }
}

/**
 * Check if a candidate has already applied to a project
 */
export async function hasAppliedToProject(projectId: string, candidateId: string) {
  try {
    const { data, error } = await supabase
      .from('project_staff')
      .select('id')
      .eq('project_id', projectId)
      .eq('candidate_id', candidateId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found - candidate hasn't applied
      return { hasApplied: false, error: null };
    }

    if (error) throw error;

    return { hasApplied: !!data, error: null };
  } catch (error) {
    console.error('Error checking application status:', error);
    return { hasApplied: false, error };
  }
}

/**
 * Apply to a project as a candidate
 */
export async function applyToProject(application: ProjectApplicationData) {
  try {
    // Check if project is open
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', application.project_id)
      .single();

    if (projectError) throw projectError;

    if (!isProjectOpen(project)) {
      throw new Error('This project is no longer accepting applications');
    }

    // Check if already applied
    const { hasApplied, error: checkError } = await hasAppliedToProject(
      application.project_id,
      application.candidate_id
    );

    if (checkError) throw checkError;
    if (hasApplied) {
      throw new Error('You have already applied to this project');
    }

    // Get candidate details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('full_name, profile_photo')
      .eq('id', application.candidate_id)
      .single();

    if (candidateError) throw candidateError;

    // Create the application (project_staff entry)
    const { data: staffEntry, error: staffError } = await supabase
      .from('project_staff')
      .insert({
        project_id: application.project_id,
        candidate_id: application.candidate_id,
        name: candidate.full_name,
        designation: application.designation || 'Crew',
        photo: candidate.profile_photo || '',
        apply_type: application.apply_type || 'applied',
        working_dates: [],
        working_dates_with_salary: {
          dates: [],
          status: application.status || 'pending'
        }
      })
      .select()
      .single();

    if (staffError) throw staffError;

    // Log the application
    await supabase.rpc('log_activity', {
      p_table_name: 'project_staff',
      p_record_id: staffEntry.id,
      p_action: 'INSERT',
      p_new_data: staffEntry,
      p_table_name: 'project_staff'
    });

    return { data: staffEntry, error: null };
  } catch (error) {
    console.error('Error applying to project:', error);
    return { data: null, error };
  }
}

/**
 * Update application status (for managers/admins)
 */
export async function updateApplicationStatus(
  projectId: string,
  candidateId: string,
  status: 'pending' | 'approved' | 'rejected'
) {
  try {
    const { data, error } = await supabase
      .from('project_staff')
      .update({
        working_dates_with_salary: {
          dates: [],
          status
        }
      })
      .eq('project_id', projectId)
      .eq('candidate_id', candidateId)
      .select()
      .single();

    if (error) throw error;

    // If approved, update the project's filled positions count
    if (status === 'approved') {
      const { error: updateError } = await supabase
        .rpc('increment', {
          table_name: 'projects',
          row_id: projectId,
          column_name: 'filled_positions',
          increment_value: 1
        });

      if (updateError) {
        // Fallback to direct update if RPC doesn't exist
        const { data: project } = await supabase
          .from('projects')
          .select('filled_positions')
          .eq('id', projectId)
          .single();

        if (project) {
          await supabase
            .from('projects')
            .update({ filled_positions: (project.filled_positions || 0) + 1 })
            .eq('id', projectId);
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating application status:', error);
    return { data: null, error };
  }
}

/**
 * Get all applications for a project
 */
export async function getProjectApplications(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('project_staff')
      .select(`
        *,
        candidates:candidate_id (
          id,
          full_name,
          ic_number,
          phone_number,
          email,
          profile_photo,
          highest_education,
          has_vehicle
        )
      `)
      .eq('project_id', projectId)
      .eq('apply_type', 'applied')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching project applications:', error);
    return { data: null, error };
  }
}

/**
 * Get all applications for a candidate
 */
export async function getCandidateApplications(candidateId: string) {
  try {
    const { data, error } = await supabase
      .from('project_staff')
      .select(`
        *,
        projects:project_id (
          id,
          title,
          company_name,
          venue_address,
          start_date,
          end_date,
          status,
          color
        )
      `)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching candidate applications:', error);
    return { data: null, error };
  }
}