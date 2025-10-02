// External Gigs Self-Service Tracking - TypeScript Types

export interface GigCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  is_baito: boolean;
  created_at: string;
}

export type CalculationMethod = 'fixed' | 'hourly' | 'project';
export type GigStatus = 'pending' | 'completed' | 'verified' | 'disputed';
export type VerificationStatus = 'self_reported' | 'pending' | 'verified' | 'rejected';

export interface ExternalGig {
  id: string;
  candidate_id: string;

  // Basic Info
  gig_name: string;
  client_name?: string;
  category_id?: string;
  gig_type?: string;
  status: GigStatus;

  // Flexible Wage Calculation
  calculation_method: CalculationMethod;
  hours_worked?: number;
  hourly_rate?: number;
  fixed_amount?: number;
  total_earned: number;

  // Work Details
  work_date: string;
  notes?: string;

  // Verification
  requires_verification: boolean;
  verification_status: VerificationStatus;
  receipt_url?: string;

  // Timestamps
  date_submitted: string;
  created_at: string;
  updated_at: string;
}

export interface UnifiedEarning {
  source: 'baito' | 'external';
  candidate_id: string;
  gig_id: string;
  gig_name: string;
  gig_type: string;
  amount: number;
  work_date: string;
  verification_status: string;
  created_at: string;
  client_name?: string;
  hours_worked?: number;
  hourly_rate?: number;
}

export interface WorkerEarningsDashboard {
  candidate_id: string;
  full_name: string;
  email: string;

  // Baito earnings
  baito_total: number;
  baito_gigs_count: number;

  // External earnings
  external_total: number;
  external_gigs_count: number;

  // Combined totals
  total_earnings: number;
  total_gigs_count: number;

  // This month totals
  baito_this_month: number;
  external_this_month: number;
  total_this_month: number;
}

// Form data for creating/updating external gigs
export interface ExternalGigFormData {
  gig_name: string;
  client_name?: string;
  category_id?: string;
  gig_type?: string;
  calculation_method: CalculationMethod;
  hours_worked?: number;
  hourly_rate?: number;
  fixed_amount?: number;
  work_date: string;
  notes?: string;
  requires_verification?: boolean;
  receipt_url?: string;
}

// Helper type for wage calculation preview
export interface WageCalculation {
  method: CalculationMethod;
  hours?: number;
  rate?: number;
  fixedAmount?: number;
  total: number;
}
