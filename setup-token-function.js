import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupFunction() {
  console.log('🔧 Setting up token validation function...\n')

  const sql = fs.readFileSync('./create-token-validation-function.sql', 'utf8')

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
    // If exec_sql doesn't exist, try direct execution
    return await supabase.from('_sql').insert({ query: sql })
  }).catch(async () => {
    // Last resort: use raw SQL execution
    const { data, error } = await supabase.rpc('query', { query_text: sql })
    return { data, error }
  })

  if (error) {
    console.log('⚠️  Standard methods failed, trying direct execution...')
    // Execute via psql if available
    console.log('Run this SQL manually in Supabase SQL Editor:\n')
    console.log(sql)
    return
  }

  console.log('✅ Function created successfully!')
}

setupFunction().catch(console.error)
