import { supabase } from './supabase';
import type { ExpenseClaim } from './expense-claim-service';

/**
 * Syncs approved expense claims to staff payroll
 * This function will update the staff's working dates with salary to include the expense claim amounts
 */
export async function syncExpenseClaimToPayroll(expenseClaim: ExpenseClaim): Promise<{ success: boolean; message: string }> {
  try {
    // Only sync approved claims
    if (expenseClaim.status !== 'approved') {
      return { 
        success: false, 
        message: 'Only approved expense claims can be synced to payroll' 
      };
    }

    // Get the staff ID from the expense claim
    const staffId = expenseClaim.user_id || expenseClaim.staff_id;
    if (!staffId) {
      return { 
        success: false, 
        message: 'No staff member associated with this expense claim' 
      };
    }

    // Get the project ID
    const projectId = expenseClaim.project_id;
    if (!projectId) {
      return { 
        success: false, 
        message: 'No project associated with this expense claim' 
      };
    }

    // Fetch the project to get confirmed staff data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('confirmed_staff')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return { 
        success: false, 
        message: 'Failed to fetch project data' 
      };
    }

    // Find the staff member in confirmed staff
    const confirmedStaff = project.confirmed_staff || [];
    const staffIndex = confirmedStaff.findIndex((staff: any) => 
      staff.candidate_id === staffId || staff.id === staffId
    );

    if (staffIndex === -1) {
      return { 
        success: false, 
        message: 'Staff member not found in project confirmed staff' 
      };
    }

    const staffMember = confirmedStaff[staffIndex];
    const workingDatesWithSalary = staffMember.working_dates_with_salary || [];
    
    if (workingDatesWithSalary.length === 0) {
      return { 
        success: false, 
        message: 'Staff member has no working dates to distribute expense claims' 
      };
    }

    // Calculate the amount to distribute per working day
    const totalAmount = expenseClaim.amount || expenseClaim.total_amount || 0;
    const amountPerDay = Math.floor(totalAmount / workingDatesWithSalary.length);
    const remainder = totalAmount - (amountPerDay * workingDatesWithSalary.length);

    // Update each working date with the distributed expense claim
    const updatedWorkingDates = workingDatesWithSalary.map((dateEntry: any, index: number) => {
      const currentClaims = parseFloat(dateEntry.claims || '0');
      // Add remainder to the first day to ensure total matches
      const additionalAmount = index === 0 ? amountPerDay + remainder : amountPerDay;
      const newClaimsAmount = currentClaims + additionalAmount;

      return {
        ...dateEntry,
        claims: newClaimsAmount.toString()
      };
    });

    // Update the staff member's data
    confirmedStaff[staffIndex] = {
      ...staffMember,
      working_dates_with_salary: updatedWorkingDates
    };

    // Update the project with the new confirmed staff data
    const { error: updateError } = await supabase
      .from('projects')
      .update({ confirmed_staff: confirmedStaff })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project staff:', updateError);
      return { 
        success: false, 
        message: 'Failed to update staff payroll data' 
      };
    }

    // Log the sync action
    console.log(`Successfully synced expense claim ${expenseClaim.id} to staff ${staffId} payroll`);
    
    return { 
      success: true, 
      message: `Expense claim of RM ${totalAmount} has been distributed across ${workingDatesWithSalary.length} working days` 
    };
  } catch (error) {
    console.error('Error syncing expense claim to payroll:', error);
    return { 
      success: false, 
      message: 'An error occurred while syncing expense claim to payroll' 
    };
  }
}

/**
 * Removes expense claim amount from staff payroll (used when claim is rejected or deleted)
 */
export async function unsyncExpenseClaimFromPayroll(expenseClaim: ExpenseClaim): Promise<{ success: boolean; message: string }> {
  try {
    // Only unsync previously approved claims
    if (expenseClaim.status !== 'approved') {
      return { 
        success: true, 
        message: 'Non-approved claims do not need to be unsynced' 
      };
    }

    const staffId = expenseClaim.user_id || expenseClaim.staff_id;
    const projectId = expenseClaim.project_id;

    if (!staffId || !projectId) {
      return { 
        success: false, 
        message: 'Missing staff or project information' 
      };
    }

    // Fetch the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('confirmed_staff')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { 
        success: false, 
        message: 'Failed to fetch project data' 
      };
    }

    const confirmedStaff = project.confirmed_staff || [];
    const staffIndex = confirmedStaff.findIndex((staff: any) => 
      staff.candidate_id === staffId || staff.id === staffId
    );

    if (staffIndex === -1) {
      return { 
        success: false, 
        message: 'Staff member not found in project' 
      };
    }

    const staffMember = confirmedStaff[staffIndex];
    const workingDatesWithSalary = staffMember.working_dates_with_salary || [];
    
    if (workingDatesWithSalary.length === 0) {
      return { 
        success: true, 
        message: 'No working dates to update' 
      };
    }

    // Calculate the amount to remove per working day
    const totalAmount = expenseClaim.amount || expenseClaim.total_amount || 0;
    const amountPerDay = Math.floor(totalAmount / workingDatesWithSalary.length);
    const remainder = totalAmount - (amountPerDay * workingDatesWithSalary.length);

    // Update each working date by removing the distributed expense claim
    const updatedWorkingDates = workingDatesWithSalary.map((dateEntry: any, index: number) => {
      const currentClaims = parseFloat(dateEntry.claims || '0');
      const amountToRemove = index === 0 ? amountPerDay + remainder : amountPerDay;
      const newClaimsAmount = Math.max(0, currentClaims - amountToRemove);

      return {
        ...dateEntry,
        claims: newClaimsAmount.toString()
      };
    });

    // Update the staff member's data
    confirmedStaff[staffIndex] = {
      ...staffMember,
      working_dates_with_salary: updatedWorkingDates
    };

    // Update the project
    const { error: updateError } = await supabase
      .from('projects')
      .update({ confirmed_staff: confirmedStaff })
      .eq('id', projectId);

    if (updateError) {
      return { 
        success: false, 
        message: 'Failed to update staff payroll data' 
      };
    }

    return { 
      success: true, 
      message: `Removed expense claim of RM ${totalAmount} from staff payroll` 
    };
  } catch (error) {
    console.error('Error unsyncing expense claim from payroll:', error);
    return { 
      success: false, 
      message: 'An error occurred while removing expense claim from payroll' 
    };
  }
}

/**
 * Get all expense claims for a staff member in a project
 */
export async function getStaffExpenseClaimsForProject(
  staffId: string, 
  projectId: string
): Promise<ExpenseClaim[]> {
  try {
    const { data, error } = await supabase
      .from('expense_claims')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', staffId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff expense claims:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getStaffExpenseClaimsForProject:', error);
    return [];
  }
}