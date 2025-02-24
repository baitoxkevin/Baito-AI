import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(
  supabaseUrl,
  serviceRole,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Authorization': `Bearer ${serviceRole}`
      }
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) throw error;
    console.log('Successfully connected to Supabase');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    process.exit(1);
  }
};

await testConnection();

async function setupKevinAdmin() {
  try {
    // Try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'kevin@baito.events',
      password: 'BaitoTest111~~'
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    // Try to sign in first to check if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'kevin@baito.events',
      password: 'BaitoTest111~~'
    });

    let user;
    if (signInError && signInError.message?.includes('Invalid login credentials')) {
      // User doesn't exist, create new one
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'kevin@baito.events',
        password: 'BaitoTest111~~',
        options: {
          data: {
            is_super_admin: true,
            full_name: 'Kevin',
            email_verified: true
          }
        }
      });
      
      if (signUpError) throw signUpError;
      user = signUpData.user;
    } else if (signInError) {
      throw signInError;
    } else {
      user = signInData.user;
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        is_super_admin: true,
        full_name: 'Kevin',
        email_verified: true
      }
    });

    if (updateError) throw updateError;

    // Update users table
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: 'kevin@baito.events',
        role: 'admin',
        is_super_admin: true,
        full_name: 'Kevin',
        contact_phone: null,
        company_name: null,
        reference_id: 'SUPER-ADMIN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (upsertError) throw upsertError;

    console.log('Super admin account created/updated successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupKevinAdmin();
