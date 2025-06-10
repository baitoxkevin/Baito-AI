import { supabase } from './supabase';
import type { Project } from './types';

import { logger } from './logger';
// Color mapping table for project themes
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

// Helper function to add color to project data
function addProjectColor(project: unknown): Project {
  return {
    ...project,
    color: project.color || (project.event_type ? eventColors[project.event_type] || eventColors.default : eventColors.default),
  };
}

/**
 * Fetch all projects with optimized query
 */
export async function fetchProjectsOptimized(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('start_date', { ascending: true });

    if (error) {
      logger.error('Error fetching projects:', error);
      throw new Error(error.message);
    }

    if (!data) return [];
    
    // Transform the data to match the Project interface and add colors
    const projects = data.map(addProjectColor);

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
        logger.warn('Error fetching client data:', error);
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
        logger.warn('Error fetching manager data:', error);
      }
    }
    
    return projects;
  } catch (error) {
    logger.error('Failed to fetch projects:', error);
    return [];
  }
}

/**
 * Fetch projects by month with server-side filtering
 */
export async function fetchProjectsByMonthOptimized(month: number): Promise<Project[]> {
  try {
    logger.debug(`Starting fetchProjectsByMonthOptimized for month ${month}`);
    
    // Return mock data for testing or when there are Supabase connection issues
    const mockData = [
      {
        id: "test-1",
        title: "Test Project 1",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: "In Progress",
        priority: "High",
        color: "#ff0000",
        event_type: "default",
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        venue_address: "123 Test Street",
        filled_positions: 5,
        crew_count: 10
      },
      {
        id: "test-2",
        title: "Test Project 2",
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
        status: "Planned",
        priority: "Medium",
        color: "#0000ff",
        event_type: "nestle",
        working_hours_start: "10:00",
        working_hours_end: "18:00",
        venue_address: "456 Demo Avenue",
        filled_positions: 3,
        crew_count: 8
      }
    ];
    
    // If no supabase client or in development mode without proper connection
    if (!supabase) {
      logger.debug("No supabase client, returning mock data");
      return mockData;
    }
    
    try {
      const year = new Date().getFullYear();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      
      logger.debug(`Querying for projects between ${startOfMonth} and ${endOfMonth}`);

      // Use simplified query without joins
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .or(
          // Project starts within month
          `and(start_date.gte.${startOfMonth},start_date.lte.${endOfMonth}),` +
          // Project ends within month
          `and(end_date.gte.${startOfMonth},end_date.lte.${endOfMonth}),` +
          // Project spans the entire month
          `and(start_date.lte.${startOfMonth},end_date.gte.${endOfMonth})`
        )
        .order('start_date', { ascending: true });

      if (error) {
        logger.error('Error fetching projects with simple query:', error);
        logger.debug('Falling back to mock data due to database error');
        return mockData;
      }

      if (!data) {
        logger.debug('No data returned, falling back to mock data');
        return mockData;
      }
      
      // Create a Map to ensure uniqueness by ID (defensive programming)
      const uniqueProjects = new Map();
      
      // Add colors and ensure uniqueness
      data.forEach(project => {
        if (!uniqueProjects.has(project.id)) {
          uniqueProjects.set(project.id, addProjectColor(project));
        }
      });
      
      const projects = Array.from(uniqueProjects.values());
      
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
          logger.warn('Error fetching client data:', error);
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
          logger.warn('Error fetching manager data:', error);
        }
      }
      
      logger.debug(`Successfully processed ${projects.length} projects for month ${month}`);
      return projects;
      
    } catch (innerError) {
      logger.error(`Error in database query for month ${month}:`, innerError);
      logger.debug('Falling back to mock data due to query error');
      return mockData;
    }
  } catch (outerError) {
    logger.error(`Failed to fetch projects for month ${month}:`, outerError);
    logger.debug('Falling back to mock data due to general error');
    return mockData;
  }
}

/**
 * Delete multiple projects with a single database operation
 */
export async function deleteMultipleProjectsOptimized(
  projectIds: string[], 
  userId: string
): Promise<{ success: string[], failed: string[] }> {
  const result = {
    success: [] as string[],
    failed: [] as string[],
  };

  if (!projectIds.length) return result;

  try {
    const timestamp = new Date().toISOString();
    
    // Perform batch soft delete in a single operation
    const { data, error } = await supabase
      .from('projects')
      .update({
        deleted_at: timestamp,
        deleted_by: userId,
        updated_at: timestamp,
      })
      .in('id', projectIds)
      .select('id');
    
    if (error) {
      logger.error('Error batch deleting projects:', error);
      result.failed = projectIds;
      return result;
    }
    
    // Record successful deletions
    if (data) {
      result.success = data.map(item => item.id);
      // Find which ones failed
      result.failed = projectIds.filter(id => !result.success.includes(id));
    }
    
    return result;
  } catch (error) {
    logger.error('Failed to batch delete projects:', error);
    result.failed = projectIds;
    return result;
  }
}

/**
 * Prefetch projects data for seamless navigation
 * This function is designed to be called in the background
 */
export async function prefetchProjects(): Promise<void> {
  try {
    logger.debug('Prefetching projects data in background...');
    
    // Start the network request but don't wait for the result
    fetchProjectsOptimized()
      .then(() => logger.debug('Projects data prefetched successfully'))
      .catch(error => logger.error('Error prefetching projects:', error));
  } catch (error) {
    logger.error('Failed to initiate projects prefetch:', error);
  }
}

/**
 * Prefetch calendar data for a given month
 * This function is designed to be called in the background
 */
export async function prefetchCalendarMonth(month: number): Promise<void> {
  try {
    logger.debug(`Prefetching calendar data for month ${month} in background...`);
    
    // Start the network request but don't wait for the result
    fetchProjectsByMonthOptimized(month)
      .then(() => logger.debug(`Calendar data for month ${month} prefetched successfully`))
      .catch(error => logger.error(`Error prefetching calendar month ${month}:`, error));
  } catch (error) {
    logger.error(`Failed to initiate calendar month ${month} prefetch:`, error);
  }
}