// Script to test document deletion functionality
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentDeletion() {
  console.log('Testing document deletion functionality...');
  
  try {
    // 1. First, get a document ID to test with
    const { data: documents, error: fetchError } = await supabase
      .from('project_docs_new')
      .select('id, file_name, file_path')
      .limit(1);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!documents || documents.length === 0) {
      console.log('No documents found to test deletion. Please upload a document first.');
      return;
    }
    
    const documentToDelete = documents[0];
    console.log('Found document to delete:', documentToDelete);
    
    // 2. Try to delete using the RPC function first
    console.log('Attempting deletion via RPC function...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'direct_delete_document',
      { p_document_id: documentToDelete.id }
    );
    
    if (rpcError) {
      console.error('RPC deletion failed:', rpcError);
      console.log('Falling back to direct delete...');
      
      // 3. Try direct deletion as fallback
      if (documentToDelete.file_path) {
        // Delete from storage first
        const { error: storageError } = await supabase.storage
          .from('public-docs')
          .remove([documentToDelete.file_path]);
          
        if (storageError) {
          console.warn('Storage deletion error:', storageError);
        } else {
          console.log('Storage deletion successful');
        }
      }
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('project_docs_new')
        .delete()
        .eq('id', documentToDelete.id);
        
      if (deleteError) {
        throw deleteError;
      }
      
      console.log('Direct deletion successful');
    } else {
      console.log('RPC deletion successful:', rpcResult);
    }
    
    // 4. Verify document is gone
    const { data: checkDoc, error: checkError } = await supabase
      .from('project_docs_new')
      .select('id')
      .eq('id', documentToDelete.id);
      
    if (checkError) {
      console.warn('Verification check error:', checkError);
    } else if (!checkDoc || checkDoc.length === 0) {
      console.log('VERIFICATION PASSED: Document was successfully deleted!');
    } else {
      console.log('VERIFICATION FAILED: Document still exists in the database');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testDocumentDeletion();