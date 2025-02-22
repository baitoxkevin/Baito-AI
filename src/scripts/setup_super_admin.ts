import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSuperAdmin() {
  try {
    // Reset password for test account
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
      'test@baitoai.com'
    );

    if (resetError) {
      console.error('Error resetting password:', resetError);
      return;
    }

    console.log('Password reset email sent');

    // Update user record
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        full_name: 'Test Super Admin'
      })
      .eq('email', 'test@baitoai.com')
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

setupSuperAdmin();
