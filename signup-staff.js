import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY'

const staffMembers = [
  { email: 'ava@baito.events', password: 'yoketing0811', full_name: 'Ava' },
  { email: 'crystal@baito.events', password: 'Crys-8711', full_name: 'Crystal' },
  { email: 'jesley@baito.events', password: 'jiyu3299', full_name: 'Jesley' }
]

async function signupStaff() {
  console.log('Signing up staff members...\n')

  for (const staff of staffMembers) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: staff.email,
        password: staff.password,
        options: {
          data: {
            full_name: staff.full_name
          }
        }
      })

      if (error) {
        console.log(`⚠️  ${staff.email}: ${error.message}`)
      } else {
        console.log(`✅ Signed up: ${staff.full_name} (${staff.email})`)
      }
    } catch (err) {
      console.error(`❌ Error: ${staff.email}:`, err.message)
    }
  }

  console.log('\n✅ Done! Users should verify their email to complete signup.')
  console.log('Note: jamilatulaili@ and winnie@ already exist')
}

signupStaff()
