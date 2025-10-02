import { supabase } from './supabase';
import type {
  ExternalGig,
  ExternalGigFormData,
  GigCategory,
  UnifiedEarning,
  WorkerEarningsDashboard,
  WageCalculation
} from './external-gigs-types';

/**
 * External Gigs Service
 * Handles all operations for worker self-service gig tracking
 */

// =============================================
// GIG CATEGORIES
// =============================================

export async function getGigCategories(): Promise<GigCategory[]> {
  const { data, error } = await supabase
    .from('gig_categories')
    .select('*')
    .order('is_baito', { ascending: false })
    .order('name');

  if (error) {
    console.error('Error fetching gig categories:', error);
    throw error;
  }

  return data || [];
}

// =============================================
// EXTERNAL GIGS CRUD
// =============================================

export async function createExternalGig(
  candidateId: string,
  gigData: ExternalGigFormData
): Promise<ExternalGig> {
  const { data, error } = await supabase
    .from('external_gigs')
    .insert({
      candidate_id: candidateId,
      ...gigData,
      // total_earned will be calculated by trigger
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating external gig:', error);
    throw error;
  }

  return data;
}

export async function updateExternalGig(
  gigId: string,
  updates: Partial<ExternalGigFormData>
): Promise<ExternalGig> {
  const { data, error } = await supabase
    .from('external_gigs')
    .update(updates)
    .eq('id', gigId)
    .select()
    .single();

  if (error) {
    console.error('Error updating external gig:', error);
    throw error;
  }

  return data;
}

export async function deleteExternalGig(gigId: string): Promise<void> {
  const { error } = await supabase
    .from('external_gigs')
    .delete()
    .eq('id', gigId);

  if (error) {
    console.error('Error deleting external gig:', error);
    throw error;
  }
}

export async function getExternalGigs(
  candidateId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    status?: string;
  }
): Promise<ExternalGig[]> {
  let query = supabase
    .from('external_gigs')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('work_date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('work_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('work_date', filters.endDate);
  }

  if (filters?.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching external gigs:', error);
    throw error;
  }

  return data || [];
}

export async function getExternalGigById(gigId: string): Promise<ExternalGig | null> {
  const { data, error } = await supabase
    .from('external_gigs')
    .select('*')
    .eq('id', gigId)
    .single();

  if (error) {
    console.error('Error fetching external gig:', error);
    throw error;
  }

  return data;
}

// =============================================
// UNIFIED EARNINGS
// =============================================

export async function getUnifiedEarnings(
  candidateId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    source?: 'baito' | 'external';
  }
): Promise<UnifiedEarning[]> {
  let query = supabase
    .from('unified_earnings')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('work_date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('work_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('work_date', filters.endDate);
  }

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching unified earnings:', error);
    throw error;
  }

  return data || [];
}

export async function getWorkerEarningsDashboard(
  candidateId: string
): Promise<WorkerEarningsDashboard | null> {
  const { data, error } = await supabase
    .from('worker_earnings_dashboard')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();

  if (error) {
    console.error('Error fetching worker earnings dashboard:', error);
    throw error;
  }

  return data;
}

// =============================================
// WAGE CALCULATION HELPERS
// =============================================

export function calculateWage(calculation: WageCalculation): number {
  if (calculation.method === 'fixed') {
    return calculation.fixedAmount || 0;
  } else if (calculation.method === 'hourly') {
    return (calculation.hours || 0) * (calculation.rate || 0);
  }
  return 0;
}

export function validateGigData(data: ExternalGigFormData): string[] {
  const errors: string[] = [];

  if (!data.gig_name || data.gig_name.trim() === '') {
    errors.push('Gig name is required');
  }

  if (!data.work_date) {
    errors.push('Work date is required');
  }

  if (data.calculation_method === 'fixed') {
    if (!data.fixed_amount || data.fixed_amount <= 0) {
      errors.push('Fixed amount must be greater than 0');
    }
  } else if (data.calculation_method === 'hourly') {
    if (!data.hours_worked || data.hours_worked <= 0) {
      errors.push('Hours worked must be greater than 0');
    }
    if (!data.hourly_rate || data.hourly_rate <= 0) {
      errors.push('Hourly rate must be greater than 0');
    }
  }

  return errors;
}

// =============================================
// STATISTICS & INSIGHTS
// =============================================

export async function getExternalGigStats(candidateId: string) {
  const gigs = await getExternalGigs(candidateId);

  const totalEarned = gigs.reduce((sum, gig) => sum + gig.total_earned, 0);
  const totalGigs = gigs.length;

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const thisMonthGigs = gigs.filter(
    g => new Date(g.work_date) >= thisMonth
  );
  const thisMonthEarned = thisMonthGigs.reduce(
    (sum, gig) => sum + gig.total_earned,
    0
  );

  const categoryBreakdown = gigs.reduce((acc, gig) => {
    const category = gig.category_id || 'other';
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0 };
    }
    acc[category].count++;
    acc[category].total += gig.total_earned;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return {
    totalEarned,
    totalGigs,
    thisMonthEarned,
    thisMonthGigs: thisMonthGigs.length,
    avgPerGig: totalGigs > 0 ? totalEarned / totalGigs : 0,
    categoryBreakdown,
  };
}
