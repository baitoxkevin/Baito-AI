/**
 * MCP-style Typed Tools for Baito-AI Chatbot (Baiger)
 *
 * These tools follow the Model Context Protocol pattern, providing
 * structured database access that the LLM can call via tool use.
 *
 * Benefits:
 * - Type-safe tool definitions with Zod schemas
 * - Clear separation of concerns
 * - Easy to extend with new capabilities
 * - Compatible with any LLM that supports tool/function calling
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

// ============================================
// Tool Interfaces
// ============================================

export interface ToolDefinition {
  name: string
  description: string
  parameters: z.ZodObject<Record<string, z.ZodTypeAny>>
  execute: (params: Record<string, unknown>, supabase: SupabaseClient, context?: ToolContext) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  suggestions?: string[]
  nextActions?: ActionButton[]
}

export interface ActionButton {
  label: string
  action: string
  variant?: 'default' | 'outline' | 'destructive'
}

export interface ToolContext {
  userId?: string
  conversationId?: string
  persona?: 'operations' | 'finance' | 'hr' | 'general'
}

// ============================================
// Project Tools
// ============================================

export const getProjectsTool: ToolDefinition = {
  name: 'get_projects',
  description: 'Get a list of projects with their details, optionally filtered by status, priority, date range, or search terms',
  parameters: z.object({
    status: z.enum(['planning', 'active', 'completed', 'cancelled', 'archived']).optional().describe('Filter by project status'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority level'),
    start_date_from: z.string().optional().describe('Filter projects starting from this date (YYYY-MM-DD)'),
    start_date_to: z.string().optional().describe('Filter projects starting up to this date (YYYY-MM-DD)'),
    search: z.string().optional().describe('Search by title, brand name, or venue'),
    manager_id: z.string().optional().describe('Filter by manager ID'),
    client_id: z.string().optional().describe('Filter by client ID'),
    understaffed_only: z.boolean().optional().describe('Only show projects that need more staff'),
    limit: z.coerce.number().max(50).default(20).describe('Maximum number of results'),
    order_by: z.enum(['start_date', 'created_at', 'title', 'priority']).default('start_date'),
    order_direction: z.enum(['asc', 'desc']).default('asc'),
  }),
  execute: async (params, supabase) => {
    let query = supabase
      .from('projects')
      .select('id, title, event_type, brand_name, status, priority, start_date, end_date, venue_address, crew_count, filled_positions, supervisors_required, description, created_at')
      .is('deleted_at', null)

    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.priority) {
      query = query.eq('priority', params.priority)
    }
    if (params.start_date_from) {
      query = query.gte('start_date', params.start_date_from)
    }
    if (params.start_date_to) {
      query = query.lte('start_date', params.start_date_to)
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,brand_name.ilike.%${params.search}%,venue_address.ilike.%${params.search}%`)
    }
    if (params.manager_id) {
      query = query.eq('manager_id', params.manager_id)
    }
    if (params.client_id) {
      query = query.eq('client_id', params.client_id)
    }
    if (params.understaffed_only) {
      query = query.filter('filled_positions', 'lt', 'crew_count')
    }

    const orderCol = params.order_by || 'start_date'
    const orderAsc = (params.order_direction || 'asc') === 'asc'
    query = query.order(orderCol, { ascending: orderAsc }).limit(params.limit || 20)

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // Analyze for insights
    const projects = data || []
    const understaffed = projects.filter(p => (p.filled_positions || 0) < (p.crew_count || 0))
    const highPriority = projects.filter(p => p.priority === 'high')

    const suggestions: string[] = []
    if (understaffed.length > 0) {
      suggestions.push(`${understaffed.length} project(s) need more staff`)
    }
    if (highPriority.length > 0) {
      suggestions.push(`${highPriority.length} high priority project(s) require attention`)
    }

    return {
      success: true,
      data: {
        projects,
        count: projects.length,
        summary: {
          total: projects.length,
          understaffed: understaffed.length,
          highPriority: highPriority.length,
          byStatus: projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1
            return acc
          }, {} as Record<string, number>),
        },
      },
      suggestions,
      nextActions: understaffed.length > 0 ? [
        { label: 'Find candidates for understaffed projects', action: 'find candidates with available status', variant: 'default' },
      ] : undefined,
    }
  },
}

export const getProjectDetailsTool: ToolDefinition = {
  name: 'get_project_details',
  description: 'Get detailed information about a specific project including staff assignments',
  parameters: z.object({
    project_id: z.string().describe('The UUID of the project'),
    include_staff: z.boolean().default(true).describe('Include staff assignments'),
  }),
  execute: async (params, supabase) => {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.project_id)
      .is('deleted_at', null)
      .single()

    if (projectError) {
      return { success: false, error: projectError.message }
    }

    let staff = []
    if (params.include_staff) {
      const { data: staffData } = await supabase
        .from('project_staff')
        .select(`
          id, status, hourly_rate, check_in_time, check_out_time,
          candidates (id, full_name, phone_number, skills, total_points)
        `)
        .eq('project_id', params.project_id)

      staff = staffData || []
    }

    const staffNeeded = (project.crew_count || 0) - (project.filled_positions || 0)

    return {
      success: true,
      data: {
        project,
        staff,
        analysis: {
          staffNeeded,
          isUnderstaffed: staffNeeded > 0,
          confirmedStaff: staff.filter(s => s.status === 'confirmed').length,
          invitedStaff: staff.filter(s => s.status === 'invited').length,
        },
      },
      suggestions: staffNeeded > 0 ? [`This project needs ${staffNeeded} more staff`] : undefined,
      nextActions: staffNeeded > 0 ? [
        { label: 'Find matching candidates', action: `find candidates with skills for ${project.event_type}`, variant: 'default' },
        { label: 'Show available candidates', action: 'show available candidates', variant: 'outline' },
      ] : undefined,
    }
  },
}

export const createProjectTool: ToolDefinition = {
  name: 'create_project',
  description: 'Create a new project/event with the specified details',
  parameters: z.object({
    title: z.string().describe('Project title/name'),
    event_type: z.string().describe('Type of event (promotion, exhibition, conference, wedding, etc.)'),
    start_date: z.string().describe('Start date and time (YYYY-MM-DD HH:MM format)'),
    end_date: z.string().optional().describe('End date and time if different from start'),
    venue_address: z.string().optional().describe('Event venue address'),
    crew_count: z.coerce.number().min(1).describe('Number of staff needed'),
    supervisors_required: z.coerce.number().default(0).describe('Number of supervisors needed'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    brand_name: z.string().optional().describe('Brand or company name'),
    description: z.string().optional().describe('Project description'),
    hourly_rate: z.coerce.number().optional().describe('Default hourly rate for staff'),
  }),
  execute: async (params, supabase, context) => {
    // First check for conflicts on the same date
    const startDate = params.start_date.split(' ')[0]
    const { data: conflicts } = await supabase
      .from('projects')
      .select('id, title, start_date, crew_count, filled_positions')
      .gte('start_date', `${startDate}T00:00:00`)
      .lt('start_date', `${startDate}T23:59:59`)
      .is('deleted_at', null)
      .in('status', ['planning', 'active'])

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        title: params.title,
        event_type: params.event_type,
        start_date: params.start_date.includes('T') ? params.start_date : `${params.start_date}:00+08`,
        end_date: params.end_date ? (params.end_date.includes('T') ? params.end_date : `${params.end_date}:00+08`) : null,
        venue_address: params.venue_address,
        crew_count: params.crew_count,
        supervisors_required: params.supervisors_required || 0,
        priority: params.priority || 'medium',
        brand_name: params.brand_name,
        description: params.description,
        status: 'planning',
        filled_positions: 0,
        created_by: context?.userId,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const suggestions: string[] = []
    if (conflicts && conflicts.length > 0) {
      suggestions.push(`Note: There are ${conflicts.length} other project(s) on this date. Staff availability may be limited.`)
    }
    suggestions.push(`Project created successfully! Next step: Find and assign ${params.crew_count} staff members.`)

    return {
      success: true,
      data: {
        project: newProject,
        conflictsOnDate: conflicts?.length || 0,
      },
      suggestions,
      nextActions: [
        { label: 'Find matching candidates', action: `find candidates for ${params.event_type} event`, variant: 'default' },
        { label: 'View project details', action: `show project ${newProject.id}`, variant: 'outline' },
      ],
    }
  },
}

// ============================================
// Candidate Tools
// ============================================

export const findCandidatesTool: ToolDefinition = {
  name: 'find_candidates',
  description: 'Search for candidates based on skills, availability, experience, and other criteria',
  parameters: z.object({
    skills: z.array(z.string()).optional().describe('Required skills (e.g., ["Promoter", "Sales", "Waiter"])'),
    languages: z.array(z.string()).optional().describe('Required languages (e.g., ["Mandarin", "English"])'),
    min_points: z.coerce.number().optional().describe('Minimum loyalty/performance points'),
    status: z.enum(['active', 'inactive']).optional().describe('Candidate status'),
    gender: z.string().optional().describe('Filter by gender'),
    has_vehicle: z.boolean().optional().describe('Must have own vehicle'),
    exclude_banned: z.boolean().default(true).describe('Exclude banned candidates'),
    search: z.string().optional().describe('Search by name or phone number'),
    exclude_project_id: z.string().optional().describe('Exclude candidates already assigned to this project'),
    limit: z.coerce.number().max(50).default(20),
    order_by: z.enum(['total_points', 'full_name', 'created_at']).default('total_points'),
  }),
  execute: async (params, supabase) => {
    let query = supabase
      .from('candidates')
      .select('id, full_name, phone_number, gender, skills, languages, experience_tags, total_points, has_vehicle, status, profile_photo')

    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.exclude_banned) {
      query = query.or('is_banned.eq.false,is_banned.is.null')
    }
    if (params.gender) {
      query = query.eq('gender', params.gender)
    }
    if (params.has_vehicle) {
      query = query.eq('has_vehicle', true)
    }
    if (params.min_points) {
      query = query.gte('total_points', params.min_points)
    }
    if (params.search) {
      query = query.or(`full_name.ilike.%${params.search}%,phone_number.ilike.%${params.search}%`)
    }

    const { data: allCandidates, error } = await query
      .order(params.order_by || 'total_points', { ascending: false })
      .limit(100) // Get more, then filter

    if (error) {
      return { success: false, error: error.message }
    }

    let candidates = allCandidates || []

    // Filter by skills (array contains any)
    if (params.skills && params.skills.length > 0) {
      candidates = candidates.filter(c => {
        const candidateSkills = c.skills || []
        return params.skills!.some(skill =>
          candidateSkills.some((cs: string) => cs.toLowerCase().includes(skill.toLowerCase()))
        )
      })
    }

    // Filter by languages
    if (params.languages && params.languages.length > 0) {
      candidates = candidates.filter(c => {
        const candidateLangs = c.languages || []
        return params.languages!.some(lang =>
          candidateLangs.some((cl: string) => cl.toLowerCase().includes(lang.toLowerCase()))
        )
      })
    }

    // Exclude candidates assigned to project
    if (params.exclude_project_id) {
      const { data: assignedStaff } = await supabase
        .from('project_staff')
        .select('candidate_id')
        .eq('project_id', params.exclude_project_id)
        .in('status', ['invited', 'confirmed'])

      const assignedIds = new Set((assignedStaff || []).map(s => s.candidate_id))
      candidates = candidates.filter(c => !assignedIds.has(c.id))
    }

    // Apply limit after filtering
    candidates = candidates.slice(0, params.limit || 20)

    const avgPoints = candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + (c.total_points || 0), 0) / candidates.length)
      : 0

    const suggestions: string[] = []
    if (candidates.length === 0) {
      suggestions.push('No candidates found with exact criteria. Try broadening your search.')
      if (params.skills && params.skills.length > 1) {
        suggestions.push('Tip: Try searching for one skill at a time')
      }
    } else if (candidates.length < 5) {
      suggestions.push(`Only ${candidates.length} candidates found. Consider expanding search criteria.`)
    }

    return {
      success: true,
      data: {
        candidates,
        count: candidates.length,
        avgPoints,
        skillsSearched: params.skills,
      },
      suggestions,
      nextActions: candidates.length > 0 ? [
        { label: 'Assign top candidates', action: `assign top ${Math.min(5, candidates.length)} candidates`, variant: 'default' },
        { label: 'View candidate details', action: 'show candidate details', variant: 'outline' },
      ] : [
        { label: 'Show all active candidates', action: 'find candidates with active status', variant: 'default' },
        { label: 'Lower minimum points', action: 'find candidates with min_points 0', variant: 'outline' },
      ],
    }
  },
}

export const getCandidateDetailsTool: ToolDefinition = {
  name: 'get_candidate_details',
  description: 'Get detailed information about a specific candidate including their work history',
  parameters: z.object({
    candidate_id: z.string().describe('The UUID of the candidate'),
    include_history: z.boolean().default(true).describe('Include assignment history'),
  }),
  execute: async (params, supabase) => {
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', params.candidate_id)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    let history = []
    if (params.include_history) {
      const { data: assignments } = await supabase
        .from('project_staff')
        .select(`
          id, status, hourly_rate, check_in_time, check_out_time, actual_hours,
          projects (id, title, start_date, end_date, venue_address)
        `)
        .eq('candidate_id', params.candidate_id)
        .order('created_at', { ascending: false })
        .limit(10)

      history = assignments || []
    }

    const completedJobs = history.filter(h => h.status === 'completed').length
    const totalJobs = history.length

    return {
      success: true,
      data: {
        candidate: {
          ...candidate,
          // Mask sensitive data
          ic_number: candidate.ic_number ? `****${candidate.ic_number.slice(-4)}` : null,
          bank_account_number: candidate.bank_account_number ? `****${candidate.bank_account_number.slice(-4)}` : null,
        },
        history,
        stats: {
          totalJobs,
          completedJobs,
          completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        },
      },
    }
  },
}

// ============================================
// Staff Assignment Tools
// ============================================

export const assignStaffTool: ToolDefinition = {
  name: 'assign_staff',
  description: 'Assign a candidate to a project with specified rate',
  parameters: z.object({
    project_id: z.string().describe('The UUID of the project'),
    candidate_id: z.string().describe('The UUID of the candidate'),
    hourly_rate: z.coerce.number().optional().describe('Hourly rate for this assignment'),
    status: z.enum(['invited', 'confirmed']).default('invited').describe('Initial status'),
  }),
  execute: async (params, supabase) => {
    // Check if already assigned
    const { data: existing } = await supabase
      .from('project_staff')
      .select('id, status')
      .eq('project_id', params.project_id)
      .eq('candidate_id', params.candidate_id)
      .single()

    if (existing) {
      return {
        success: false,
        error: `Candidate is already assigned to this project with status: ${existing.status}`
      }
    }

    const { data, error } = await supabase
      .from('project_staff')
      .insert({
        project_id: params.project_id,
        candidate_id: params.candidate_id,
        hourly_rate: params.hourly_rate,
        status: params.status || 'invited',
      })
      .select(`
        id, status, hourly_rate,
        candidates (id, full_name, phone_number)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Update filled_positions count
    if (params.status === 'confirmed') {
      await supabase.rpc('increment_filled_positions', { project_id: params.project_id })
    }

    return {
      success: true,
      data: {
        assignment: data,
        message: `Successfully assigned ${data.candidates?.full_name} to project`,
      },
      nextActions: [
        { label: 'Assign more staff', action: 'find more candidates', variant: 'default' },
        { label: 'View project staff', action: `show staff for project ${params.project_id}`, variant: 'outline' },
      ],
    }
  },
}

export const getProjectStaffTool: ToolDefinition = {
  name: 'get_project_staff',
  description: 'Get all staff assigned to a project with their details and status',
  parameters: z.object({
    project_id: z.string().describe('The UUID of the project'),
    status: z.enum(['invited', 'confirmed', 'completed', 'cancelled', 'checked_in', 'checked_out']).optional().describe('Filter by status'),
  }),
  execute: async (params, supabase) => {
    let query = supabase
      .from('project_staff')
      .select(`
        id, status, hourly_rate, check_in_time, check_out_time, actual_hours,
        candidates (id, full_name, phone_number, skills, total_points, profile_photo)
      `)
      .eq('project_id', params.project_id)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const staff = data || []
    const statusSummary = staff.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      success: true,
      data: {
        staff,
        count: staff.length,
        byStatus: statusSummary,
      },
    }
  },
}

export const updateStaffStatusTool: ToolDefinition = {
  name: 'update_staff_status',
  description: 'Update the status of a staff assignment (e.g., confirm, cancel, check-in, check-out)',
  parameters: z.object({
    assignment_id: z.string().describe('The UUID of the project_staff assignment'),
    new_status: z.enum(['invited', 'confirmed', 'completed', 'cancelled', 'checked_in', 'checked_out']).describe('New status'),
    reason: z.string().optional().describe('Reason for status change (for cancellations)'),
  }),
  execute: async (params, supabase) => {
    const updates: Record<string, unknown> = {
      status: params.new_status,
    }

    if (params.new_status === 'checked_in') {
      updates.check_in_time = new Date().toISOString()
    }
    if (params.new_status === 'checked_out') {
      updates.check_out_time = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('project_staff')
      .update(updates)
      .eq('id', params.assignment_id)
      .select(`
        id, status, check_in_time, check_out_time,
        candidates (full_name),
        projects (id, title)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        assignment: data,
        message: `Updated ${data.candidates?.full_name}'s status to ${params.new_status}`,
      },
    }
  },
}

// ============================================
// Analytics Tools
// ============================================

export const getProjectStatsTool: ToolDefinition = {
  name: 'get_project_stats',
  description: 'Get comprehensive statistics about projects including counts by status, staffing levels, and upcoming deadlines',
  parameters: z.object({
    date_from: z.string().optional().describe('Start date for analysis (YYYY-MM-DD)'),
    date_to: z.string().optional().describe('End date for analysis (YYYY-MM-DD)'),
    group_by: z.enum(['status', 'priority', 'event_type', 'month']).optional().describe('Group statistics by this field'),
  }),
  execute: async (params, supabase) => {
    let query = supabase
      .from('projects')
      .select('id, title, status, priority, event_type, start_date, crew_count, filled_positions')
      .is('deleted_at', null)

    if (params.date_from) {
      query = query.gte('start_date', params.date_from)
    }
    if (params.date_to) {
      query = query.lte('start_date', params.date_to)
    }

    const { data: projects, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    const stats: Record<string, unknown> = {
      total: projects?.length || 0,
      byStatus: {},
      byPriority: {},
      byEventType: {},
      staffing: {
        totalNeeded: 0,
        totalFilled: 0,
        understaffedCount: 0,
      },
    }

    (projects || []).forEach(p => {
      // By status
      stats.byStatus[p.status] = ((stats.byStatus as Record<string, number>)[p.status] || 0) + 1
      // By priority
      stats.byPriority[p.priority] = ((stats.byPriority as Record<string, number>)[p.priority] || 0) + 1
      // By event type
      if (p.event_type) {
        stats.byEventType[p.event_type] = ((stats.byEventType as Record<string, number>)[p.event_type] || 0) + 1
      }
      // Staffing
      const staffing = stats.staffing as Record<string, number>
      staffing.totalNeeded += p.crew_count || 0
      staffing.totalFilled += p.filled_positions || 0
      if ((p.filled_positions || 0) < (p.crew_count || 0)) {
        staffing.understaffedCount++
      }
    })

    const staffing = stats.staffing as Record<string, number>
    const fillRate = staffing.totalNeeded > 0
      ? Math.round((staffing.totalFilled / staffing.totalNeeded) * 100)
      : 0

    return {
      success: true,
      data: {
        ...stats,
        staffing: {
          ...staffing,
          fillRate: `${fillRate}%`,
          gap: staffing.totalNeeded - staffing.totalFilled,
        },
      },
    }
  },
}

export const getUpcomingDeadlinesTool: ToolDefinition = {
  name: 'get_upcoming_deadlines',
  description: 'Get projects with upcoming deadlines that need attention, sorted by urgency',
  parameters: z.object({
    days_ahead: z.coerce.number().default(7).describe('Number of days to look ahead'),
    understaffed_only: z.boolean().default(false).describe('Only show understaffed projects'),
  }),
  execute: async (params, supabase) => {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + (params.days_ahead || 7))

    let query = supabase
      .from('projects')
      .select('id, title, status, priority, start_date, end_date, crew_count, filled_positions, venue_address')
      .is('deleted_at', null)
      .in('status', ['planning', 'active'])
      .gte('start_date', today.toISOString())
      .lte('start_date', futureDate.toISOString())
      .order('start_date', { ascending: true })

    const { data: projects, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    let results = projects || []
    if (params.understaffed_only) {
      results = results.filter(p => (p.filled_positions || 0) < (p.crew_count || 0))
    }

    // Calculate urgency
    const withUrgency = results.map(p => {
      const startDate = new Date(p.start_date)
      const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const staffNeeded = (p.crew_count || 0) - (p.filled_positions || 0)

      let urgency = 'low'
      if (daysUntil <= 1 && staffNeeded > 0) urgency = 'critical'
      else if (daysUntil <= 3 && staffNeeded > 0) urgency = 'high'
      else if (daysUntil <= 5 && staffNeeded > 0) urgency = 'medium'
      else if (staffNeeded > 0) urgency = 'low'
      else urgency = 'none'

      return {
        ...p,
        daysUntil,
        staffNeeded,
        urgency,
      }
    })

    const criticalCount = withUrgency.filter(p => p.urgency === 'critical').length
    const highCount = withUrgency.filter(p => p.urgency === 'high').length

    return {
      success: true,
      data: {
        projects: withUrgency,
        count: withUrgency.length,
        urgencySummary: {
          critical: criticalCount,
          high: highCount,
          medium: withUrgency.filter(p => p.urgency === 'medium').length,
          low: withUrgency.filter(p => p.urgency === 'low').length,
        },
      },
      suggestions: criticalCount > 0
        ? [`⚠️ ${criticalCount} project(s) have CRITICAL staffing needs (within 24 hours)`]
        : highCount > 0
        ? [`${highCount} project(s) need attention within 3 days`]
        : undefined,
    }
  },
}

// ============================================
// Memory Tool
// ============================================

export const saveUserMemoryTool: ToolDefinition = {
  name: 'save_user_memory',
  description: 'Save an important fact or preference about the user for future conversations. Use this when the user tells you something they want you to remember, mentions a preference, or shares context about themselves or their work.',
  parameters: z.object({
    key: z.string().describe('A short identifier for this memory (e.g., "preferred_language", "team_size", "main_role", "prefers_brief_responses")'),
    value: z.string().describe('The actual content/value to remember'),
    memory_type: z.enum(['preference', 'fact', 'context', 'instruction']).default('fact').describe('Type of memory: preference (user likes/dislikes), fact (about user), context (work context), instruction (how to behave)'),
    category: z.enum(['communication', 'work', 'team', 'personal']).optional().describe('Category for organizing memories'),
    confidence: z.coerce.number().min(0).max(1).default(1.0).describe('Confidence level: 1.0 for explicit statements, 0.5-0.8 for inferred'),
  }),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User ID required to save memory' }
    }

    const { data, error } = await supabase.rpc('upsert_user_memory', {
      p_user_id: context.userId,
      p_key: params.key,
      p_value: params.value,
      p_memory_type: params.memory_type || 'fact',
      p_category: params.category || null,
      p_confidence: params.confidence || 1.0,
      p_source: 'conversation',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        saved: true,
        key: params.key,
        message: `I'll remember that for future conversations.`,
      },
    }
  },
}

// ============================================
// Expense Tools
// ============================================

export const getExpenseClaimsTool: ToolDefinition = {
  name: 'get_expense_claims',
  description: 'Get expense claims with optional filters by status, user, or project. Managers can view all claims, staff can only view their own.',
  parameters: z.object({
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional().describe('Filter by claim status'),
    user_id: z.string().optional().describe('Filter by user who submitted the claim'),
    project_id: z.string().optional().describe('Filter by project'),
    pending_my_approval: z.boolean().optional().describe('Show only claims waiting for my approval'),
    limit: z.coerce.number().max(50).default(20),
  }),
  execute: async (params, supabase, context) => {
    // Query minimal columns that exist in the base schema
    let query = supabase
      .from('expense_claims')
      .select(`
        id, title, description, total_amount, status,
        submitted_at, approved_at, rejected_at, rejection_reason,
        user_id, approver_id, project_id, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(params.limit || 20)

    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.user_id) {
      query = query.eq('user_id', params.user_id)
    }
    if (params.project_id) {
      query = query.eq('project_id', params.project_id)
    }
    if (params.pending_my_approval && context?.userId) {
      query = query.eq('approver_id', context.userId).eq('status', 'pending')
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    const claims = data || []
    const pendingCount = claims.filter(c => c.status === 'pending').length
    const totalAmount = claims.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0)

    const statusSummary = claims.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      success: true,
      data: {
        claims,
        count: claims.length,
        totalAmount: totalAmount.toFixed(2),
        byStatus: statusSummary,
      },
      suggestions: pendingCount > 0
        ? [`${pendingCount} claim(s) are pending approval`]
        : undefined,
      nextActions: pendingCount > 0 ? [
        { label: 'Review pending claims', action: 'show pending expense claims', variant: 'default' },
      ] : undefined,
    }
  },
}

export const getPendingApprovalsTool: ToolDefinition = {
  name: 'get_pending_approvals',
  description: 'Get all expense claims that are waiting for the current user to approve',
  parameters: z.object({
    limit: z.coerce.number().max(50).default(20),
  }),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User authentication required' }
    }

    const { data, error } = await supabase
      .from('expense_claims')
      .select(`
        id, title, description, total_amount, status,
        submitted_at, user_id, project_id, created_at
      `)
      .eq('approver_id', context.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(params.limit || 20)

    if (error) {
      return { success: false, error: error.message }
    }

    const claims = data || []
    const totalAmount = claims.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0)

    return {
      success: true,
      data: {
        claims,
        count: claims.length,
        totalPendingAmount: totalAmount.toFixed(2),
      },
      suggestions: claims.length > 0
        ? [`You have ${claims.length} expense claim(s) to review, totaling RM ${totalAmount.toFixed(2)}`]
        : ['No pending expense claims to approve'],
      nextActions: claims.length > 0 ? [
        { label: 'Approve all', action: 'approve all pending expense claims', variant: 'default' },
        { label: 'Review first claim', action: `review expense claim ${claims[0]?.id}`, variant: 'outline' },
      ] : undefined,
    }
  },
}

export const approveExpenseClaimTool: ToolDefinition = {
  name: 'approve_expense_claim',
  description: 'Approve a pending expense claim. Only the designated approver can approve.',
  parameters: z.object({
    claim_id: z.string().describe('The UUID of the expense claim to approve'),
  }),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User authentication required' }
    }

    // Call the stored procedure
    const { data, error } = await supabase.rpc('approve_expense_claim', {
      claim_id: params.claim_id,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.message || 'Failed to approve expense claim',
        suggestions: ['Make sure you are the designated approver for this claim', 'The claim must be in pending status']
      }
    }

    return {
      success: true,
      data: {
        claim: data.data,
        message: 'Expense claim approved successfully',
      },
      nextActions: [
        { label: 'View more pending claims', action: 'show my pending approvals', variant: 'default' },
      ],
    }
  },
}

export const rejectExpenseClaimTool: ToolDefinition = {
  name: 'reject_expense_claim',
  description: 'Reject a pending expense claim with a reason. Only the designated approver can reject.',
  parameters: z.object({
    claim_id: z.string().describe('The UUID of the expense claim to reject'),
    reason: z.string().describe('Reason for rejection'),
  }),
  execute: async (params, supabase, context) => {
    if (!context?.userId) {
      return { success: false, error: 'User authentication required' }
    }

    // Call the stored procedure
    const { data, error } = await supabase.rpc('reject_expense_claim', {
      claim_id: params.claim_id,
      reason: params.reason,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.message || 'Failed to reject expense claim',
        suggestions: ['Make sure you are the designated approver for this claim', 'The claim must be in pending status']
      }
    }

    return {
      success: true,
      data: {
        claim: data.data,
        message: `Expense claim rejected. Reason: ${params.reason}`,
      },
      nextActions: [
        { label: 'View more pending claims', action: 'show my pending approvals', variant: 'default' },
      ],
    }
  },
}

// ============================================
// Business Intelligence Tools (Smart Baiger)
// ============================================

export const getBusinessOverviewTool: ToolDefinition = {
  name: 'get_business_overview',
  description: 'Get a comprehensive business overview including revenue, project stats, crew utilization, and key metrics. Use this for "how are we doing" type questions.',
  parameters: z.object({
    period: z.enum(['today', 'this_week', 'this_month', 'last_month', 'this_quarter', 'this_year']).default('this_month').describe('Time period for analysis'),
    compare_to_previous: z.boolean().default(true).describe('Compare to previous period'),
  }),
  execute: async (params, supabase) => {
    const period = params.period || 'this_month'
    const now = new Date()
    let startDate: Date
    let endDate: Date = now
    let previousStartDate: Date
    let previousEndDate: Date

    // Calculate date ranges
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 1)
        previousEndDate = new Date(startDate)
        break
      case 'this_week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        previousEndDate = new Date(startDate)
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0)
        break
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1)
        previousEndDate = new Date(now.getFullYear(), quarter * 3, 0)
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
    }

    // Get current period projects
    const { data: currentProjects } = await supabase
      .from('projects')
      .select('id, status, priority, crew_count, filled_positions, start_date')
      .is('deleted_at', null)
      .gte('start_date', startDate.toISOString())
      .lte('start_date', endDate.toISOString())

    // Get previous period projects for comparison
    const { data: previousProjects } = await supabase
      .from('projects')
      .select('id, status, crew_count, filled_positions')
      .is('deleted_at', null)
      .gte('start_date', previousStartDate.toISOString())
      .lte('start_date', previousEndDate.toISOString())

    // Get top performers
    const { data: topPerformers } = await supabase
      .from('candidates')
      .select('id, full_name, total_points')
      .eq('status', 'active')
      .order('total_points', { ascending: false })
      .limit(5)

    // Get recent activity
    const { data: recentAssignments } = await supabase
      .from('project_staff')
      .select('id, status, created_at')
      .gte('created_at', startDate.toISOString())

    const projects = currentProjects || []
    const prevProjects = previousProjects || []
    const assignments = recentAssignments || []

    // Calculate metrics
    const totalProjects = projects.length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const understaffed = projects.filter(p => (p.filled_positions || 0) < (p.crew_count || 0)).length

    const totalCrewNeeded = projects.reduce((sum, p) => sum + (p.crew_count || 0), 0)
    const totalCrewFilled = projects.reduce((sum, p) => sum + (p.filled_positions || 0), 0)
    const utilizationRate = totalCrewNeeded > 0 ? Math.round((totalCrewFilled / totalCrewNeeded) * 100) : 0

    // Previous period metrics
    const prevTotalProjects = prevProjects.length
    const prevCrewNeeded = prevProjects.reduce((sum, p) => sum + (p.crew_count || 0), 0)
    const prevCrewFilled = prevProjects.reduce((sum, p) => sum + (p.filled_positions || 0), 0)
    const prevUtilization = prevCrewNeeded > 0 ? Math.round((prevCrewFilled / prevCrewNeeded) * 100) : 0

    // Calculate changes
    const projectChange = prevTotalProjects > 0 ? Math.round(((totalProjects - prevTotalProjects) / prevTotalProjects) * 100) : 0
    const utilizationChange = prevUtilization > 0 ? utilizationRate - prevUtilization : 0

    // Insights
    const insights: string[] = []
    if (understaffed > 0) {
      insights.push(`⚠️ ${understaffed} project(s) are understaffed and need attention`)
    }
    if (utilizationChange > 5) {
      insights.push(`📈 Crew utilization improved by ${utilizationChange}% vs previous period`)
    } else if (utilizationChange < -5) {
      insights.push(`📉 Crew utilization dropped by ${Math.abs(utilizationChange)}% vs previous period`)
    }
    if (projectChange > 20) {
      insights.push(`🚀 Project volume increased by ${projectChange}% - consider recruiting more crew`)
    }

    // Concerns
    const concerns: string[] = []
    if (utilizationRate < 70) {
      concerns.push(`Low crew utilization (${utilizationRate}%) - consider better matching or marketing`)
    }
    if (understaffed > totalProjects * 0.3) {
      concerns.push(`High understaffing rate (${Math.round((understaffed / totalProjects) * 100)}%) - urgent recruitment needed`)
    }

    return {
      success: true,
      data: {
        period: period,
        dateRange: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
        summary: {
          totalProjects,
          completedProjects,
          activeProjects,
          understaffed,
          crewUtilization: `${utilizationRate}%`,
          totalCrewNeeded,
          totalCrewFilled,
          totalAssignments: assignments.length,
        },
        comparison: params.compare_to_previous ? {
          previousPeriod: { from: previousStartDate.toISOString().split('T')[0], to: previousEndDate.toISOString().split('T')[0] },
          projectChange: `${projectChange > 0 ? '+' : ''}${projectChange}%`,
          utilizationChange: `${utilizationChange > 0 ? '+' : ''}${utilizationChange}%`,
        } : null,
        topPerformers: topPerformers || [],
        insights,
        concerns,
      },
      suggestions: insights.length > 0 ? insights : ['Business is running smoothly this period'],
    }
  },
}

export const analyzeProblemTool: ToolDefinition = {
  name: 'analyze_problem',
  description: 'Analyze a business problem and provide data-driven recommendations. Use for questions like "why are we having X problem" or "what should I do about Y".',
  parameters: z.object({
    problem_type: z.enum([
      'no_shows',
      'understaffing',
      'low_performance',
      'high_cancellations',
      'payment_delays',
      'client_complaints',
      'crew_shortage',
      'scheduling_conflicts',
      'other'
    ]).describe('Type of problem to analyze'),
    custom_problem: z.string().optional().describe('Description if problem_type is "other"'),
    time_range_days: z.coerce.number().default(30).describe('Number of days to analyze'),
  }),
  execute: async (params, supabase) => {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - (params.time_range_days || 30))

    const analysis: Record<string, unknown> = {
      problemType: params.problem_type,
      timeRange: `Last ${params.time_range_days} days`,
      findings: [],
      rootCauses: [],
      recommendations: [],
      actionItems: [],
    }

    switch (params.problem_type) {
      case 'no_shows': {
        // Analyze no-show patterns
        const { data: assignments } = await supabase
          .from('project_staff')
          .select(`
            id, status, candidate_id, project_id, created_at,
            candidates (id, full_name, total_points),
            projects (id, title, start_date, venue_address)
          `)
          .in('status', ['cancelled', 'no_show'])
          .gte('created_at', daysAgo.toISOString())

        const noShows = assignments || []
        const byCandidate: Record<string, number> = {}
        const byDayOfWeek: Record<string, number> = {}

        noShows.forEach(ns => {
          if (ns.candidate_id) {
            byCandidate[ns.candidate_id] = (byCandidate[ns.candidate_id] || 0) + 1
          }
          const project = ns.projects as { start_date?: string } | null
          if (project?.start_date) {
            const day = new Date(project.start_date).toLocaleDateString('en-US', { weekday: 'long' })
            byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1
          }
        })

        // Find repeat offenders
        const repeatOffenders = Object.entries(byCandidate)
          .filter(([_, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])

        // Find problematic days
        const problematicDays = Object.entries(byDayOfWeek)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)

        analysis.findings = [
          `Total no-shows/cancellations: ${noShows.length}`,
          `Repeat offenders: ${repeatOffenders.length} crew members`,
          problematicDays.length > 0 ? `Most affected days: ${problematicDays.map(d => d[0]).join(', ')}` : null,
        ].filter(Boolean)

        analysis.rootCauses = []
        if (repeatOffenders.length > 0) {
          analysis.rootCauses.push('Some crew members have reliability issues')
        }
        if (problematicDays.some(d => ['Saturday', 'Sunday'].includes(d[0]))) {
          analysis.rootCauses.push('Weekend events have higher no-show rates')
        }

        analysis.recommendations = [
          'Require 24-hour advance confirmation for all assignments',
          repeatOffenders.length > 0 ? 'Consider flagging or removing repeat offenders' : null,
          'Implement a penalty point system for no-shows',
          'Have backup crew on standby for high-risk events',
        ].filter(Boolean)

        analysis.repeatOffenders = repeatOffenders.slice(0, 5)
        break
      }

      case 'understaffing': {
        // Analyze understaffing patterns
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, start_date, crew_count, filled_positions, venue_address, event_type')
          .is('deleted_at', null)
          .in('status', ['planning', 'active'])
          .lt('filled_positions', 'crew_count')
          .order('start_date', { ascending: true })

        const understaffed = projects || []
        const totalGap = understaffed.reduce((sum, p) => sum + ((p.crew_count || 0) - (p.filled_positions || 0)), 0)

        const byEventType: Record<string, number> = {}
        understaffed.forEach(p => {
          if (p.event_type) {
            byEventType[p.event_type] = (byEventType[p.event_type] || 0) + 1
          }
        })

        // Get active crew count
        const { count: activeCrew } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        analysis.findings = [
          `${understaffed.length} projects are currently understaffed`,
          `Total crew gap: ${totalGap} positions`,
          `Active crew pool: ${activeCrew || 0} members`,
          Object.keys(byEventType).length > 0 ? `Most affected event types: ${Object.entries(byEventType).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]).join(', ')}` : null,
        ].filter(Boolean)

        analysis.rootCauses = []
        if (totalGap > (activeCrew || 0) * 0.2) {
          analysis.rootCauses.push('Crew pool is too small for current demand')
        }
        if (Object.keys(byEventType).length > 0) {
          analysis.rootCauses.push(`Certain event types (${Object.keys(byEventType)[0]}) may need specialized skills`)
        }

        analysis.recommendations = [
          'Launch a recruitment drive to expand the crew pool',
          'Reach out to inactive crew members to reactivate them',
          'Consider partnering with staffing agencies for overflow',
          'Review rate competitiveness vs market',
        ]

        analysis.understaffedProjects = understaffed.slice(0, 10)
        break
      }

      case 'crew_shortage': {
        // Analyze crew supply vs demand
        const { data: upcomingProjects } = await supabase
          .from('projects')
          .select('id, start_date, crew_count, filled_positions')
          .is('deleted_at', null)
          .in('status', ['planning', 'active'])
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(30)

        const { data: candidates } = await supabase
          .from('candidates')
          .select('id, status, created_at')

        const projects = upcomingProjects || []
        const allCandidates = candidates || []

        const activeCandidates = allCandidates.filter(c => c.status === 'active').length
        const inactiveCandidates = allCandidates.filter(c => c.status === 'inactive').length
        const totalDemand = projects.reduce((sum, p) => sum + (p.crew_count || 0), 0)
        const totalFilled = projects.reduce((sum, p) => sum + (p.filled_positions || 0), 0)

        // Find peak demand dates
        const demandByDate: Record<string, number> = {}
        projects.forEach(p => {
          const date = new Date(p.start_date).toISOString().split('T')[0]
          demandByDate[date] = (demandByDate[date] || 0) + (p.crew_count || 0)
        })
        const peakDates = Object.entries(demandByDate)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)

        analysis.findings = [
          `Active crew: ${activeCandidates}`,
          `Inactive crew: ${inactiveCandidates} (potential reactivation pool)`,
          `Upcoming demand: ${totalDemand} positions across ${projects.length} projects`,
          `Currently filled: ${totalFilled} (${Math.round((totalFilled / totalDemand) * 100)}%)`,
          peakDates.length > 0 ? `Peak demand dates: ${peakDates.slice(0, 3).map(d => `${d[0]} (${d[1]} crew)`).join(', ')}` : null,
        ].filter(Boolean)

        analysis.recommendations = [
          `Contact ${inactiveCandidates} inactive crew members for reactivation`,
          'Run referral bonus campaign for existing crew',
          'Post recruitment ads on job platforms',
          peakDates.length > 0 ? `Plan extra staffing for peak date: ${peakDates[0][0]}` : null,
        ].filter(Boolean)

        analysis.peakDates = peakDates
        break
      }

      default: {
        // Generic analysis
        const { data: projectStats } = await supabase
          .from('projects')
          .select('status')
          .is('deleted_at', null)
          .gte('created_at', daysAgo.toISOString())

        const stats = (projectStats || []).reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        analysis.findings = [
          `Analyzed ${Object.values(stats).reduce((a, b) => a + b, 0)} projects`,
          `Status breakdown: ${JSON.stringify(stats)}`,
        ]

        analysis.recommendations = [
          'Provide more specific problem description for detailed analysis',
          'Consider running get_business_overview for general health check',
        ]
      }
    }

    return {
      success: true,
      data: analysis,
      suggestions: (analysis.recommendations as string[]).slice(0, 3),
      nextActions: [
        { label: 'View detailed metrics', action: 'get_business_overview', variant: 'default' },
        { label: 'Find available crew', action: 'find_candidates with active status', variant: 'outline' },
      ],
    }
  },
}

export const getFinancialAnalysisTool: ToolDefinition = {
  name: 'get_financial_analysis',
  description: 'Analyze financial performance including revenue, costs, profitability by venue/client/event type. Use for "am I making money on X" type questions.',
  parameters: z.object({
    analysis_type: z.enum(['venue', 'client', 'event_type', 'overall']).default('overall').describe('What to analyze'),
    filter_value: z.string().optional().describe('Specific venue/client/event_type to analyze'),
    period_months: z.coerce.number().default(6).describe('Number of months to analyze'),
  }),
  execute: async (params, supabase) => {
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - (params.period_months || 6))

    // Get projects with staff costs
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        id, title, venue_address, event_type, client_id, status,
        crew_count, filled_positions, start_date,
        project_staff (hourly_rate, actual_hours, status)
      `)
      .is('deleted_at', null)
      .gte('start_date', monthsAgo.toISOString())
      .in('status', ['completed', 'active'])

    const allProjects = projects || []

    // Calculate metrics per project
    interface ProjectMetrics {
      id: string
      title: string
      venue: string
      eventType: string
      crewCost: number
      estimatedRevenue: number
      margin: number
      marginPercent: number
    }

    const projectMetrics: ProjectMetrics[] = allProjects.map(p => {
      const staff = (p.project_staff || []) as Array<{ hourly_rate: number; actual_hours: number; status: string }>
      const crewCost = staff.reduce((sum, s) => {
        const hours = s.actual_hours || 8 // Default 8 hours if not recorded
        const rate = s.hourly_rate || 0
        return sum + (hours * rate)
      }, 0)

      // Estimate revenue (typically 30-50% margin on crew cost)
      const estimatedRevenue = crewCost * 1.4 // Assume 40% markup
      const margin = estimatedRevenue - crewCost
      const marginPercent = estimatedRevenue > 0 ? (margin / estimatedRevenue) * 100 : 0

      return {
        id: p.id,
        title: p.title,
        venue: p.venue_address || 'Unknown',
        eventType: p.event_type || 'Unknown',
        crewCost,
        estimatedRevenue,
        margin,
        marginPercent,
      }
    })

    // Group by analysis type
    let groupedAnalysis: Record<string, { count: number; totalCost: number; totalRevenue: number; avgMargin: number }> = {}

    if (params.analysis_type === 'venue') {
      projectMetrics.forEach(p => {
        const key = p.venue.split(',')[0].trim() // Use first part of address
        if (!groupedAnalysis[key]) {
          groupedAnalysis[key] = { count: 0, totalCost: 0, totalRevenue: 0, avgMargin: 0 }
        }
        groupedAnalysis[key].count++
        groupedAnalysis[key].totalCost += p.crewCost
        groupedAnalysis[key].totalRevenue += p.estimatedRevenue
      })
    } else if (params.analysis_type === 'event_type') {
      projectMetrics.forEach(p => {
        if (!groupedAnalysis[p.eventType]) {
          groupedAnalysis[p.eventType] = { count: 0, totalCost: 0, totalRevenue: 0, avgMargin: 0 }
        }
        groupedAnalysis[p.eventType].count++
        groupedAnalysis[p.eventType].totalCost += p.crewCost
        groupedAnalysis[p.eventType].totalRevenue += p.estimatedRevenue
      })
    }

    // Calculate margins
    Object.keys(groupedAnalysis).forEach(key => {
      const g = groupedAnalysis[key]
      g.avgMargin = g.totalRevenue > 0 ? ((g.totalRevenue - g.totalCost) / g.totalRevenue) * 100 : 0
    })

    // Sort by margin
    const sortedAnalysis = Object.entries(groupedAnalysis)
      .map(([name, data]) => ({ name, ...data, profit: data.totalRevenue - data.totalCost }))
      .sort((a, b) => b.avgMargin - a.avgMargin)

    // Overall totals
    const totalCost = projectMetrics.reduce((sum, p) => sum + p.crewCost, 0)
    const totalRevenue = projectMetrics.reduce((sum, p) => sum + p.estimatedRevenue, 0)
    const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

    // Identify best and worst performers
    const bestPerformers = sortedAnalysis.filter(a => a.avgMargin >= 30).slice(0, 3)
    const underperformers = sortedAnalysis.filter(a => a.avgMargin < 25 && a.count >= 2)

    const insights: string[] = []
    if (bestPerformers.length > 0) {
      insights.push(`🏆 Best margins: ${bestPerformers.map(p => `${p.name} (${p.avgMargin.toFixed(1)}%)`).join(', ')}`)
    }
    if (underperformers.length > 0) {
      insights.push(`⚠️ Low margins: ${underperformers.map(p => `${p.name} (${p.avgMargin.toFixed(1)}%)`).join(', ')}`)
    }

    const recommendations: string[] = []
    if (underperformers.length > 0) {
      recommendations.push(`Review pricing for ${underperformers[0].name} - margin is below target`)
    }
    if (overallMargin < 25) {
      recommendations.push('Overall margins are thin - consider raising rates or reducing costs')
    }

    return {
      success: true,
      data: {
        period: `Last ${params.period_months} months`,
        overall: {
          totalProjects: projectMetrics.length,
          totalCrewCost: totalCost.toFixed(2),
          estimatedRevenue: totalRevenue.toFixed(2),
          estimatedProfit: (totalRevenue - totalCost).toFixed(2),
          overallMargin: `${overallMargin.toFixed(1)}%`,
        },
        byCategory: sortedAnalysis,
        bestPerformers,
        underperformers,
        insights,
        recommendations,
      },
      suggestions: insights.concat(recommendations),
    }
  },
}

export const getForecastTool: ToolDefinition = {
  name: 'get_forecast',
  description: 'Get demand forecast and recommendations for upcoming period. Use for "what should I prepare for" type questions.',
  parameters: z.object({
    period: z.enum(['next_week', 'next_month', 'next_quarter']).default('next_month').describe('Forecast period'),
    compare_to_historical: z.boolean().default(true).describe('Compare to same period last year'),
  }),
  execute: async (params, supabase) => {
    const now = new Date()
    let forecastStart: Date
    let forecastEnd: Date
    let historicalStart: Date
    let historicalEnd: Date

    switch (params.period) {
      case 'next_week':
        forecastStart = new Date(now)
        forecastStart.setDate(now.getDate() + 1)
        forecastEnd = new Date(now)
        forecastEnd.setDate(now.getDate() + 7)
        historicalStart = new Date(forecastStart)
        historicalStart.setFullYear(historicalStart.getFullYear() - 1)
        historicalEnd = new Date(forecastEnd)
        historicalEnd.setFullYear(historicalEnd.getFullYear() - 1)
        break
      case 'next_month':
        forecastStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        forecastEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        historicalStart = new Date(forecastStart)
        historicalStart.setFullYear(historicalStart.getFullYear() - 1)
        historicalEnd = new Date(forecastEnd)
        historicalEnd.setFullYear(historicalEnd.getFullYear() - 1)
        break
      case 'next_quarter':
        const nextQuarter = Math.floor(now.getMonth() / 3) + 1
        forecastStart = new Date(now.getFullYear(), nextQuarter * 3, 1)
        forecastEnd = new Date(now.getFullYear(), (nextQuarter + 1) * 3, 0)
        historicalStart = new Date(forecastStart)
        historicalStart.setFullYear(historicalStart.getFullYear() - 1)
        historicalEnd = new Date(forecastEnd)
        historicalEnd.setFullYear(historicalEnd.getFullYear() - 1)
        break
      default:
        forecastStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        forecastEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        historicalStart = new Date(forecastStart)
        historicalStart.setFullYear(historicalStart.getFullYear() - 1)
        historicalEnd = new Date(forecastEnd)
        historicalEnd.setFullYear(historicalEnd.getFullYear() - 1)
    }

    // Get upcoming confirmed projects
    const { data: upcomingProjects } = await supabase
      .from('projects')
      .select('id, title, start_date, crew_count, filled_positions, venue_address, priority')
      .is('deleted_at', null)
      .in('status', ['planning', 'active'])
      .gte('start_date', forecastStart.toISOString())
      .lte('start_date', forecastEnd.toISOString())
      .order('start_date', { ascending: true })

    // Get historical data for comparison
    const { data: historicalProjects } = await supabase
      .from('projects')
      .select('id, crew_count')
      .is('deleted_at', null)
      .gte('start_date', historicalStart.toISOString())
      .lte('start_date', historicalEnd.toISOString())

    // Get active crew count
    const { count: activeCrew } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get inactive but reactivatable crew
    const { count: inactiveCrew } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive')

    const upcoming = upcomingProjects || []
    const historical = historicalProjects || []

    const currentDemand = upcoming.reduce((sum, p) => sum + (p.crew_count || 0), 0)
    const currentFilled = upcoming.reduce((sum, p) => sum + (p.filled_positions || 0), 0)
    const historicalDemand = historical.reduce((sum, p) => sum + (p.crew_count || 0), 0)

    // Find peak days
    const demandByDate: Record<string, { count: number; projects: string[] }> = {}
    upcoming.forEach(p => {
      const date = new Date(p.start_date).toISOString().split('T')[0]
      if (!demandByDate[date]) {
        demandByDate[date] = { count: 0, projects: [] }
      }
      demandByDate[date].count += p.crew_count || 0
      demandByDate[date].projects.push(p.title)
    })

    const peakDays = Object.entries(demandByDate)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([date, data]) => ({ date, ...data }))

    // Calculate gap
    const crewGap = currentDemand - (activeCrew || 0)
    const demandVsHistorical = historicalDemand > 0
      ? Math.round(((currentDemand - historicalDemand) / historicalDemand) * 100)
      : 0

    // Recommendations
    const recommendations: string[] = []
    if (crewGap > 0) {
      recommendations.push(`⚠️ Need ${crewGap} more crew to meet demand - start recruiting now`)
    }
    if (demandVsHistorical > 20) {
      recommendations.push(`📈 Demand is ${demandVsHistorical}% higher than same period last year`)
    }
    if (peakDays.length > 0 && peakDays[0].count > (activeCrew || 0)) {
      recommendations.push(`🚨 Peak day ${peakDays[0].date} needs ${peakDays[0].count} crew - plan accordingly`)
    }
    if (inactiveCrew && inactiveCrew > 10) {
      recommendations.push(`💡 Consider reactivating some of the ${inactiveCrew} inactive crew members`)
    }

    // Action items
    const actionItems = []
    if (crewGap > 0) {
      actionItems.push({ label: 'Start recruitment', action: 'How do I recruit more crew?', variant: 'default' })
    }
    if (inactiveCrew && inactiveCrew > 0) {
      actionItems.push({ label: `Contact ${inactiveCrew} inactive crew`, action: 'find_candidates with inactive status', variant: 'outline' })
    }

    return {
      success: true,
      data: {
        forecastPeriod: {
          from: forecastStart.toISOString().split('T')[0],
          to: forecastEnd.toISOString().split('T')[0],
        },
        demand: {
          confirmedProjects: upcoming.length,
          totalCrewNeeded: currentDemand,
          currentlyFilled: currentFilled,
          fillRate: `${currentDemand > 0 ? Math.round((currentFilled / currentDemand) * 100) : 0}%`,
          gap: currentDemand - currentFilled,
        },
        capacity: {
          activeCrew: activeCrew || 0,
          inactiveCrew: inactiveCrew || 0,
          crewGap,
          capacityStatus: crewGap <= 0 ? 'sufficient' : crewGap < 10 ? 'tight' : 'critical',
        },
        historicalComparison: params.compare_to_historical ? {
          samePerioLastYear: historicalDemand,
          change: `${demandVsHistorical > 0 ? '+' : ''}${demandVsHistorical}%`,
        } : null,
        peakDays,
        recommendations,
      },
      suggestions: recommendations,
      nextActions: actionItems as ActionButton[],
    }
  },
}

export const getSmartRecommendationsTool: ToolDefinition = {
  name: 'get_smart_recommendations',
  description: 'Get proactive AI recommendations based on current business state. Use this for general "what should I focus on" or "any issues I should know about" questions.',
  parameters: z.object({
    focus_area: z.enum(['all', 'staffing', 'projects', 'finance', 'performance']).default('all').describe('Area to focus recommendations on'),
  }),
  execute: async (params, supabase) => {
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(now.getDate() + 7)

    const recommendations: Array<{
      priority: 'critical' | 'high' | 'medium' | 'low'
      category: string
      title: string
      description: string
      action: string
    }> = []

    // Check for understaffed urgent projects
    const { data: urgentProjects } = await supabase
      .from('projects')
      .select('id, title, start_date, crew_count, filled_positions')
      .is('deleted_at', null)
      .in('status', ['planning', 'active'])
      .lt('filled_positions', 'crew_count')
      .gte('start_date', now.toISOString())
      .lte('start_date', threeDaysFromNow.toISOString())

    if (urgentProjects && urgentProjects.length > 0) {
      urgentProjects.forEach(p => {
        const gap = (p.crew_count || 0) - (p.filled_positions || 0)
        recommendations.push({
          priority: 'critical',
          category: 'staffing',
          title: `${p.title} needs ${gap} more crew`,
          description: `Project starts on ${new Date(p.start_date).toLocaleDateString()} and is understaffed`,
          action: `find candidates for project ${p.id}`,
        })
      })
    }

    // Check for unconfirmed staff on upcoming projects
    const { data: pendingConfirmations } = await supabase
      .from('project_staff')
      .select(`
        id, status,
        projects (id, title, start_date)
      `)
      .eq('status', 'invited')
      .limit(50)

    const upcomingPending = (pendingConfirmations || []).filter(ps => {
      const project = ps.projects as { start_date?: string } | null
      if (!project?.start_date) return false
      const startDate = new Date(project.start_date)
      return startDate >= now && startDate <= sevenDaysFromNow
    })

    if (upcomingPending.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'staffing',
        title: `${upcomingPending.length} pending confirmations this week`,
        description: 'Staff members who haven\'t confirmed their assignments yet',
        action: 'show pending staff confirmations',
      })
    }

    // Check for high priority projects without full staff
    const { data: highPriorityProjects } = await supabase
      .from('projects')
      .select('id, title, start_date, crew_count, filled_positions')
      .is('deleted_at', null)
      .eq('priority', 'high')
      .in('status', ['planning', 'active'])
      .lt('filled_positions', 'crew_count')
      .limit(5)

    if (highPriorityProjects && highPriorityProjects.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'projects',
        title: `${highPriorityProjects.length} high-priority projects understaffed`,
        description: 'These VIP/urgent projects need attention',
        action: 'get_projects with priority high and understaffed_only true',
      })
    }

    // Check for pending expense claims (if user is approver)
    const { data: pendingExpenses } = await supabase
      .from('expense_claims')
      .select('id, total_amount')
      .eq('status', 'pending')
      .limit(50)

    if (pendingExpenses && pendingExpenses.length > 0) {
      const totalAmount = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.total_amount || '0'), 0)
      recommendations.push({
        priority: 'medium',
        category: 'finance',
        title: `${pendingExpenses.length} expense claims pending approval`,
        description: `Total: RM ${totalAmount.toFixed(2)} waiting for review`,
        action: 'get_pending_approvals',
      })
    }

    // Check crew with low performance
    const { data: lowPerformers } = await supabase
      .from('candidates')
      .select('id, full_name, total_points')
      .eq('status', 'active')
      .lt('total_points', 50)
      .gt('total_points', 0)
      .limit(10)

    if (lowPerformers && lowPerformers.length > 5) {
      recommendations.push({
        priority: 'low',
        category: 'performance',
        title: `${lowPerformers.length} crew members with low performance points`,
        description: 'Consider coaching or reviewing their assignments',
        action: 'find_candidates with min_points 0 max_points 50',
      })
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    // Filter by focus area if specified
    const filteredRecs = params.focus_area === 'all'
      ? recommendations
      : recommendations.filter(r => r.category === params.focus_area)

    // Summary
    const critical = recommendations.filter(r => r.priority === 'critical').length
    const high = recommendations.filter(r => r.priority === 'high').length

    let overallStatus = 'good'
    if (critical > 0) overallStatus = 'needs_attention'
    else if (high > 2) overallStatus = 'review_recommended'

    return {
      success: true,
      data: {
        overallStatus,
        summary: {
          critical,
          high,
          medium: recommendations.filter(r => r.priority === 'medium').length,
          low: recommendations.filter(r => r.priority === 'low').length,
        },
        recommendations: filteredRecs.slice(0, 10),
        topPriority: filteredRecs[0] || null,
      },
      suggestions: filteredRecs.slice(0, 3).map(r => `${r.priority === 'critical' ? '🚨' : r.priority === 'high' ? '⚠️' : '💡'} ${r.title}`),
      nextActions: filteredRecs.slice(0, 2).map(r => ({
        label: r.title.substring(0, 30) + (r.title.length > 30 ? '...' : ''),
        action: r.action,
        variant: r.priority === 'critical' ? 'destructive' : 'default',
      })) as ActionButton[],
    }
  },
}

// ============================================
// SQL Fallback Tool (for complex queries)
// ============================================

export const executeSQLTool: ToolDefinition = {
  name: 'execute_sql',
  description: 'Execute a raw SQL query for complex operations not covered by other tools. Use with caution. DELETE operations are blocked.',
  parameters: z.object({
    query: z.string().describe('The SQL query to execute. Only SELECT, INSERT, UPDATE allowed.'),
  }),
  execute: async (params, supabase) => {
    const sql = params.query as string
    const upperSQL = sql.trim().toUpperCase()

    // Security validations
    if (upperSQL.includes('DELETE FROM') || upperSQL.startsWith('DELETE ')) {
      return { success: false, error: 'DELETE operations are not allowed' }
    }
    if (upperSQL.includes('DROP TABLE') || upperSQL.includes('DROP DATABASE')) {
      return { success: false, error: 'DROP operations are not allowed' }
    }
    if (upperSQL.includes('TRUNCATE')) {
      return { success: false, error: 'TRUNCATE operations are not allowed' }
    }

    // Check for multiple statements
    const statements = sql.split(';').filter(s => s.trim().length > 0)
    if (statements.length > 1) {
      return { success: false, error: 'Multiple SQL statements are not allowed' }
    }

    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sql,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        suggestions: ['Check column names and table names against the schema', 'Ensure proper SQL syntax'],
      }
    }

    return {
      success: true,
      data: {
        result: data,
        rowCount: Array.isArray(data) ? data.length : 0,
      },
    }
  },
}

// Import integration tools
import { INTEGRATION_TOOLS } from './integrations.ts'

// ============================================
// Tool Registry
// ============================================

export const BAIGER_TOOLS: ToolDefinition[] = [
  // Project tools
  getProjectsTool,
  getProjectDetailsTool,
  createProjectTool,
  // Candidate tools
  findCandidatesTool,
  getCandidateDetailsTool,
  // Staff assignment tools
  assignStaffTool,
  getProjectStaffTool,
  updateStaffStatusTool,
  // Analytics tools
  getProjectStatsTool,
  getUpcomingDeadlinesTool,
  // Expense tools
  getExpenseClaimsTool,
  getPendingApprovalsTool,
  approveExpenseClaimTool,
  rejectExpenseClaimTool,
  // Memory tool
  saveUserMemoryTool,
  // Business Intelligence tools (Smart Baiger)
  getBusinessOverviewTool,
  analyzeProblemTool,
  getFinancialAnalysisTool,
  getForecastTool,
  getSmartRecommendationsTool,
  // SQL fallback
  executeSQLTool,
  // Integration tools (P2)
  ...INTEGRATION_TOOLS,
]

// ============================================
// Helper Functions
// ============================================

// Convert tools to OpenRouter/OpenAI function format
export function getToolsForLLM() {
  return BAIGER_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    },
  }))
}

// Execute a tool by name
export async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  supabase: SupabaseClient,
  context?: ToolContext
): Promise<ToolResult> {
  const tool = BAIGER_TOOLS.find(t => t.name === toolName)

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}. Available tools: ${BAIGER_TOOLS.map(t => t.name).join(', ')}`,
    }
  }

  try {
    // Validate and parse parameters
    const validatedParams = tool.parameters.parse(params)
    return await tool.execute(validatedParams, supabase, context)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Parameter validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Convert Zod schema to JSON Schema
function zodToJsonSchema(schema: z.ZodObject<Record<string, z.ZodTypeAny>>): Record<string, unknown> {
  const shape = schema.shape
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const [key, value] of Object.entries(shape)) {
    const zodType = value as z.ZodTypeAny
    const description = zodType.description

    // Determine if optional
    const isOptional = zodType.isOptional()
    if (!isOptional && !zodType.isNullable()) {
      // Check if has default
      const hasDefault = zodType._def.typeName === 'ZodDefault'
      if (!hasDefault) {
        required.push(key)
      }
    }

    // Get the base type (unwrap optional/default)
    let baseType = zodType
    if (zodType._def.typeName === 'ZodOptional') {
      baseType = (zodType as z.ZodOptional<z.ZodTypeAny>)._def.innerType
    }
    if (baseType._def.typeName === 'ZodDefault') {
      baseType = (baseType as z.ZodDefault<z.ZodTypeAny>)._def.innerType
    }

    // Convert to JSON Schema type
    properties[key] = {
      ...getJsonSchemaType(baseType),
      ...(description ? { description } : {}),
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  }
}

function getJsonSchemaType(zodType: z.ZodTypeAny): Record<string, unknown> {
  const typeName = zodType._def.typeName

  switch (typeName) {
    case 'ZodString':
      return { type: 'string' }
    case 'ZodNumber':
      return { type: 'number' }
    case 'ZodBoolean':
      return { type: 'boolean' }
    case 'ZodEnum':
      return { type: 'string', enum: (zodType as z.ZodEnum<[string, ...string[]]>)._def.values }
    case 'ZodArray':
      const arrayType = (zodType as z.ZodArray<z.ZodTypeAny>)._def.type
      return { type: 'array', items: getJsonSchemaType(arrayType) }
    case 'ZodDefault':
      return getJsonSchemaType((zodType as z.ZodDefault<z.ZodTypeAny>)._def.innerType)
    case 'ZodOptional':
      return getJsonSchemaType((zodType as z.ZodOptional<z.ZodTypeAny>)._def.innerType)
    default:
      return { type: 'string' }
  }
}
