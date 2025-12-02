/**
 * AI Assistant Components Index
 * Export all AI chat assistant components
 */

// Main widgets
export { ChatWidget } from './ChatWidget'
export { EnhancedChatWidget } from './EnhancedChatWidget'

// Message components
export { MessageList } from './MessageList'
export { EnhancedMessageList } from './EnhancedMessageList'
export { TypingIndicator } from './TypingIndicator'

// Tool execution
export { ToolExecutionIndicator, CompactToolIndicator } from './ToolExecutionIndicator'

// Data cards
export {
  ProjectDataCard,
  ProjectDataCardList,
  CandidateDataCard,
  CandidateDataCardList,
  DataTable
} from './DataCards'

// Interactive components
export { ConfirmationDialog, InlineConfirmation } from './ConfirmationDialog'
export { ActionButtons } from './ActionButtons'

// UI components
export { QuickActions } from './QuickActions'
export { PersonaSelector } from './PersonaSelector'
export { SuggestionBar } from './SuggestionBar'
export { WelcomeOnboarding, useOnboardingState } from './WelcomeOnboarding'
export { ClarificationPrompt } from './ClarificationPrompt'
