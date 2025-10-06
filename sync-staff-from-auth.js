import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const staffEmails = [
  'ava@baito.events',
  'jamilatulaili@baito.events',
  'crystal@baito.events',
  'winnie@baito.events',
  'jesley@baito.events',
  'laili@baito.events'
]

async function syncStaffFromAuth() {
  console.log('Getting users from Auth...\n')

  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers()
  const staffUsers = authData?.users?.filter(u => staffEmails.includes(u.email))

  console.log(`Found ${staffUsers?.length} staff in auth\n`)

  for (const user of staffUsers || []) {
    try {
      const displayName = user.user_metadata?.full_name || user.email.split('@')[0]
      const username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30)

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: displayName,
          username: username,
          role: 'staff',
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error(`❌ ${user.email}:`, error.message)
      } else {
        console.log(`✅ ${displayName} (${user.email}) - username: ${username}`)
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err.message)
    }
  }

  console.log('\n✅ Staff sync complete!')
}

syncStaffFromAuth()
