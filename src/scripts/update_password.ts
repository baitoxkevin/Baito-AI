import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePassword() {
  try {
    // First sign up the user again
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@baitoai.com',
      password: 'BaitoTest123!'
    });

    if (signUpError) {
      console.error('Error signing up:', signUpError);
    } else {
      console.log('Sign up successful:', signUpData);
    }

    // Try to sign in with new credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@baitoai.com',
      password: 'BaitoTest123!'
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
    } else {
      console.log('Sign in successful:', signInData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

updatePassword();
