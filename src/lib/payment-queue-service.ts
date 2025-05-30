import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

// Type definitions for status values
export type PaymentBatchStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'duitnow' | 'cash' | 'cheque';
export type PaymentApprovalAction = 'created' | 'approved' | 'rejected' | 'cancelled' | 'exported' | 'edited' | 'completed';

// Interface for batch creation parameters
export interface CreatePaymentBatchParams {
  projectId: string;
  paymentDate: Date;
  companyName: string;
  companyRegistrationNumber: string;
  companyBankAccount: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  payments: {
    staffId: string;
    staffName: string;
    bankCode?: string;
    bankAccountNumber?: string;
    amount: number;
    reference?: string;
    description?: string;
    paymentDetails?: Record<string, unknown>;
  }[];
}

// Interface for payment batch
export interface PaymentBatch {
  id: string;
  batch_reference: string;
  project_id: string;
  project_name?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string | Date;
  payment_date: string | Date;
  total_amount: number;
  status: PaymentBatchStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string | Date;
  exported_at?: string | Date;
  exported_by?: string;
  exported_by_name?: string;
  company_bank_account: string;
  company_name: string;
  company_registration_number: string;
  payment_method: PaymentMethod;
  notes?: string;
  items_count?: number;
}

// Interface for payment item
export interface PaymentItem {
  id: string;
  batch_id: string;
  staff_id: string;
  staff_name: string;
  bank_code?: string;
  bank_account_number?: string;
  amount: number;
  reference?: string;
  description?: string;
  status: PaymentBatchStatus;
  payment_details?: Record<string, unknown>;
  created_at: string | Date;
  updated_at: string | Date;
}

// Interface for payment approval history
export interface PaymentApprovalHistory {
  id: string;
  batch_id: string;
  user_id: string;
  user_email?: string;
  action: PaymentApprovalAction;
  notes?: string;
  created_at: string | Date;
}

// Interface for payment batch details
export interface PaymentBatchDetails extends PaymentBatch {
  payment_items: PaymentItem[];
}

// Interface for payment batch filtering
export interface PaymentBatchFilter {
  status?: PaymentBatchStatus;
  projectId?: string;
  createdBy?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Generate a unique batch reference for a new payment batch
 */
export function generateBatchReference(projectName: string, existingReferences: string[] = []): string {
  // Get first 10 letters of project name, remove spaces and special chars
  const projectPrefix = projectName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 10)
    .padEnd(10, 'X') || 'PROJECTXXX';
  
  // Find the highest number for this prefix
  let maxNumber = 0;
  existingReferences.forEach(ref => {
    if (ref.startsWith(projectPrefix + '-')) {
      const numberPart = ref.substring(projectPrefix.length + 1);
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  // Generate new reference with next number (padded to 2 digits)
  const nextNumber = maxNumber + 1;
  const paddedNumber = nextNumber.toString().padStart(2, '0');
  return `${projectPrefix}-${paddedNumber}`;
}

/**
 * Submit a new payment batch to the payment queue
 */
export async function submitPaymentBatch(
  projectId: string,
  paymentDate: Date,
  staffPayments: {
    staffId: string;
    staffName: string;
    bankCode?: string;
    bankAccountNumber?: string;
    amount: number;
    reference?: string;
    description?: string;
    workingDates?: string[];
    totalDays?: number;
    payrollDetails?: Record<string, unknown>;
  }[],
  companyDetails: {
    name: string;
    registrationNumber: string;
    bankAccount: string;
  },
  paymentMethod: PaymentMethod = "duitnow",
  notes?: string
): Promise<{ success: boolean; batchId?: string; error?: unknown }> {
  try {
    // Format payments for the database
    const formattedPayments = staffPayments.map(payment => ({
      staff_id: payment.staffId,
      staff_name: payment.staffName,
      bank_code: payment.bankCode || '',
      bank_account_number: payment.bankAccountNumber || '',
      amount: payment.amount,
      reference: payment.reference || `Salary payment for ${payment.staffName}`,
      description: payment.description || `Salary payment for project`,
      working_dates: payment.workingDates || [],
      total_days: payment.totalDays || 0,
      payroll_details: payment.payrollDetails || {}
    }));

    // Generate a batch reference
    const batchReference = generateBatchReference(projectId);

    // Format the payment date
    const formattedDate = format(paymentDate, 'yyyy-MM-dd');

    // Validate total amount
    const totalAmount = formattedPayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalAmount <= 0) {
      throw new Error('Invalid payment amount: Total amount must be greater than 0');
    }

    // Call the database function to submit the payment batch
    const { data, error } = await supabase.rpc('submit_payment_batch', {
      p_project_id: projectId,
      p_payment_date: formattedDate,
      p_batch_reference: batchReference,
      p_company_name: companyDetails.name,
      p_company_registration_number: companyDetails.registrationNumber,
      p_company_bank_account: companyDetails.bankAccount,
      p_payment_method: paymentMethod,
      p_payments: JSON.stringify(formattedPayments),
      p_notes: notes
    });

    if (error) throw error;
    
    return {
      success: data.success,
      batchId: data.batch_id,
      ...data
    };
  } catch (error) {
    console.error('Error submitting payment batch:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit payment batch'
    };
  }
}

/**
 * Fetch payment batches with optional filtering
 */
export async function fetchPaymentBatches(filter: PaymentBatchFilter = {}): Promise<{
  data: PaymentBatch[];
  count: number;
  error?: string;
}> {
  try {
    const {
      status,
      projectId,
      createdBy,
      fromDate,
      toDate,
      limit = 20,
      offset = 0
    } = filter;

    const { data, error, count } = await supabase
      .rpc('get_payment_batches', {
        p_status: status || null,
        p_project_id: projectId || null,
        p_created_by: createdBy || null,
        p_from_date: fromDate ? format(fromDate, 'yyyy-MM-dd') : null,
        p_to_date: toDate ? format(toDate, 'yyyy-MM-dd') : null,
        p_limit: limit,
        p_offset: offset
      })
      .select('*', { count: 'exact' });

    if (error) throw error;
    
    return {
      data: data || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Error fetching payment batches:', error);
    return {
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch payment batches'
    };
  }
}

/**
 * Get detailed information about a specific payment batch
 */
export async function getPaymentBatchDetails(batchId: string): Promise<{
  data?: PaymentBatchDetails;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_payment_batch_details', {
        p_batch_id: batchId
      })
      .single();

    if (error) throw error;
    
    return { data };
  } catch (error) {
    console.error('Error fetching payment batch details:', error);
    return {
      error: error.message || 'Failed to fetch payment batch details'
    };
  }
}

/**
 * Get the approval history for a payment batch
 */
export async function getPaymentBatchHistory(batchId: string): Promise<{
  data: PaymentApprovalHistory[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_payment_batch_history', {
        p_batch_id: batchId
      });

    if (error) throw error;
    
    return {
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching payment batch history:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch payment batch history'
    };
  }
}

/**
 * Approve a payment batch
 */
export async function approvePaymentBatch(
  batchId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Update the payment batch directly
    const { error } = await supabase
      .from('payment_batches')
      .update({
        status: 'approved',
        approved_by: user.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('status', 'pending'); // Only approve if pending

    if (error) throw error;

    // Log the approval action (ignore errors as the table might not exist)
    try {
      await supabase
        .from('payment_approval_history')
        .insert({
          batch_id: batchId,
          user_id: user.user.id,
          action: 'approved',
          notes: notes
        });
    } catch (historyError) {
      console.log('Could not log approval history:', historyError);
    }
    
    return {
      success: true
    };
  } catch (error: unknown) {
    console.error('Error approving payment batch:', error);
    return {
      success: false,
      error: error.message || 'Failed to approve payment batch'
    };
  }
}

/**
 * Reject a payment batch
 */
export async function rejectPaymentBatch(
  batchId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Update the payment batch directly
    const { error } = await supabase
      .from('payment_batches')
      .update({
        status: 'rejected',
        approved_by: user.user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .eq('status', 'pending'); // Only reject if pending

    if (error) throw error;

    // Log the rejection action (ignore errors as the table might not exist)
    try {
      await supabase
        .from('payment_approval_history')
        .insert({
          batch_id: batchId,
          user_id: user.user.id,
          action: 'rejected',
          notes: notes
        });
    } catch (historyError) {
      console.log('Could not log rejection history:', historyError);
    }
    
    return {
      success: true
    };
  } catch (error: unknown) {
    console.error('Error rejecting payment batch:', error);
    return {
      success: false,
      error: error.message || 'Failed to reject payment batch'
    };
  }
}

/**
 * Mark a payment batch as exported
 */
export async function markPaymentBatchExported(
  batchId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('mark_payment_batch_exported', {
        p_batch_id: batchId,
        p_notes: notes
      });

    if (error) throw error;
    
    return {
      success: data.success
    };
  } catch (error) {
    console.error('Error marking payment batch as exported:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark payment batch as exported'
    };
  }
}

/**
 * Mark a payment batch as completed
 */
export async function markPaymentBatchCompleted(
  batchId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('mark_payment_batch_completed', {
        p_batch_id: batchId,
        p_notes: notes
      });

    if (error) throw error;
    
    return {
      success: data.success
    };
  } catch (error) {
    console.error('Error marking payment batch as completed:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark payment batch as completed'
    };
  }
}

/**
 * Get payment batches for a specific project
 */
export async function getProjectPaymentBatches(
  projectId: string,
  status?: PaymentBatchStatus,
  limit: number = 20,
  offset: number = 0
): Promise<{
  data: PaymentBatch[];
  count: number;
  error?: string;
}> {
  return fetchPaymentBatches({
    projectId,
    status,
    limit,
    offset
  });
}

/**
 * Get payment batches created by a specific user
 */
export async function getUserPaymentBatches(
  userId: string,
  status?: PaymentBatchStatus,
  limit: number = 20,
  offset: number = 0
): Promise<{
  data: PaymentBatch[];
  count: number;
  error?: string;
}> {
  return fetchPaymentBatches({
    createdBy: userId,
    status,
    limit,
    offset
  });
}

/**
 * Get pending payment batches that need approval
 */
export async function getPendingPaymentBatches(
  limit: number = 20,
  offset: number = 0
): Promise<{
  data: PaymentBatch[];
  count: number;
  error?: string;
}> {
  return fetchPaymentBatches({
    status: 'pending',
    limit,
    offset
  });
}

/**
 * Calculate total amount for a batch from individual payments
 */
export function calculateBatchTotal(payments: { amount: number }[]): number {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Format payment data for DuitNow CSV export
 */
export function formatDuitNowCsvData(
  batch: PaymentBatchDetails,
  includeStaffWithoutBankDetails: boolean = false
): string {
  // Format the payment date
  const formattedPaymentDate = format(new Date(batch.payment_date), 'yyyyMMdd');
  
  // Header row for DuitNow CSV
  const header = [
    'PAYMENT_TYPE',
    'PAYMENT_CURRENCY',
    'PAYMENT_AMOUNT',
    'PAYMENT_DATE',
    'BENEFICIARY_NAME',
    'BENEFICIARY_ID_TYPE',
    'BENEFICIARY_ID',
    'PAYMENT_DETAILS1',
    'PAYMENT_DETAILS2',
    'PAYMENT_DETAILS3',
    'PAYMENT_DETAILS4',
    'EMAIL',
    'MOBILE_NO'
  ].join(',');
  
  // Filter eligible payments
  const eligiblePayments = batch.payment_items.filter(item => 
    includeStaffWithoutBankDetails || (item.bank_code && item.bank_account_number)
  );
  
  // Generate data rows
  const dataRows = eligiblePayments.map(item => {
    const paymentDetails1 = `Salary for ${batch.project_name || 'Project'} - ${format(new Date(batch.payment_date), 'MMM yyyy')}`;
    const paymentDetails2 = item.payment_details?.total_days ? `${item.payment_details.total_days} days worked` : '';
    
    // Format bank account ID based on bank code
    const beneficiaryId = item.bank_account_number ? item.bank_account_number.replace(/\s+/g, '') : '';
    
    // Check if bank code is available, otherwise use a placeholder
    const bankCode = item.bank_code || (includeStaffWithoutBankDetails ? 'MISSING' : '');
    
    return [
      'IBG', // PAYMENT_TYPE: Interbank GIRO
      'MYR', // PAYMENT_CURRENCY: Malaysian Ringgit
      item.amount.toFixed(2), // PAYMENT_AMOUNT
      formattedPaymentDate, // PAYMENT_DATE in YYYYMMDD format
      item.staff_name, // BENEFICIARY_NAME
      'A', // BENEFICIARY_ID_TYPE: A for Account Number
      beneficiaryId ? `${bankCode}${beneficiaryId}` : '', // BENEFICIARY_ID
      paymentDetails1, // PAYMENT_DETAILS1
      paymentDetails2, // PAYMENT_DETAILS2
      '', // PAYMENT_DETAILS3
      '', // PAYMENT_DETAILS4
      item.payment_details?.email || '', // EMAIL
      item.payment_details?.phone || '' // MOBILE_NO
    ].join(',');
  });
  
  // Combine header and data rows
  return [header, ...dataRows].join('\n');
}

/**
 * Get statistics for payment batches
 */
export async function getPaymentBatchStatistics(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
  completed: number;
  cancelled: number;
  total: number;
  totalAmount: number;
  error?: string;
}> {
  try {
    // Get counts for each status
    const pending = await getPaymentBatchesByStatusCount('pending');
    const approved = await getPaymentBatchesByStatusCount('approved');
    const rejected = await getPaymentBatchesByStatusCount('rejected');
    const processing = await getPaymentBatchesByStatusCount('processing');
    const completed = await getPaymentBatchesByStatusCount('completed');
    const cancelled = await getPaymentBatchesByStatusCount('cancelled');
    
    // Get total amount for all batches
    const { data } = await supabase
      .from('payment_batches')
      .select('total_amount');
    
    const totalAmount = data?.reduce((sum, batch) => sum + parseFloat(batch.total_amount), 0) || 0;
    
    return {
      pending,
      approved,
      rejected,
      processing,
      completed,
      cancelled,
      total: pending + approved + rejected + processing + completed + cancelled,
      totalAmount
    };
  } catch (error) {
    console.error('Error fetching payment batch statistics:', error);
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
      totalAmount: 0,
      error: error.message || 'Failed to fetch payment batch statistics'
    };
  }
}

/**
 * Get the count of payment batches with a specific status
 */
export async function getPaymentBatchesByStatusCount(status: PaymentBatchStatus): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('payment_batches')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);
      
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error(`Error fetching ${status} payment batches count:`, error);
    return 0;
  }
}

/**
 * Cancel a payment batch (available for pending batches only)
 */
export async function cancelPaymentBatch(
  batchId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if the batch is in pending status
    const { data: batch, error: fetchError } = await supabase
      .from('payment_batches')
      .select('status')
      .eq('id', batchId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (batch.status !== 'pending') {
      return {
        success: false,
        error: 'Only pending batches can be cancelled'
      };
    }
    
    // Update the batch status
    const { error: updateError } = await supabase
      .from('payment_batches')
      .update({ status: 'cancelled' })
      .eq('id', batchId);
      
    if (updateError) throw updateError;
    
    // Update all payment items to cancelled
    const { error: itemsError } = await supabase
      .from('payment_items')
      .update({ status: 'cancelled' })
      .eq('batch_id', batchId);
      
    if (itemsError) throw itemsError;
    
    // Record the action in the approval history
    const { error: historyError } = await supabase
      .from('payment_approval_history')
      .insert({
        batch_id: batchId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'cancelled',
        notes
      });
      
    if (historyError) throw historyError;
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error cancelling payment batch:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel payment batch'
    };
  }
}

/**
 * Update notes for a payment batch
 */
export async function updatePaymentBatchNotes(
  batchId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_batches')
      .update({ notes })
      .eq('id', batchId);
      
    if (error) throw error;
    
    // Record the action in the approval history
    const { error: historyError } = await supabase
      .from('payment_approval_history')
      .insert({
        batch_id: batchId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'edited',
        notes: `Updated batch notes`
      });
      
    if (historyError) throw historyError;
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating payment batch notes:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment batch notes'
    };
  }
}