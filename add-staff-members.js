import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const staffMembers = [
  {
    email: 'ava@baito.events',
    password: 'yoketing0811',
    full_name: 'Ava'
  },
  {
    email: 'jamilatulaili@baito.events',
    password: 'laili1994!',
    full_name: 'Jamila Tulaili'
  },
  {
    email: 'crystal@baito.events',
    password: 'Crys-8711',
    full_name: 'Crystal'
  },
  {
    email: 'winnie@baito.events',
    password: 'winnie1106',
    full_name: 'Winnie'
  },
  {
    email: 'jesley@baito.events',
    password: 'jiyu3299',
    full_name: 'Jesley'
  }
]

async function addStaffMembers() {
  console.log('Adding staff members...\n')

  for (const staff of staffMembers) {
    try {
      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: staff.email,
        password: staff.password,
        email_confirm: true,
        user_metadata: {
          full_name: staff.full_name
        }
      })

      if (authError) {
        console.error(`❌ Error creating ${staff.email}:`, authError.message)
        continue
      }

      console.log(`✅ Created auth user: ${staff.email} (${authData.user.id})`)

      // Add to users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: staff.email,
          full_name: staff.full_name,
          role: 'staff'
        })

      if (userError) {
        console.error(`❌ Error adding ${staff.email} to users table:`, userError.message)
      } else {
        console.log(`✅ Added to users table: ${staff.full_name}\n`)
      }

    } catch (error) {
      console.error(`❌ Unexpected error for ${staff.email}:`, error.message)
    }
  }

  console.log('\n✅ All staff members processed!')
}

addStaffMembers()
