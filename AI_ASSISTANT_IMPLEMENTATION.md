# AI Assistant Implementation for BaitoAI

## Overview
Implement an AI-powered assistant that enables users to interact with the BaitoAI system through natural language, both via WhatsApp integration and in-app chat interface. The assistant will understand user intent and perform database operations, eliminating the need for manual clicking and form filling.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   WhatsApp      │────▶│     n8n      │────▶│                 │
│   Voice/Text    │     │   Workflow   │     │                 │
└─────────────────┘     └──────────────┘     │                 │
                                              │   AI Service    │
┌─────────────────┐     ┌──────────────┐     │    (MCP/API)    │
│   BaitoAI App   │────▶│   Chat UI    │────▶│                 │
│   Chat Widget   │     │              │     │                 │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │    Supabase     │
                                              │    Database     │
                                              └─────────────────┘
```

## Key Features

### 1. Natural Language Understanding
- **Intent Recognition**: Understand what users want to do
- **Entity Extraction**: Extract relevant data from user messages
- **Context Management**: Maintain conversation context for multi-turn interactions

### 2. Supported Operations

#### Data Retrieval
- "Show me today's projects"
- "How many staff are assigned to Project X?"
- "What's the status of John Doe?"
- "List all pending expense claims"
- "Show me candidates available this week"

#### Data Input
- "Add John Doe as a candidate with phone 012-3456789"
- "Create a new project called 'Event Setup' for tomorrow"
- "Assign 5 staff to the morning shift"
- "Submit expense claim for RM 150 for transportation"
- "Update project status to completed"

### 3. Integration Channels

#### WhatsApp Integration (via n8n)
- Voice note transcription
- Text message processing
- Media handling (receipts, documents)
- Automated responses
- Multi-language support

#### In-App Chat Widget
- Real-time chat interface
- Rich message formatting
- Quick action buttons
- File uploads
- Voice input support

## Technical Implementation

### 1. MCP (Model Context Protocol) Server

```typescript
// mcp-server/index.ts
import { MCPServer } from '@modelcontextprotocol/server-node';
import { createClient } from '@supabase/supabase-js';

const server = new MCPServer({
  name: 'baitoai-assistant',
  version: '1.0.0',
});

// Define available tools
server.tool('get_projects', async (params) => {
  // Fetch projects based on filters
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .filter(params.filter);
  
  return { projects: data };
});

server.tool('create_candidate', async (params) => {
  // Validate and create candidate
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      full_name: params.name,
      phone_number: params.phone,
      email: params.email,
      // ... other fields
    });
  
  return { success: !error, candidate: data };
});

// More tools for various operations...
```

### 2. AI Service Layer

```typescript
// ai-service/assistant.ts
import { OpenAI } from 'openai';
import { MCPClient } from '@modelcontextprotocol/client';

export class BaitoAIAssistant {
  private openai: OpenAI;
  private mcpClient: MCPClient;
  
  async processMessage(message: string, context: ConversationContext) {
    // 1. Understand intent
    const intent = await this.classifyIntent(message);
    
    // 2. Extract entities
    const entities = await this.extractEntities(message, intent);
    
    // 3. Execute appropriate action
    const result = await this.executeAction(intent, entities);
    
    // 4. Generate response
    return this.generateResponse(result, context);
  }
  
  private async executeAction(intent: Intent, entities: Entities) {
    switch (intent.type) {
      case 'GET_PROJECTS':
        return await this.mcpClient.callTool('get_projects', {
          filter: entities.filter
        });
        
      case 'CREATE_CANDIDATE':
        return await this.mcpClient.callTool('create_candidate', {
          name: entities.candidateName,
          phone: entities.phoneNumber,
          email: entities.email
        });
        
      // More cases...
    }
  }
}
```

### 3. WhatsApp Integration (n8n Workflow)

```yaml
# n8n workflow configuration
nodes:
  - WhatsApp Webhook:
      - Receive messages/voice notes
      - Extract sender info
      
  - Voice Transcription:
      - Convert voice to text (using Whisper API)
      - Detect language
      
  - AI Assistant API:
      - Send transcribed text
      - Include user context
      - Get response
      
  - WhatsApp Send:
      - Format response
      - Send back to user
      - Include action confirmations
```

### 4. In-App Chat Component

```tsx
// components/ai-chat/ChatWidget.tsx
import React, { useState } from 'react';
import { useAIAssistant } from '@/hooks/use-ai-assistant';

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendMessage, isProcessing } = useAIAssistant();
  
  const handleSend = async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: text 
    }]);
    
    // Get AI response
    const response = await sendMessage(text);
    
    // Add AI response
    setMessages(prev => [...prev, { 
      type: 'assistant', 
      content: response.message,
      actions: response.actions 
    }]);
  };
  
  return (
    <div className="chat-widget">
      <MessageList messages={messages} />
      <QuickActions />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
```

## Security Considerations

### 1. Authentication & Authorization
- Verify user identity via WhatsApp phone number
- Check user permissions before executing actions
- Implement rate limiting to prevent abuse

### 2. Data Validation
- Validate all inputs before database operations
- Sanitize user messages
- Implement field-level permissions

### 3. Audit Trail
- Log all AI-initiated actions
- Track who requested what and when
- Enable action rollback capabilities

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up MCP server with basic tools
- Implement core database operations
- Create simple intent classification

### Phase 2: WhatsApp Integration (Week 3-4)
- Configure n8n workflow
- Implement voice transcription
- Test basic commands

### Phase 3: In-App Chat (Week 5-6)
- Build chat UI component
- Integrate with MCP server
- Add rich interactions

### Phase 4: Advanced Features (Week 7-8)
- Multi-turn conversations
- Complex queries
- Bulk operations
- Report generation

## Example Interactions

### WhatsApp Voice Note
```
User: "Hi, I need to add a new candidate. His name is Ahmad bin Ali, 
       phone number 012-3456789, he has a car and speaks Malay and English."

AI: "✅ I've added Ahmad bin Ali as a new candidate with:
     📱 Phone: 012-3456789
     🚗 Vehicle: Car
     🗣️ Languages: Malay, English
     
     Would you like to assign him to any projects?"
```

### In-App Chat
```
User: "Show me all available staff for tomorrow's morning shift"

AI: "I found 12 available staff for tomorrow's morning shift (6 AM - 2 PM):
     
     👥 Available Staff:
     1. John Doe - ⭐ 4.8 rating
     2. Jane Smith - ⭐ 4.9 rating
     3. Ahmad Ali - ⭐ 4.7 rating
     ... (showing top 3)
     
     [View All] [Assign to Project] [Filter Further]"
```

### Complex Operations
```
User: "Create a new project for next Monday, need 5 staff from 9am to 5pm 
       at KLCC, budget RM 2000"

AI: "I'll create a new project with these details:
     📅 Date: Monday, Dec 2, 2024
     ⏰ Time: 9:00 AM - 5:00 PM
     📍 Location: KLCC
     👥 Staff needed: 5
     💰 Budget: RM 2,000
     
     [Confirm & Create] [Modify Details] [Cancel]"
```

## Benefits

### For Staff/Colleagues
- No need to learn complex UI
- Voice input in their preferred language
- Quick actions while on the go
- Reduced data entry errors

### For Administrators
- Faster data collection
- Improved data accuracy
- Reduced training requirements
- Better accessibility

### For the System
- Increased user adoption
- More consistent data
- Automated workflows
- Scalable operations

## Technical Stack

- **AI/LLM**: OpenAI GPT-4 or Claude API
- **MCP Server**: Node.js with TypeScript
- **Voice Processing**: OpenAI Whisper
- **WhatsApp**: Twilio or WhatsApp Business API
- **Workflow**: n8n (self-hosted)
- **Database**: Existing Supabase
- **Frontend**: React with real-time updates

## Estimated Timeline

- **Planning & Design**: 1 week
- **MCP Server Development**: 2 weeks
- **AI Integration**: 2 weeks
- **WhatsApp Integration**: 1 week
- **In-App Chat UI**: 1 week
- **Testing & Refinement**: 2 weeks
- **Total**: ~9 weeks

## Success Metrics

- Response accuracy: >90%
- Processing time: <3 seconds
- User adoption rate: 50% in 3 months
- Error rate: <5%
- Task completion rate: >85%

## Future Enhancements

1. **Proactive Assistance**
   - Remind about understaffed projects
   - Suggest candidates based on requirements
   - Alert about expiring documents

2. **Advanced Analytics**
   - Natural language report generation
   - Predictive insights
   - Trend analysis

3. **Multi-modal Input**
   - Image processing (receipts, documents)
   - Location-based queries
   - Calendar integration

4. **Workflow Automation**
   - Trigger automated workflows
   - Conditional actions
   - Scheduled operations