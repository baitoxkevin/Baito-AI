import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI1MzY0OCwiZXhwIjoyMDU1ODI5NjQ4fQ.iFkUU3ouy_sEOA4uIWR3nuYJsqFz9OKcoIHgEUGg-PE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying database migration...\n');

  const migrations = [
    {
      name: 'Add skills column',
      sql: 'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT[];'
    },
    {
      name: 'Add languages column',
      sql: 'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS languages TEXT[];'
    },
    {
      name: 'Create skills GIN index',
      sql: 'CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN(skills);'
    },
    {
      name: 'Create languages GIN index',
      sql: 'CREATE INDEX IF NOT EXISTS idx_candidates_languages ON candidates USING GIN(languages);'
    },
    {
      name: 'Set default skills',
      sql: "UPDATE candidates SET skills = '{}' WHERE skills IS NULL;"
    },
    {
      name: 'Set default languages',
      sql: "UPDATE candidates SET languages = '{}' WHERE languages IS NULL;"
    }
  ];

  for (const migration of migrations) {
    try {
      console.log(`⏳ ${migration.name}...`);
      const { data, error } = await supabase.rpc('exec', { sql: migration.sql });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
        console.log(`   Trying direct query...`);

        // Try using .from() for UPDATE statements
        if (migration.sql.includes('UPDATE')) {
          console.log(`   UPDATE operations need to be run via SQL editor`);
          console.log(`   SQL: ${migration.sql}`);
          continue;
        }

        throw error;
      }

      console.log(`✅ ${migration.name} - Success\n`);
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
      console.log(`   SQL: ${migration.sql}\n`);
    }
  }

  // Verify the migration
  console.log('\n🔍 Verifying migration...');
  const { data: columns, error } = await supabase
    .from('candidates')
    .select('skills, languages')
    .limit(1);

  if (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n⚠️  Migration may need to be applied manually via Supabase SQL Editor');
    console.log('📋 Copy and run this SQL in Supabase dashboard:');
    console.log('\n' + fs.readFileSync('supabase/migrations/20251004_add_candidates_skills_languages.sql', 'utf8'));
  } else {
    console.log('✅ Migration verified successfully!');
    console.log('📊 Sample data:', columns);
  }
}

applyMigration().catch(console.error);
