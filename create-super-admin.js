import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Check if we have the service key
if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY is required but not found in .env');
  console.log('\nTo create a super admin, you need to:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Copy the "service_role" key (NOT the anon key)');
  console.log('4. Add it to your .env file as SUPABASE_SERVICE_KEY=your_key_here');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: node create-super-admin.js <email> <password>');
    console.log('Example: node create-super-admin.js admin@example.com SecurePassword123!');
    process.exit(1);
  }

  console.log(`\n🔧 Creating super admin account for: ${email}`);

  try {
    // Step 1: Create auth user
    console.log('1️⃣ Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm the email
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('⚠️  Auth user already exists, continuing...');
        
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === email);
        if (!existingUser) throw new Error('Could not find existing user');
        
        authData.user = existingUser;
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created');
    }

    // Step 2: Create or update user profile
    console.log('2️⃣ Creating user profile...');
    const userId = authData.user.id;
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    const avatarSeed = Math.random().toString(36).substring(2, 12);

    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        username: username,
        full_name: 'Super Admin',
        role: 'admin',
        is_super_admin: true,
        avatar_seed: avatarSeed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) throw profileError;
    console.log('✅ User profile created with super admin privileges');

    // Step 3: Verify the user was created
    console.log('3️⃣ Verifying user...');
    const { data: userData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (verifyError) throw verifyError;

    console.log('\n✨ Super admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Username:', userData.username);
    console.log('🛡️  Super Admin:', userData.is_super_admin);
    console.log('\nYou can now login with these credentials.');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    process.exit(1);
  }
}

// Run the function
createSuperAdmin();