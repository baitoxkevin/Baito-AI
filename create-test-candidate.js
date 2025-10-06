import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestCandidate() {
  console.log('🔍 Creating test candidate...\n')

  // Generate a secure token
  const secureToken = crypto.randomBytes(32).toString('hex')

  const testCandidate = {
    full_name: 'Test Candidate',
    email: 'testcandidate@example.com',
    phone_number: '+60123456789',
    status: 'pending',
    ic_number: '900101011234',
    date_of_birth: '1990-01-01',
    gender: 'male',
    nationality: 'Malaysian',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_number: '+60129999999',
    emergency_contact_relationship: 'parent',
    bank_name: 'Maybank',
    bank_account_number: '1234567890',
    bank_account_name: 'Test Candidate',
    highest_education: 'degree',
    has_vehicle: false,
    race: 'chinese',
    address_mailing: 'Test Address',
    shirt_size: 'M'
  }

  try {
    // Check if test candidate already exists
    const { data: existing } = await supabase
      .from('candidates')
      .select('id, secure_token')
      .eq('email', testCandidate.email)
      .maybeSingle()

    if (existing) {
      console.log('✅ Test candidate already exists!')
      console.log(`   ID: ${existing.id}`)
      console.log(`\n🔗 Test URL:\n   http://localhost:5173/candidate-update-mobile/${existing.id}\n`)
      return
    }

    // Create new candidate
    const { data: newCandidate, error } = await supabase
      .from('candidates')
      .insert([testCandidate])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating candidate:', error)
      return
    }

    console.log('✅ Test candidate created successfully!')
    console.log(`   ID: ${newCandidate.id}`)
    console.log(`   Email: ${newCandidate.email}`)
    console.log(`\n🔗 Test URL:\n   http://localhost:5173/candidate-update-mobile/${newCandidate.id}\n`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTestCandidate().catch(console.error)
