import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugValidation() {
  const candidateId = '371ae03c-0afe-4ed6-a71e-48b5a61dfcf5'
  const secureToken = 'c6291a7d387d5a176c53e79c7dbcf91b64050857e73765e138d9de2c326e3bb4'

  console.log('🔍 Debugging Token Validation\n')

  // 1. Check if candidate exists
  console.log('1. Checking candidate exists...')
  const { data: candidate, error: fetchError } = await supabase
    .from('candidates')
    .select('id, full_name, ic_number, custom_fields')
    .eq('id', candidateId)
    .single()

  if (fetchError) {
    console.log('   ❌ Error:', fetchError.message)
    return
  }

  console.log('   ✓ Candidate found:', candidate.full_name)
  console.log('   IC:', candidate.ic_number)
  console.log('   Custom fields:', JSON.stringify(candidate.custom_fields, null, 2))

  // 2. Test RPC function
  console.log('\n2. Testing RPC function...')
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('validate_candidate_token_secure', {
      p_token: secureToken,
      p_candidate_id: candidateId,
      p_ic_number: '',
      p_ip_address: null
    })

  if (rpcError) {
    console.log('   ❌ RPC Error:', rpcError.message)
    console.log('   Code:', rpcError.code)
    console.log('   Details:', rpcError.details)
  } else {
    console.log('   ✓ RPC Response:', JSON.stringify(rpcData, null, 2))
  }

  // 3. Try with IC number
  console.log('\n3. Testing with IC number...')
  const { data: rpcDataWithIC, error: rpcErrorWithIC } = await supabase
    .rpc('validate_candidate_token_secure', {
      p_token: secureToken,
      p_candidate_id: candidateId,
      p_ic_number: candidate.ic_number,
      p_ip_address: null
    })

  if (rpcErrorWithIC) {
    console.log('   ❌ RPC Error:', rpcErrorWithIC.message)
  } else {
    console.log('   ✓ RPC Response:', JSON.stringify(rpcDataWithIC, null, 2))
  }
}

debugValidation().catch(console.error)
