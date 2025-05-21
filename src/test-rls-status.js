// Test script to check RLS status on all tables
async function checkRLSStatus() {
  const supabase = window.supabase;
  
  try {
    // Check tables with disabled RLS
    const query = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE rowsecurity = false
      ORDER BY schemaname, tablename
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { query_text: query });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Tables with RLS DISABLED:');
    console.table(data);
    
  } catch (err) {
    console.error('Failed to check RLS status:', err);
  }
}

// Run this in browser console:
// await checkRLSStatus()