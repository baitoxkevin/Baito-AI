/**
 * Backend Activity Logger
 * Comprehensive logging system for all user activities
 */

import { supabase } from './supabase';
import { getUser } from './auth';

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'payment'
  | 'approval'
  | 'navigation';

export type EntityType =
  | 'project'
  | 'payment'
  | 'staff'
  | 'document'
  | 'expense_claim'
  | 'task'
  | 'user';

export interface LogActivityParams {
  action: string;
  actionType: ActionType;
  entityType?: EntityType;
  entityId?: string;
  projectId?: string;
  details?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

export interface LogPaymentParams {
  paymentBatchId: string;
  projectId?: string;
  action: 'create' | 'approve' | 'push' | 'export' | 'cancel';
  status: 'pending' | 'approved' | 'pushed' | 'exported' | 'failed' | 'cancelled';
  amount?: number;
  staffCount?: number;
  exportFormat?: 'excel' | 'csv' | 'duitnow';
  filePath?: string;
  details?: Record<string, any>;
  errorMessage?: string;
}

class BackendLogger {
  /**
   * Log user activity to the backend
   */
  async logActivity(params: LogActivityParams): Promise<string | null> {
    try {
      const user = await getUser();
      if (!user) {
        console.warn('[BackendLogger] No user found, skipping activity log');
        return null;
      }

      const { data, error } = await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_action: params.action,
        p_action_type: params.actionType,
        p_entity_type: params.entityType || null,
        p_entity_id: params.entityId || null,
        p_project_id: params.projectId || null,
        p_details: params.details || {},
        p_success: params.success ?? true,
        p_error_message: params.errorMessage || null
      });

      if (error) {
        console.error('[BackendLogger] Error logging activity:', error);
        return null;
      }

      console.log('[BackendLogger] Activity logged:', params.action, data);
      return data;
    } catch (error) {
      console.error('[BackendLogger] Failed to log activity:', error);
      return null;
    }
  }

  /**
   * Log payment operation
   */
  async logPayment(params: LogPaymentParams): Promise<string | null> {
    try {
      const user = await getUser();
      if (!user) {
        console.warn('[BackendLogger] No user found, skipping payment log');
        return null;
      }

      const { data, error } = await supabase.rpc('log_payment_activity', {
        p_payment_batch_id: params.paymentBatchId,
        p_project_id: params.projectId || null,
        p_user_id: user.id,
        p_action: params.action,
        p_status: params.status,
        p_amount: params.amount || null,
        p_staff_count: params.staffCount || null,
        p_export_format: params.exportFormat || null,
        p_file_path: params.filePath || null,
        p_details: params.details || {},
        p_error_message: params.errorMessage || null
      });

      if (error) {
        console.error('[BackendLogger] Error logging payment:', error);
        return null;
      }

      console.log('[BackendLogger] Payment logged:', params.action, data);
      return data;
    } catch (error) {
      console.error('[BackendLogger] Failed to log payment:', error);
      return null;
    }
  }

  /**
   * Get activity logs for a user
   */
  async getUserActivityLogs(userId: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BackendLogger] Error fetching user logs:', error);
      return [];
    }
  }

  /**
   * Get activity logs for a project
   */
  async getProjectActivityLogs(projectId: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BackendLogger] Error fetching project logs:', error);
      return [];
    }
  }

  /**
   * Get payment logs
   */
  async getPaymentLogs(paymentBatchId?: string, projectId?: string, limit: number = 100) {
    try {
      let query = supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (paymentBatchId) {
        query = query.eq('payment_batch_id', paymentBatchId);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BackendLogger] Error fetching payment logs:', error);
      return [];
    }
  }

  /**
   * Get payment activity summary
   */
  async getPaymentSummary(limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('payment_activity_summary')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[BackendLogger] Error fetching payment summary:', error);
      return [];
    }
  }

  /**
   * Convenience method: Log project creation
   */
  async logProjectCreated(projectId: string, projectTitle: string, details?: Record<string, any>) {
    return this.logActivity({
      action: 'create_project',
      actionType: 'create',
      entityType: 'project',
      entityId: projectId,
      projectId: projectId,
      details: { project_title: projectTitle, ...details }
    });
  }

  /**
   * Convenience method: Log payment created
   */
  async logPaymentCreated(paymentBatchId: string, projectId: string, amount: number, staffCount: number) {
    return this.logPayment({
      paymentBatchId,
      projectId,
      action: 'create',
      status: 'pending',
      amount,
      staffCount,
      details: { created_at: new Date().toISOString() }
    });
  }

  /**
   * Convenience method: Log payment pushed
   */
  async logPaymentPushed(paymentBatchId: string, projectId: string, staffCount: number) {
    return this.logPayment({
      paymentBatchId,
      projectId,
      action: 'push',
      status: 'pushed',
      staffCount,
      details: { pushed_at: new Date().toISOString() }
    });
  }

  /**
   * Convenience method: Log payment exported
   */
  async logPaymentExported(
    paymentBatchId: string,
    projectId: string,
    exportFormat: 'excel' | 'csv' | 'duitnow',
    filePath: string,
    staffCount: number
  ) {
    return this.logPayment({
      paymentBatchId,
      projectId,
      action: 'export',
      status: 'exported',
      exportFormat,
      filePath,
      staffCount,
      details: { exported_at: new Date().toISOString() }
    });
  }

  /**
   * Convenience method: Log payment error
   */
  async logPaymentError(
    paymentBatchId: string,
    projectId: string,
    action: 'create' | 'approve' | 'push' | 'export',
    errorMessage: string
  ) {
    return this.logPayment({
      paymentBatchId,
      projectId,
      action,
      status: 'failed',
      errorMessage,
      details: { failed_at: new Date().toISOString() }
    });
  }
}

// Export singleton instance
export const backendLogger = new BackendLogger();

// Export convenience functions
export const logActivity = (params: LogActivityParams) => backendLogger.logActivity(params);
export const logPayment = (params: LogPaymentParams) => backendLogger.logPayment(params);
