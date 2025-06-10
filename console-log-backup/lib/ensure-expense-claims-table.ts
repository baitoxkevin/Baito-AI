import { supabase } from './supabase';

let tableChecked = false;

/**
 * Simple function to check if expense_claims table exists without requiring RPC functions
 */
export async function ensureExpenseClaimsTable(): Promise<boolean> {
  if (tableChecked) return true;
  
  try {
    // First check if the table exists by trying to select from it
    const { error } = await supabase
      .from('expense_claims')
      .select('id')
      .limit(1);
      
    // If we get a 42P01 error, the table doesn't exist
    if (error && error.code === '42P01') {
      console.warn('Expense claims table does not exist');
      return false;
    }

    // Check if receipt_number field exists
    const { data: hasReceiptNumber, error: fieldError } = await supabase
      .from('expense_claims')
      .select('receipt_number')
      .limit(1);
      
    if (fieldError && (fieldError.message?.includes('receipt_number') || fieldError.code === 'PGRST204')) {
      console.warn('receipt_number field does not exist in expense_claims table');
      return false;
    }
    
    tableChecked = true;
    return true;
  } catch (error) {
    console.warn('Error checking expense claims table:', error);
    return false;
  }
}