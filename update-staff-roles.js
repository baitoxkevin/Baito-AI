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

async function updateStaffRoles() {
  console.log('Checking and updating staff roles...\n')

  for (const email of staffEmails) {
    try {
      // Update role in users table
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'staff' })
        .eq('email', email)
        .select()

      if (error) {
        console.error(`❌ Error updating ${email}:`, error.message)
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${email} to staff role`)
      } else {
        console.log(`⚠️  ${email} not found in users table`)
      }

    } catch (error) {
      console.error(`❌ Unexpected error for ${email}:`, error.message)
    }
  }

  console.log('\n✅ Staff roles updated!')
}

updateStaffRoles()
