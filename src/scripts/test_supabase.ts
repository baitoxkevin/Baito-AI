import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yihtesaawdzkgxukhlfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaHRlc2Fhd2R6a2d4dWtobGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMDQ3ODUsImV4cCI6MjA1NDU4MDc4NX0.6pV98JpsEXMQyopmOTypmfmTpAg49v1EnrWNSovUOVU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    // Test connection
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .single();

    if (testError) {
      console.error('Connection test failed:', testError);
      return;
    }

    console.log('Connection successful');

    // Try to sign in with test account
    console.log('\nTesting authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'noobxkevin@gmail.com',
      password: 'qqWW010611~~'
    });

    if (authError) {
      console.error('Authentication test failed:', authError);
      return;
    }

    console.log('Authentication successful:', authData);

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (userError) {
      console.error('User data fetch failed:', userError);
      return;
    }

    console.log('\nUser data:', userData);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSupabase();
