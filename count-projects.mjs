import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countProjects() {
  try {
    // Count all projects
    const { count: totalCount, error: totalError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Count active projects
    const { count: activeCount, error: activeError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (activeError) throw activeError;

    console.log('=== Project Count ===');
    console.log(`Total Projects: ${totalCount}`);
    console.log(`Active Projects: ${activeCount}`);
    console.log(`Deleted Projects: ${totalCount - activeCount}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

countProjects();