import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

async function setupKevinAdmin() {
  try {
    const { data: user, error: signUpError } = await supabase.auth.signUp({
      email: 'kevin@baito.events',
      password: 'BaitoTest111~~'
    });

    if (signUpError) throw signUpError;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        is_super_admin: true,
        raw_user_meta_data: {
          is_super_admin: true,
          full_name: 'Kevin',
          email_verified: true
        }
      })
      .eq('email', 'kevin@baito.events');

    if (updateError) throw updateError;

    console.log('Super admin account created successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

setupKevinAdmin();
