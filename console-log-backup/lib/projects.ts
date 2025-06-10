import { supabase } from './supabase';
import type { Project, User, Client } from './types';
import { getUser } from './auth';

// Add event colors for dummy data and fallback colors
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
    // Use simple select without complex joins to avoid schema cache issues
  const { data, error } = await supabase
      .from('projects')
      .select('*')
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

    // Fetch related client and manager data in a batch
    const clientIds = projects.filter(p => p.client_id).map(p => p.client_id);
    const managerIds = projects.filter(p => p.manager_id).map(p => p.manager_id);

    // Only fetch if we have IDs to look up
    if (clientIds.length > 0) {
      try {
        // First try to fetch from companies table
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*')
          .in('id', clientIds);
          
        // Then try to fetch from users table for any remaining IDs
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', clientIds);
          
        // Create a combined map for quick lookup
        const clientMap: Record<string, unknown> = {};
        
        // Add company data first
        if (companiesData && companiesData.length > 0) {
          companiesData.forEach(company => {
            clientMap[company.id] = {
              ...company,
              name: company.name || company.company_name,
              // Add logo_url if available
              logo_url: company.logo_url
            };
          });
        }
        
        // Then add user data (for clients that are users, not companies)
        if (usersData && usersData.length > 0) {
          usersData.forEach(user => {
            // Only add if not already in map (companies take precedence)
            if (!clientMap[user.id]) {
              clientMap[user.id] = {
                ...user,
                name: user.full_name || user.company_name
              };
            }
          });
        }
        
        // Add client data to projects
        projects.forEach(project => {
          if (project.client_id && clientMap[project.client_id]) {
            project.client = clientMap[project.client_id];
          }
        });
      } catch (error) {
        // console.warn('Error fetching client data:', error);
      }
    }
    
    // Only fetch if we have IDs to look up
    if (managerIds.length > 0) {
      try {
        const { data: managersData } = await supabase
          .from('users')
          .select('*')
          .in('id', managerIds);
          
        if (managersData && managersData.length > 0) {
          // Create a map for quick lookup
          const managerMap = managersData.reduce((map, manager) => {
            map[manager.id] = manager;
            return map;
          }, {} as Record<string, unknown>);
          
          // Add manager data to projects
          projects.forEach(project => {
            if (project.manager_id && managerMap[project.manager_id]) {
              project.manager = managerMap[project.manager_id];
            }
          });
        }
      } catch (error) {
        // console.warn('Error fetching manager data:', error);
      }
    }

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
      // console.warn(`Invalid input to fetchProjectsByMonth: year=${year}, month=${month}`);
      // Default to current month if inputs are invalid
      const currentDate = new Date();
      year = currentDate.getFullYear();
      month = currentDate.getMonth();
      // console.log(`Using fallback date: year=${year}, month=${month}`);
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
    
    // console.log(`Fetching projects for ${normalizedYear}-${monthForDate} with dates: ${startDateStr} to ${endDateStr}`);
    
    // Always use real data from Supabase
    const USE_DUMMY_DATA = false;  // Set to false to use real Supabase data
    
    // If not using dummy data, proceed with supabase query - ENHANCED TO FETCH MORE DATA
    // console.log("Using real Supabase data");
    
    // Calculate expanded date range (±1 month for performance)
    // This still captures projects that span into the requested month
    const expandedStartDate = new Date(normalizedYear, normalizedMonth - 1, 1);
    const expandedEndDate = new Date(normalizedYear, normalizedMonth + 1 + 1, 0); // Last day of month+1
    
    // Format expanded dates
    const expandedStartStr = expandedStartDate.toISOString();
    const expandedEndStr = expandedEndDate.toISOString();
    
    // console.log(`Using optimized date range (±1 month) for Supabase query: ${expandedStartStr} to ${expandedEndStr}`);
    
    // Use simple select without complex joins to avoid schema cache issues
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      // This OR query finds projects that:
      // 1. Start within or after our expanded range
      // 2. End within or after our expanded range
      // 3. Start before and end after our expanded range (spanning it)
      .or(`start_date.gte.${expandedStartStr},start_date.lte.${expandedEndStr}`)
      .or(`end_date.gte.${expandedStartStr},end_date.lte.${expandedEndStr}`)
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
    
    // Fetch related client and manager data in a batch
    const clientIds = projects.filter(p => p.client_id).map(p => p.client_id);
    const managerIds = projects.filter(p => p.manager_id).map(p => p.manager_id);

    // Only fetch if we have IDs to look up
    if (clientIds.length > 0) {
      try {
        // First try to fetch from companies table
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*')
          .in('id', clientIds);
          
        // Then try to fetch from users table for any remaining IDs
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', clientIds);
          
        // Create a combined map for quick lookup
        const clientMap: Record<string, unknown> = {};
        
        // Add company data first
        if (companiesData && companiesData.length > 0) {
          companiesData.forEach(company => {
            clientMap[company.id] = {
              ...company,
              name: company.name || company.company_name,
              // Add logo_url if available
              logo_url: company.logo_url
            };
          });
        }
        
        // Then add user data (for clients that are users, not companies)
        if (usersData && usersData.length > 0) {
          usersData.forEach(user => {
            // Only add if not already in map (companies take precedence)
            if (!clientMap[user.id]) {
              clientMap[user.id] = {
                ...user,
                name: user.full_name || user.company_name
              };
            }
          });
        }
        
        // Add client data to projects
        projects.forEach(project => {
          if (project.client_id && clientMap[project.client_id]) {
            project.client = clientMap[project.client_id];
          }
        });
      } catch (error) {
        // console.warn('Error fetching client data:', error);
      }
    }
    
    // Only fetch if we have IDs to look up
    if (managerIds.length > 0) {
      try {
        const { data: managersData } = await supabase
          .from('users')
          .select('*')
          .in('id', managerIds);
          
        if (managersData && managersData.length > 0) {
          // Create a map for quick lookup
          const managerMap = managersData.reduce((map, manager) => {
            map[manager.id] = manager;
            return map;
          }, {} as Record<string, unknown>);
          
          // Add manager data to projects
          projects.forEach(project => {
            if (project.manager_id && managerMap[project.manager_id]) {
              project.manager = managerMap[project.manager_id];
            }
          });
        }
      } catch (error) {
        // console.warn('Error fetching manager data:', error);
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Error fetching projects by month:', error);
    return [];
  }
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project | null> {
  // console.log('[projects.ts] createProject - Function start. Input project data:', JSON.stringify(project, null, 2));
  try {
    // Remove logo_url field which doesn't exist in the database
    // Keep brand_logo field as it's now added to the database
    const { logo_url, ...projectWithoutLogo } = project;

    const { data, error } = await supabase
      .from('projects')
      .insert([projectWithoutLogo])
      .select()
      .single();

    if (error) {
      console.error('[projects.ts] createProject - Error creating project:', JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }

    // console.log('[projects.ts] createProject - Supabase response data:', JSON.stringify(data, null, 2));
    // Add color to the project if not provided
    const projectWithColor = {
      ...data,
      color: data.color || eventColors[data.event_type as keyof typeof eventColors] || eventColors.default,
    };

    // console.log('[projects.ts] createProject - Returning projectWithColor:', JSON.stringify(projectWithColor, null, 2));
    return projectWithColor;
  } catch (error) {
    console.error('[projects.ts] createProject - Catch block error:', JSON.stringify(error, null, 2));
    return null;
  }
}

export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  // console.log('[projects.ts] updateProject - Function start. Input id:', id, 'Input projectData:', JSON.stringify(projectData, null, 2));
  try {
    // console.log('updateProject called with staff arrays:', {
    //   id,
    //   title: projectData.title,
    //   confirmed_staff_count: (projectData.confirmed_staff || []).length,
    //   applicants_count: (projectData.applicants || []).length,
    //   confirmed_staff_sample: (projectData.confirmed_staff || []).slice(0, 1),
    //   applicants_sample: (projectData.applicants || []).slice(0, 1),
    // });

    // Process confirmed_staff and applicants to ensure they're properly stored
    const processedData = { ...projectData };
    
    // Format dates in workingDates for confirmed_staff if needed
    if (processedData.confirmed_staff) {
      processedData.confirmed_staff = processedData.confirmed_staff.map((staffMember: unknown) => {
        const processedStaff = { ...staffMember };
        
        // Remove UI-specific properties that shouldn't be stored
        delete processedStaff.dragging;
        delete processedStaff.editing;
        
        // Convert workingDates from Date objects to strings and ensure all dates are valid ISO strings
        if (processedStaff.workingDates && Array.isArray(processedStaff.workingDates)) {
          processedStaff.workingDates = processedStaff.workingDates.map((date: unknown) => {
            if (date instanceof Date) {
              return date.toISOString();
            }
            
            // If it's a string but not a valid ISO date, try to parse it
            if (typeof date === 'string') {
              try {
                // Try to parse and format the date to ensure it's a valid ISO string
                const parsedDate = new Date(date);
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toISOString();
                }
              } catch (e) {
                // console.warn('Invalid date string in workingDates:', date);
              }
            }
            
            // Return the original string if it's already valid or now as fallback
            return typeof date === 'string' ? date : new Date().toISOString();
          });
        }
        
        // Ensure workingDates is an empty array if null or undefined, to prevent Supabase errors
        if (processedStaff.workingDates === null || typeof processedStaff.workingDates === 'undefined') {
          processedStaff.workingDates = [];
        }
        
        return processedStaff;
      });
    }
    
    // Format dates in workingDates for applicants if needed
    if (processedData.applicants) {
      processedData.applicants = processedData.applicants.map((applicant: unknown) => {
        const processedApplicant = { ...applicant };
        
        // Remove UI-specific properties that shouldn't be stored
        delete processedApplicant.dragging;
        delete processedApplicant.editing;
        
        // Convert workingDates from Date objects to strings and ensure all dates are valid ISO strings
        if (processedApplicant.workingDates && Array.isArray(processedApplicant.workingDates)) {
          processedApplicant.workingDates = processedApplicant.workingDates.map((date: unknown) => {
            if (date instanceof Date) {
              return date.toISOString();
            }
            
            // If it's a string but not a valid ISO date, try to parse it
            if (typeof date === 'string') {
              try {
                // Try to parse and format the date to ensure it's a valid ISO string
                const parsedDate = new Date(date);
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toISOString();
                }
              } catch (e) {
                // console.warn('Invalid date string in applicants workingDates:', date);
              }
            }
            
            // Return the original string if it's already valid or now as fallback
            return typeof date === 'string' ? date : new Date().toISOString();
          });
        }
        
        // Ensure workingDates is an empty array if null or undefined, to prevent Supabase errors
        if (processedApplicant.workingDates === null || typeof processedApplicant.workingDates === 'undefined') {
          processedApplicant.workingDates = [];
        }
        
        return processedApplicant;
      });
    }

    // Add updated_at timestamp and remove logo_url field
    const { logo_url, ...dataWithoutLogo } = processedData;
    const dataToUpdate = {
      ...dataWithoutLogo,
      updated_at: new Date().toISOString(),
    };

    // console.log('[projects.ts] updateProject - Data before Supabase update:', JSON.stringify(dataToUpdate, null, 2));

    const { data, error } = await supabase
      .from('projects')
      .update(dataToUpdate)
      .eq('id', id);
      
    if (error) {
      console.error('[projects.ts] updateProject - Error updating project:', JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }

    // console.log('[projects.ts] updateProject - Supabase response data:', JSON.stringify(data, null, 2));
    // Add color to the project if not provided
    // Use dataToUpdate since the data returned might be null
    const projectWithColor = {
      ...dataToUpdate,
      color: dataToUpdate.color ||
        (dataToUpdate.event_type ? eventColors[dataToUpdate.event_type as keyof typeof eventColors] : null) ||
        eventColors.default,
    };

    // console.log('[projects.ts] updateProject - Returning projectWithColor:', JSON.stringify(projectWithColor, null, 2));
    return projectWithColor;
  } catch (error) {
    // Better error handling to preserve error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[projects.ts] updateProject - Catch block error:', errorMessage);
    console.error('[projects.ts] updateProject - Error object:', error);

    // Rethrow the error with better formatting to propagate it properly
    throw new Error(`Project update failed: ${errorMessage}`);
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

// Import the dedicated getProjectById function instead of duplicating it
import { getProjectById as getProjectByIdDedicated } from './getProjectById';

// Re-export the dedicated function to maintain compatibility
export async function getProjectById(id: string, includeDocuments: boolean = false): Promise<Project | null> {
  try {
    // console.log(`Using consolidated getProjectById function for project: ${id}`);
    
    // Use the dedicated implementation from getProjectById.ts
    const project = await getProjectByIdDedicated(id, includeDocuments);
    
    if (!project) {
      // console.log('No project found with ID:', id);
      return null;
    }

    // Additional logging for debugging staff data issues
    if (project.confirmed_staff && Array.isArray(project.confirmed_staff)) {
      // console.log(`Project ${id} has ${project.confirmed_staff.length} confirmed staff members`);
      
      // Log working dates count for each staff member
      if (project.confirmed_staff.length > 0) {
        // console.log('Confirmed staff working dates:', 
        //   project.confirmed_staff.map(staff => ({
        //     id: staff.id,
        //     name: staff.name,
        //     working_dates_count: staff.workingDates?.length || 0,
        //     dates_type: staff.workingDates?.length ? 
        //       (staff.workingDates[0] instanceof Date ? 'Date objects' : 'String dates') : 'None'
        //   }))
        // );
      }
    } else {
      // console.log(`Project ${id} has no confirmed staff (or invalid format)`);
    }
    
    if (project.applicants && Array.isArray(project.applicants)) {
      // console.log(`Project ${id} has ${project.applicants.length} applicants`);
      
      // Log working dates count for each applicant
      if (project.applicants.length > 0) {
        // console.log('Applicants working dates:', 
        //   project.applicants.map(applicant => ({
        //     id: applicant.id,
        //     name: applicant.name,
        //     working_dates_count: applicant.workingDates?.length || 0,
        //     dates_type: applicant.workingDates?.length ? 
        //       (applicant.workingDates[0] instanceof Date ? 'Date objects' : 'String dates') : 'None'
        //   }))
        // );
      }
    } else {
      // console.log(`Project ${id} has no applicants (or invalid format)`);
    }
    
    return project;
  } catch (error) {
    console.error('Error in consolidated getProjectById:', error);
    return null;
  }
}

/**
 * Gets a list of possible project managers
 * @returns Array of users who can be assigned as project managers
 */
export async function getPossibleManagers(): Promise<User[]> {
  try {
    // Just fetch all users as managers
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching managers:', error);
      return [];
    }

    // Return dummy managers if no data found
    if (!data || data.length === 0) {
      // console.log('No users found, returning dummy managers');
      return [
        { id: '1', full_name: 'Alex Manager', email: 'alex@example.com' },
        { id: '2', full_name: 'Jordan Manager', email: 'jordan@example.com' }
      ] as User[];
    }
    
    return data;
  } catch (error) {
    console.error('Error in getPossibleManagers:', error);
    // Return dummy managers in case of error
    return [
      { id: '1', full_name: 'Alex Manager', email: 'alex@example.com' },
      { id: '2', full_name: 'Jordan Manager', email: 'jordan@example.com' }
    ] as User[];
  }
}

/**
 * Gets a list of possible clients
 * @returns Array of clients who can be assigned to projects
 */
export async function getPossibleClients(): Promise<Client[]> {
  try {
    // First try to get clients from users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching clients from users table:', error);
      // Return dummy clients on error
      return getDummyClients();
    }

    // Return dummy clients if no data found
    if (!data || data.length === 0) {
      // console.log('No users found, returning dummy clients');
      return getDummyClients();
    }
    
    // Convert users to clients (might need to add client-specific fields)
    return data.map(user => ({
      id: user.id,
      full_name: user.full_name || 'Unknown',
      email: user.email || '',
      phone: (user as unknown).phone || '',
      company: (user as unknown).company || 'Unknown Company',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    })) as Client[];
  } catch (error) {
    console.error('Error in getPossibleClients:', error);
    return getDummyClients();
  }
}

// Helper function to provide fallback dummy client data
function getDummyClients(): Client[] {
  return [
    { 
      id: '101', 
      full_name: 'Acme Corporation', 
      email: 'contact@acme.com',
      phone: '123-456-7890',
      company: 'Acme Corp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '102', 
      full_name: 'XYZ Industries', 
      email: 'info@xyz.com',
      phone: '987-654-3210',
      company: 'XYZ Industries', 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ] as Client[];
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

/**
 * Records project changes with user context
 */
export async function recordProjectChanges(
  projectId: string,
  changes: { field: string, old: string, new: string }[],
  reason: string
): Promise<void> {
  try {
    const user = await getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Insert each change into the project_changes table
    for (const change of changes) {
      await supabase
        .from('project_changes')
        .insert({
          project_id: projectId,
          field_name: change.field,
          old_value: change.old,
          new_value: change.new,
          change_reason: reason,
          changed_by: user.id
        });
    }
  } catch (error) {
    console.error('Error recording project changes:', error);
    throw error;
  }
}

/**
 * Saves project change context for AI analysis
 */
export async function saveProjectChangeContext(
  projectId: string, 
  changes: { field: string, old: string, new: string }[],
  reason: string
): Promise<void> {
  try {
    await supabase
      .from('projects_ai_context')
      .insert({
        project_id: projectId,
        context_type: 'change_analysis',
        content: JSON.stringify({ changes, reason }),
        source: 'user_input'
      });
  } catch (error) {
    console.error('Error saving project change context:', error);
    throw error;
  }
}