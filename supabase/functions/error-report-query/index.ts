// ============================================================================
// Error Report Query & Management Edge Function
// Version: 1.0.0
// Purpose: Query, update, and manage error reports (for Claude Code/MCP access)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Types
// ============================================================================

type ErrorStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate'
type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

interface QueryParams {
  action: 'list' | 'get' | 'update' | 'stats' | 'search'

  // For list/search
  status?: ErrorStatus
  severity?: ErrorSeverity
  component?: string
  search?: string
  limit?: number
  offset?: number
  order_by?: 'created_at' | 'priority' | 'severity'
  order_dir?: 'ASC' | 'DESC'

  // For get
  error_id?: string
  report_number?: number

  // For update
  new_status?: ErrorStatus
  resolution_notes?: string
  assigned_to?: string
  priority?: number
  category?: string
  tags?: string[]

  // For stats
  start_date?: string
  end_date?: string
}

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * List error reports with filters
 */
async function listErrors(
  supabase: ReturnType<typeof createClient>,
  params: QueryParams
): Promise<{ data: unknown[]; count: number }> {
  const { data, error } = await supabase.rpc('query_error_reports', {
    p_status: params.status || null,
    p_severity: params.severity || null,
    p_component: params.component || null,
    p_search: params.search || null,
    p_limit: params.limit || 50,
    p_offset: params.offset || 0,
    p_order_by: params.order_by || 'created_at',
    p_order_dir: params.order_dir || 'DESC'
  })

  if (error) throw error

  // Get total count for pagination
  let countQuery = supabase
    .from('error_reports')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false)

  if (params.status) countQuery = countQuery.eq('status', params.status)
  if (params.severity) countQuery = countQuery.eq('severity', params.severity)
  if (params.component) countQuery = countQuery.ilike('component_name', `%${params.component}%`)

  const { count } = await countQuery

  return {
    data: data || [],
    count: count || 0
  }
}

/**
 * Get single error report with full details
 */
async function getError(
  supabase: ReturnType<typeof createClient>,
  errorId?: string,
  reportNumber?: number
): Promise<unknown> {
  let query = supabase
    .from('error_reports')
    .select(`
      *,
      error_report_comments (
        id,
        author_name,
        content,
        comment_type,
        created_at
      ),
      error_report_attachments (
        id,
        file_name,
        file_path,
        file_type,
        upload_type,
        created_at
      ),
      error_console_logs (
        id,
        log_level,
        message,
        data,
        timestamp_offset
      ),
      error_network_requests (
        id,
        request_url,
        request_method,
        response_status,
        duration_ms,
        is_error,
        timestamp_offset
      )
    `)

  if (errorId) {
    query = query.eq('id', errorId)
  } else if (reportNumber) {
    query = query.eq('report_number', reportNumber)
  } else {
    throw new Error('Either error_id or report_number is required')
  }

  const { data, error } = await query.single()

  if (error) throw error
  if (!data) throw new Error('Error report not found')

  // Get status history
  const { data: history } = await supabase
    .from('error_report_history')
    .select('*')
    .eq('error_report_id', data.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get duplicate reports if this is original
  let duplicates = []
  if (data.duplicate_count > 0) {
    const { data: dups } = await supabase
      .from('error_reports')
      .select('id, report_number, created_at, reporter_email')
      .eq('duplicate_of', data.id)
      .order('created_at', { ascending: false })
      .limit(10)
    duplicates = dups || []
  }

  return {
    ...data,
    display_id: `ERR-${String(data.report_number).padStart(5, '0')}`,
    history: history || [],
    duplicates
  }
}

/**
 * Update error report
 */
async function updateError(
  supabase: ReturnType<typeof createClient>,
  errorId: string,
  params: QueryParams,
  userId: string | null
): Promise<unknown> {
  // Build update object
  const updates: Record<string, unknown> = {}

  if (params.new_status) {
    updates.status = params.new_status

    if (params.new_status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.resolved_by = userId
    }
  }

  if (params.resolution_notes !== undefined) {
    updates.resolution_notes = params.resolution_notes
  }

  if (params.assigned_to !== undefined) {
    updates.assigned_to = params.assigned_to || null
    if (params.assigned_to) {
      updates.assigned_at = new Date().toISOString()
    }
  }

  if (params.priority !== undefined) {
    updates.priority = params.priority
  }

  if (params.category !== undefined) {
    updates.category = params.category
  }

  if (params.tags !== undefined) {
    updates.tags = params.tags
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No update parameters provided')
  }

  const { data, error } = await supabase
    .from('error_reports')
    .update(updates)
    .eq('id', errorId)
    .select('id, report_number, status, resolution_notes, assigned_to, priority, category, tags, resolved_at')
    .single()

  if (error) throw error
  if (!data) throw new Error('Error report not found')

  return {
    success: true,
    error: {
      ...data,
      display_id: `ERR-${String(data.report_number).padStart(5, '0')}`
    }
  }
}

/**
 * Get error statistics
 */
async function getStats(
  supabase: ReturnType<typeof createClient>,
  startDate?: string,
  endDate?: string
): Promise<unknown> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const end = endDate || new Date().toISOString()

  const { data, error } = await supabase.rpc('get_error_statistics', {
    p_start_date: start,
    p_end_date: end
  })

  if (error) throw error

  // Get recent critical errors
  const { data: criticalErrors } = await supabase
    .from('error_reports')
    .select('id, report_number, error_message, component_name, created_at')
    .eq('severity', 'critical')
    .eq('status', 'new')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    ...data[0],
    recent_critical: criticalErrors || [],
    period: { start, end }
  }
}

/**
 * Full-text search in error reports
 */
async function searchErrors(
  supabase: ReturnType<typeof createClient>,
  searchQuery: string,
  limit: number = 20
): Promise<unknown[]> {
  // Use PostgreSQL full-text search
  const { data, error } = await supabase
    .from('error_reports')
    .select(`
      id,
      report_number,
      error_message,
      error_name,
      component_name,
      page_url,
      status,
      severity,
      created_at
    `)
    .or(`error_message.ilike.%${searchQuery}%,error_stack.ilike.%${searchQuery}%,component_name.ilike.%${searchQuery}%`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map(item => ({
    ...item,
    display_id: `ERR-${String(item.report_number).padStart(5, '0')}`
  }))
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    let params: QueryParams

    if (req.method === 'GET') {
      const url = new URL(req.url)
      params = {
        action: (url.searchParams.get('action') as QueryParams['action']) || 'list',
        status: url.searchParams.get('status') as ErrorStatus || undefined,
        severity: url.searchParams.get('severity') as ErrorSeverity || undefined,
        component: url.searchParams.get('component') || undefined,
        search: url.searchParams.get('search') || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
        order_by: url.searchParams.get('order_by') as QueryParams['order_by'] || undefined,
        order_dir: url.searchParams.get('order_dir') as QueryParams['order_dir'] || undefined,
        error_id: url.searchParams.get('error_id') || undefined,
        report_number: url.searchParams.get('report_number') ? parseInt(url.searchParams.get('report_number')!) : undefined,
        start_date: url.searchParams.get('start_date') || undefined,
        end_date: url.searchParams.get('end_date') || undefined
      }
    } else if (req.method === 'POST' || req.method === 'PATCH') {
      params = await req.json()
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user from auth header (for update operations)
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
      }
    }

    // Route to appropriate handler
    let result: unknown

    switch (params.action) {
      case 'list':
        result = await listErrors(supabase, params)
        break

      case 'get':
        result = await getError(supabase, params.error_id, params.report_number)
        break

      case 'update':
        if (!params.error_id) {
          throw new Error('error_id is required for update action')
        }
        result = await updateError(supabase, params.error_id, params, userId)
        break

      case 'stats':
        result = await getStats(supabase, params.start_date, params.end_date)
        break

      case 'search':
        if (!params.search) {
          throw new Error('search query is required for search action')
        }
        result = await searchErrors(supabase, params.search, params.limit)
        break

      default:
        throw new Error(`Unknown action: ${params.action}`)
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error report query failed:', error)

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('not found') ? 404 : 500
      }
    )
  }
})

/* Usage Examples:

# List all new errors
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query?action=list&status=new' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Get specific error by ID
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query?action=get&error_id=UUID' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Get error by report number
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query?action=get&report_number=123' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Search errors
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query?action=search&search=TypeError' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Get statistics
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query?action=stats' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'

# Update error status (POST)
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "update",
    "error_id": "UUID",
    "new_status": "in_progress",
    "assigned_to": "USER_UUID"
  }'

# Resolve error
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report-query' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "update",
    "error_id": "UUID",
    "new_status": "resolved",
    "resolution_notes": "Fixed by updating null check in ProjectCard component"
  }'

*/
