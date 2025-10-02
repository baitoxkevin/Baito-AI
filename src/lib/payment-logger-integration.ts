/**
 * Payment Logger Integration
 * Adds comprehensive logging to payment operations
 */

import { backendLogger } from './backend-logger';
import { PayrollData } from '@/components/payroll-manager/types';

/**
 * Log payment creation
 */
export async function logPaymentCreation(
  batchId: string,
  projectId: string,
  staffCount: number,
  totalAmount: number
): Promise<void> {
  try {
    await backendLogger.logPaymentCreated(
      batchId,
      projectId,
      totalAmount,
      staffCount
    );

    await backendLogger.logActivity({
      action: 'create_payment_batch',
      actionType: 'payment',
      entityType: 'payment',
      entityId: batchId,
      projectId: projectId,
      details: {
        batch_id: batchId,
        staff_count: staffCount,
        total_amount: totalAmount,
        status: 'created'
      }
    });

    console.log('[Payment Logger] Payment creation logged:', batchId);
  } catch (error) {
    console.error('[Payment Logger] Failed to log payment creation:', error);
  }
}

/**
 * Log payment push
 */
export async function logPaymentPush(
  batchId: string,
  projectId: string,
  staffCount: number,
  paymentDate: string
): Promise<void> {
  try {
    await backendLogger.logPaymentPushed(
      batchId,
      projectId,
      staffCount
    );

    await backendLogger.logActivity({
      action: 'push_payment',
      actionType: 'payment',
      entityType: 'payment',
      entityId: batchId,
      projectId: projectId,
      details: {
        batch_id: batchId,
        staff_count: staffCount,
        payment_date: paymentDate,
        status: 'pushed'
      }
    });

    console.log('[Payment Logger] Payment push logged:', batchId);
  } catch (error) {
    console.error('[Payment Logger] Failed to log payment push:', error);
  }
}

/**
 * Log payment export
 */
export async function logPaymentExport(
  batchId: string,
  projectId: string,
  exportFormat: 'excel' | 'csv' | 'duitnow',
  fileName: string,
  staffCount: number
): Promise<void> {
  try {
    const filePath = `/downloads/${fileName}`;

    await backendLogger.logPaymentExported(
      batchId,
      projectId,
      'duitnow',
      filePath,
      staffCount
    );

    await backendLogger.logActivity({
      action: 'export_payment',
      actionType: 'export',
      entityType: 'payment',
      entityId: batchId,
      projectId: projectId,
      details: {
        batch_id: batchId,
        export_format: exportFormat,
        file_name: fileName,
        file_path: filePath,
        staff_count: staffCount,
        status: 'exported'
      }
    });

    console.log('[Payment Logger] Payment export logged:', fileName);
  } catch (error) {
    console.error('[Payment Logger] Failed to log payment export:', error);
  }
}

/**
 * Log payment error
 */
export async function logPaymentError(
  batchId: string,
  projectId: string,
  action: 'create' | 'push' | 'export',
  errorMessage: string
): Promise<void> {
  try {
    await backendLogger.logPaymentError(
      batchId,
      projectId,
      action,
      errorMessage
    );

    await backendLogger.logActivity({
      action: `${action}_payment_failed`,
      actionType: 'payment',
      entityType: 'payment',
      entityId: batchId,
      projectId: projectId,
      success: false,
      errorMessage: errorMessage,
      details: {
        batch_id: batchId,
        failed_action: action,
        error: errorMessage
      }
    });

    console.error('[Payment Logger] Payment error logged:', errorMessage);
  } catch (error) {
    console.error('[Payment Logger] Failed to log payment error:', error);
  }
}

/**
 * Get payment logs for a batch
 */
export async function getPaymentBatchLogs(batchId: string) {
  try {
    const logs = await backendLogger.getPaymentLogs(batchId);
    return logs;
  } catch (error) {
    console.error('[Payment Logger] Failed to get payment logs:', error);
    return [];
  }
}

/**
 * Get all payment activity summary
 */
export async function getPaymentActivitySummary(limit: number = 50) {
  try {
    const summary = await backendLogger.getPaymentSummary(limit);
    return summary;
  } catch (error) {
    console.error('[Payment Logger] Failed to get payment summary:', error);
    return [];
  }
}
