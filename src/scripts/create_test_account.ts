import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAccount() {
  try {
    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@baitoai.com',
      password: 'BaitoTest123!'
    });

    if (signUpError) {
      console.error('Error creating auth user:', signUpError);
      return;
    }

    console.log('Auth user created:', authData);

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user?.id,
          email: 'test@baitoai.com',
          full_name: 'Test Super Admin',
          role: 'admin',
          is_super_admin: true
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      return;
    }

    console.log('User record created:', userData);
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAccount();
