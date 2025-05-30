import { StaffMember, WorkingDateWithSalary, PayrollData, StaffPayrollEntry, StaffWorkingSummary } from './types';
import { parseAmount } from './utils';
import { supabase as supabaseClient } from '@/lib/supabase';
import { useToast as useAppToast } from '@/hooks/use-toast';

// Adapter for consistent imports when using component in different contexts
export const supabase = supabaseClient;
export function useToast() {
  return useAppToast();
}

/**
 * Calculate working summaries for all staff members
 */
export function calculateStaffWorkingSummaries(confirmedStaff: StaffMember[]): StaffWorkingSummary[] {
  return confirmedStaff.map(staff => {
    const workingDatesWithSalary = staff.workingDatesWithSalary || [];
    
    const totalDays = workingDatesWithSalary.length;
    const totalBasicSalary = workingDatesWithSalary.reduce((sum, date) => {
      return sum + parseAmount(date.basicSalary);
    }, 0);
    const totalClaims = workingDatesWithSalary.reduce((sum, date) => {
      return sum + parseAmount(date.claims);
    }, 0);
    const totalCommission = workingDatesWithSalary.reduce((sum, date) => {
      return sum + parseAmount(date.commission);
    }, 0);
    
    return {
      name: staff.name || 'Unknown Staff',
      totalDays,
      totalBasicSalary,
      totalClaims,
      totalCommission,
      totalAmount: totalBasicSalary + totalClaims + totalCommission,
      workingDates: staff.workingDates || [],
      workingDatesWithSalary
    };
  });
}

/**
 * Save payment details for individual staff
 */
export async function saveStaffPaymentDetails(
  staffId: string,
  workingDatesWithSalary: WorkingDateWithSalary[]
): Promise<{ success: boolean; message?: string; error?: unknown }> {
  try {
    // First get the staff record to update
    const { data: staffData, error: staffError } = await supabase
      .from('project_staff')
      .select('id, working_dates_with_salary')
      .eq('id', staffId)
      .single();
    
    if (staffError) throw staffError;
    if (!staffData) throw new Error('Staff not found');
    
    // Update the working dates with salary
    const { error: updateError } = await supabase
      .from('project_staff')
      .update({ 
        working_dates_with_salary: workingDatesWithSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId);
    
    if (updateError) throw updateError;
    
    return { success: true, message: 'Staff payment details saved successfully' };
  } catch (error) {
    console.error('Error saving staff payment details:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to save staff payment details',
      error 
    };
  }
}

/**
 * Save project payroll data
 */
export async function saveProjectPayroll(payrollData: PayrollData): Promise<{ success: boolean; message?: string; error?: unknown }> {
  try {
    // First check if payroll exists for this project
    const { data: existingPayroll, error: payrollError } = await supabase
      .from('project_payroll')
      .select('id')
      .eq('project_id', payrollData.projectId)
      .maybeSingle();
    
    let result;
    
    // If payroll exists, update it
    if (existingPayroll) {
      result = await supabase
        .from('project_payroll')
        .update({
          total_amount: payrollData.totalAmount,
          payment_date: payrollData.paymentDate || new Date().toISOString(),
          staff_details: payrollData.staffPayroll,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayroll.id);
    } else {
      // Otherwise, create a new payroll record
      result = await supabase
        .from('project_payroll')
        .insert({
          project_id: payrollData.projectId,
          total_amount: payrollData.totalAmount,
          payment_date: payrollData.paymentDate || new Date().toISOString(),
          staff_details: payrollData.staffPayroll,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    if (result.error) throw result.error;
    
    // Now update each staff member's working_dates_with_salary in the project_staff table
    for (const staffEntry of payrollData.staffPayroll) {
      try {
        // Try using both id and staff_id field to find the right record
        let updateError = null;
        
        try {
          // First try with 'id'
          const { error: staffError } = await supabase
            .from('project_staff')
            .update({
              working_dates_with_salary: staffEntry.workingDatesWithSalary,
              updated_at: new Date().toISOString()
            })
            .eq('id', staffEntry.staffId);
            
          updateError = staffError;
          
          // If that failed with a column error, try with staff_id
          if (staffError && staffError.code === '42703' && staffError.message?.includes('staff_id')) {
            // console.log('Trying with alternate column name...');
            const { error: retry } = await supabase
              .from('project_staff')
              .update({
                working_dates_with_salary: staffEntry.workingDatesWithSalary,
                updated_at: new Date().toISOString()
              })
              .eq('staff_id', staffEntry.staffId);
              
            if (!retry) {
              // Success with alternate column
              updateError = null;
            }
          }
        } catch (err) {
          console.error('Error during staff update:', err);
          updateError = err;
        }
        
        const staffError = updateError;
        
        if (staffError) {
          // If we got a column not found error, try with staff_id instead (column name might be different)
          if (staffError.code === '42703' && staffError.message?.includes('staff_id')) {
            // console.log('Trying alternative column name for staff ID...');
            // Try with candidate_id (another common column name in the DB)
            const { error: retryError } = await supabase
              .from('project_staff')
              .update({
                working_dates_with_salary: staffEntry.workingDatesWithSalary,
                updated_at: new Date().toISOString()
              })
              .eq('candidate_id', staffEntry.staffId);
              
            if (retryError) {
              // If that didn't work either, try with just 'user_id' as a final option
              if (retryError.code === '42703') {
                const { error: finalRetryError } = await supabase
                .from('project_staff')
                .update({
                  working_dates_with_salary: staffEntry.workingDatesWithSalary,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', staffEntry.staffId);
                
                if (finalRetryError) {
                  console.error(`Error updating staff with final column attempt ${staffEntry.staffId}:`, finalRetryError);
                }
              } else {
                console.error(`Error updating staff with alternative ID ${staffEntry.staffId}:`, retryError);
              }
            }
          } else {
            console.error(`Error updating staff ${staffEntry.staffId}:`, staffError);
          }
        }
      } catch (staffErr) {
        console.error(`Error processing staff ${staffEntry.staffId}:`, staffErr);
      }
    }
    
    // Also update the project with the total payroll amount
    try {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          payroll_amount: payrollData.totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', payrollData.projectId);
      
      if (projectError) {
        console.error('Error updating project payroll amount:', projectError);
      }
    } catch (projErr) {
      console.error('Error processing project update:', projErr);
    }
    
    return { success: true, message: 'Project payroll saved successfully' };
  } catch (error) {
    console.error('Error saving project payroll:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to save project payroll',
      error 
    };
  }
}

/**
 * Get project payroll data
 */
export async function getProjectPayroll(projectId: string): Promise<{ 
  success: boolean; 
  data?: PayrollData; 
  message?: string; 
  error?: unknown 
}> {
  try {
    const { data, error } = await supabase
      .from('project_payroll')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    
    if (error) throw error;
    
    return { 
      success: true, 
      data: data ? {
        projectId: data.project_id,
        staffPayroll: data.staff_details || [],
        totalAmount: data.total_amount || 0,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined
      } : undefined 
    };
  } catch (error) {
    console.error('Error fetching project payroll:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch project payroll',
      error 
    };
  }
}