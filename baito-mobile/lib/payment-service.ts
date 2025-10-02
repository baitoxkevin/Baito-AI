import { supabase } from './supabase';

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface WorkerEarning {
  id: string;
  candidate_id: string;
  project_id: string;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  bonus: number;
  deductions: number;
  total_earnings: number;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed';
  payment_method?: 'bank_transfer' | 'cash' | 'e_wallet' | 'check';
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentBatch {
  id: string;
  batch_number: string;
  total_amount: number;
  total_workers: number;
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: 'bank_transfer' | 'cash' | 'e_wallet' | 'check';
  scheduled_date?: string;
  completed_date?: string;
  created_by?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentBatchItem {
  id: string;
  batch_id: string;
  earning_id: string;
  candidate_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  candidate_id: string;
  earning_id: string;
  batch_id?: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed';
  transaction_id?: string;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface SalaryConfiguration {
  id: string;
  role: string;
  base_hourly_rate: number;
  overtime_multiplier: number;
  night_shift_bonus: number;
  weekend_bonus: number;
  minimum_hours: number;
  maximum_hours: number;
  created_at: string;
  updated_at: string;
}

export interface WorkerEarningSummary {
  candidate_id: string;
  full_name: string;
  email: string;
  phone: string;
  total_projects_paid: number;
  total_earnings: number;
  total_paid: number;
  total_pending: number;
  avg_earnings_per_project: number;
}

// =============================================
// PAYMENT SERVICE CLASS
// =============================================

class PaymentService {

  // =============================================
  // 1. WORKER EARNINGS
  // =============================================

  async calculateWorkerEarnings(candidateId: string, projectId: string): Promise<string> {
    const { data, error } = await supabase.rpc('calculate_worker_earnings', {
      p_candidate_id: candidateId,
      p_project_id: projectId,
    });

    if (error) {
      console.error('Error calculating worker earnings:', error);
      throw error;
    }

    return data as string;
  }

  async getWorkerEarnings(candidateId?: string, status?: string): Promise<WorkerEarning[]> {
    let query = supabase
      .from('worker_earnings')
      .select('*')
      .order('created_at', { ascending: false });

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }

    if (status) {
      query = query.eq('payment_status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching worker earnings:', error);
      throw error;
    }

    return data || [];
  }

  async updateWorkerEarning(
    earningId: string,
    updates: Partial<WorkerEarning>
  ): Promise<WorkerEarning> {
    const { data, error } = await supabase
      .from('worker_earnings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', earningId)
      .select()
      .single();

    if (error) {
      console.error('Error updating worker earning:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // 2. PAYMENT BATCHES
  // =============================================

  async createPaymentBatch(
    earningIds: string[],
    paymentMethod: 'bank_transfer' | 'cash' | 'e_wallet' | 'check',
    scheduledDate: string,
    createdBy: string,
    notes?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_payment_batch', {
      p_earning_ids: earningIds,
      p_payment_method: paymentMethod,
      p_scheduled_date: scheduledDate,
      p_created_by: createdBy,
      p_notes: notes || null,
    });

    if (error) {
      console.error('Error creating payment batch:', error);
      throw error;
    }

    return data as string;
  }

  async getPaymentBatches(status?: string): Promise<PaymentBatch[]> {
    let query = supabase
      .from('payment_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payment batches:', error);
      throw error;
    }

    return data || [];
  }

  async getPaymentBatchById(batchId: string): Promise<PaymentBatch | null> {
    const { data, error } = await supabase
      .from('payment_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) {
      console.error('Error fetching payment batch:', error);
      throw error;
    }

    return data;
  }

  async processPaymentBatch(batchId: string, approvedBy: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('process_payment_batch', {
      p_batch_id: batchId,
      p_approved_by: approvedBy,
    });

    if (error) {
      console.error('Error processing payment batch:', error);
      throw error;
    }

    return data as boolean;
  }

  async updatePaymentBatch(
    batchId: string,
    updates: Partial<PaymentBatch>
  ): Promise<PaymentBatch> {
    const { data, error } = await supabase
      .from('payment_batches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment batch:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // 3. PAYMENT BATCH ITEMS
  // =============================================

  async getPaymentBatchItems(batchId: string): Promise<PaymentBatchItem[]> {
    const { data, error } = await supabase
      .from('payment_batch_items')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment batch items:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 4. PAYMENT HISTORY
  // =============================================

  async getPaymentHistory(candidateId?: string): Promise<PaymentHistory[]> {
    let query = supabase
      .from('payment_history')
      .select('*')
      .order('payment_date', { ascending: false });

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 5. SALARY CONFIGURATIONS
  // =============================================

  async getSalaryConfigurations(): Promise<SalaryConfiguration[]> {
    const { data, error } = await supabase
      .from('salary_configurations')
      .select('*')
      .order('role');

    if (error) {
      console.error('Error fetching salary configurations:', error);
      throw error;
    }

    return data || [];
  }

  async updateSalaryConfiguration(
    configId: string,
    updates: Partial<SalaryConfiguration>
  ): Promise<SalaryConfiguration> {
    const { data, error } = await supabase
      .from('salary_configurations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Error updating salary configuration:', error);
      throw error;
    }

    return data;
  }

  // =============================================
  // 6. WORKER EARNINGS SUMMARY
  // =============================================

  async getWorkerEarningsSummary(): Promise<WorkerEarningSummary[]> {
    const { data, error } = await supabase
      .from('worker_earnings_summary')
      .select('*')
      .order('total_earnings', { ascending: false });

    if (error) {
      console.error('Error fetching worker earnings summary:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 7. UTILITY FUNCTIONS
  // =============================================

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  }

  getPaymentStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      e_wallet: 'E-Wallet',
      check: 'Check',
    };
    return labels[method] || method;
  }

  calculateEarningsBreakdown(earning: WorkerEarning) {
    return {
      baseSalary: earning.base_salary,
      overtimePay: earning.overtime_pay,
      bonus: earning.bonus,
      subtotal: earning.base_salary + earning.overtime_pay + earning.bonus,
      deductions: earning.deductions,
      netPay: earning.total_earnings,
    };
  }

  async exportPaymentBatch(batchId: string): Promise<any[]> {
    const batch = await this.getPaymentBatchById(batchId);
    const items = await this.getPaymentBatchItems(batchId);

    const exportData = [];

    for (const item of items) {
      const { data: candidate } = await supabase
        .from('candidates')
        .select('full_name, email, phone, bank_name, bank_account_number')
        .eq('id', item.candidate_id)
        .single();

      const { data: earning } = await supabase
        .from('worker_earnings')
        .select('*')
        .eq('id', item.earning_id)
        .single();

      exportData.push({
        'Batch Number': batch?.batch_number,
        'Worker Name': candidate?.full_name,
        'Email': candidate?.email,
        'Phone': candidate?.phone,
        'Bank Name': candidate?.bank_name || 'N/A',
        'Account Number': candidate?.bank_account_number || 'N/A',
        'Base Salary': this.formatCurrency(earning?.base_salary || 0),
        'Overtime Pay': this.formatCurrency(earning?.overtime_pay || 0),
        'Bonus': this.formatCurrency(earning?.bonus || 0),
        'Deductions': this.formatCurrency(earning?.deductions || 0),
        'Total Amount': this.formatCurrency(item.amount),
        'Payment Method': this.getPaymentMethodLabel(batch?.payment_method || ''),
        'Status': item.status,
      });
    }

    return exportData;
  }
}

export const paymentService = new PaymentService();
