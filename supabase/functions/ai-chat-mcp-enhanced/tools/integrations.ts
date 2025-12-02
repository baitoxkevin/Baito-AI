/**
 * External Service Integration Framework for Baiger
 *
 * Provides a unified interface for integrating with external services
 * like WhatsApp, Google Calendar, Slack, etc.
 *
 * This is a foundation that can be extended with specific integrations.
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { ToolDefinition, ToolResult, ToolContext } from './index.ts'

// ============================================
// Integration Types
// ============================================

export type IntegrationType = 'whatsapp' | 'google_calendar' | 'slack' | 'email' | 'sms'

export interface IntegrationConfig {
  type: IntegrationType
  name: string
  description: string
  requiredCredentials: string[]
  optionalConfig: string[]
  webhookEndpoint?: string
}

export interface IntegrationCredentials {
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  webhookSecret?: string
  accountId?: string
}

// ============================================
// Integration Registry
// ============================================

export const INTEGRATIONS: Record<IntegrationType, IntegrationConfig> = {
  whatsapp: {
    type: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send messages, notifications, and updates via WhatsApp',
    requiredCredentials: ['accessToken', 'phoneNumberId'],
    optionalConfig: ['templateName', 'defaultLanguage'],
  },
  google_calendar: {
    type: 'google_calendar',
    name: 'Google Calendar',
    description: 'Create events, check availability, sync schedules',
    requiredCredentials: ['accessToken', 'refreshToken'],
    optionalConfig: ['calendarId', 'timeZone'],
  },
  slack: {
    type: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    requiredCredentials: ['accessToken', 'webhookUrl'],
    optionalConfig: ['defaultChannel', 'botName'],
  },
  email: {
    type: 'email',
    name: 'Email (SMTP)',
    description: 'Send email notifications and reports',
    requiredCredentials: ['smtpHost', 'smtpPort', 'username', 'password'],
    optionalConfig: ['fromEmail', 'fromName', 'replyTo'],
  },
  sms: {
    type: 'sms',
    name: 'SMS (Twilio)',
    description: 'Send SMS notifications',
    requiredCredentials: ['accountSid', 'authToken', 'fromNumber'],
    optionalConfig: ['messagingServiceSid'],
  },
}

// ============================================
// Integration Base Class
// ============================================

abstract class BaseIntegration {
  protected supabase: SupabaseClient
  protected userId: string
  protected config: Record<string, unknown>
  protected credentials: IntegrationCredentials

  constructor(
    supabase: SupabaseClient,
    userId: string,
    config: Record<string, unknown>,
    credentials: IntegrationCredentials
  ) {
    this.supabase = supabase
    this.userId = userId
    this.config = config
    this.credentials = credentials
  }

  abstract sendMessage(to: string, message: string, options?: Record<string, unknown>): Promise<ToolResult>
  abstract checkStatus(): Promise<ToolResult>
}

// ============================================
// WhatsApp Integration
// ============================================

class WhatsAppIntegration extends BaseIntegration {
  async sendMessage(to: string, message: string, options?: Record<string, unknown>): Promise<ToolResult> {
    // WhatsApp Business API integration
    const phoneNumberId = this.config.phoneNumberId as string
    const accessToken = this.credentials.accessToken

    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        error: 'WhatsApp integration not configured. Missing phoneNumberId or accessToken.',
      }
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''), // Remove non-digits
            type: 'text',
            text: { body: message },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: `WhatsApp API error: ${error.error?.message || 'Unknown error'}`,
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          messageId: result.messages?.[0]?.id,
          to,
          status: 'sent',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to send WhatsApp message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async checkStatus(): Promise<ToolResult> {
    return {
      success: true,
      data: {
        integration: 'whatsapp',
        status: 'active',
        configured: !!this.credentials.accessToken,
      },
    }
  }
}

// ============================================
// Google Calendar Integration
// ============================================

class GoogleCalendarIntegration extends BaseIntegration {
  async sendMessage(to: string, message: string, options?: Record<string, unknown>): Promise<ToolResult> {
    // For calendar, "sendMessage" creates an event
    return this.createEvent(options || {})
  }

  async createEvent(eventDetails: Record<string, unknown>): Promise<ToolResult> {
    const calendarId = (this.config.calendarId as string) || 'primary'
    const accessToken = this.credentials.accessToken

    if (!accessToken) {
      return {
        success: false,
        error: 'Google Calendar integration not configured. Missing access token.',
      }
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: eventDetails.title || 'New Event',
            description: eventDetails.description,
            start: {
              dateTime: eventDetails.startDateTime,
              timeZone: (this.config.timeZone as string) || 'Asia/Kuala_Lumpur',
            },
            end: {
              dateTime: eventDetails.endDateTime,
              timeZone: (this.config.timeZone as string) || 'Asia/Kuala_Lumpur',
            },
            location: eventDetails.location,
            attendees: eventDetails.attendees,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: `Google Calendar API error: ${error.error?.message || 'Unknown error'}`,
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          eventId: result.id,
          htmlLink: result.htmlLink,
          status: 'created',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async checkStatus(): Promise<ToolResult> {
    return {
      success: true,
      data: {
        integration: 'google_calendar',
        status: 'active',
        configured: !!this.credentials.accessToken,
      },
    }
  }
}

// ============================================
// Integration Manager
// ============================================

export class IntegrationManager {
  private supabase: SupabaseClient
  private userId: string

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  /**
   * Get user's integration configuration
   */
  async getIntegration(type: IntegrationType): Promise<{
    config: Record<string, unknown>
    credentials: IntegrationCredentials
    isActive: boolean
  } | null> {
    const { data, error } = await this.supabase
      .from('ai_integrations')
      .select('config, credentials, is_active')
      .eq('user_id', this.userId)
      .eq('integration_type', type)
      .single()

    if (error || !data) {
      return null
    }

    return {
      config: data.config,
      credentials: data.credentials || {},
      isActive: data.is_active,
    }
  }

  /**
   * Get integration instance
   */
  async getInstance(type: IntegrationType): Promise<BaseIntegration | null> {
    const integration = await this.getIntegration(type)
    if (!integration || !integration.isActive) {
      return null
    }

    switch (type) {
      case 'whatsapp':
        return new WhatsAppIntegration(
          this.supabase,
          this.userId,
          integration.config,
          integration.credentials
        )
      case 'google_calendar':
        return new GoogleCalendarIntegration(
          this.supabase,
          this.userId,
          integration.config,
          integration.credentials
        )
      default:
        return null
    }
  }

  /**
   * List all configured integrations
   */
  async listIntegrations(): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('ai_integrations')
      .select('integration_type, is_active, last_sync_at, sync_status')
      .eq('user_id', this.userId)

    if (error) {
      return { success: false, error: error.message }
    }

    const configuredTypes = new Set((data || []).map(i => i.integration_type))

    const allIntegrations = Object.values(INTEGRATIONS).map(config => ({
      ...config,
      configured: configuredTypes.has(config.type),
      active: data?.find(i => i.integration_type === config.type)?.is_active || false,
      lastSync: data?.find(i => i.integration_type === config.type)?.last_sync_at,
      syncStatus: data?.find(i => i.integration_type === config.type)?.sync_status,
    }))

    return {
      success: true,
      data: {
        integrations: allIntegrations,
        configuredCount: data?.length || 0,
        availableCount: Object.keys(INTEGRATIONS).length,
      },
    }
  }
}

// ============================================
// Integration Tools
// ============================================

export const listIntegrationsTool: ToolDefinition = {
  name: 'list_integrations',
  description: 'List all available external service integrations and their status',
  parameters: z.object({}),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User ID required' }
    }

    const manager = new IntegrationManager(supabase, context.userId)
    return manager.listIntegrations()
  },
}

export const sendNotificationTool: ToolDefinition = {
  name: 'send_notification',
  description: 'Send a notification via an external service (WhatsApp, Email, SMS, Slack)',
  parameters: z.object({
    channel: z.enum(['whatsapp', 'email', 'sms', 'slack']).describe('Notification channel'),
    to: z.string().describe('Recipient (phone number, email, or channel)'),
    message: z.string().describe('Message content'),
    subject: z.string().optional().describe('Subject (for email)'),
  }),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User ID required' }
    }

    const manager = new IntegrationManager(supabase, context.userId)
    const integration = await manager.getInstance(params.channel as IntegrationType)

    if (!integration) {
      return {
        success: false,
        error: `${params.channel} integration is not configured or inactive. Please set it up in Settings.`,
        suggestions: ['Go to Settings > Integrations to configure'],
      }
    }

    return integration.sendMessage(
      params.to as string,
      params.message as string,
      { subject: params.subject }
    )
  },
}

export const createCalendarEventTool: ToolDefinition = {
  name: 'create_calendar_event',
  description: 'Create a calendar event for a project or meeting',
  parameters: z.object({
    title: z.string().describe('Event title'),
    start_datetime: z.string().describe('Start date and time (ISO format)'),
    end_datetime: z.string().describe('End date and time (ISO format)'),
    location: z.string().optional().describe('Event location'),
    description: z.string().optional().describe('Event description'),
    attendee_emails: z.array(z.string()).optional().describe('Email addresses of attendees'),
  }),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User ID required' }
    }

    const manager = new IntegrationManager(supabase, context.userId)
    const calendar = await manager.getInstance('google_calendar') as GoogleCalendarIntegration | null

    if (!calendar) {
      return {
        success: false,
        error: 'Google Calendar integration is not configured. Please set it up in Settings.',
        suggestions: ['Go to Settings > Integrations to connect Google Calendar'],
      }
    }

    return (calendar as any).createEvent({
      title: params.title,
      startDateTime: params.start_datetime,
      endDateTime: params.end_datetime,
      location: params.location,
      description: params.description,
      attendees: (params.attendee_emails as string[] | undefined)?.map(email => ({ email })),
    })
  },
}

// Export integration tools
export const INTEGRATION_TOOLS: ToolDefinition[] = [
  listIntegrationsTool,
  sendNotificationTool,
  createCalendarEventTool,
]
