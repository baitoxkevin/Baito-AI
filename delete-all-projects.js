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

async function deleteAllProjects() {
  console.log('🔍 Fetching all projects...\n')

  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('id, title, created_at')

  if (fetchError) {
    console.error('❌ Error fetching projects:', fetchError)
    return
  }

  if (!projects || projects.length === 0) {
    console.log('ℹ️  No projects found in the database')
    return
  }

  console.log(`Found ${projects.length} projects to delete:\n`)
  projects.slice(0, 10).forEach(project => {
    console.log(`  - ${project.title} (${new Date(project.created_at).toLocaleDateString()})`)
  })

  if (projects.length > 10) {
    console.log(`  ... and ${projects.length - 10} more`)
  }

  console.log('\n🗑️  Deleting all projects...\n')

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using always-true condition)

  if (deleteError) {
    console.error('❌ Error deleting projects:', deleteError)
    return
  }

  console.log(`✅ Successfully deleted all ${projects.length} projects!`)

  // Verify deletion
  const { data: remaining } = await supabase
    .from('projects')
    .select('id')

  console.log(`\n📊 Remaining projects: ${remaining?.length || 0}`)
}

deleteAllProjects().catch(console.error)
