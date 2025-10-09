/**
 * Check what experience tags exist in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aoiwrdzlichescqgnohi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExperienceTags() {
  console.log('Checking experience tags in database...\n');

  // First, check if the column exists
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, full_name, skills')
    .limit(100);

  if (error) {
    console.error('Error querying database:', error);
    return;
  }

  console.log(`Found ${candidates.length} candidates\n`);

  // Collect all unique tags
  const allTags = new Set();
  const allSkills = new Set();

  candidates.forEach(candidate => {
    // Check skills
    if (candidate.skills && Array.isArray(candidate.skills)) {
      candidate.skills.forEach(skill => allSkills.add(skill));
    }
  });

  console.log('=== NOTE ===');
  console.log('The experience_tags column does not exist yet.');
  console.log('You need to apply the migration: supabase/migrations/20251009_add_experience_tags.sql\n');

  console.log('\n=== SKILLS (for reference) ===');
  if (allSkills.size === 0) {
    console.log('No skills found.');
  } else {
    console.log(`Found ${allSkills.size} unique skills:\n`);
    [...allSkills].sort().forEach(skill => console.log(`  - ${skill}`));
  }

  console.log('\n=== SAMPLE CANDIDATES ===');
  candidates.slice(0, 5).forEach(candidate => {
    console.log(`\n${candidate.full_name}:`);
    console.log(`  Skills: ${candidate.skills?.join(', ') || 'None'}`);
  });
}

checkExperienceTags();
