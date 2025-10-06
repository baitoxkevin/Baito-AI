import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkChatTables() {
  console.log('🔍 Checking AI chat tables...\n')

  // Check ai_conversations table
  const { data: convData, error: convError } = await supabase
    .from('ai_conversations')
    .select('id')
    .limit(1)

  if (convError) {
    console.error('❌ ai_conversations table error:', convError.message)
    console.log('   → Table might not exist or have RLS issues\n')
  } else {
    console.log('✅ ai_conversations table exists\n')
  }

  // Check ai_messages table
  const { data: msgData, error: msgError } = await supabase
    .from('ai_messages')
    .select('id')
    .limit(1)

  if (msgError) {
    console.error('❌ ai_messages table error:', msgError.message)
    console.log('   → Table might not exist or have RLS issues\n')
  } else {
    console.log('✅ ai_messages table exists\n')
  }

  // Check Edge Function
  console.log('🔍 Testing Edge Function...\n')
  
  const { data: funcData, error: funcError } = await supabase.functions.invoke('ai-chat', {
    body: { message: 'test' }
  })

  if (funcError) {
    console.error('❌ Edge Function error:', funcError.message)
    console.log('   → Check if environment variables are set in Supabase\n')
  } else {
    console.log('✅ Edge Function responded\n')
  }
}

checkChatTables()
