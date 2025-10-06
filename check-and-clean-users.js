import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const staffEmails = [
  'ava@baito.events',
  'jamilatulaili@baito.events',
  'crystal@baito.events',
  'winnie@baito.events',
  'jesley@baito.events'
]

async function checkAndCleanUsers() {
  console.log('🔍 Checking users table...\n')

  // Check what's in the users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('email', staffEmails)

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message)
    return
  }

  console.log(`Found ${usersData.length} users in users table:`)
  usersData.forEach(u => {
    console.log(`  - ${u.email} (${u.id}) - Role: ${u.role}`)
  })

  // Check auth users
  console.log('\n🔍 Checking auth.users...\n')
  const { data: authData } = await supabase.auth.admin.listUsers()
  const staffAuthUsers = authData?.users?.filter(u => staffEmails.includes(u.email))

  console.log(`Found ${staffAuthUsers?.length || 0} users in auth:`)
  staffAuthUsers?.forEach(u => {
    console.log(`  - ${u.email} (${u.id})`)
  })

  // Offer to delete
  console.log('\n🗑️  Deleting users from users table...')
  
  for (const email of staffEmails) {
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)

    if (deleteError) {
      console.error(`❌ Error deleting ${email} from users table:`, deleteError.message)
    } else {
      console.log(`✅ Deleted ${email} from users table`)
    }
  }

  console.log('\n🗑️  Deleting users from auth...')
  
  for (const user of staffAuthUsers || []) {
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (authDeleteError) {
      console.error(`❌ Error deleting ${user.email} from auth:`, authDeleteError.message)
    } else {
      console.log(`✅ Deleted ${user.email} from auth`)
    }
  }

  console.log('\n✅ Cleanup complete! Now you can add them fresh.')
}

checkAndCleanUsers()
