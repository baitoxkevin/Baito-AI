#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  console.log('🔍 Checking existing baito.events users...\n');

  // List all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message);
    return;
  }

  const baitoUsers = authUsers.users.filter(u => u.email?.includes('@baito.events'));

  console.log(`Found ${baitoUsers.length} @baito.events auth users:\n`);

  baitoUsers.forEach(user => {
    console.log(`✅ ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   Confirmed: ${user.confirmed_at ? 'Yes' : 'No'}`);
    console.log('');
  });

  // Check profiles
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('*')
    .like('email', '%@baito.events%');

  if (!profileError) {
    console.log(`\nFound ${profiles?.length || 0} @baito.events profiles in users table:\n`);
    profiles?.forEach(p => {
      console.log(`📋 ${p.email} - Role: ${p.role}`);
    });
  }
}

checkUsers().catch(console.error);
