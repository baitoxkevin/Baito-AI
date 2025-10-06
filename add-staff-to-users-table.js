import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Based on the screenshot UIDs
const staffMembers = [
  { id: '66e00db2-a4d5-45cb-94db-05d3a6aed59a', email: 'jamilatulaili@baito.events', full_name: 'Jamila Tulaili' },
  { id: 'e6f7ca9e-60c4-489d-8c66-9b6a1fb9f721', email: 'laili@baito.events', full_name: 'Laili' },
  { id: 'd15b2018-bee2-4eab-984d-dbd072fa2c1', email: 'jesley@baito.events', full_name: 'Jesley' },
  { id: '3e1a3340-fb4f-4324-8ef7-a0f838c1b970', email: 'ava@baito.events', full_name: 'Ava' },
  { id: 'f17aef7b-ed6d-4fc6-981c-93bf4f772e90', email: 'crystal@baito.events', full_name: 'Crystal' },
  { id: '94544b15-f72a-4f17-8ef3-72025a7df190', email: 'winnie@baito.events', full_name: 'Winnie' }
]

async function addStaffToUsersTable() {
  console.log('Adding staff to users table...\n')

  for (const staff of staffMembers) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: staff.id,
          email: staff.email,
          full_name: staff.full_name,
          role: 'staff',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()

      if (error) {
        console.error(`❌ Error for ${staff.email}:`, error.message)
      } else {
        console.log(`✅ Added ${staff.full_name} (${staff.email}) as staff`)
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${staff.email}:`, err.message)
    }
  }

  console.log('\n✅ All staff members added to users table!')
}

addStaffToUsersTable()
