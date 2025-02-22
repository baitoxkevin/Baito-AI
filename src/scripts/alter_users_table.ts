import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function alterUsersTable() {
  try {
    // Try to select from users table to check schema
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Error checking users table:', selectError);
      return;
    }

    console.log('Current user schema:', users ? Object.keys(users[0]) : 'No users found');

    // Try to update the admin user
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'super_admin' })
      .eq('email', 'noobxkevin@gmail.com')
      .select();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return;
    }

    console.log('User updated:', updateData);

  } catch (error) {
    console.error('Error:', error);
  }
}

alterUsersTable();
