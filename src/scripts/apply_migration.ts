import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Add is_super_admin column
    const { data: alterData, error: alterError } = await supabase
      .rpc('alter_users_table', {
        sql_command: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;'
      });

    if (alterError) {
      console.error('Error adding column:', alterError);
      return;
    }

    console.log('Column added successfully');

    // Update test account
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        is_super_admin: true
      })
      .eq('email', 'test@baitoai.com')
      .select();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return;
    }

    console.log('User updated successfully:', updateData);

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
