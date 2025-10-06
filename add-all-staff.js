import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const staffCredentials = [
  { email: 'ava@baito.events', password: 'yoketing0811', full_name: 'Ava', username: 'ava' },
  { email: 'jamilatulaili@baito.events', password: 'laili1994!', full_name: 'Jamila Tulaili', username: 'jamila_tulaili' },
  { email: 'crystal@baito.events', password: 'Crys-8711', full_name: 'Crystal', username: 'crystal' },
  { email: 'winnie@baito.events', password: 'winnie1106', full_name: 'Winnie', username: 'winnie' },
  { email: 'jesley@baito.events', password: 'jiyu3299', full_name: 'Jesley', username: 'jesley' }
]

async function addAllStaff() {
  console.log('🔄 Checking and adding staff members...\n')

  for (const staff of staffCredentials) {
    try {
      // Check if user exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', staff.email)
        .single()

      if (existingUser) {
        // Update existing user to staff role
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: 'staff',
            username: staff.username,
            full_name: staff.full_name
          })
          .eq('id', existingUser.id)

        if (updateError) {
          console.error(`❌ Error updating ${staff.email}:`, updateError.message)
        } else {
          console.log(`✅ Updated ${staff.full_name} to staff role`)
        }
      } else {
        console.log(`ℹ️  ${staff.email} not in users table, checking auth...`)
        
        // Try to find in auth by listing all users (limited approach)
        // Since we can't easily query auth, we'll create via admin
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: staff.email,
          password: staff.password,
          email_confirm: true,
          user_metadata: {
            full_name: staff.full_name
          }
        })

        if (authError && !authError.message.includes('already been registered')) {
          console.error(`❌ Auth error for ${staff.email}:`, authError.message)
          continue
        }

        const userId = authData?.user?.id
        if (!userId) {
          console.log(`⚠️  Could not get user ID for ${staff.email}`)
          continue
        }

        // Add to users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: staff.email,
            full_name: staff.full_name,
            username: staff.username,
            role: 'staff'
          })

        if (insertError) {
          console.error(`❌ Error adding ${staff.email} to users:`, insertError.message)
        } else {
          console.log(`✅ Added ${staff.full_name} as new staff member`)
        }
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${staff.email}:`, err.message)
    }
  }

  console.log('\n✅ Staff setup complete!')
  
  // Show final status
  console.log('\n📋 Final staff list:')
  const { data: allStaff } = await supabase
    .from('users')
    .select('email, full_name, role')
    .eq('role', 'staff')
    .order('email')

  allStaff?.forEach(s => console.log(`   - ${s.full_name} (${s.email})`))
}

addAllStaff()
