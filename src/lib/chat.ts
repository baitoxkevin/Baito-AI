import { supabase } from './supabase';

export type ChatSession = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  context: Record<string, any>;
  is_active: boolean;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata: Record<string, any>;
};

export async function createChatSession(userId: string, context: Record<string, any> = {}) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      context,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveChatSession(userId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
}

export async function getChatMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata: Record<string, any> = {}
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChatSession(
  sessionId: string,
  updates: Partial<Omit<ChatSession, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endChatSession(sessionId: string) {
  return updateChatSession(sessionId, { is_active: false });
}
