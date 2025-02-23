import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

async function setupAdmin() {
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    // Get or create user in auth.users
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserByEmail(process.env.ADMIN_EMAIL);
    
    if (getUserError) throw getUserError;
    if (!user) throw new Error('Failed to get or create user');

    // Update user metadata and role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          is_super_admin: true,
          full_name: process.env.ADMIN_NAME,
          email_verified: true
        },
        role: 'authenticated',
        email_confirm: true
      }
    );

    if (updateError) throw updateError;

    // Update users table
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        is_super_admin: true,
        raw_user_meta_data: {
          is_super_admin: true,
          full_name: process.env.ADMIN_NAME,
          email_verified: true
        }
      });

    if (upsertError) throw upsertError;

    console.log('Super admin account created/updated successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupAdmin();
