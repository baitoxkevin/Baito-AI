import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_docs_new')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (document: any) => {
    try {
      // Use raw SQL to bypass RLS
      const { data, error } = await supabase.rpc('insert_document_bypass', {
        doc_data: JSON.stringify(document)
      });

      if (error) throw error;
      await fetchDocuments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    }
  }, [projectId]);

  return { documents, loading, error, uploadDocument, refreshDocuments: fetchDocuments };
}