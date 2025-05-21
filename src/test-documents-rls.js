// Direct test to check RLS status
import { supabase } from './lib/supabase.js';

async function testDocumentsRLS() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    // Try a simple insert
    const testData = {
      project_id: '0df389cc-e9a7-4b1e-a314-fc1b57706826',
      file_name: 'test.txt',
      file_type: 'text/plain',
      uploaded_by: user?.id || null
    };
    
    console.log('Attempting insert with:', testData);
    
    const { data, error } = await supabase
      .from('project_documents')
      .insert(testData)
      .select();
      
    console.log('Insert result:', data, 'Error:', error);
    
    // Check RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_rls_status', { table_name: 'project_documents' });
      
    console.log('RLS status:', rlsStatus, 'Error:', rlsError);
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testDocumentsRLS();