import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAccess() {
  try {
    // Try to execute raw SQL
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@baitoai.com')
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Current user data:', data);

    // Try to update the user
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'test@baitoai.com')
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }

    console.log('Update successful:', updateData);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminAccess();
