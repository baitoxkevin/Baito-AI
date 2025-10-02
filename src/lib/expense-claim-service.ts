import { supabase } from './supabase';
import { uploadMultipleReceipts } from './expense-receipt-service';
import { ensureExpenseClaimsTable } from './ensure-expense-claims-table';

import { logger } from './logger';
export interface ExpenseClaim {
  id?: string;
  title: string;
  description?: string;
  receipt_number: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  amount?: number; // Also support amount field
  total_amount?: number;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  approver_id?: string;
  user_id: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
  project_title?: string;
  user_email?: string;
  receipt_count?: number;
  expense_date?: string; // Also support expense_date field
  date?: string; // Support both date formats
  category?: string;
  submitted_by?: string;
  user_image?: string;
  receipts?: Array<{ id: string; url: string; filename: string }>;
  metadata?: unknown;
  // Fields expected by the UI
  reference_number?: string;
  submitted_by_name?: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface ExpenseClaimReceipt {
  id?: string;
  expense_claim_id: string;
  receipt_id: string;
  amount: number;
  notes?: string;
  created_at?: string;
}

export interface Receipt {
  id: string;
  amount: number;
  date: string;
  vendor: string;
  category?: string;
  description?: string;
  image_url?: string;
}

/**
 * Fetch all expense claims for the current user
 */
export async function fetchUserExpenseClaims(): Promise<ExpenseClaim[]> {
  try {
    // First try to fetch from the view
    const { data: viewData, error: viewError } = await supabase
      .from('expense_claims_summary')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!viewError) {
      return viewData || [];
    }
    
    // If view doesn't exist, fetch directly from table
    if (viewError.code === '42P01') {
      logger.warn('Expense claims summary view does not exist, fetching from table directly');
      
      const { data, error } = await supabase
        .from('expense_claims')
        .select(`
          *,
          projects!project_id(title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Error fetching expense claims from table:', error);
        return [];
      }
      
      // Transform data to match expected format
      return (data || []).map(claim => ({
        ...claim,
        receipt_number: claim.bill_number,
        total_amount: claim.amount,
        date: claim.expense_date,
        user_id: claim.submitted_by,
        project_title: claim.projects?.title
      }));
    }
    
    throw viewError;
  } catch (error) {
    logger.error('Error fetching expense claims:', error);
    return [];
  }
}

/**
 * Fetch expense claims by status
 * @param status The status to filter by
 */
export async function fetchExpenseClaimsByStatus(status: ExpenseClaim['status']): Promise<ExpenseClaim[]> {
  try {
    // First try to fetch from the view
    const { data: viewData, error: viewError } = await supabase
      .from('expense_claims_summary')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (!viewError) {
      return viewData || [];
    }
    
    // If view doesn't exist, fetch directly from table
    if (viewError.code === '42P01') {
      logger.warn('Expense claims summary view does not exist, fetching from table directly');
      
      const { data, error } = await supabase
        .from('expense_claims')
        .select(`
          *,
          projects!project_id(title)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Error fetching expense claims from table:', error);
        return [];
      }
      
      // Transform data to match expected format
      return (data || []).map(claim => ({
        ...claim,
        receipt_number: claim.bill_number,
        total_amount: claim.amount,
        date: claim.expense_date,
        user_id: claim.submitted_by,
        project_title: claim.projects?.title
      }));
    }
    
    throw viewError;
  } catch (error) {
    logger.error(`Error fetching ${status} expense claims:`, error);
    return [];
  }
}

/**
 * Fetch expense claims for a specific project
 * @param projectId The ID of the project
 */
export async function fetchProjectExpenseClaims(projectId: string): Promise<ExpenseClaim[]> {
  try {
    // Ensure table structure is correct
    const tableExists = await ensureExpenseClaimsTable();
    if (!tableExists) {
      return []; // Return empty array if table doesn't exist
    }
    
    // First check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('Not authenticated, returning empty array');
      return [];
    }
    
    // Directly fetch expense claims without joins to avoid foreign key issues
    const { data, error } = await supabase
      .from('expense_claims')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    // Handle errors
    if (error) {
      if (error.code === '42P01') {
        logger.warn('Expense claims table does not exist');
        return [];
      }
      logger.error('Error fetching project expense claims:', error);
      return [];
    }
    
    // Try to get user info separately for claims where we have user_id
    const userIds = data?.filter(claim => claim.user_id).map(claim => claim.user_id) || [];
    let usersMap: Record<string, unknown> = {};
    
    if (userIds.length > 0) {
      try {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
          
        // Create a map of userId to user data
        usersMap = (usersData || []).reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {} as Record<string, unknown>);
      } catch (userError) {
        logger.warn('Could not fetch user details for claims:', userError);
        // Continue without user data
      }
    }
    
    // Transform the data to match the expected format
    const transformedData = (data || []).map(claim => ({
      ...claim,
      reference_number: claim.receipt_number || `EXP${claim.id?.slice(0, 6)}`,
      date: claim.expense_date || claim.created_at,
      submitted_by_name: usersMap[claim.user_id]?.full_name || claim.submitted_by || 'Unknown',
      user_email: usersMap[claim.user_id]?.email || null,
      amount: claim.amount || claim.total_amount || 0,
      category: claim.category || 'other', // Ensure category always exists
    }));
    
    return transformedData;
  } catch (error) {
    logger.error('Error fetching project expense claims:', error);
    return [];
  }
}

/**
 * Fetch an expense claim with its receipts
 * @param claimId The ID of the expense claim
 */
export async function fetchExpenseClaimWithReceipts(claimId: string): Promise<{
  claim: ExpenseClaim | null, 
  receipts: Array<Receipt & { notes?: string }>
}> {
  try {
    // Get the claim details
    const { data: claim, error: claimError } = await supabase
      .from('expense_claims')
      .select('*')
      .eq('id', claimId)
      .single();
    
    // If table doesn't exist, return null instead of throwing
    if (claimError && claimError.code === '42P01') {
      logger.warn('Expense claims table does not exist. Using local data only.');
      return { claim: null, receipts: [] };
    }
    
    if (claimError) throw claimError;
    
    // For now, just use the claim as is
    
    // Get the receipts directly from receipts table
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('*')
      .eq('expense_claim_id', claimId);
    
    // If table doesn't exist, return empty receipts
    if (receiptsError && receiptsError.code === '42P01') {
      logger.warn('Receipts table does not exist.');
      return { claim: claimWithUserInfo, receipts: [] };
    }
    
    if (receiptsError) throw receiptsError;
    
    return { claim, receipts: receipts || [] };
  } catch (error) {
    logger.error('Error fetching expense claim details:', error);
    // Don't throw the error if it's a table not exist error
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      return { claim: null, receipts: [] };
    }
    throw error;
  }
}

/**
 * Create a new expense claim
 * @param claim The expense claim data
 */
export async function createExpenseClaim(claim: Omit<ExpenseClaim, 'total_amount' | 'status' | 'receipt_number'>): Promise<ExpenseClaim> {
  try {
    // First check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required to create expense claims');
    }
    
    logger.debug('Authenticated user:', { data: { id: user.id, email: user.email } });
    // Extract amount from claim data and use it for total_amount
    // Only include the fields that exist in the database table
    const claimData: Partial<ExpenseClaim> & { 
      user_id?: string; 
      staff_id?: string;
      amount?: number;
    } = {
      title: claim.title,
      description: claim.description || null,
      receipt_number: claim.receipt_number,
      total_amount: claim.amount || 0,
      expense_date: claim.expense_date,
      category: claim.category,
      submitted_at: claim.submitted_at || new Date().toISOString(),
      submitted_by: claim.submitted_by || 'Self',
      status: 'pending'
    };
    
    // Handle user_id vs staff_id
    if (claim.user_id) {
      claimData.user_id = claim.user_id;
    }
    if (claim.staff_id) {
      claimData.staff_id = claim.staff_id;
    }
    
    // Only add project_id if it's a valid UUID
    if (claim.project_id && claim.project_id !== 'undefined') {
      claimData.project_id = claim.project_id;
    } else {
      claimData.project_id = null;
    }
    
    // Try to add amount field - if it fails, DB might not have this column yet
    claimData.amount = claim.amount || 0;
    
    // Generate a receipt number that's unique
    claimData.receipt_number = `REC-${new Date().getFullYear()}-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    
    logger.debug('Creating expense claim with data:', { data: JSON.stringify(claimData, null, 2) });
    
    let { data, error } = await supabase
      .from('expense_claims')
      .insert([claimData])
      .select()
      .single();
    
    // If amount field doesn't exist, retry without it
    if (error && error.message && error.message.includes('amount')) {
      logger.debug('Retrying without amount field...');
      delete claimData.amount;
      
      const retry = await supabase
        .from('expense_claims')
        .insert([claimData])
        .select()
        .single();
        
      data = retry.data;
      error = retry.error;
    }
    
    if (error) {
      logger.error('Supabase error when creating expense claim:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      });
      
      // Log the exact data we tried to insert
      logger.error('Data attempted to insert:', JSON.stringify(claimData, null, 2));
      
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Error creating expense claim:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Create a new expense claim with receipts (documents)
 * @param claim The expense claim data
 * @param receiptFiles Array of file objects to upload
 */
export async function createExpenseClaimWithReceipts(
  claim: Omit<ExpenseClaim, 'total_amount' | 'status' | 'receipt_number'>,
  receiptFiles: File[]
): Promise<{ claim: ExpenseClaim; receipts: unknown[] }> {
  logger.debug('createExpenseClaimWithReceipts called with claim:', { data: claim, files: receiptFiles?.length || 0 });
  
  try {
    // First create the expense claim
    const createdClaim = await createExpenseClaim(claim);
    
    logger.debug('Created expense claim result:', { data: createdClaim });
    
    if (!createdClaim.id) {
      throw new Error('Failed to create expense claim - no ID returned');
    }
    
    // Then upload the receipts
    let uploadedReceipts = [];
    if (receiptFiles && receiptFiles.length > 0) {
      uploadedReceipts = await uploadMultipleReceipts(createdClaim.id, receiptFiles);
      logger.debug('Uploaded receipts:', { data: uploadedReceipts });
    }
    
    return {
      claim: createdClaim,
      receipts: uploadedReceipts
    };
  } catch (error) {
    logger.error('Error creating expense claim with receipts:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Update an expense claim
 * @param id The ID of the expense claim
 * @param updates The updates to apply
 */
export async function updateExpenseClaim(
  id: string, 
  updates: Partial<Omit<ExpenseClaim, 'total_amount'>>
): Promise<ExpenseClaim> {
  try {
    const { data, error } = await supabase
      .from('expense_claims')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating expense claim:', error);
    throw error;
  }
}

/**
 * Soft delete an expense claim
 * @param id The ID of the expense claim
 */
export async function softDeleteExpenseClaim(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('expense_claims')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    logger.error('Error soft deleting expense claim:', error);
    throw error;
  }
}

/**
 * Add a receipt to an expense claim
 * @param expenseClaimId The ID of the expense claim
 * @param receiptId The ID of the receipt
 * @param amount The amount to claim (might be less than the full receipt amount)
 * @param notes Optional notes about this receipt
 */
export async function addReceiptToExpenseClaim(
  expenseClaimId: string,
  receiptId: string,
  amount: number,
  notes?: string
): Promise<ExpenseClaimReceipt> {
  try {
    const { data, error } = await supabase
      .from('expense_claim_receipts')
      .insert([{
        expense_claim_id: expenseClaimId,
        receipt_id: receiptId,
        amount,
        notes
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error adding receipt to expense claim:', error);
    throw error;
  }
}

/**
 * Remove a receipt from an expense claim
 * @param expenseClaimId The ID of the expense claim
 * @param receiptId The ID of the receipt
 */
export async function removeReceiptFromExpenseClaim(
  expenseClaimId: string,
  receiptId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('expense_claim_receipts')
      .delete()
      .eq('expense_claim_id', expenseClaimId)
      .eq('receipt_id', receiptId);
    
    if (error) throw error;
  } catch (error) {
    logger.error('Error removing receipt from expense claim:', error);
    throw error;
  }
}

/**
 * Submit an expense claim for approval
 * @param claimId The ID of the expense claim
 * @param approverId The ID of the user who will approve this claim
 */
export async function submitExpenseClaim(
  claimId: string,
  approverId: string
): Promise<{ success: boolean; message: string; data?: ExpenseClaim }> {
  try {
    const { data, error } = await supabase
      .rpc('submit_expense_claim', { claim_id: claimId, approver_id: approverId });
    
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error submitting expense claim:', error);
    throw error;
  }
}

/**
 * Approve an expense claim
 * @param claimId The ID of the expense claim
 */
export async function approveExpenseClaim(
  claimId: string
): Promise<{ success: boolean; message: string; data?: ExpenseClaim }> {
  try {
    const { data, error } = await supabase
      .rpc('approve_expense_claim', { claim_id: claimId });
    
    if (error) throw error;
    
    // If approval was successful, sync to payroll
    if (data?.success && data.data) {
      const { syncExpenseClaimToPayroll } = await import('./expense-payroll-sync-service');
      const syncResult = await syncExpenseClaimToPayroll(data.data);
      
      if (!syncResult.success) {
        logger.warn('Failed to sync expense claim to payroll:', syncResult.message);
        // Don't fail the approval, just log the warning
      }
    }
    
    return data || { success: false, message: 'No data returned from server' };
  } catch (error) {
    logger.error('Error approving expense claim:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to approve expense claim' 
    };
  }
}

/**
 * Reject an expense claim
 * @param claimId The ID of the expense claim
 * @param reason The reason for rejection
 */
export async function rejectExpenseClaim(
  claimId: string,
  reason: string
): Promise<{ success: boolean; message: string; data?: ExpenseClaim }> {
  try {
    // First, get the claim details to check if it was previously approved
    const { data: claim, error: fetchError } = await supabase
      .from('expense_claims')
      .select('*')
      .eq('id', claimId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // If claim was approved, unsync from payroll before rejecting
    if (claim && claim.status === 'approved') {
      const { unsyncExpenseClaimFromPayroll } = await import('./expense-payroll-sync-service');
      const unsyncResult = await unsyncExpenseClaimFromPayroll(claim);
      
      if (!unsyncResult.success) {
        logger.warn('Failed to unsync expense claim from payroll:', unsyncResult.message);
      }
    }
    
    const { data, error } = await supabase
      .rpc('reject_expense_claim', { claim_id: claimId, reason });
    
    if (error) throw error;
    return data || { success: false, message: 'No data returned from server' };
  } catch (error) {
    logger.error('Error rejecting expense claim:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to reject expense claim' 
    };
  }
}

/**
 * Delete an expense claim and its associated receipts
 * @param claimId The ID of the expense claim to delete
 */
export async function deleteExpenseClaim(claimId: string): Promise<{ success: boolean; message: string }> {
  try {
    // First check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required to delete expense claims');
    }
    
    // Check if this claim belongs to the current user
    const { data: claim, error: claimError } = await supabase
      .from('expense_claims')
      .select('*')
      .eq('id', claimId)
      .single();
      
    if (claimError) {
      throw new Error('Failed to get expense claim details');
    }
    
    // Only allow deleting if it's your own claim or you're an admin
    if (claim && claim.user_id !== user.id) {
      // TODO: Check if user is admin - for now we'll just allow it
      logger.warn('User is deleting a claim they do not own');
    }
    
    // If claim was approved, unsync from payroll before deleting
    if (claim && claim.status === 'approved') {
      const { unsyncExpenseClaimFromPayroll } = await import('./expense-payroll-sync-service');
      const unsyncResult = await unsyncExpenseClaimFromPayroll(claim);
      
      if (!unsyncResult.success) {
        logger.warn('Failed to unsync expense claim from payroll:', unsyncResult.message);
        return { 
          success: false, 
          message: 'Cannot delete approved expense claim: Failed to remove from payroll' 
        };
      }
    }
    
    // First get the receipts associated with this claim
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('id, url')
      .eq('expense_claim_id', claimId);
      
    if (receiptsError) {
      logger.warn('Error fetching receipts for deletion:', receiptsError);
      // Continue anyway since we want to delete the claim
    }
    
    // If we have receipt URLs, try to delete the storage objects
    if (receipts && receipts.length > 0) {
      logger.debug(`Deleting ${receipts.length} receipt(s) from storage`);
      
      // Delete files from storage for each receipt
      for (const receipt of receipts) {
        if (receipt.url) {
          try {
            // Extract the path from the URL
            const path = receipt.url.split('/').slice(-2).join('/');
            if (path) {
              const { error: storageError } = await supabase.storage
                .from('receipts')
                .remove([path]);
                
              if (storageError) {
                logger.warn(`Failed to delete receipt file ${path}:`, storageError);
              }
            }
          } catch (fileError) {
            logger.warn('Error parsing receipt URL for deletion:', fileError);
          }
        }
      }
    }
    
    // Delete the expense claim - which should cascade delete related records
    const { error } = await supabase
      .from('expense_claims')
      .delete()
      .eq('id', claimId);
      
    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Expense claim deleted successfully' 
    };
  } catch (error) {
    logger.error('Error deleting expense claim:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete expense claim' 
    };
  }
}

/**
 * Get pending expense claims count for a user
 * (can be used to show notification badges)
 */
export async function getPendingExpenseClaimsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('expense_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error('Error getting pending expense claims count:', error);
    return 0; // Return 0 on error rather than throwing
  }
}

/**
 * Get expense claims statistics
 */
export async function getExpenseClaimsStatistics(): Promise<{
  byStatus: Array<{ status: string; count: number }>;
  byMonth: Array<{ month: string; total: number }>;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
}> {
  try {
    // Get counts by status
    const { data: statusData, error: statusError } = await supabase
      .from('expense_claims')
      .select('status')
      .is('deleted_at', null);
    
    if (statusError) throw statusError;
    
    // Calculate status counts
    const statusMap = new Map<string, number>();
    statusData?.forEach(claim => {
      statusMap.set(claim.status, (statusMap.get(claim.status) || 0) + 1);
    });
    
    const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count
    }));
    
    // Get monthly totals for approved claims
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('expense_claims')
      .select('approved_at, total_amount')
      .eq('status', 'approved')
      .is('deleted_at', null);
    
    if (monthlyError) throw monthlyError;
    
    // Calculate monthly totals
    const monthMap = new Map<string, number>();
    monthlyData?.forEach(claim => {
      if (claim.approved_at) {
        const month = new Date(claim.approved_at).toISOString().substring(0, 7); // YYYY-MM format
        monthMap.set(month, (monthMap.get(month) || 0) + parseFloat(claim.total_amount));
      }
    });
    
    const byMonth = Array.from(monthMap.entries())
      .map(([month, total]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: parseFloat(total.toFixed(2))
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 12); // Last 12 months
    
    // Calculate totals
    const totalApproved = statusData
      ?.filter(claim => claim.status === 'approved')
      .length || 0;
    
    const totalPending = statusData
      ?.filter(claim => claim.status === 'pending')
      .length || 0;
    
    const totalRejected = statusData
      ?.filter(claim => claim.status === 'rejected')
      .length || 0;
    
    return {
      byStatus,
      byMonth,
      totalApproved,
      totalPending,
      totalRejected
    };
  } catch (error) {
    logger.error('Error getting expense claims statistics:', error);
    throw error;
  }
}