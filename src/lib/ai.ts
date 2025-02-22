import { supabase } from './supabase';
import { createChatSession, getActiveChatSession, addChatMessage } from './chat';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type AIAction = {
  type: 'query' | 'update' | 'create' | 'schedule';
  data: Record<string, any>;
};

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function getAIResponse(messages: ChatMessage[], userId: string) {
  try {
    // Get or create active chat session
    let session = await getActiveChatSession(userId);
    
    if (!session) {
      try {
        session = await createChatSession(userId);
      } catch (error) {
        console.error('Error creating chat session:', error);
        // If session creation fails, proceed with AI request without session
      }
    }

    // Get AI response
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-qwen-32b',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a talent management system. You can help with:
              - Scheduling and managing events
              - Assigning staff to projects
              - Checking staff availability
              - Managing tasks and deadlines
              - Generating reports
              
              Please provide concise, professional responses focused on helping manage the talent system effectively.
              
              When dates are mentioned:
              - Always include the year (e.g., "March 1st, 2024" not just "March 1st")
              - Use the current year (2024) unless specified otherwise
              - Format dates consistently as "Month Day, Year" (e.g., "March 1st, 2024")
              
              You have direct access to the system's database and can see:
              - All projects and their details
              - Staff assignments and availability
              - Tasks and their status
              - Calendar events and schedules
              
              When asked about specific items, check the database first and provide accurate information.
              If you cannot access certain information, clearly state that.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.statusText}${errorData.error ? ` - ${errorData.error.message}` : ''}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI service');
    }

    const aiResponse = data.choices[0].message.content;

    // Try to save the message to the database if we have a valid session
    if (session?.id) {
      try {
        await addChatMessage(session.id, 'user', messages[messages.length - 1].content);
        await addChatMessage(session.id, 'assistant', aiResponse);
      } catch (error) {
        console.error('Error saving chat messages:', error);
        // Continue even if message saving fails
      }
    }

    return aiResponse;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error calling Groq API:', error.message);
      throw error;
    }
    console.error('Error calling Groq API:', error);
    throw new Error('Failed to get AI response');
  }
}

export async function processAIAction(action: AIAction) {
  try {
    switch (action.type) {
      case 'query':
        return await handleQuery(action.data);
      case 'update':
        return await handleUpdate(action.data);
      case 'create':
        return await handleCreate(action.data);
      case 'schedule':
        return await handleSchedule(action.data);
      default:
        throw new Error('Invalid action type');
    }
  } catch (error) {
    console.error('Error processing AI action:', error);
    throw error;
  }
}

async function handleQuery(data: Record<string, any>) {
  const { table, filters } = data;
  const { data: result, error } = await supabase
    .from(table)
    .select('*')
    .match(filters);

  if (error) throw error;
  return result;
}

async function handleUpdate(data: Record<string, any>) {
  const { table, id, updates } = data;
  const { data: result, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

async function handleCreate(data: Record<string, any>) {
  const { table, values } = data;
  const { data: result, error } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return result;
}

async function handleSchedule(data: Record<string, any>) {
  const { project_id, user_id, start_date, end_date } = data;
  
  // Check for scheduling conflicts
  const { data: conflicts, error: conflictError } = await supabase
    .from('project_assignments')
    .select('*')
    .eq('user_id', user_id)
    .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

  if (conflictError) throw conflictError;
  if (conflicts && conflicts.length > 0) {
    throw new Error('Scheduling conflict detected');
  }

  // Create assignment if no conflicts
  const { data: result, error } = await supabase
    .from('project_assignments')
    .insert({
      project_id,
      user_id,
      start_date,
      end_date,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
