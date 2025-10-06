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

const emailsToCheck = [
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

async function verifyDeletion() {
  console.log('🔍 Checking if users still exist...\n')

  const { data: remainingUsers, error } = await supabase
    .from('users')
    .select('id, email, full_name')
    .in('email', emailsToCheck)

  if (error) {
    console.error('❌ Error checking users:', error)
    return
  }

  if (!remainingUsers || remainingUsers.length === 0) {
    console.log('✅ All specified users have been successfully deleted!')
  } else {
    console.log(`⚠️  ${remainingUsers.length} users still exist:\n`)
    remainingUsers.forEach(user => {
      console.log(`  - ${user.full_name || '(no name)'} (${user.email})`)
    })
  }
}

verifyDeletion().catch(console.error)
