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

async function checkFunction() {
  console.log('🔍 Checking validation function implementation\n')

  // Get function definition
  const { data, error } = await supabase
    .from('pg_proc')
    .select('*')
    .eq('proname', 'validate_candidate_token_secure')

  if (error) {
    console.log('Could not query pg_proc directly')
  }

  // Let's check what the function returns with debug
  const candidateId = '371ae03c-0afe-4ed6-a71e-48b5a61dfcf5'
  const token = 'c6291a7d387d5a176c53e79c7dbcf91b64050857e73765e138d9de2c326e3bb4'

  // Check the actual candidate record
  const { data: candidate } = await supabase
    .from('candidates')
    .select('custom_fields')
    .eq('id', candidateId)
    .single()

  console.log('Candidate custom_fields:')
  console.log(JSON.stringify(candidate.custom_fields, null, 2))

  console.log('\nToken being validated:', token)
  console.log('Token in DB:', candidate.custom_fields?.secure_token)
  console.log('Match:', token === candidate.custom_fields?.secure_token)

  // The function might be checking a different structure
  // Let's look at the actual error message returned
  const { data: result } = await supabase.rpc('validate_candidate_token_secure', {
    p_token: token,
    p_candidate_id: candidateId,
    p_ic_number: '',
    p_ip_address: null
  })

  console.log('\nFunction result:')
  console.log(JSON.stringify(result, null, 2))
}

checkFunction().catch(console.error)
