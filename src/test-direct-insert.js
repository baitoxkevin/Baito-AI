async function testDirectInsert() {
  const { data, error } = await window.supabase
    .from('project_documents_simple')
    .insert({
      project_id: '0df389cc-e9a7-4b1e-a314-fc1b57706826',
      file_name: 'test_from_console.pdf',
      file_type: 'application/pdf',
      uploaded_by: null
    })
    .select();
    
  console.log('Direct insert result:', data, 'Error:', error);
}

// Run in browser console:
// await testDirectInsert()