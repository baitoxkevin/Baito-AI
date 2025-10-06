import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function deleteUsersWithCascade() {
  console.log('🔍 Finding users to delete...\n')

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

  for (const user of users) {
    console.log(`\n📋 Processing: ${user.full_name || '(no name)'} (${user.email})`)

    // Check for related records
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title')
      .eq('created_by', user.id)

    if (projects && projects.length > 0) {
      console.log(`   Found ${projects.length} projects created by this user`)

      // Delete related records first
      console.log('   🗑️  Deleting related projects...')
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('created_by', user.id)

      if (projectError) {
        console.error(`   ❌ Error deleting projects:`, projectError.message)
        continue
      }
      console.log(`   ✅ Deleted ${projects.length} projects`)
    }

    // Check for other related data
    const tables = ['user_roles', 'invitations', 'notifications']

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id)

        if (!error) {
          console.log(`   ✅ Cleaned up ${table}`)
        }
      } catch (err) {
        // Table might not exist or have different structure
      }
    }

    // Delete from auth.users
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

      if (authError) {
        console.error(`   ❌ Error deleting from auth:`, authError.message)
      } else {
        console.log(`   ✅ Deleted from auth.users`)
      }
    } catch (error) {
      console.error(`   ❌ Error deleting from auth:`, error.message)
    }

    // Delete from public.users
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (dbError) {
      console.error(`   ❌ Error deleting from users table:`, dbError.message)
    } else {
      console.log(`   ✅ Deleted from users table`)
    }
  }

  console.log('\n✨ User deletion complete!')
}

deleteUsersWithCascade().catch(console.error)
