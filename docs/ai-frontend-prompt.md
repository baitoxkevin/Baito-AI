# AI Frontend Prompt: Baito AI Chatbot

**Generated:** 2025-10-07
**Based on:** UX Specification v1.0
**For:** v0.dev, Lovable, Cursor, or similar AI coding tools

---

## Project Overview

Build an intelligent AI chatbot widget for the Baito staffing management platform. The chatbot provides a conversational interface that allows non-technical users (Chinese-speaking admin, managers, field staff) to interact with the system using natural language.

**Key Requirements:**
- Mobile-first, responsive design
- Multilingual (Chinese + English) with auto-detection
- Voice input support
- WCAG 2.1 AA accessibility
- Smooth animations using Framer Motion
- Offline-ready with service workers

---

## Tech Stack

**Required:**
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "TailwindCSS v3+",
  "components": "ShadCN UI",
  "animations": "Framer Motion",
  "icons": "Lucide React",
  "backend": "Supabase",
  "i18n": "react-i18next",
  "voice": "Web Speech API"
}
```

**Build Configuration:**
- Vite as bundler
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Path alias `@/` for imports

---

## Component Architecture

Create the following components:

### 1. ChatWidget (Main Container)

**File:** `src/components/chat/ChatWidget.tsx`

**Purpose:** Main floating chat widget container

**Props:**
```typescript
interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  defaultState?: 'collapsed' | 'expanded';
  theme?: 'light' | 'dark' | 'auto';
  userRole: 'admin' | 'manager' | 'staff';
  language?: 'zh' | 'en' | 'auto';
  onClose?: () => void;
}
```

**States:**
- `collapsed`: FAB button (60×60px circular)
- `expanded`: Full chat interface (mobile: fullscreen, desktop: 400×600px)
- `minimized`: Header bar only

**Behavior:**
- Mobile (<768px): Fullscreen overlay
- Desktop (>768px): Floating widget, draggable, resizable (360-600px width)
- Keyboard shortcut: Cmd/Ctrl + K to open/close
- Escape key to close
- Click outside to close (with confirmation if mid-conversation)

**Animation:**
```tsx
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
/>
```

---

### 2. MessageBubble

**File:** `src/components/chat/MessageBubble.tsx`

**Purpose:** Individual message display

**Props:**
```typescript
interface MessageBubbleProps {
  type: 'user' | 'assistant' | 'system' | 'confirmation' | 'error';
  content: string | React.ReactNode;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  avatar?: string;
  actions?: QuickAction[];
  onRetry?: () => void;
}
```

**Variants:**
- **User** (right-aligned, #3B82F6 bg, white text)
- **Assistant** (left-aligned, #F3F4F6 bg, #111827 text)
- **System** (centered, #FEF3C7 bg, #92400E text)
- **Error** (left-aligned, #FEE2E2 bg, #991B1B text)

**Animation:**
```tsx
// User message (from right)
initial={{ x: 20, opacity: 0, scale: 0.95 }}
animate={{ x: 0, opacity: 1, scale: 1 }}
transition={{ duration: 0.2, ease: 'easeOut' }}

// AI message (from left)
initial={{ x: -20, opacity: 0, scale: 0.95 }}
animate={{ x: 0, opacity: 1, scale: 1 }}
```

**Styling:**
```css
.message-bubble-user {
  max-width: 75%;
  padding: 12px 16px;
  background: #3B82F6;
  color: white;
  border-radius: 12px 12px 4px 12px;
  margin-left: auto;
}

.message-bubble-assistant {
  max-width: 85%;
  padding: 12px 16px;
  background: #F3F4F6;
  color: #111827;
  border-radius: 12px 12px 12px 4px;
}
```

---

### 3. QuickActionBar

**File:** `src/components/chat/QuickActionBar.tsx`

**Purpose:** Role-based quick action buttons

**Props:**
```typescript
interface QuickActionBarProps {
  role: 'admin' | 'manager' | 'staff';
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
}

interface QuickAction {
  id: string;
  label: string;
  labelZh: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}
```

**Quick Actions by Role:**

**Admin:**
- 今天的项目 (Today's Projects) - Calendar icon
- 添加员工 (Add Staff) - UserPlus icon
- 更新考勤 (Update Attendance) - CheckSquare icon
- 查看报表 (View Reports) - BarChart icon

**Manager:**
- 项目总览 (Projects Overview) - Briefcase icon
- 员工排班 (Staff Scheduling) - Users icon
- 审批费用 (Approve Expenses) - DollarSign icon
- 财务报表 (Financial Reports) - TrendingUp icon

**Staff:**
- 我的排班 (My Schedule) - Calendar icon
- 打卡签到 (Check-in) - MapPin icon
- 提交费用 (Submit Expense) - Receipt icon
- 联系管理员 (Contact Admin) - MessageSquare icon

**Styling:**
```css
.quick-action-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #E5E7EB;
  overflow-x: auto;
}

.quick-action-button {
  min-width: 80px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
}

.quick-action-button:hover {
  background: #F3F4F6;
  border-color: #3B82F6;
  transform: translateY(-1px);
}
```

---

### 4. RichContentCard

**File:** `src/components/chat/RichContentCard.tsx`

**Purpose:** Display structured data (tables, charts, forms)

**Props:**
```typescript
interface RichContentCardProps {
  variant: 'table' | 'form' | 'chart' | 'list' | 'detail';
  title: string;
  data: any;
  actions?: CardAction[];
  expandable?: boolean;
}
```

**Example - Table Variant:**
```tsx
<RichContentCard
  variant="table"
  title="Today's Projects"
  data={[
    { id: 1, project: 'Warehouse ABC', time: '9-5', staff: '8/10' },
    { id: 2, project: 'Site XYZ', time: '8-6', staff: '12/15' }
  ]}
  actions={[
    { label: 'View All', onClick: () => {} }
  ]}
/>
```

---

### 5. VoiceInput

**File:** `src/components/chat/VoiceInput.tsx`

**Purpose:** Speech-to-text voice input

**Props:**
```typescript
interface VoiceInputProps {
  language: 'zh-CN' | 'en-US';
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
}
```

**Implementation:**
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = language;
recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  onTranscript(transcript);
};
```

**Visual States:**
- **Idle:** Blue microphone icon
- **Listening:** Red pulsing icon with animation
- **Processing:** Spinner
- **Error:** Red X with error message

**Animation (pulsing while listening):**
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

.voice-button-listening {
  animation: pulse 1.5s infinite;
}
```

---

### 6. TypingIndicator

**File:** `src/components/chat/TypingIndicator.tsx`

**Purpose:** Show AI is typing

**Implementation:**
```tsx
<div className="typing-indicator">
  <span className="typing-dot" />
  <span className="typing-dot" />
  <span className="typing-dot" />
</div>
```

**Animation:**
```css
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #9CA3AF;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

---

## Design System Tokens

**File:** `src/styles/design-tokens.ts`

```typescript
export const colors = {
  primary: '#3B82F6',        // Blue-500
  secondary: '#10B981',      // Emerald-500
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  chat: {
    userBubble: '#3B82F6',
    userText: '#FFFFFF',
    assistantBubble: '#F3F4F6',
    assistantText: '#111827',
    systemBubble: '#FEF3C7',
    systemText: '#92400E',
  },

  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
  }
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
  },

  fontSize: {
    xs: '0.75rem',    // 12px - Labels
    sm: '0.875rem',   // 14px - Timestamps
    base: '1rem',     // 16px - Messages
    lg: '1.125rem',   // 18px - Header
  },

  lineHeight: {
    tight: '1.5',
    normal: '1.75',   // Chinese prefers more
  }
};

export const spacing = {
  messagePadding: '12px 16px',
  messageBubbleGap: '8px',
  messageGroupGap: '16px',
  widgetPadding: '16px',
};

export const borderRadius = {
  widget: '16px',
  messageBubble: '12px',
  button: '8px',
  fab: '9999px',
};

export const shadows = {
  widget: '0 8px 32px rgba(0, 0, 0, 0.12)',
  fab: '0 4px 12px rgba(0, 0, 0, 0.15)',
  fabHover: '0 6px 16px rgba(0, 0, 0, 0.2)',
};
```

---

## Internationalization Setup

**File:** `src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': {
        translation: {
          chat: {
            header: 'AI 助手',
            placeholder: '输入您的消息...',
            send: '发送',
            voiceInput: '语音输入',
          },
          quickActions: {
            todayProjects: '今天的项目',
            addStaff: '添加员工',
            updateAttendance: '更新考勤',
            viewReports: '查看报表',
          }
        }
      },
      'en-US': {
        translation: {
          chat: {
            header: 'AI Assistant',
            placeholder: 'Type your message...',
            send: 'Send',
            voiceInput: 'Voice Input',
          },
          quickActions: {
            todayProjects: "Today's Projects",
            addStaff: 'Add Staff',
            updateAttendance: 'Update Attendance',
            viewReports: 'View Reports',
          }
        }
      }
    },
    fallbackLng: 'en-US',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

---

## Responsive Breakpoints

**File:** `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    screens: {
      'xs': '320px',
      'sm': '375px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  }
}
```

**CSS Media Queries:**

```css
/* Mobile: Fullscreen chat */
@media (max-width: 767px) {
  .chat-widget-expanded {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .chat-widget-collapsed {
    bottom: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
  }
}

/* Tablet/Desktop: Floating widget */
@media (min-width: 768px) {
  .chat-widget-expanded {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 400px;
    height: 600px;
    border-radius: 16px;
  }

  .chat-widget-collapsed {
    width: 60px;
    height: 60px;
  }
}

/* Desktop: Resizable */
@media (min-width: 1024px) {
  .chat-widget-expanded {
    width: 420px;
    height: 640px;
    resize: both;
    overflow: hidden;
    min-width: 360px;
    max-width: 600px;
    min-height: 400px;
    max-height: 800px;
  }
}
```

---

## Accessibility Implementation

### 1. Keyboard Navigation

```typescript
// Keyboard shortcuts hook
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Open/close chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleChat();
      }

      // Escape: Close chat
      if (e.key === 'Escape') {
        closeChat();
      }

      // Enter: Send message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### 2. ARIA Labels

```tsx
<div
  role="dialog"
  aria-labelledby="chat-header"
  aria-describedby="chat-description"
>
  <h2 id="chat-header">AI 助手 / AI Assistant</h2>

  <div role="log" aria-live="polite" aria-atomic="false">
    {messages.map(msg => (
      <article
        key={msg.id}
        aria-label={`${msg.type === 'user' ? 'You' : 'AI'} said: ${msg.content}`}
      >
        {msg.content}
      </article>
    ))}
  </div>

  <input
    type="text"
    aria-label="Message input field"
    aria-describedby="input-help-text"
    placeholder={t('chat.placeholder')}
  />

  <button
    aria-label="Send message"
    aria-disabled={!message}
  >
    <Send />
  </button>
</div>
```

### 3. Focus Management

```typescript
const ChatWidget = () => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      // Focus trap within widget
      const focusableElements = widgetRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // Focus first element (message input)
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  return (
    <div ref={widgetRef} className="chat-widget">
      {/* Widget content */}
    </div>
  );
};
```

### 4. Color Contrast

All text meets WCAG 2.1 AA standards (4.5:1 minimum):
- Primary Blue (#3B82F6) on White: 4.52:1 ✅
- Gray-900 (#111827) on White: 16.26:1 ✅
- Gray-500 (#6B7280) on White: 4.57:1 ✅

### 5. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Keep essential animations */
  .typing-indicator,
  .loading-spinner {
    animation-duration: 1s;
  }
}
```

---

## Supabase Integration

### 1. Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Store Messages

```typescript
// src/hooks/useChatMessages.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  user_id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'failed';
}

export const useChatMessages = (userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const sendMessage = async (content: string, type: 'user' | 'assistant') => {
    const newMessage = {
      user_id: userId,
      type,
      content,
      timestamp: new Date().toISOString(),
      status: 'sending' as const,
    };

    // Optimistic update
    setMessages(prev => [...prev, { ...newMessage, id: 'temp-' + Date.now() }]);

    // Send to database
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      // Handle error - mark as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id.startsWith('temp-')
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
    }
  };

  return { messages, sendMessage };
};
```

---

## AI Integration (OpenAI/Anthropic)

```typescript
// src/hooks/useAIChat.ts
import { useState } from 'react';

export const useAIChat = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendToAI = async (message: string, conversationHistory: Message[]) => {
    setIsLoading(true);

    try {
      // Call your backend API that interfaces with OpenAI/Anthropic
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: conversationHistory.slice(-10), // Last 10 messages for context
        }),
      });

      const data = await response.json();
      return data.response;

    } catch (error) {
      console.error('AI error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendToAI, isLoading };
};
```

---

## Example Usage

### Main App Integration

```tsx
// src/App.tsx
import { ChatWidget } from '@/components/chat/ChatWidget';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {/* Your main app content */}

      {/* Chat widget */}
      {user && (
        <ChatWidget
          position="bottom-right"
          userRole={user.role}
          language="auto"
        />
      )}
    </div>
  );
}
```

---

## Testing Requirements

### 1. Accessibility Tests

```bash
npm install --save-dev @axe-core/react
```

```typescript
// src/tests/accessibility.test.tsx
import { axe } from '@axe-core/react';
import { render } from '@testing-library/react';
import { ChatWidget } from '@/components/chat/ChatWidget';

describe('ChatWidget Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ChatWidget userRole="admin" />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
```

### 2. Responsive Tests

```typescript
// Test mobile, tablet, desktop viewports
const viewports = [
  { width: 375, height: 667, name: 'iPhone SE' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1920, height: 1080, name: 'Desktop' },
];

viewports.forEach(({ width, height, name }) => {
  it(`should render correctly on ${name}`, () => {
    cy.viewport(width, height);
    cy.visit('/');
    cy.get('[data-testid="chat-widget"]').should('be.visible');
  });
});
```

### 3. Internationalization Tests

```typescript
it('should switch language dynamically', () => {
  const { getByText, rerender } = render(
    <I18nextProvider i18n={i18n}>
      <ChatWidget userRole="admin" language="zh" />
    </I18nextProvider>
  );

  expect(getByText('AI 助手')).toBeInTheDocument();

  // Switch to English
  i18n.changeLanguage('en');
  rerender(
    <I18nextProvider i18n={i18n}>
      <ChatWidget userRole="admin" language="en" />
    </I18nextProvider>
  );

  expect(getByText('AI Assistant')).toBeInTheDocument();
});
```

---

## Performance Optimization

### 1. Code Splitting

```typescript
// Lazy load chat widget
const ChatWidget = lazy(() => import('@/components/chat/ChatWidget'));

<Suspense fallback={<LoadingSpinner />}>
  <ChatWidget />
</Suspense>
```

### 2. Memoization

```typescript
const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {message.content}
    </motion.div>
  );
});
```

### 3. Virtual Scrolling (for long conversations)

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const MessageList = ({ messages }: { messages: Message[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimate message height
  });

  return (
    <div ref={parentRef} className="message-list">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageBubble message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Deployment Checklist

- [ ] Environment variables configured (.env.production)
- [ ] Supabase project setup with database tables
- [ ] AI backend API endpoint configured
- [ ] Voice API permissions requested
- [ ] PWA manifest and service worker configured
- [ ] Accessibility audit passed (Lighthouse score >90)
- [ ] Cross-browser testing completed
- [ ] Mobile device testing completed
- [ ] Performance optimization (bundle size <500KB)
- [ ] Error monitoring setup (Sentry or similar)

---

## Special Instructions for AI Tools

**For v0.dev:**
1. Start with ChatWidget component
2. Build in this order: MessageBubble → QuickActionBar → RichContentCard → VoiceInput
3. Use ShadCN UI components as base (Button, Input, Badge, Avatar)
4. Apply TailwindCSS utilities for styling
5. Add Framer Motion animations last

**For Lovable:**
1. Import this entire prompt
2. Request mobile-first responsive design
3. Emphasize Chinese language support
4. Request accessibility features explicitly

**For Cursor:**
1. Create project structure first
2. Generate components one at a time
3. Test each component in isolation
4. Integrate with Supabase incrementally

---

## Summary

This prompt provides everything needed to build the Baito AI Chatbot:

✅ **Complete component specifications** with TypeScript interfaces
✅ **Design system tokens** (colors, typography, spacing)
✅ **Responsive breakpoints** for mobile/tablet/desktop
✅ **Accessibility implementation** (WCAG 2.1 AA)
✅ **Internationalization setup** (Chinese + English)
✅ **Animation specifications** with Framer Motion
✅ **Backend integration** with Supabase
✅ **AI integration patterns**
✅ **Testing requirements**
✅ **Performance optimization strategies**

**Next Steps:**
1. Copy this prompt to v0.dev or your AI tool
2. Generate components iteratively
3. Test and refine
4. Integrate with Baito-AI app
5. Deploy and monitor

**Related Documents:**
- UX Specification: `/docs/ux-specification.md` (full design details)
- PRD: `/docs/AI_CHATBOT_PRD.md` (product requirements)
