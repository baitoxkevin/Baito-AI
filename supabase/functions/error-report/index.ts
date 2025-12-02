// ============================================================================
// Error Report Submission Edge Function
// Version: 1.0.0
// Purpose: Handle error report submissions with screenshot upload and AI processing
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ============================================================================
// Types
// ============================================================================

interface ErrorReportRequest {
  // Required fields
  error_message: string
  page_url: string

  // Error details
  error_stack?: string
  error_name?: string
  error_code?: string
  component_name?: string
  component_stack?: string

  // Page context
  page_title?: string
  route_path?: string
  route_params?: Record<string, string>

  // User description
  user_description?: string
  reproduction_steps?: string
  expected_behavior?: string
  actual_behavior?: string

  // Browser info (auto-captured)
  user_agent?: string
  browser_name?: string
  browser_version?: string
  os_name?: string
  os_version?: string
  device_type?: string
  screen_width?: number
  screen_height?: number
  viewport_width?: number
  viewport_height?: number

  // Screenshot (base64 encoded)
  screenshot_base64?: string
  screenshot_filename?: string

  // Application context
  app_version?: string
  environment?: string
  session_id?: string
  request_id?: string

  // Network context
  network_type?: string
  is_online?: boolean

  // Related entities
  related_project_id?: string
  related_candidate_id?: string

  // Classification hints
  category?: string
  tags?: string[]
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info'

  // Console logs captured
  console_logs?: Array<{
    level: string
    message: string
    data?: Record<string, unknown>
    timestamp_offset?: number
  }>

  // Recent network requests
  network_requests?: Array<{
    url: string
    method?: string
    status?: number
    duration_ms?: number
    is_error?: boolean
    timestamp_offset?: number
  }>
}

interface ErrorReportResponse {
  success: boolean
  error_id?: string
  report_number?: number
  display_id?: string
  is_duplicate?: boolean
  duplicate_of?: string
  message: string
}

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

// AI model for analysis (optional)
const AI_MODEL = 'anthropic/claude-3-haiku'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate error hash for deduplication
 */
function generateErrorHash(
  errorMessage: string,
  errorStack: string | undefined,
  componentName: string | undefined
): string {
  const data = (errorMessage || '') +
    (errorStack?.substring(0, 500) || '') +
    (componentName || '')

  // Simple hash function (MD5-like but using Web Crypto)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Upload screenshot to Supabase Storage
 */
async function uploadScreenshot(
  supabase: ReturnType<typeof createClient>,
  base64Data: string,
  filename: string,
  reportId: string
): Promise<{ path: string; url: string } | null> {
  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '')

    // Decode base64 to binary
    const binaryStr = atob(base64Content)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    // Determine MIME type from filename or default to PNG
    let mimeType = 'image/png'
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      mimeType = 'image/jpeg'
    } else if (filename.endsWith('.webp')) {
      mimeType = 'image/webp'
    }

    // Generate unique path
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `${reportId}/${timestamp}_${sanitizedFilename}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('error-screenshots')
      .upload(path, bytes, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      console.error('Screenshot upload error:', error)
      return null
    }

    // Get signed URL (valid for 7 days)
    const { data: signedUrlData } = await supabase.storage
      .from('error-screenshots')
      .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 days

    return {
      path: data.path,
      url: signedUrlData?.signedUrl || ''
    }
  } catch (error) {
    console.error('Screenshot processing error:', error)
    return null
  }
}

/**
 * Parse user agent string
 */
function parseUserAgent(userAgent: string): {
  browser_name: string
  browser_version: string
  os_name: string
  os_version: string
  device_type: string
} {
  const result = {
    browser_name: 'Unknown',
    browser_version: '',
    os_name: 'Unknown',
    os_version: '',
    device_type: 'desktop'
  }

  if (!userAgent) return result

  // Browser detection
  if (userAgent.includes('Chrome')) {
    result.browser_name = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/)
    if (match) result.browser_version = match[1]
  } else if (userAgent.includes('Firefox')) {
    result.browser_name = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
    if (match) result.browser_version = match[1]
  } else if (userAgent.includes('Safari')) {
    result.browser_name = 'Safari'
    const match = userAgent.match(/Version\/(\d+\.\d+)/)
    if (match) result.browser_version = match[1]
  } else if (userAgent.includes('Edge')) {
    result.browser_name = 'Edge'
    const match = userAgent.match(/Edg\/(\d+\.\d+)/)
    if (match) result.browser_version = match[1]
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    result.os_name = 'Windows'
    const match = userAgent.match(/Windows NT (\d+\.\d+)/)
    if (match) result.os_version = match[1]
  } else if (userAgent.includes('Mac OS X')) {
    result.os_name = 'macOS'
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/)
    if (match) result.os_version = match[1].replace('_', '.')
  } else if (userAgent.includes('Linux')) {
    result.os_name = 'Linux'
  } else if (userAgent.includes('Android')) {
    result.os_name = 'Android'
    const match = userAgent.match(/Android (\d+\.\d+)/)
    if (match) result.os_version = match[1]
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    result.os_name = 'iOS'
    const match = userAgent.match(/OS (\d+[._]\d+)/)
    if (match) result.os_version = match[1].replace('_', '.')
  }

  // Device type detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    result.device_type = 'mobile'
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    result.device_type = 'tablet'
  }

  return result
}

/**
 * AI analysis of error (optional, runs async)
 */
async function analyzeErrorWithAI(
  supabase: ReturnType<typeof createClient>,
  errorId: string,
  errorData: ErrorReportRequest
): Promise<void> {
  if (!OPENROUTER_API_KEY) {
    console.log('AI analysis skipped: OPENROUTER_API_KEY not set')
    return
  }

  try {
    const prompt = `Analyze this error report and provide insights:

Error Message: ${errorData.error_message}
Component: ${errorData.component_name || 'Unknown'}
Page: ${errorData.page_url}
Stack Trace: ${errorData.error_stack?.substring(0, 1000) || 'Not available'}
User Description: ${errorData.user_description || 'Not provided'}

Provide a JSON response with:
1. "summary": Brief summary of the error (1-2 sentences)
2. "likely_cause": Most probable root cause
3. "suggested_fix": Suggested fix or investigation steps
4. "category": Category (UI, API, Authentication, Data, Network, Performance, Other)
5. "priority_score": 1-100 priority score based on severity and impact
6. "affected_users": Estimated impact (single_user, few_users, many_users, all_users)
7. "reproducibility": How reproducible (always, sometimes, rarely, unknown)

Respond ONLY with valid JSON.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI Error Analysis'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('AI analysis API error:', await response.text())
      return
    }

    const data = await response.json()
    const analysisText = data.choices[0]?.message?.content || ''

    // Parse AI response
    try {
      const analysis = JSON.parse(analysisText)

      // Update error report with AI analysis
      await supabase.rpc('ai_process_error_report', {
        p_error_id: errorId,
        p_analysis: analysis,
        p_suggested_priority: analysis.priority_score,
        p_suggested_category: analysis.category
      })

      console.log(`AI analysis completed for error ${errorId}`)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    // Parse request body
    const body: ErrorReportRequest = await req.json()

    // Validate required fields
    if (!body.error_message) {
      return new Response(
        JSON.stringify({ success: false, message: 'error_message is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!body.page_url) {
      return new Response(
        JSON.stringify({ success: false, message: 'page_url is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user from auth header if present
    let userId: string | null = null
    let userEmail: string | null = null
    let userName: string | null = null
    let userRole: string | null = null

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        userEmail = user.email || null
        userName = user.user_metadata?.full_name || null

        // Get user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single()
        userRole = userData?.role || null
      }
    }

    // Generate error hash for deduplication
    const errorHash = generateErrorHash(
      body.error_message,
      body.error_stack,
      body.component_name
    )

    // Check for duplicates
    const { data: existingError } = await supabase
      .from('error_reports')
      .select('id, report_number')
      .eq('error_hash', errorHash)
      .not('status', 'in', '("resolved","wont_fix")')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    let isDuplicate = false
    let duplicateOf: string | null = null

    if (existingError) {
      isDuplicate = true
      duplicateOf = existingError.id
    }

    // Parse user agent if provided
    const parsedUA = body.user_agent ? parseUserAgent(body.user_agent) : null

    // Generate a temporary ID for screenshot upload
    const tempId = crypto.randomUUID()

    // Upload screenshot if provided
    let screenshotPath: string | null = null
    let screenshotUrl: string | null = null

    if (body.screenshot_base64) {
      const uploadResult = await uploadScreenshot(
        supabase,
        body.screenshot_base64,
        body.screenshot_filename || 'screenshot.png',
        tempId
      )
      if (uploadResult) {
        screenshotPath = uploadResult.path
        screenshotUrl = uploadResult.url
      }
    }

    // Insert error report
    const { data: errorReport, error: insertError } = await supabase
      .from('error_reports')
      .insert({
        // Error details
        error_message: body.error_message,
        error_stack: body.error_stack,
        error_name: body.error_name,
        error_code: body.error_code,
        component_name: body.component_name,
        component_stack: body.component_stack,

        // Page context
        page_url: body.page_url,
        page_title: body.page_title,
        route_path: body.route_path,
        route_params: body.route_params || {},

        // User context
        reporter_id: userId,
        reporter_email: userEmail,
        reporter_name: userName,
        user_role: userRole,

        // Browser info
        user_agent: body.user_agent,
        browser_name: body.browser_name || parsedUA?.browser_name,
        browser_version: body.browser_version || parsedUA?.browser_version,
        os_name: body.os_name || parsedUA?.os_name,
        os_version: body.os_version || parsedUA?.os_version,
        device_type: body.device_type || parsedUA?.device_type,
        screen_width: body.screen_width,
        screen_height: body.screen_height,
        viewport_width: body.viewport_width,
        viewport_height: body.viewport_height,

        // Screenshot
        screenshot_path: screenshotPath,
        screenshot_url: screenshotUrl,
        screenshot_taken_at: screenshotPath ? new Date().toISOString() : null,

        // User description
        user_description: body.user_description,
        reproduction_steps: body.reproduction_steps,
        expected_behavior: body.expected_behavior,
        actual_behavior: body.actual_behavior,

        // Application context
        app_version: body.app_version,
        environment: body.environment || 'production',
        session_id: body.session_id,
        request_id: body.request_id,

        // Network context
        network_type: body.network_type,
        is_online: body.is_online ?? true,

        // Related entities
        related_project_id: body.related_project_id,
        related_candidate_id: body.related_candidate_id,

        // Classification
        category: body.category,
        tags: body.tags || [],
        severity: body.severity || 'medium',

        // Deduplication
        error_hash: errorHash,
        duplicate_of: duplicateOf,

        // Status
        status: isDuplicate ? 'duplicate' : 'new'
      })
      .select('id, report_number')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to create error report: ${insertError.message}`)
    }

    const errorId = errorReport.id
    const reportNumber = errorReport.report_number

    // Insert console logs if provided
    if (body.console_logs && body.console_logs.length > 0) {
      const consoleLogs = body.console_logs.map(log => ({
        error_report_id: errorId,
        log_level: log.level,
        message: log.message,
        data: log.data || {},
        timestamp_offset: log.timestamp_offset
      }))

      await supabase
        .from('error_console_logs')
        .insert(consoleLogs)
    }

    // Insert network requests if provided
    if (body.network_requests && body.network_requests.length > 0) {
      const networkRequests = body.network_requests.map(req => ({
        error_report_id: errorId,
        request_url: req.url,
        request_method: req.method || 'GET',
        response_status: req.status,
        duration_ms: req.duration_ms,
        is_error: req.is_error || false,
        timestamp_offset: req.timestamp_offset
      }))

      await supabase
        .from('error_network_requests')
        .insert(networkRequests)
    }

    // Trigger AI analysis asynchronously (don't wait)
    if (!isDuplicate) {
      analyzeErrorWithAI(supabase, errorId, body).catch(err => {
        console.error('Background AI analysis failed:', err)
      })
    }

    // Build response
    const response: ErrorReportResponse = {
      success: true,
      error_id: errorId,
      report_number: reportNumber,
      display_id: `ERR-${String(reportNumber).padStart(5, '0')}`,
      is_duplicate: isDuplicate,
      duplicate_of: duplicateOf || undefined,
      message: isDuplicate
        ? `Error report submitted (duplicate of existing report)`
        : `Error report submitted successfully`
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    )

  } catch (error) {
    console.error('Error report submission failed:', error)

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/* Usage Example:

curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/error-report' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "error_message": "Cannot read property 'name' of undefined",
    "error_stack": "TypeError: Cannot read property...",
    "error_name": "TypeError",
    "component_name": "ProjectCard",
    "page_url": "https://app.baito-ai.com/projects/123",
    "page_title": "Project Details",
    "user_agent": "Mozilla/5.0...",
    "screenshot_base64": "data:image/png;base64,...",
    "user_description": "Page crashed when clicking edit button",
    "severity": "high"
  }'

*/
