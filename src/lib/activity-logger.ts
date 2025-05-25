import { supabase } from './supabase';
import { getUser } from './auth';

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  user_name?: string;
  activity_type: 'navigation' | 'interaction' | 'data_change' | 'view' | 'action';
  action: string;
  details: Record<string, any>;
  timestamp: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
}

export interface LoggableEvent {
  action: string;
  activity_type: ActivityLog['activity_type'];
  details?: Record<string, any>;
  project_id?: string;
}

class ActivityLogger {
  private sessionId: string;
  private projectId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private batchLogs: Omit<ActivityLog, 'id' | 'timestamp'>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeUser();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser() {
    if (this.isInitialized) return;
    
    try {
      const user = await getUser();
      if (user) {
        this.userId = user.id;
        this.userName = user.full_name || user.email || 'Unknown User';
        this.isInitialized = true;
        console.log('ActivityLogger: User initialized:', { id: this.userId, name: this.userName });
      }
    } catch (error) {
      console.warn('ActivityLogger: Could not initialize user', error);
      // Set fallback values
      this.userId = 'anonymous';
      this.userName = 'Unknown User';
      this.isInitialized = true;
    }
  }

  public setProjectId(projectId: string) {
    console.log('ActivityLogger: Setting project ID to:', projectId);
    this.projectId = projectId;
    // Don't log project focus events - we only want actual user actions
  }

  public async log(event: LoggableEvent) {
    if (!this.isInitialized) {
      await this.initializeUser();
    }

    // Use explicit project_id from event, otherwise use the current project ID
    const projectId = event.project_id || this.projectId;
    if (!projectId) {
      console.warn('ActivityLogger: No project ID available for logging event:', event);
      return;
    }

    console.log('ActivityLogger: Logging event for project:', projectId, event.action);

    const logEntry: Omit<ActivityLog, 'id' | 'timestamp'> = {
      project_id: projectId,
      user_id: this.userId || 'anonymous',
      user_name: this.userName || 'Unknown User',
      activity_type: event.activity_type,
      action: event.action,
      details: {
        ...event.details,
        session_id: this.sessionId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp_client: new Date().toISOString()
      },
      session_id: this.sessionId,
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };

    // Add to batch
    this.batchLogs.push(logEntry);

    // Schedule batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 1000); // Batch logs every 1 second

    // For critical events, process immediately
    if (event.activity_type === 'data_change' || event.action.includes('error')) {
      this.processBatch();
    }
  }

  private async processBatch() {
    if (this.batchLogs.length === 0) return;

    const logsToProcess = [...this.batchLogs];
    this.batchLogs = [];

    try {
      // Add timestamps
      const logsWithTimestamps = logsToProcess.map(log => ({
        ...log,
        timestamp: new Date().toISOString()
      }));

      // Store in localStorage as backup
      this.storeLogsLocally(logsWithTimestamps);

      // Try to store in database - transform to match database schema
      try {
        const dbLogs = logsWithTimestamps.map(log => ({
          project_id: log.project_id,
          user_id: log.user_id,
          user_name: log.user_name,
          activity_type: log.activity_type,
          action: log.action,
          description: this.generateDescription(log),
          details: log.details,
          session_id: log.session_id,
          created_at: log.timestamp
        }));

        const { error } = await supabase
          .from('activity_logs')
          .insert(dbLogs);

        if (error) {
          console.warn('ActivityLogger: Database unavailable, using localStorage only', error.message);
          // Don't re-add to batch since we have localStorage backup
        } else {
          console.log(`ActivityLogger: Successfully stored ${dbLogs.length} logs in database`);
        }
      } catch (dbError) {
        console.warn('ActivityLogger: Database connection failed, using localStorage only');
        // Database is not available, but localStorage backup is working
      }
    } catch (error) {
      console.error('ActivityLogger: Batch processing error', error);
      // Re-add logs to batch for retry
      this.batchLogs.unshift(...logsToProcess);
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  private generateDescription(log: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp: string }): string {
    const details = log.details || {};
    
    switch (log.action) {
      case 'upload_document':
        if (details.is_external_link) {
          return `Added Google Drive link: ${details.document_name}`;
        }
        return `Uploaded document: ${details.document_name}`;
      case 'delete_document':
        return `Deleted document: ${details.document_name}`;
      case 'create_expense_claim':
        return `Created expense claim: ${details.claim_title} ($${details.claim_amount})`;
      case 'delete_expense_claim':
        return `Deleted expense claim: ${details.claim_title}`;
      case 'add_staff':
        return `Added staff member: ${details.staff_name} (${details.staff_position})`;
      case 'remove_staff':
        return `Removed staff member: ${details.staff_name}`;
      case 'export_payment_data':
        return `Exported payment data for ${details.staff_count} staff members`;
      case 'submit_payment':
        if (details.success) {
          return `Successfully submitted payment for ${details.staff_count} staff members`;
        }
        return `Failed to submit payment: ${details.error}`;
      case 'data_change':
        return `Updated ${details.field}: ${details.old_value} → ${details.new_value}`;
      default:
        return `${log.action}: ${JSON.stringify(details)}`;
    }
  }

  private storeLogsLocally(logs: ActivityLog[]) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      
      // Add timestamps and IDs to logs if missing
      const logsWithIds = logs.map(log => ({
        ...log,
        id: log.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: log.timestamp || new Date().toISOString()
      }));
      
      const updatedLogs = [...existingLogs, ...logsWithIds].slice(-1000); // Keep last 1000 logs
      localStorage.setItem('activity_logs', JSON.stringify(updatedLogs));
      
      console.log(`ActivityLogger: Stored ${logs.length} logs locally (total: ${updatedLogs.length})`);
    } catch (error) {
      console.warn('ActivityLogger: Could not store logs locally', error);
    }
  }

  public async getProjectLogs(projectId: string, limit: number = 100): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('ActivityLogger: Database unavailable for reading, using localStorage', error.message);
        return this.getFallbackLogs(projectId);
      }
      
      // Transform database logs to match ActivityLog interface
      const dbLogs = (data || []).map(log => ({
        ...log,
        timestamp: log.created_at,
        user_name: log.user_name || 'Unknown User'
      }));
      
      const localLogs = this.getFallbackLogs(projectId);
      
      // Combine and deduplicate by timestamp and action
      const allLogs = [...dbLogs, ...localLogs];
      const uniqueLogs = allLogs.filter((log, index, self) => {
        return index === self.findIndex(l => 
          l.timestamp === log.timestamp && 
          l.action === log.action && 
          l.project_id === log.project_id
        );
      });
      
      // Sort by timestamp and limit
      return uniqueLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
        
    } catch (error) {
      console.warn('ActivityLogger: Database connection failed, using localStorage only', error);
      return this.getFallbackLogs(projectId);
    }
  }

  private getFallbackLogs(projectId: string): ActivityLog[] {
    try {
      const localLogs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      return localLogs
        .filter((log: ActivityLog) => log.project_id === projectId)
        .sort((a: ActivityLog, b: ActivityLog) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 100);
    } catch (error) {
      console.warn('ActivityLogger: Error loading fallback logs', error);
      return [];
    }
  }

  // Convenience methods for common actions

  public logDataChange(field: string, oldValue: any, newValue: any, details?: Record<string, any>) {
    this.log({
      action: 'data_change',
      activity_type: 'data_change',
      details: { 
        field, 
        old_value: oldValue, 
        new_value: newValue, 
        change_type: 'field_update',
        ...details 
      }
    });
  }


  public logAction(actionName: string, success: boolean, details?: Record<string, any>) {
    this.log({
      action: actionName,
      activity_type: 'action',
      details: { success, ...details }
    });
  }


  // Force immediate processing of all batched logs
  public async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.processBatch();
  }

  // Clear all logs from localStorage (for debugging)
  public clearLocalStorage() {
    localStorage.removeItem('activity_logs');
    console.log('ActivityLogger: Cleared all logs from localStorage');
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger();

// Export convenience function for easy logging
export function logActivity(event: LoggableEvent) {
  activityLogger.log(event);
}

// Export utility functions (only keeping dataChange and action)
export const logUtils = {
  dataChange: (field: string, oldValue: any, newValue: any, details?: Record<string, any>, projectId?: string) => {
    if (projectId) {
      activityLogger.log({
        action: 'data_change',
        activity_type: 'data_change',
        project_id: projectId,
        details: { 
          field, 
          old_value: oldValue, 
          new_value: newValue, 
          change_type: 'field_update',
          ...details 
        }
      });
    } else {
      activityLogger.logDataChange(field, oldValue, newValue, details);
    }
  },
  
  action: (actionName: string, success: boolean, details?: Record<string, any>, projectId?: string) => {
    if (projectId) {
      activityLogger.log({
        action: actionName,
        activity_type: 'action',
        project_id: projectId,
        details: { success, ...details }
      });
    } else {
      activityLogger.logAction(actionName, success, details);
    }
  }
};