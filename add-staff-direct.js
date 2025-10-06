import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// From screenshot - exact UUIDs
const staffMembers = [
  { id: '66e00db2-a4d5-45cb-94db-05d3a6aed59a', email: 'jamilatulaili@baito.events', full_name: 'Jamila Tulaili', username: 'jamila_tulaili' },
  { id: 'e6f7ca9e-60c4-489d-8c66-9b6a1fb9f721', email: 'laili@baito.events', full_name: 'Laili', username: 'laili' },
  { id: 'd15b2018-bee2-4eab-984d-dbd072fa2c21', email: 'jesley@baito.events', full_name: 'Jesley', username: 'jesley' }, // Fixed UUID
  { id: '3e1a3340-fb4f-4324-8ef7-a0f838c1b970', email: 'ava@baito.events', full_name: 'Ava', username: 'ava' },
  { id: 'f17aef7b-ed6d-4fc6-981c-93bf4f772e90', email: 'crystal@baito.events', full_name: 'Crystal', username: 'crystal' },
  { id: '94544b15-f72a-4f17-8ef3-72025a7df190', email: 'winnie@baito.events', full_name: 'Winnie', username: 'winnie' }
]

async function addStaff() {
  console.log('Adding staff to users table...\n')

  for (const staff of staffMembers) {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: staff.id,
          email: staff.email,
          full_name: staff.full_name,
          username: staff.username,
          role: 'staff'
        })

      if (error) {
        console.error(`❌ ${staff.email}:`, error.message)
      } else {
        console.log(`✅ ${staff.full_name} (${staff.username})`)
      }
    } catch (err) {
      console.error(`❌ ${staff.email}:`, err.message)
    }
  }

  console.log('\n✅ Done!')
}

addStaff()
