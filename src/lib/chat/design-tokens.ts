/**
 * Design Tokens for Baito AI Chatbot
 * Based on UX Specification v1.0
 */

export const colors = {
  // Primary Colors
  primary: {
    DEFAULT: '#3B82F6', // Blue-500
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Secondary Colors
  secondary: {
    DEFAULT: '#10B981', // Emerald-500
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // UI Colors
  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E7EB',

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Chat-Specific Colors
  chat: {
    userBubble: '#3B82F6',
    userText: '#FFFFFF',
    assistantBubble: '#F3F4F6',
    assistantText: '#111827',
    systemBubble: '#FEF3C7',
    systemText: '#92400E',
    confirmationBubble: '#FEF3C7',
    confirmationBorder: '#FCD34D',
    confirmationText: '#92400E',
    errorBubble: '#FEE2E2',
    errorBorder: '#FCA5A5',
    errorText: '#991B1B',
  },

  // Status Indicators
  status: {
    online: '#10B981',
    offline: '#6B7280',
    typing: '#3B82F6',
    processing: '#F59E0B',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'PingFang SC',
      'Microsoft YaHei',
      'Hiragino Sans GB',
      'sans-serif',
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Consolas',
      'Monaco',
      'monospace',
    ].join(', '),
  },

  fontSize: {
    xxs: '0.625rem', // 10px
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },

  lineHeight: {
    tight: '1.5',
    normal: '1.75', // Chinese prefers more
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  letterSpacing: {
    normal: '0.01em', // Slight spacing for Chinese
    relaxed: '0.025em', // Titles, headers
  },
} as const;

export const spacing = {
  // Message Bubbles
  messagePadding: '12px 16px',
  messageBubbleGap: '8px',
  messageGroupGap: '16px',

  // Widget Layout
  widgetPadding: '16px',
  widgetHeaderHeight: '56px',
  widgetFooterHeight: '72px',
  quickActionBarHeight: '80px',

  // Input Area
  inputPadding: '12px 16px',
  inputGap: '8px',

  // Cards and Lists
  cardPadding: '16px',
  cardGap: '12px',
  listItemPadding: '12px 16px',
  listItemGap: '0px',

  // Buttons
  buttonPadding: {
    sm: '6px 12px',
    md: '8px 16px',
    lg: '12px 24px',
  },

  // Mobile Adjustments
  mobile: {
    widgetPadding: '12px',
    messagePadding: '10px 14px',
    buttonPadding: {
      sm: '8px 12px',
      md: '10px 16px',
      lg: '14px 24px',
    },
  },
} as const;

export const borderRadius = {
  none: '0px',
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',

  // Component-specific
  widget: '16px',
  messageBubble: '12px',
  quickActionButton: '8px',
  inputField: '8px',
  voiceButton: '9999px',
  fab: '9999px',
  badge: '9999px',
  card: '8px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',

  // Component-specific
  widget: '0 8px 32px rgba(0, 0, 0, 0.12)',
  fab: '0 4px 12px rgba(0, 0, 0, 0.15)',
  fabHover: '0 6px 16px rgba(0, 0, 0, 0.2)',
  messageBubble: '0 1px 2px rgba(0, 0, 0, 0.05)',
} as const;

export const breakpoints = {
  xs: '320px',
  sm: '375px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const animations = {
  // Duration
  duration: {
    instant: '0.1s',
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s',
  },

  // Easing
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  chatWidget: 9999,
} as const;
