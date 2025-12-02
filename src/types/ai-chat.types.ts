/**
 * Enhanced AI Chat Types
 * Comprehensive type definitions for multi-step AI reasoning with tool/function calling
 */

// ============================================================================
// TOOL EXECUTION TYPES
// ============================================================================

export type ToolExecutionStatus =
  | 'pending'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type ToolCategory =
  | 'database'
  | 'search'
  | 'action'
  | 'analysis'
  | 'external'

export interface ToolCall {
  id: string
  name: string
  displayName: string
  category: ToolCategory
  status: ToolExecutionStatus
  startedAt?: Date
  completedAt?: Date
  duration?: number // milliseconds
  input?: Record<string, unknown>
  output?: unknown
  error?: string
}

export interface ToolExecutionStep {
  id: string
  label: string
  description?: string
  status: ToolExecutionStatus
  toolCalls: ToolCall[]
  startedAt?: Date
  completedAt?: Date
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'error'
  | 'tool_execution'
  | 'confirmation'

export type MessageContentType =
  | 'text'
  | 'project_card'
  | 'candidate_card'
  | 'table'
  | 'metrics'
  | 'schedule'
  | 'status'
  | 'confirmation_request'
  | 'action_result'

// ============================================================================
// DATA CARD TYPES
// ============================================================================

export interface ProjectCardData {
  id: string
  title: string
  client?: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  startDate?: string
  endDate?: string
  venue?: string
  venueAddress?: string
  crewCount?: number
  filledPositions?: number
  color?: string
  workingHours?: {
    start: string
    end: string
  }
}

export interface CandidateCardData {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  status: 'available' | 'assigned' | 'unavailable' | 'blacklisted'
  skills?: string[]
  rating?: number
  totalProjects?: number
  lastActive?: string
  availability?: {
    date: string
    available: boolean
  }[]
}

export interface TableData {
  title?: string
  columns: {
    key: string
    label: string
    type?: 'text' | 'number' | 'date' | 'status' | 'action'
    width?: string
  }[]
  rows: Record<string, unknown>[]
  footer?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}

export interface MetricsData {
  title: string
  metrics: {
    label: string
    value: string | number
    change?: number
    trend?: 'up' | 'down' | 'neutral'
    icon?: string
  }[]
}

export interface ScheduleData {
  title: string
  date?: string
  items: {
    time: string
    title: string
    location?: string
    status?: 'upcoming' | 'ongoing' | 'completed'
    assignees?: string[]
  }[]
}

export interface StatusData {
  title: string
  status: 'success' | 'warning' | 'error' | 'info'
  message: string
  details?: string[]
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export type ActionType =
  | 'navigate'
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'approve'
  | 'reject'
  | 'send_message'
  | 'schedule'
  | 'export'
  | 'custom'

export interface ActionButton {
  id: string
  label: string
  action: ActionType
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'
  icon?: string
  // Action-specific data
  path?: string           // for navigate
  url?: string            // for external links
  message?: string        // for send_message
  payload?: Record<string, unknown>  // for create/update/delete/etc
  requiresConfirmation?: boolean
}

export interface ConfirmationRequest {
  id: string
  title: string
  description: string
  actionType: ActionType
  payload: Record<string, unknown>
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  preview?: {
    type: MessageContentType
    data: unknown
  }
}

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
  error?: string
}

// ============================================================================
// MESSAGE CONTENT UNION
// ============================================================================

export type MessageContent =
  | { type: 'text'; data: string }
  | { type: 'project_card'; data: ProjectCardData }
  | { type: 'candidate_card'; data: CandidateCardData }
  | { type: 'table'; data: TableData }
  | { type: 'metrics'; data: MetricsData }
  | { type: 'schedule'; data: ScheduleData }
  | { type: 'status'; data: StatusData }
  | { type: 'confirmation_request'; data: ConfirmationRequest }
  | { type: 'action_result'; data: ActionResult }

// ============================================================================
// ENHANCED MESSAGE TYPE
// ============================================================================

export interface EnhancedMessage {
  id: string
  type: MessageType
  content: MessageContent[]
  createdAt: Date

  // Tool execution tracking
  toolExecution?: {
    steps: ToolExecutionStep[]
    currentStep?: number
    isComplete: boolean
    totalDuration?: number
  }

  // Interactive elements
  buttons?: ActionButton[]

  // Pending actions requiring confirmation
  pendingConfirmation?: ConfirmationRequest

  // Metadata
  metadata?: {
    toolsUsed?: string[]
    tokens?: number
    model?: string
    streamId?: string
    [key: string]: unknown
  }
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

export type StreamEventType =
  | 'stream_start'
  | 'content_delta'
  | 'tool_call_start'
  | 'tool_call_delta'
  | 'tool_call_complete'
  | 'content_complete'
  | 'stream_end'
  | 'error'

export interface StreamEvent {
  type: StreamEventType
  timestamp: Date
  data: {
    messageId?: string
    content?: string
    toolCall?: Partial<ToolCall>
    error?: string
    metadata?: Record<string, unknown>
  }
}

// ============================================================================
// CHAT STATE TYPES
// ============================================================================

export type ChatPhase =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'executing_tool'
  | 'awaiting_confirmation'
  | 'responding'
  | 'streaming'
  | 'error'

export interface ChatState {
  phase: ChatPhase
  currentTool?: string
  currentStep?: string
  progress?: number
  message?: string
}

export interface PendingAction {
  id: string
  confirmation: ConfirmationRequest
  createdAt: Date
  expiresAt?: Date
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseEnhancedAIChatOptions {
  userId: string
  persona?: 'general' | 'operations' | 'finance' | 'hr'
  pageContext?: {
    currentPage: string
    pageType?: string
    entityType?: string
    entityId?: string
    userAction?: string
    breadcrumb?: string[]
  }
  enableStreaming?: boolean
  enableToolExecution?: boolean
  onToolExecutionStart?: (tool: ToolCall) => void
  onToolExecutionComplete?: (tool: ToolCall) => void
  onConfirmationRequired?: (confirmation: ConfirmationRequest) => void
  onActionComplete?: (result: ActionResult) => void
}

export interface UseEnhancedAIChatReturn {
  // Messages
  messages: EnhancedMessage[]

  // State
  chatState: ChatState
  isLoading: boolean
  error: string | null
  conversationId: string | null

  // Tool execution
  currentToolExecution: ToolExecutionStep[] | null

  // Pending actions
  pendingActions: PendingAction[]

  // Actions
  sendMessage: (message: string) => Promise<void>
  confirmAction: (actionId: string) => Promise<ActionResult>
  rejectAction: (actionId: string) => Promise<void>
  cancelToolExecution: () => void
  clearConversation: () => void

  // Streaming
  streamingContent: string | null
  isStreaming: boolean
}
