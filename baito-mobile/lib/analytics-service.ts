import { supabase } from './supabase';

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface WorkerPerformanceStats {
  candidate_id: string;
  full_name: string;
  email: string;
  phone: string;
  total_shifts: number;
  completed_shifts: number;
  total_hours_worked: number;
  avg_hours_per_shift: number;
  total_points: number;
  completion_rate: number;
}

export interface RevenueAnalytics {
  month: string;
  total_projects: number;
  total_workers: number;
  total_budget: number;
  total_expenses: number;
  net_revenue: number;
}

export interface ShiftCompletionAnalytics {
  project_id: string;
  project_title: string;
  start_date: string;
  end_date: string;
  required_workers: number;
  assigned_workers: number;
  actual_attendees: number;
  completed_attendances: number;
  staffing_percentage: number;
  completion_percentage: number;
}

export interface DailyAttendanceStats {
  attendance_date: string;
  unique_workers: number;
  total_check_ins: number;
  completed_shifts: number;
  avg_shift_duration_hours: number;
}

export interface TopPerformer {
  candidate_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  total_shifts: number;
  completed_shifts: number;
  total_hours_worked: number;
  total_achievements: number;
}

export interface AnalyticsSummary {
  total_workers: number;
  total_projects: number;
  total_shifts_completed: number;
  total_hours_worked: number;
  total_revenue: number;
  total_expenses: number;
  avg_shift_completion_rate: number;
}

export interface WorkerPerformanceHistory {
  month: string;
  shifts_completed: number;
  hours_worked: number;
  points_earned: number;
}

export interface RevenueTrend {
  month: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  project_count: number;
}

export interface ShiftCompletionRate {
  month: string;
  total_shifts: number;
  completed_shifts: number;
  completion_rate: number;
}

// =============================================
// ANALYTICS SERVICE CLASS
// =============================================

class AnalyticsService {

  // =============================================
  // 1. WORKER PERFORMANCE ANALYTICS
  // =============================================

  async getWorkerPerformanceStats(): Promise<WorkerPerformanceStats[]> {
    const { data, error } = await supabase
      .from('worker_performance_stats')
      .select('*')
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching worker performance stats:', error);
      throw error;
    }

    return data || [];
  }

  async getWorkerPerformanceHistory(
    candidateId: string,
    months: number = 6
  ): Promise<WorkerPerformanceHistory[]> {
    const { data, error } = await supabase
      .rpc('get_worker_performance_history', {
        p_candidate_id: candidateId,
        p_months: months,
      });

    if (error) {
      console.error('Error fetching worker performance history:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 2. REVENUE ANALYTICS
  // =============================================

  async getRevenueAnalytics(): Promise<RevenueAnalytics[]> {
    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('*')
      .order('month', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }

    return data || [];
  }

  async getRevenueTrend(months: number = 12): Promise<RevenueTrend[]> {
    const { data, error } = await supabase
      .rpc('get_revenue_trend', {
        p_months: months,
      });

    if (error) {
      console.error('Error fetching revenue trend:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 3. SHIFT COMPLETION ANALYTICS
  // =============================================

  async getShiftCompletionAnalytics(): Promise<ShiftCompletionAnalytics[]> {
    const { data, error } = await supabase
      .from('shift_completion_analytics')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching shift completion analytics:', error);
      throw error;
    }

    return data || [];
  }

  async getShiftCompletionRate(months: number = 6): Promise<ShiftCompletionRate[]> {
    const { data, error } = await supabase
      .rpc('get_shift_completion_rate', {
        p_months: months,
      });

    if (error) {
      console.error('Error fetching shift completion rate:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 4. DAILY ATTENDANCE STATS
  // =============================================

  async getDailyAttendanceStats(days: number = 30): Promise<DailyAttendanceStats[]> {
    const { data, error } = await supabase
      .from('daily_attendance_stats')
      .select('*')
      .order('attendance_date', { ascending: false })
      .limit(days);

    if (error) {
      console.error('Error fetching daily attendance stats:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 5. TOP PERFORMERS (LEADERBOARD)
  // =============================================

  async getTopPerformers(limit: number = 10): Promise<TopPerformer[]> {
    const { data, error } = await supabase
      .from('top_performers')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }

    return data || [];
  }

  // =============================================
  // 6. ANALYTICS SUMMARY
  // =============================================

  async getAnalyticsSummary(
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsSummary> {
    const { data, error } = await supabase.rpc('get_analytics_summary', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }

    return data as AnalyticsSummary;
  }

  // =============================================
  // 7. CHART DATA FORMATTERS
  // =============================================

  formatRevenueChartData(data: RevenueTrend[]) {
    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          data: data.map((d) => Number(d.total_revenue)),
          color: () => 'rgba(34, 197, 94, 1)', // green
        },
        {
          data: data.map((d) => Number(d.total_expenses)),
          color: () => 'rgba(239, 68, 68, 1)', // red
        },
      ],
      legend: ['Revenue', 'Expenses'],
    };
  }

  formatShiftCompletionChartData(data: ShiftCompletionRate[]) {
    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          data: data.map((d) => Number(d.completion_rate)),
          color: () => 'rgba(59, 130, 246, 1)', // blue
        },
      ],
      legend: ['Completion Rate (%)'],
    };
  }

  formatWorkerPerformanceChartData(data: WorkerPerformanceHistory[]) {
    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          data: data.map((d) => Number(d.shifts_completed)),
          color: () => 'rgba(168, 85, 247, 1)', // purple
        },
        {
          data: data.map((d) => Number(d.hours_worked)),
          color: () => 'rgba(245, 158, 11, 1)', // amber
        },
      ],
      legend: ['Shifts', 'Hours'],
    };
  }

  formatDailyAttendanceChartData(data: DailyAttendanceStats[]) {
    return {
      labels: data.map((d) => new Date(d.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          data: data.map((d) => d.unique_workers),
          color: () => 'rgba(20, 184, 166, 1)', // teal
        },
      ],
      legend: ['Unique Workers'],
    };
  }

  // =============================================
  // 8. UTILITY FUNCTIONS
  // =============================================

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  formatHours(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${Math.round(hours)}h`;
  }
}

export const analyticsService = new AnalyticsService();
