import { supabase } from './supabase';
import type { Project } from './types';

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

/**
 * Helper function to determine if clients table exists
 * @returns Promise<boolean> True if the clients table exists
 */
async function doesClientsTableExist(): Promise<boolean> {
  try {
    // Try to query the clients table to check if it exists
    const { error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);
      
    // If no error, the table exists
    return !error;
  } catch (e) {
    // If there's an error, assume the table doesn't exist
    return false;
  }
}

/**
 * Gets a project by its ID with detailed information including related client and manager
 * @param id The project ID to fetch
 * @param includeDocuments Optional parameter to include project documents
 * @returns Promise resolving to Project object or null if not found
 */
export async function getProjectById(id: string, includeDocuments: boolean = false): Promise<Project | null> {
  try {
    // console.log(`Getting project details for ID: ${id}`);
    
    if (!id) {
      console.error('Invalid project ID provided');
      return null;
    }
    
    // Check if clients table exists
    const clientsTableExists = await doesClientsTableExist();
    
    // Use a simple select query without joins
    let selectClause = '*';
    
    // Add documents to select clause if requested
    if (includeDocuments) {
      selectClause += ', project_documents(*)';
    }
    
    // Use simple query without complex joins
    const query = supabase
      .from('projects')
      .select(selectClause)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching project:', error);
      throw new Error(error.message);
    }

    if (!data) {
      // console.log('No project found with ID:', id);
      return null;
    }

    // Process the raw project data
    const processedData = {
      ...data,
      color: data.color || eventColors[data.event_type as keyof typeof eventColors] || eventColors.default,
    };
    
    // Initialize and process confirmed_staff array
    if (Array.isArray(data.confirmed_staff)) {
      processedData.confirmed_staff = data.confirmed_staff.map(staffMember => {
        // Create a copy to avoid mutating original
        const processedStaff = { ...staffMember };
        
        // Ensure workingDates is properly formatted
        if (processedStaff.workingDates && Array.isArray(processedStaff.workingDates)) {
          // Convert dates to Date objects for frontend use
          processedStaff.workingDates = processedStaff.workingDates.map((date: any) => {
            if (typeof date === 'string') {
              try {
                return new Date(date);
              } catch (e) {
                // console.warn('Invalid date string in confirmed_staff workingDates:', date);
                return date; // Keep original if parsing fails
              }
            }
            return date; // Return original if not a string
          });
        }
        
        return processedStaff;
      });
    } else {
      processedData.confirmed_staff = [];
    }
    
    // Initialize and process applicants array
    if (Array.isArray(data.applicants)) {
      processedData.applicants = data.applicants.map(applicant => {
        // Create a copy to avoid mutating original
        const processedApplicant = { ...applicant };
        
        // Ensure workingDates is properly formatted
        if (processedApplicant.workingDates && Array.isArray(processedApplicant.workingDates)) {
          // Convert dates to Date objects for frontend use
          processedApplicant.workingDates = processedApplicant.workingDates.map((date: any) => {
            if (typeof date === 'string') {
              try {
                return new Date(date);
              } catch (e) {
                // console.warn('Invalid date string in applicants workingDates:', date);
                return date; // Keep original if parsing fails
              }
            }
            return date; // Return original if not a string
          });
        }
        
        return processedApplicant;
      });
    } else {
      processedData.applicants = [];
    }

    // Log staff data for debugging
    // console.log(`Project ${id} staff data:`, {
    //   confirmed_staff_count: processedData.confirmed_staff.length,
    //   applicants_count: processedData.applicants.length
    // });
    
    // Fetch client data separately if client_id exists
    if (data.client_id) {
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.client_id)
          .single();

        if (!clientError && clientData) {
          processedData.client = clientData;
        }
      } catch (clientErr) {
        console.error('Error fetching client data:', clientErr);
      }
    }

    // Fetch manager data separately if manager_id exists
    if (data.manager_id) {
      try {
        const { data: managerData, error: managerError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.manager_id)
          .single();

        if (!managerError && managerData) {
          processedData.manager = managerData;
        }
      } catch (managerErr) {
        console.error('Error fetching manager data:', managerErr);
      }
    }

    return processedData;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}