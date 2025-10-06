import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const staffMembers = [
  { email: 'ava@baito.events', password: 'yoketing0811', full_name: 'Ava' },
  { email: 'jamilatulaili@baito.events', password: 'laili1994!', full_name: 'Jamila Tulaili' },
  { email: 'crystal@baito.events', password: 'Crys-8711', full_name: 'Crystal' },
  { email: 'winnie@baito.events', password: 'winnie1106', full_name: 'Winnie' },
  { email: 'jesley@baito.events', password: 'jiyu3299', full_name: 'Jesley' }
]

async function createStaff() {
  console.log('Creating staff members...\n')

  for (const staff of staffMembers) {
    try {
      // Try to get existing user first
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === staff.email)

      let userId

      if (existingUser) {
        console.log(`📧 User exists: ${staff.email}`)
        userId = existingUser.id
        
        // Update password
        await supabase.auth.admin.updateUserById(userId, {
          password: staff.password,
          user_metadata: { full_name: staff.full_name }
        })
        console.log(`🔑 Updated password for: ${staff.email}`)
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: staff.email,
          password: staff.password,
          email_confirm: true,
          user_metadata: { full_name: staff.full_name }
        })

        if (authError) {
          console.error(`❌ Auth error for ${staff.email}:`, authError.message)
          continue
        }

        userId = authData.user.id
        console.log(`✅ Created auth user: ${staff.email}`)
      }

      // Upsert to users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: staff.email,
          full_name: staff.full_name,
          role: 'staff',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (userError) {
        console.error(`❌ Database error for ${staff.email}:`, userError.message)
      } else {
        console.log(`✅ Added to users table: ${staff.full_name}\n`)
      }

    } catch (error) {
      console.error(`❌ Error processing ${staff.email}:`, error.message, '\n')
    }
  }

  console.log('✅ All staff members processed!')
}

createStaff()
