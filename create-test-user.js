import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTestUser() {
  console.log('🔧 Creating test user for authentication testing...\n');

  // Get environment variables
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    console.error('\nPlease ensure these are set in your .env file');
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Create the test user
    console.log('📋 Creating user admin@example.com...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'admin123!', // Using a stronger password
      email_confirm: true // Auto-confirm the email
    });

    if (authError) {
      if (authError.message?.includes('already registered')) {
        console.log('⚠️ User already exists, updating password...');

        // Try to update the existing user's password
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          authData?.user?.id || '',
          { password: 'admin123!' }
        );

        if (updateError) {
          console.error('❌ Failed to update password:', updateError.message);
          throw updateError;
        }
        console.log('✅ Password updated successfully');
      } else {
        console.error('❌ Failed to create user:', authError.message);
        throw authError;
      }
    } else {
      console.log('✅ User created successfully');
      console.log('   ID:', authData.user?.id);
      console.log('   Email:', authData.user?.email);
    }

    // Step 2: Create user profile in users table
    const userId = authData?.user?.id;
    if (userId) {
      console.log('\n📋 Creating user profile...');

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: 'admin@example.com',
            username: 'admin',
            full_name: 'Test Admin',
            role: 'super_admin',
            is_super_admin: true,
            avatar_seed: Math.random().toString(36).substring(2, 12),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('⚠️ Failed to create profile:', profileError.message);
        } else {
          console.log('✅ User profile created');
        }
      } else {
        console.log('⚠️ Profile already exists');

        // Update to ensure it's a super admin
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: 'super_admin',
            is_super_admin: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('⚠️ Failed to update profile:', updateError.message);
        } else {
          console.log('✅ Profile updated to super_admin');
        }
      }
    }

    // Step 3: Test the login
    console.log('\n📋 Testing login with created user...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123!'
    });

    if (loginError) {
      console.error('❌ Login test failed:', loginError.message);
    } else {
      console.log('✅ Login test successful!');
      console.log('   Session exists:', !!loginData.session);
      console.log('   Access token exists:', !!loginData.session?.access_token);

      // Sign out
      await supabase.auth.signOut();
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Test user setup complete!');
    console.log('═'.repeat(60));
    console.log('\nYou can now login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123!');
    console.log('\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
createTestUser()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });