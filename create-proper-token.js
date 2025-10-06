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

async function createProperToken() {
  const candidateId = '371ae03c-0afe-4ed6-a71e-48b5a61dfcf5'
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  console.log('🔐 Creating verification token in proper table...\n')

  // Create token in candidate_verification_tokens table
  const { data, error } = await supabase
    .from('candidate_verification_tokens')
    .insert([{
      candidate_id: candidateId,
      token: token,
      expires_at: expiresAt.toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating token:', error.message)
    console.error('   Code:', error.code)
    console.error('   Details:', error.details)
    return
  }

  console.log('✅ Token created successfully!')
  console.log(`   Token ID: ${data.id}`)
  console.log(`   Expires: ${expiresAt.toLocaleString()}`)

  const testUrl = `http://localhost:5173/candidate-update-mobile/${candidateId}?secure_token=${token}`
  console.log(`\n🔗 Test URL:\n   ${testUrl}\n`)

  // Test validation
  console.log('Testing token validation...')
  const { data: validation, error: valError } = await supabase
    .rpc('validate_candidate_token_secure', {
      p_token: token,
      p_candidate_id: candidateId,
      p_ic_number: '',
      p_ip_address: null
    })

  if (valError) {
    console.log('❌ Validation error:', valError.message)
  } else {
    console.log('✓ Validation result:', JSON.stringify(validation, null, 2))
  }
}

createProperToken().catch(console.error)
