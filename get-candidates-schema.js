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

async function getSchema() {
  // Get a sample candidate to see the structure
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Candidate table columns:')
    console.log(Object.keys(data[0]).join(', '))
  } else {
    console.log('No candidates found in database')
  }
}

getSchema().catch(console.error)
