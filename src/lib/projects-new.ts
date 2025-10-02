import { supabase } from './supabase';
import type { Project, User, Client } from './types';

const eventColors = {
  'nestle': '#FCA5A5', // Light red for Nestle Choy Sun
  'ribena': '#DDD6FE', // Light purple for Ribena
  'mytown': '#FDA4AF', // Light pink for Mytown
  'warrior': '#93C5FD', // Light blue for Warrior
  'diy': '#FEF08A', // Light yellow for DIY/MrDIY
  'blackmores': '#E2E8F0', // Light gray for Blackmores
  'lapasar': '#F9A8D4', // Light pink for Lapasar
  'spritzer': '#BBF7D0', // Light green for Spritzer
  'redoxon': '#FDBA74', // Light orange for Redoxon
  'double-mint': '#67E8F9', // Light cyan for Double Mint
  'softlan': '#E2E8F0', // Light gray for Softlan
  'colgate': '#FED7AA', // Light orange for Colgate
  'hsbc': '#FCA5A5', // Light red for HSBC
  'asw': '#93C5FD', // Light blue for ASW
  'lee-frozen': '#E2E8F0', // Light gray for Lee Frozen
  'maggle': '#E2E8F0', // Light gray for Maggle-Roots
  'unifi': '#FEF9C3', // Light yellow for Unifi
  'brands': '#BBF7D0', // Light green for Brands
  'oppo': '#93C5FD', // Light blue for Oppo
  'chrissy': '#F9A8D4', // Light pink for Chrissy
  'xiao-mi': '#E2E8F0', // Light gray for Xiao Mi
  'mcd': '#DDD6FE', // Light purple for MCD
  'te': '#F472B6', // Pink for TE
  'cpoc': '#86EFAC', // Green for CPOC
  'drora': '#FEF9C3', // Light yellow for Dr.Ora
  'default': '#CBD5E1', // Default color
};

export async function fetchProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:client_id(*), manager:manager_id(*)')
      .is('deleted_at', null)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    // Transform the data to match the Project interface
    const projects = data.map(project => {
      return {
        ...project,
        color: project.color || eventColors[project.event_type as keyof typeof eventColors] || eventColors.default,
      };
    });

    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function fetchProjectsByMonth(year: number, month: number): Promise<Project[]> {
  try {
    // Input validation - handle cases where inputs are not numbers
    if (isNaN(year) || isNaN(month)) {
      console.warn(`Invalid input to fetchProjectsByMonth: year=${year}, month=${month}`);
      // Default to current month if inputs are invalid
      const currentDate = new Date();
      year = currentDate.getFullYear();
      month = currentDate.getMonth();
      console.log(`Using fallback date: year=${year}, month=${month}`);
    }
    
    // Normalize the year/month values
    let normalizedYear = parseInt(String(year));
    let normalizedMonth = parseInt(String(month));
    
    // Handle month values outside the valid range (0-11)
    if (normalizedMonth < 0) {
      const yearsToSubtract = Math.ceil(Math.abs(normalizedMonth) / 12);
      normalizedYear = normalizedYear - yearsToSubtract;
      normalizedMonth = 12 - (Math.abs(normalizedMonth) % 12);
      if (normalizedMonth === 12) normalizedMonth = 0;
    } else if (normalizedMonth > 11) {
      const yearsToAdd = Math.floor(normalizedMonth / 12);
      normalizedYear = normalizedYear + yearsToAdd;
      normalizedMonth = normalizedMonth % 12;
    }

    // Construct date strings manually in ISO format (YYYY-MM-DD)
    const monthForDate = normalizedMonth + 1; // Convert 0-indexed month to 1-indexed for date string
    
    // First day of month
    const startDateStr = `${normalizedYear}-${String(monthForDate).padStart(2, '0')}-01T00:00:00.000Z`;
    
    // Last day of month - determine number of days in the month
    const daysInMonth = new Date(normalizedYear, monthForDate, 0).getDate();
    const endDateStr = `${normalizedYear}-${String(monthForDate).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}T23:59:59.999Z`;
    
    console.log(`Fetching projects for ${normalizedYear}-${monthForDate} with dates: ${startDateStr} to ${endDateStr}`);
    
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:client_id(*), manager:manager_id(*)')
      .is('deleted_at', null)
      .or(`start_date.gte.${startDateStr},end_date.gte.${startDateStr}`)
      .or(`start_date.lte.${endDateStr},end_date.lte.${endDateStr}`)
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching projects by month:', error);
      throw new Error(error.message);
    }
    
    if (!data) {
      return [];
    }
    
    // Transform the data to match the Project interface
    const projects = data.map(project => {
      return {
        ...project,
        color: project.color || eventColors[project.event_type as keyof typeof eventColors] || eventColors.default,
      };
    });
    
    return projects;
  } catch (error) {
    console.error('Error fetching projects by month:', error);
    return [];
  }
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw new Error(error.message);
    }

    // Add color to the project if not provided
    const projectWithColor = {
      ...data,
      color: data.color || eventColors[data.event_type as keyof typeof eventColors] || eventColors.default,
    };

    return projectWithColor;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProject(project: Project): Promise<Project | null> {
  try {
    const { id, ...updateData } = project;

    // Add updated_at timestamp
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw new Error(error.message);
    }

    // Add color to the project if not provided
    const projectWithColor = {
      ...data,
      color: data.color || eventColors[data.event_type as keyof typeof eventColors] || eventColors.default,
    };

    return projectWithColor;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

export async function deleteProject(id: string, deletedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    console.log(`Getting project details for ID: ${id}`);
    
    // Use a simple query first to get the core project data
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw new Error(error.message);
    }

    if (!data) {
      console.log('No project found with ID:', id);
      return null;
    }

    const projectData = { ...data };
    
    // If client_id exists, fetch client info separately
    if (data.client_id) {
      try {
        // First try from users table (assuming client_id references users table)
        const { data: clientData, error: clientError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.client_id)
          .single();
          
        if (!clientError && clientData) {
          projectData.client = clientData;
        } else {
          // Try clients table if it exists
          console.log('Client not found in users table, trying clients table');
          const { data: clientData2, error: clientError2 } = await supabase
            .from('clients')
            .select('*')
            .eq('id', data.client_id)
            .single();
            
          if (!clientError2 && clientData2) {
            projectData.client = clientData2;
          }
        }
      } catch (clientErr) {
        console.error('Error fetching client data:', clientErr);
      }
    }
    
    // If manager_id exists, fetch manager info separately
    if (data.manager_id) {
      try {
        const { data: managerData, error: managerError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.manager_id)
          .single();
          
        if (!managerError && managerData) {
          projectData.manager = managerData;
        }
      } catch (managerErr) {
        console.error('Error fetching manager data:', managerErr);
      }
    }

    // Add color to the project if not provided
    const projectWithColor = {
      ...projectData,
      color: data.color || eventColors[data.event_type as keyof typeof eventColors] || eventColors.default,
    };

    console.log('Successfully fetched project with additional data:', projectWithColor);
    return projectWithColor;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

/**
 * Gets a list of possible project managers
 * @returns Array of users who can be assigned as project managers
 */
export async function getPossibleManagers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_manager', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching managers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPossibleManagers:', error);
    return [];
  }
}

/**
 * Gets a list of possible clients
 * @returns Array of clients who can be assigned to projects
 */
export async function getPossibleClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPossibleClients:', error);
    return [];
  }
}

/**
 * Deletes multiple projects by marking them as deleted
 * @param ids Array of project IDs to delete
 * @param deletedBy ID of the user performing the deletion
 * @returns Object containing arrays of successfully and unsuccessfully deleted project IDs
 */
export async function deleteMultipleProjects(ids: string[], deletedBy: string): Promise<{ success: string[], failed: string[] }> {
  const result = { success: [] as string[], failed: [] as string[] };
  
  try {
    const deletionTimestamp = new Date().toISOString();
    
    // Use a single batch update for better performance
    const { data, error } = await supabase
      .from('projects')
      .update({
        deleted_at: deletionTimestamp,
        deleted_by: deletedBy,
      })
      .in('id', ids)
      .select('id');
    
    if (error) {
      console.error('Error batch deleting projects:', error);
      return { success: [], failed: ids };
    }
    
    // Get the IDs of successfully deleted projects
    const successfulIds = data?.map(project => project.id) || [];
    result.success = successfulIds;
    
    // Find which IDs failed (if any)
    result.failed = ids.filter(id => !successfulIds.includes(id));
    
    return result;
  } catch (error) {
    console.error('Error deleting multiple projects:', error);
    return { success: [], failed: ids };
  }
}