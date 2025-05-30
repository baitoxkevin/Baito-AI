import { supabase } from './supabase';
import { getUser } from './auth';

// User role hierarchy
export const USER_ROLES = {
  MANAGER: 'manager',
  EVENT_PIC: 'event_pic',
  STAFF: 'staff',
  USER: 'user'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Get user role from their metadata or database
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // First check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!userError && userData?.role) {
      return userData.role as UserRole;
    }

    // Fallback to auth metadata - use regular auth API
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user?.id === userId && user?.user_metadata?.role) {
      return user.user_metadata.role as UserRole;
    }

    // Default to staff if no role found
    return USER_ROLES.STAFF;
  } catch (error) {
    console.error('Error getting user role:', error);
    return USER_ROLES.STAFF;
  }
}

/**
 * Check if a user can approve another user's expense claims
 */
export async function canApproveExpenseClaim(
  approverId: string,
  claimantId: string
): Promise<boolean> {
  if (approverId === claimantId) {
    return false; // Can't approve own claims
  }

  const approverRole = await getUserRole(approverId);
  const claimantRole = await getUserRole(claimantId);

  // Manager can approve everyone (Event PIC and Staff)
  if (approverRole === USER_ROLES.MANAGER) {
    return true;
  }

  // Event PIC can only approve Staff
  if (approverRole === USER_ROLES.EVENT_PIC) {
    return claimantRole === USER_ROLES.STAFF;
  }

  // Staff and regular users cannot approve
  return false;
}

/**
 * Approve an expense claim
 */
export async function approveExpenseClaim(claimId: string): Promise<void> {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get the claim details
    const { data: claim, error: claimError } = await supabase
      .from('expense_claims')
      .select('*, receipts(*)')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      throw new Error('Expense claim not found');
    }

    // Check if user can approve this claim
    const canApprove = await canApproveExpenseClaim(currentUser.id, claim.created_by);
    if (!canApprove) {
      throw new Error('You do not have permission to approve this claim');
    }

    // Update the claim status
    const { error: updateError } = await supabase
      .from('expense_claims')
      .update({
        status: 'approved',
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', claimId);

    if (updateError) throw updateError;

    // If the claimant is staff, add to payroll
    const claimantRole = await getUserRole(claim.created_by);
    if (claimantRole === USER_ROLES.STAFF) {
      await addClaimToPayroll(claim);
    } else {
      // For non-staff (users), add to unpaid claims
      await addToUnpaidClaims(claim);
    }
  } catch (error) {
    console.error('Error approving expense claim:', error);
    throw error;
  }
}

/**
 * Add approved claim to staff payroll based on receipt date
 */
async function addClaimToPayroll(claim: unknown): Promise<void> {
  try {
    // Get the project staff record for this user
    let projectStaff: unknown;
    const { data: staffData, error: staffError } = await supabase
      .from('project_staff')
      .select('*')
      .eq('project_id', claim.project_id)
      .eq('staff_member_id', claim.created_by)
      .single();
    
    projectStaff = staffData;

    if (staffError && staffError.code !== 'PGRST116') {
      console.error('Error fetching project staff:', staffError);
      throw staffError;
    }

    if (!projectStaff) {
      // If no project_staff record exists, create one
      const { data: newStaff, error: insertError } = await supabase
        .from('project_staff')
        .insert({
          project_id: claim.project_id,
          staff_member_id: claim.created_by,
          working_dates_with_salary: []
        })
        .select()
        .single();

      if (insertError) throw insertError;
      projectStaff = newStaff;
    }

    // Get existing working dates with salary
    const workingDatesWithSalary = projectStaff.working_dates_with_salary || [];

    // Add expense claim amounts to the appropriate dates
    for (const receipt of claim.receipts || []) {
      const receiptDate = receipt.date || claim.expense_date;
      if (!receiptDate) continue;

      // Find or create entry for this date
      let dateEntry = workingDatesWithSalary.find((entry: unknown) => entry.date === receiptDate);
      
      if (!dateEntry) {
        dateEntry = {
          date: receiptDate,
          claims: 0,
          basicSalary: 0, // This would be set separately when staff actually works
          commission: 0
        };
        workingDatesWithSalary.push(dateEntry);
      }

      // Add the expense claim amount
      dateEntry.claims = (dateEntry.claims || 0) + (receipt.amount || claim.amount || 0);
      dateEntry.isExpenseApproved = true; // Mark as approved
    }

    // Sort dates to maintain consistency
    workingDatesWithSalary.sort((a: unknown, b: unknown) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Update the project_staff record
    const { error: updateError } = await supabase
      .from('project_staff')
      .update({
        working_dates_with_salary: workingDatesWithSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectStaff.id);

    if (updateError) throw updateError;

    // Also update the expense claim with approval details
    const { error: claimUpdateError } = await supabase
      .from('expense_claims')
      .update({
        is_added_to_payroll: true,
        payroll_updated_at: new Date().toISOString()
      })
      .eq('id', claim.id);

    if (claimUpdateError) {
      console.error('Error updating expense claim payroll status:', claimUpdateError);
    }
  } catch (error) {
    console.error('Error adding claim to payroll:', error);
    throw error;
  }
}

/**
 * Add approved claim to unpaid claims for non-staff users
 */
async function addToUnpaidClaims(claim: unknown): Promise<void> {
  try {
    const { error } = await supabase
      .from('unpaid_claims')
      .insert({
        user_id: claim.created_by,
        expense_claim_id: claim.id,
        amount: claim.amount,
        project_id: claim.project_id,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding to unpaid claims:', error);
    throw error;
  }
}