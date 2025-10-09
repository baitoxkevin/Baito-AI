/**
 * TypeScript Types for Baito AI Chatbot
 */

export type MessageType = 'user' | 'assistant' | 'system' | 'confirmation' | 'error';
export type MessageStatus = 'sending' | 'sent' | 'failed';
export type UserRole = 'admin' | 'manager' | 'staff';
export type Language = 'zh' | 'en' | 'auto';
export type WidgetState = 'collapsed' | 'expanded' | 'minimized';
export type WidgetPosition = 'bottom-right' | 'bottom-left';

export interface Message {
  id: string;
  type: MessageType;
  content: string | React.ReactNode;
  timestamp: Date;
  status?: MessageStatus;
  avatar?: string;
  userId?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  labelZh: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  onClick: () => void;
}

export interface ChatWidgetProps {
  position?: WidgetPosition;
  defaultState?: WidgetState;
  theme?: 'light' | 'dark' | 'auto';
  userRole: UserRole;
  language?: Language;
  onClose?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

export interface QuickActionBarProps {
  role: UserRole;
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  maxVisible?: number;
}

export interface VoiceInputProps {
  language: 'zh-CN' | 'en-US';
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export interface RichContentCardProps {
  variant: 'table' | 'form' | 'chart' | 'list' | 'detail';
  title: string;
  data: any;
  actions?: CardAction[];
  expandable?: boolean;
  maxHeight?: string;
}

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface ChatMessage {
  id: string;
  user_id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  metadata?: Record<string, any>;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  error: Error | null;
}

export interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
}
