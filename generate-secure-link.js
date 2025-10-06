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

async function generateSecureLink() {
  const candidateId = '5c9fac76-3bfe-4b3f-939c-c5bedf82719e'

  // Generate secure token
  const secureToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  console.log('🔐 Generating secure link for test candidate...\n')

  // Create an invitation/access record
  const { data: invitation, error: inviteError } = await supabase
    .from('candidate_invitations')
    .insert([{
      candidate_id: candidateId,
      secure_token: secureToken,
      expires_at: expiresAt.toISOString(),
      is_used: false
    }])
    .select()
    .single()

  if (inviteError) {
    console.log('⚠️  Could not create invitation record:', inviteError.message)
    console.log('   This table might not exist. Trying alternative approach...\n')

    // Alternative: Update candidate with secure token directly
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        custom_fields: {
          secure_token: secureToken,
          token_expires_at: expiresAt.toISOString()
        }
      })
      .eq('id', candidateId)

    if (updateError) {
      console.error('❌ Error updating candidate:', updateError)
      return
    }
  }

  const testUrl = `http://localhost:5173/candidate-update-mobile/${candidateId}?secure_token=${secureToken}`

  console.log('✅ Secure link generated successfully!')
  console.log(`\n🔗 Test URL:\n   ${testUrl}\n`)
  console.log(`📅 Expires: ${expiresAt.toLocaleString()}\n`)
  console.log('Copy this URL to test the candidate fill-up flow.')
}

generateSecureLink().catch(console.error)
