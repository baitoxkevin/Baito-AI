import { supabase } from './supabase';
import { toastService } from './toast-service';

import { logger } from './logger';
interface EmailNotification {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  projectId: string;
  type: 'project_update' | 'project_creation' | 'status_change' | 'assignment';
}

interface NotificationPreferences {
  emailNotifications: boolean;
  ccOnAllProjects: boolean;
}

/**
 * Notification service for handling email notifications
 * Currently stores notifications in database for future email processing
 */
export const notificationService = {
  /**
   * Send notification to client and person in charge
   */
  async notifyProjectStakeholders(
    projectId: string,
    subject: string,
    body: string,
    type: EmailNotification['type'] = 'project_update'
  ) {
    try {
      // Fetch project details including client and manager info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:client_id (
            id,
            email,
            full_name
          ),
          manager:manager_id (
            id,
            email,
            full_name
          )
        `)
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        logger.error('Error fetching project:', projectError);
        throw new Error('Failed to fetch project details');
      }

      // Prepare recipient list
      const recipients: string[] = [];
      const ccRecipients: string[] = [];

      // Add client email
      if (project.client?.email) {
        recipients.push(project.client.email);
      }

      // Add manager as CC
      if (project.manager?.email) {
        ccRecipients.push(project.manager.email);
      }

      // Store notification in database for future processing
      const { error: notificationError } = await supabase
        .from('email_notifications')
        .insert({
          project_id: projectId,
          to_emails: recipients,
          cc_emails: ccRecipients,
          subject,
          body,
          type,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        // If table doesn't exist, create it first
        if (notificationError.code === '42P01') {
          await this.createNotificationTable();
          // Retry the insert
          const { error: retryError } = await supabase
            .from('email_notifications')
            .insert({
              project_id: projectId,
              to_emails: recipients,
              cc_emails: ccRecipients,
              subject,
              body,
              type,
              status: 'pending',
              created_at: new Date().toISOString()
            });

          if (retryError) {
            throw retryError;
          }
        } else {
          throw notificationError;
        }
      }

      // Show success toast
      toastService.success(
        'Notification Queued',
        `Email notification will be sent to ${recipients.length} recipient(s) with ${ccRecipients.length} CC(s)`
      );

      return {
        success: true,
        recipients,
        ccRecipients
      };
    } catch (error) {
      logger.error('Error sending notification:', error);
      toastService.error(
        'Notification Failed',
        'Failed to queue email notification'
      );
      throw error;
    }
  },

  /**
   * Create notification table if it doesn't exist
   */
  async createNotificationTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS email_notifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        to_emails TEXT[] NOT NULL,
        cc_emails TEXT[],
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_email_notifications_project_id ON email_notifications(project_id);
      CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
      CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);
    `;

    const { error } = await supabase.rpc('execute_sql', {
      query: createTableSQL
    });

    if (error) {
      logger.error('Error creating notification table:', error);
      throw error;
    }
  },

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('email_notifications, cc_on_all_projects')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default preferences if not found
      return {
        emailNotifications: true,
        ccOnAllProjects: false
      };
    }

    return {
      emailNotifications: data.email_notifications ?? true,
      ccOnAllProjects: data.cc_on_all_projects ?? false
    };
  },

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Error updating preferences:', error);
      throw error;
    }
  },

  /**
   * Format project update email
   */
  formatProjectUpdateEmail(
    projectTitle: string,
    updatedFields: Record<string, { old: unknown; new: unknown }>,
    updatedBy: string
  ): { subject: string; body: string } {
    const subject = `Project Update: ${projectTitle}`;
    
    let body = `Hello,\n\n`;
    body += `${updatedBy} has made the following updates to the project "${projectTitle}":\n\n`;
    
    Object.entries(updatedFields).forEach(([field, values]) => {
      const fieldName = field.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      body += `• ${fieldName}:\n`;
      body += `  From: ${values.old || 'N/A'}\n`;
      body += `  To: ${values.new || 'N/A'}\n\n`;
    });
    
    body += `\nBest regards,\nThe Baito Team`;
    
    return { subject, body };
  },

  /**
   * Send notification when project is created
   */
  async notifyProjectCreation(
    projectId: string,
    projectTitle: string,
    createdBy: string
  ) {
    const subject = `New Project Created: ${projectTitle}`;
    const body = `Hello,\n\nA new project "${projectTitle}" has been created by ${createdBy}.\n\nYou have been assigned to this project.\n\nBest regards,\nThe Baito Team`;
    
    return this.notifyProjectStakeholders(projectId, subject, body, 'project_creation');
  },

  /**
   * Send notification when project status changes
   */
  async notifyStatusChange(
    projectId: string,
    projectTitle: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string
  ) {
    const subject = `Project Status Update: ${projectTitle}`;
    const body = `Hello,\n\nThe status of project "${projectTitle}" has been updated by ${changedBy}.\n\nStatus changed from "${oldStatus}" to "${newStatus}".\n\nBest regards,\nThe Baito Team`;
    
    return this.notifyProjectStakeholders(projectId, subject, body, 'status_change');
  },

  /**
   * Get pending notifications for a project
   */
  async getPendingNotifications(projectId: string) {
    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }
};