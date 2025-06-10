import { supabase } from './supabase';
import { ensureExpenseClaimsTable } from './ensure-expense-claims-table';

import { logger } from './logger';
/**
 * Simplified function to handle expense claims with robust error handling
 */
export async function fetchProjectExpenseClaimsWithFallback(projectId: string): Promise<any[]> {
  try {
    // Check if table exists
    const tableExists = await ensureExpenseClaimsTable();
    if (!tableExists) {
      logger.warn('Expense claims table does not exist');
      return []; // Return empty array if table doesn't exist
    }
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Not authenticated for expense claims');
      return [];
    }

    // Query with joins to get staff and user names
    const { data, error } = await supabase
      .from('expense_claims')
      .select(`
        *,
        staff:candidates!staff_id(
          id,
          full_name
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // If table doesn't exist, return empty array
    if (error && error.code === '42P01') {
      logger.warn('Expense claims table does not exist');
      return [];
    }

    // If any other error, return empty array
    if (error) {
      logger.error('Error fetching expense claims:', error);
      return [];
    }

    // Try to get user info separately
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

    // Transform data to match UI expectations
    return (data || []).map(claim => ({
      ...claim,
      // Map database fields to UI fields
      reference_number: claim.receipt_number || `EXP${claim.id?.substring(0, 6)}`,
      date: claim.expense_date || claim.created_at,
      submitted_by_name: claim.user?.full_name || usersMap[claim.user_id]?.full_name || claim.submitted_by || 'Unknown',
      user_email: claim.user?.email || usersMap[claim.user_id]?.email || null,
      staff_name: claim.staff?.full_name || null,
      amount: claim.amount || claim.total_amount || 0,
      category: claim.category || 'other',
      status: claim.status || 'pending',
      title: claim.title || 'Untitled',
    }));
  } catch (error) {
    logger.error('Unexpected error fetching expense claims:', error);
    return [];
  }
}