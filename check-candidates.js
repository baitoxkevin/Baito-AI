import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const staffEmails = [
  'ava@baito.events',
  'jamilatulaili@baito.events',
  'crystal@baito.events',
  'winnie@baito.events',
  'jesley@baito.events'
]

async function checkCandidates() {
  console.log('🔍 Checking candidates table...\n')

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .in('email', staffEmails)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (data.length === 0) {
    console.log('✅ No candidates found with these emails')
    return
  }

  console.log(`Found ${data.length} candidates:`)
  data.forEach(c => {
    console.log(`  - ${c.name} (${c.email}) - ID: ${c.id}`)
  })

  console.log('\n🗑️  Deleting from candidates table...')
  
  for (const email of staffEmails) {
    const { error: deleteError } = await supabase
      .from('candidates')
      .delete()
      .eq('email', email)

    if (deleteError) {
      console.error(`❌ Error deleting ${email}:`, deleteError.message)
    } else {
      console.log(`✅ Deleted ${email}`)
    }
  }

  console.log('\n✅ Cleanup complete!')
}

checkCandidates()
