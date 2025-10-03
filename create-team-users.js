#!/usr/bin/env node

/**
 * Create Baito Team User Accounts
 *
 * This script creates user accounts in Supabase Auth
 * Run with: node create-team-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    email: 'jesley@baito.events',
    password: 'jiyu3299',
    name: 'Jesley',
    role: 'staff' // Valid roles: super_admin, admin, manager, staff, viewer
  },
  {
    email: 'winnie@baito.events',
    password: 'winnie1106',
    name: 'Winnie',
    role: 'staff'
  },
  {
    email: 'ava@baito.events',
    password: 'yoketing0811',
    name: 'Ava',
    role: 'staff'
  },
  {
    email: 'jamilatulaili@baito.events',
    password: 'laili1994!',
    name: 'Jamila Tulaili',
    role: 'staff'
  },
  {
    email: 'crystal@baito.events',
    password: 'Crys-8711',
    name: 'Crystal',
    role: 'staff'
  }
];

async function createUser(userData) {
  try {
    // Try to create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.name,
        role: userData.role
      }
    });

    if (authError) {
      console.error(`❌ Failed to create auth user ${userData.email}:`, authError.message);
      return null;
    }

    console.log(`✅ Created auth user: ${userData.email}`);

    // Create user profile in public.users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        auth_id: authData.user.id,
        email: userData.email,
        full_name: userData.name,
        role: userData.role,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (profileError) {
      console.error(`⚠️  Warning: Could not create profile for ${userData.email}:`, profileError.message);
    } else {
      console.log(`✅ Created user profile: ${userData.email}`);
    }

    return authData.user;
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating Baito Team User Accounts\n');
  console.log('='.repeat(50));
  console.log('');

  for (const userData of users) {
    await createUser(userData);
    console.log('');
  }

  console.log('='.repeat(50));
  console.log('\n✨ User creation process completed!');
  console.log('\n📋 Created accounts:');
  users.forEach(u => {
    console.log(`   - ${u.email} (${u.name})`);
  });
  console.log('\n⚠️  Note: If you see auth errors, you may need to use the Supabase service role key');
  console.log('   Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.log('   Get it from: https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/settings/api');
}

main().catch(console.error);
