import React, { useState, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';

interface DocumentTextPreviewProps {
  url: string;
  fileName?: string;
}

export function DocumentTextPreview({ url, fileName: _fileName }: DocumentTextPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'text/plain,text/*,*/*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        // Limit preview to first 1000 characters for performance
        setContent(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
      } catch (err: unknown) {
        console.error('Text preview error:', err);
        // Provide more specific error messages
        if (err.message.includes('Failed to fetch')) {
          setError('Network error - please check your connection');
        } else if (err.message.includes('HTTP error')) {
          setError('Unable to access this file');
        } else {
          setError('Unable to load text preview');
        }
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchContent();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-2 inline-block"
          >
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words bg-muted/50 rounded">
      {content}
    </pre>
  );
}