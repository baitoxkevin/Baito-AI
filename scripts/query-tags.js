/**
 * Query existing skills and tags from the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryTags() {
  console.log('Querying database for skills and experience tags...\n');

  // Query using RPC or direct query
  const { data, error } = await supabase.rpc('get_all_skills_and_tags');

  if (error) {
    // If RPC doesn't exist, try direct query
    console.log('RPC not available, using direct query...\n');

    const { data: candidates, error: queryError } = await supabase
      .from('candidates')
      .select('full_name, skills, experience_tags')
      .limit(100);

    if (queryError) {
      console.error('Error:', queryError);
      return;
    }

    // Collect unique skills and tags
    const skills = new Set();
    const tags = new Set();

    candidates.forEach(c => {
      if (c.skills) c.skills.forEach(s => skills.add(s));
      if (c.experience_tags) c.experience_tags.forEach(t => tags.add(t));
    });

    console.log('=== CURRENT SKILLS IN DATABASE ===');
    console.log(`Total unique skills: ${skills.size}\n`);
    if (skills.size > 0) {
      [...skills].sort().forEach(s => console.log(`  • ${s}`));
    } else {
      console.log('  No skills found');
    }

    console.log('\n=== CURRENT EXPERIENCE TAGS IN DATABASE ===');
    console.log(`Total unique tags: ${tags.size}\n`);
    if (tags.size > 0) {
      [...tags].sort().forEach(t => console.log(`  • ${t}`));
    } else {
      console.log('  No experience tags yet (will be populated when candidates are imported with AI)');
    }

    console.log('\n=== SAMPLE CANDIDATES ===');
    candidates.slice(0, 3).forEach(c => {
      console.log(`\n${c.full_name}:`);
      console.log(`  Skills: ${c.skills?.join(', ') || 'None'}`);
      console.log(`  Tags: ${c.experience_tags?.join(', ') || 'None'}`);
    });
  }
}

queryTags();
