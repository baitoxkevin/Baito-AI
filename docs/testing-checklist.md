# AI Chat Widget - End-to-End Testing Checklist

## Prerequisites

- [ ] `OPENAI_API_KEY` environment variable set in Netlify
- [ ] Supabase project connected and accessible
- [ ] Development server running (`netlify dev`)
- [ ] Chrome DevTools console open for debugging

## 1. Setup Verification

### Environment
- [ ] Navigate to the app in browser
- [ ] Open browser console - verify no errors on page load
- [ ] Check network tab - verify Supabase connection successful
- [ ] Verify API keys are not exposed in client-side code

### Chat Widget Appearance
- [ ] FAB (Floating Action Button) appears in bottom-right corner
- [ ] Baiger tiger avatar displays correctly on FAB
- [ ] FAB has proper shadow and hover effects
- [ ] Click FAB - chat window opens smoothly with animation

## 2. Basic Chat Functionality

### Opening & Closing
- [ ] Press `⌘ K` (Mac) or `Ctrl K` (Windows) - chat toggles open/close
- [ ] Click FAB - chat opens
- [ ] Click X button - chat closes with animation
- [ ] Click minimize button - chat minimizes to header only
- [ ] Click maximize button - chat expands back to full size

### First Message
- [ ] Welcome message displays with Baiger avatar
- [ ] Welcome message in correct language
- [ ] Quick Actions buttons display below welcome message
- [ ] Quick Actions match user role (admin/manager/staff)

### Sending Messages
- [ ] Type message in input field
- [ ] Press Enter - message sends
- [ ] User message appears immediately (optimistic update)
- [ ] User message has blue background, right-aligned
- [ ] Typing indicator appears with animated dots
- [ ] AI response appears after processing
- [ ] AI response has gray background, left-aligned
- [ ] Timestamp displays below each message
- [ ] Messages auto-scroll to bottom

### Conversation Persistence
- [ ] Refresh page - conversation loads from Supabase
- [ ] Previous messages display in correct order
- [ ] Conversation ID maintained across refreshes
- [ ] Click "Clear Conversation" - all messages cleared
- [ ] Page reload - starts fresh conversation

## 3. Voice Input Testing

### Setup
- [ ] Verify microphone connected and working
- [ ] Browser allows microphone access (HTTPS required)

### Recording
- [ ] Click microphone button - permission prompt appears
- [ ] Grant permission - recording starts
- [ ] Microphone button shows pulsing red animation
- [ ] Three animated dots appear on button
- [ ] Speak clearly in selected language (Chinese/English)
- [ ] Click square button to stop - recording stops

### Transcription
- [ ] Processing indicator shows (blue spinning icon)
- [ ] Transcription appears in input field after ~2-5 seconds
- [ ] Transcription accuracy matches spoken words
- [ ] Chinese transcription works (if selected)
- [ ] English transcription works (if selected)

### Error Handling
- [ ] Deny microphone permission - error toast appears
- [ ] Speak with no audio - handles gracefully
- [ ] Network error - shows appropriate error message
- [ ] API error - displays error toast with retry option

## 4. Internationalization (i18n)

### Language Toggle
- [ ] Click globe icon in header - language switches
- [ ] English → Chinese: All UI text updates instantly
- [ ] Chinese → English: All UI text updates instantly
- [ ] Language preference saves to localStorage
- [ ] Page refresh - selected language persists

### UI Text Coverage
- [ ] Chat header text translated
- [ ] Input placeholder text translated
- [ ] Button labels translated (Send, Clear, etc.)
- [ ] Welcome message translated
- [ ] Quick Action labels translated
- [ ] Error messages translated
- [ ] Voice input status translated
- [ ] Accessibility labels translated

### Voice Input Language
- [ ] Set UI to Chinese - voice input uses Chinese
- [ ] Set UI to English - voice input uses English
- [ ] Language switch updates voice transcription language

## 5. Mobile Responsive Testing

### Desktop (>768px)
- [ ] Chat widget: 420px × 700px
- [ ] FAB: 64px × 64px
- [ ] Widget positioned bottom-right with margins
- [ ] Rounded corners and shadow visible
- [ ] Minimize button visible

### Mobile (<768px)
- [ ] Chat takes full screen (no margins)
- [ ] No rounded corners
- [ ] No shadow
- [ ] Minimize button hidden
- [ ] Input height: 44px (touch-friendly)
- [ ] Button heights: 44px (touch-friendly)
- [ ] Font size increased for readability
- [ ] Padding optimized for mobile

### Responsive Transitions
- [ ] Resize browser window
- [ ] 768px breakpoint - smooth transition to mobile
- [ ] Expand from mobile - smooth transition to desktop
- [ ] No layout jumping or flickering

## 6. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible on all buttons
- [ ] Enter key sends message from input
- [ ] `⌘ K` / `Ctrl K` toggles chat
- [ ] Escape key closes chat (if implemented)

### Screen Reader Testing
- [ ] Use screen reader (VoiceOver/NVDA)
- [ ] FAB announced as "Open AI Assistant"
- [ ] Messages announced as they arrive
- [ ] "Message sent" announcement after sending
- [ ] "AI is typing" announced during processing
- [ ] Button labels properly announced
- [ ] Input field has proper label

### ARIA Attributes
- [ ] Inspect MessageList - has `role="log"` and `aria-live="polite"`
- [ ] Message bubbles have `role="article"`
- [ ] Avatars have proper `aria-label`
- [ ] Icons have `aria-hidden="true"`
- [ ] TypingIndicator has `role="status"`
- [ ] Buttons have descriptive `aria-label`

### Color Contrast
- [ ] All text meets WCAG AA standards
- [ ] Light mode: sufficient contrast
- [ ] Dark mode: sufficient contrast
- [ ] Error messages: red with sufficient contrast
- [ ] Status indicators: distinguishable colors

## 7. Rich Content Display

### Edge Function Integration
If your Edge Function returns rich content:

#### List Card
- [ ] List items display with icons
- [ ] Subtitles render correctly
- [ ] Values align right
- [ ] Status badges show correct colors
- [ ] Footer text displays

#### Metrics Card
- [ ] Metrics display in 2-column grid
- [ ] Trend indicators show (up/down/neutral arrows)
- [ ] Colors match trend direction
- [ ] Icons display correctly
- [ ] Large numbers readable

#### Schedule Card
- [ ] Times display on left
- [ ] Status dots show correct colors
- [ ] Titles and locations render
- [ ] Items separated by borders

#### Status Card
- [ ] Correct background color for status type
- [ ] Icon displays (check/alert)
- [ ] Details list renders correctly
- [ ] Border color matches status

### Markdown Content
- [ ] Bold text renders: **bold**
- [ ] Italic text renders: *italic*
- [ ] Code inline: `code`
- [ ] Code blocks with syntax
- [ ] Links clickable and open in new tab
- [ ] Lists (ordered and unordered)
- [ ] Tables render correctly
- [ ] Blockquotes display

## 8. Supabase Integration

### Database Operations
- [ ] Open Supabase dashboard
- [ ] Send message - check `ai_messages` table
- [ ] Verify message stored with correct type
- [ ] Check `conversation_id` foreign key
- [ ] Verify timestamp accurate
- [ ] Check metadata JSONB structure

### Conversation Management
- [ ] Check `ai_conversations` table
- [ ] Verify `user_id` matches authenticated user
- [ ] Check `last_activity` updates with new messages
- [ ] Verify `ended_at` null for active conversations
- [ ] Clear conversation - check `ended_at` populated

### Row Level Security
- [ ] Login as User A - send messages
- [ ] Login as User B - verify cannot see User A's messages
- [ ] Check policies in Supabase dashboard
- [ ] Verify INSERT policy enforces user_id match
- [ ] Test UPDATE policy (should only update own conversations)

### Triggers
- [ ] Send message - verify `last_activity` updates automatically
- [ ] Send 10+ messages - check if summarization triggered
- [ ] Inspect trigger functions in Supabase

## 9. Error Handling

### Network Errors
- [ ] Disconnect internet - send message
- [ ] Error message displays in chat
- [ ] Error message has red background
- [ ] Network reconnects - can send messages again

### API Errors
- [ ] Invalid API key (temporarily) - check error handling
- [ ] Supabase down - check graceful degradation
- [ ] Edge Function error - displays error message

### Voice Input Errors
- [ ] No microphone - shows error toast
- [ ] API quota exceeded - shows error
- [ ] Corrupted audio - handles gracefully
- [ ] Network timeout - shows timeout error

### Validation Errors
- [ ] Send empty message - button disabled
- [ ] Send only whitespace - button disabled
- [ ] Very long message - truncates or handles properly

## 10. Performance Testing

### Load Time
- [ ] Initial page load < 3 seconds
- [ ] Chat widget opens instantly
- [ ] First message sends within 1 second (network dependent)

### Animation Performance
- [ ] All animations smooth (60fps)
- [ ] No jank when opening/closing chat
- [ ] Message animations smooth
- [ ] Typing indicator fluid

### Memory
- [ ] Open DevTools Performance tab
- [ ] Send 50+ messages
- [ ] Check memory usage doesn't leak
- [ ] Close and reopen chat - memory released

## 11. Design Tokens Integration

### Visual Consistency
- [ ] Primary blue color matches across all buttons
- [ ] Shadows consistent (FAB, widget, buttons)
- [ ] Border radius consistent
- [ ] Spacing consistent throughout
- [ ] Typography consistent

### Dark Mode (if implemented)
- [ ] Toggle dark mode
- [ ] All colors adapt correctly
- [ ] Contrast maintained
- [ ] Shadows visible in dark mode
- [ ] No white flashes during transitions

## 12. Quick Actions

### Role-Based Actions
- [ ] Admin role - shows admin actions (Add Staff, Attendance)
- [ ] Manager role - shows manager actions (Approve Expenses, Reports)
- [ ] Staff role - shows staff actions (My Schedule, Check-in)
- [ ] Click action - inserts text into input field
- [ ] Input field receives focus after click

### Styling
- [ ] Action buttons have icons
- [ ] Hover effect displays
- [ ] Ripple effect on click
- [ ] Layout responsive on mobile

## Issues & Bugs Log

Use this section to document any issues found:

| # | Component | Issue | Severity | Status |
|---|-----------|-------|----------|--------|
| 1 | | | | |
| 2 | | | | |

## Test Results Summary

- **Date Tested**: _______________
- **Tester**: _______________
- **Total Tests**: _____ / _____
- **Passed**: _____
- **Failed**: _____
- **Blocked**: _____

## Sign-off

- [ ] All critical tests passed
- [ ] All known issues documented
- [ ] Ready for production deployment

**Tested by**: _______________
**Date**: _______________
**Signature**: _______________
