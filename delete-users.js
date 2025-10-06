import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const emailsToDelete = [
  'admin@example.com',
  'jamilatulaili@baito.events',
  'admin@baito.app',
  'jasmine@baito.events',
  'jesley@baito.events',
  'laili@baito.events',
  'xinyi@baito.events',
  'ava@baito.events',
  'crystal@baito.events',
  'winnie@baito.events'
]

async function deleteUsers() {
  console.log('🔍 Finding users to delete...\n')

  // First, get the user IDs
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('email', emailsToDelete)

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError)
    return
  }

  if (!users || users.length === 0) {
    console.log('ℹ️  No users found with the specified emails')
    return
  }

  console.log(`Found ${users.length} users to delete:\n`)
  users.forEach(user => {
    console.log(`  - ${user.full_name || '(no name)'} (${user.email})`)
  })

  console.log('\n🗑️  Deleting users...\n')

  // Delete from auth.users (this will cascade to other tables if foreign keys are set up)
  for (const user of users) {
    try {
      // Delete from auth.users using admin API
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        console.error(`❌ Error deleting ${user.email} from auth:`, authError.message)
      } else {
        console.log(`✅ Deleted ${user.email} from auth.users`)
      }

      // Also delete from public.users table
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (dbError) {
        console.error(`❌ Error deleting ${user.email} from users table:`, dbError.message)
      } else {
        console.log(`✅ Deleted ${user.email} from users table`)
      }

    } catch (error) {
      console.error(`❌ Error deleting ${user.email}:`, error.message)
    }
  }

  console.log('\n✨ User deletion complete!')
}

deleteUsers().catch(console.error)
