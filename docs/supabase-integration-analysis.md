# Supabase AI Chat Integration Analysis

## Database Schema

### Tables Overview

#### `ai_conversations`
Stores conversation sessions between users and the AI assistant.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | References auth.users |
| session_id | text | NO | - | Unique session identifier |
| session_summary | text | YES | - | AI-generated summary |
| started_at | timestamp | YES | now() | When conversation started |
| last_activity | timestamp | YES | now() | Last message timestamp |
| ended_at | timestamp | YES | null | When conversation ended |
| metadata | jsonb | YES | '{}' | Additional data |
| created_at | timestamp | YES | now() | Record creation time |
| updated_at | timestamp | YES | now() | Record update time |

**Indexes:**
- `ai_conversations_pkey` - Primary key on id
- `idx_ai_conversations_user_id` - Index on user_id
- `idx_ai_conversations_session_id` - Index on session_id
- `idx_ai_conversations_last_activity` - Index on last_activity DESC
- `unique_session_per_user` - Unique constraint on (user_id, session_id)

#### `ai_messages`
Stores individual messages within conversations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| conversation_id | uuid | NO | - | FK to ai_conversations |
| type | text | NO | - | Message type (user/assistant/system/error) |
| content | text | NO | - | Message content |
| embedding | vector | YES | - | Text embedding for semantic search |
| metadata | jsonb | YES | '{}' | Tools used, buttons, etc. |
| created_at | timestamp | YES | now() | Message timestamp |

**Indexes:**
- `ai_messages_pkey` - Primary key on id
- `idx_ai_messages_conversation_id` - Index on conversation_id
- `idx_ai_messages_created_at` - Index on created_at DESC
- `idx_ai_messages_type` - Index on type
- `ai_messages_embedding_idx` - HNSW vector index for embeddings

## Row Level Security (RLS)

### ai_conversations Policies

1. **Users view own conversations** (SELECT)
   - Policy: `auth.uid() = user_id`
   - Users can only view their own conversations

2. **Users update own conversations** (UPDATE)
   - Policy: `auth.uid() = user_id`
   - Users can only update their own conversations

3. **⚠️ Users create own conversations** (INSERT)
   - Policy: No restriction (null qual)
   - **SECURITY ISSUE**: Any authenticated user can insert with any user_id

### ai_messages Policies

1. **Users view own messages** (SELECT)
   - Policy: Message belongs to user's conversation
   - Checks via JOIN to ai_conversations

2. **Users insert own messages** (INSERT)
   - Policy: No restriction (null qual)
   - Relies on conversation ownership for security

## Database Triggers

### `trigger_update_conversation_activity`
- **Table**: ai_messages
- **Event**: INSERT
- **Function**: update_conversation_activity()
- **Purpose**: Updates `last_activity` timestamp on ai_conversations when new message is added

### `trigger_check_summarization`
- **Table**: ai_messages
- **Event**: INSERT
- **Function**: check_conversation_summarization()
- **Purpose**: Checks if conversation needs AI summarization based on message count

## Current Usage Statistics

- **Total Conversations**: 85
- **Total Messages**: 352
- **Active Conversations** (ended_at IS NULL): 3
- **Message Distribution**:
  - User messages: 176
  - Assistant messages: 176
  - **Perfect 1:1 ratio** (healthy)

## Integration with Frontend

### useAIChat Hook (`src/hooks/use-ai-chat.ts`)

**Flow:**
1. On mount: Load most recent active conversation for user
2. Load messages for that conversation
3. Send message → Call Supabase Edge Function `ai-chat`
4. Edge function handles AI processing and stores messages
5. Frontend receives response and updates UI

**Supported Message Types:**
- `user` - User messages
- `assistant` - AI responses
- `system` - System notifications
- `error` - Error messages

**Features:**
- Optimistic UI updates (user message shown immediately)
- Automatic conversation ID management
- Error handling with error messages
- Conversation clearing (ends all active conversations)

## Issues & Recommendations

### 🔴 Critical Issues

1. **INSERT RLS Policy Security Vulnerability**
   - **Issue**: ai_conversations INSERT policy has no `qual` restriction
   - **Risk**: Any authenticated user can insert conversations with any user_id
   - **Fix Required**:
   ```sql
   DROP POLICY "Users create own conversations" ON ai_conversations;

   CREATE POLICY "Users create own conversations" ON ai_conversations
   FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```

2. **Missing session_id Generation**
   - **Issue**: `session_id` is NOT NULL but hook doesn't provide it
   - **Current Behavior**: Likely handled by Edge Function or trigger
   - **Recommendation**: Document the session_id generation strategy

### 🟡 Enhancements Recommended

1. **Add Composite Index for Common Query**
   ```sql
   CREATE INDEX idx_ai_conversations_user_active
   ON ai_conversations(user_id, last_activity DESC)
   WHERE ended_at IS NULL;
   ```
   - Optimizes the query in `loadConversation()` which filters by user_id and ended_at

2. **Add Message Count Tracking**
   ```sql
   ALTER TABLE ai_conversations
   ADD COLUMN message_count INTEGER DEFAULT 0;

   -- Update trigger to increment count
   ```
   - Useful for pagination and conversation summaries

3. **Add Error Handling in Hook**
   - Current `clearConversation()` silently fails
   - Should provide user feedback on errors

4. **Add Pagination for Messages**
   - Current implementation loads ALL messages
   - Should implement cursor-based pagination for long conversations

5. **Vector Embeddings Strategy**
   - `embedding` column exists but not documented
   - Clarify if/how embeddings are being used for semantic search

### 🟢 Working Well

✅ **Proper Indexing**: All frequently queried columns have indexes
✅ **Automatic Timestamps**: Triggers maintain last_activity automatically
✅ **RLS Protection**: SELECT/UPDATE policies properly scoped to user
✅ **Vector Support**: HNSW index ready for semantic search
✅ **Metadata Flexibility**: JSONB columns allow extensibility
✅ **Clean Architecture**: Separation of conversations and messages

## Migration Recommendations

### Priority 1: Fix Security Issue

```sql
-- Fix INSERT policy for ai_conversations
DROP POLICY "Users create own conversations" ON ai_conversations;

CREATE POLICY "Users create own conversations" ON ai_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Priority 2: Add Performance Index

```sql
-- Optimize active conversation lookup
CREATE INDEX idx_ai_conversations_user_active
ON ai_conversations(user_id, last_activity DESC)
WHERE ended_at IS NULL;
```

### Priority 3: Document Session Management

Create documentation for:
- How `session_id` is generated
- When conversations auto-end
- Summarization trigger behavior

## Testing Checklist

- [ ] Test conversation creation with new user
- [ ] Test message sending and receiving
- [ ] Test conversation loading on page refresh
- [ ] Test multiple active conversations per user
- [ ] Test conversation clearing functionality
- [ ] Test RLS policies (try accessing other users' data)
- [ ] Test Edge Function error handling
- [ ] Test long conversations (100+ messages)
- [ ] Test concurrent message sending
- [ ] Test session_id uniqueness constraints

## Monitoring Recommendations

1. **Track Conversation Metrics**:
   - Average messages per conversation
   - Average conversation duration
   - Conversations without ended_at (leaked sessions)

2. **Performance Monitoring**:
   - Query performance for loadConversation()
   - Message loading time for long conversations
   - Edge Function response times

3. **Error Tracking**:
   - Failed message sends
   - RLS policy violations
   - Trigger failures
