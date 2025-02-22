import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTestAccount() {
  try {
    // Update user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        is_super_admin: true
      })
      .eq('email', 'test@baitoai.com')
      .select()
      .single();

    if (userError) {
      console.error('Error updating user record:', userError);
      return;
    }

    console.log('User record updated:', userData);

    // Try to sign in with the account
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@baitoai.com',
      password: 'BaitoTest123!'
    });

    if (authError) {
      console.error('Error signing in:', authError);
      return;
    }

    console.log('Successfully signed in:', authData);
  } catch (error) {
    console.error('Error:', error);
  }
}

updateTestAccount();
