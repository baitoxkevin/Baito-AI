import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TyphoidCertificateViewerProps {
  candidateId: string;
}

export function TyphoidCertificateViewer({ candidateId }: TyphoidCertificateViewerProps) {
  const [certificateData, setCertificateData] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('full_name, custom_fields')
          .eq('id', candidateId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCandidateName(data.full_name);
          const typhoiCert = data.custom_fields?.typhoid_certificate;
          setCertificateData(typhoiCert || null);
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Could not retrieve the certificate data');
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchCertificate();
    }
  }, [candidateId]);

  const handleDownload = () => {
    if (!certificateData) return;

    try {
      // Create a link element for downloading
      const link = document.createElement('a');
      link.href = certificateData;
      
      // Extract file type from base64 string
      let fileType = 'png';
      if (certificateData.includes('data:image/jpeg')) {
        fileType = 'jpg';
      }
      
      // Set the file name
      const fileName = `typhoid_certificate_${candidateName.replace(/\s+/g, '_').toLowerCase()}.${fileType}`;
      link.download = fileName;
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Failed to download the certificate');
    }
  };

  // Helper function to determine if the certificate is valid
  const isCertificateValid = (): boolean => {
    return !!certificateData && certificateData.startsWith('data:image/');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading certificate...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!isCertificateValid()) {
    return (
      <Card className="w-full max-w-md mx-auto border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-600 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            No Certificate Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">No typhoid vaccination certificate has been uploaded for this candidate.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-700 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Typhoid Vaccination Certificate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden bg-gray-50">
          {certificateData && (
            <div className="w-full aspect-auto flex justify-center p-2">
              <img 
                src={certificateData} 
                alt="Typhoid Vaccination Certificate" 
                className="max-w-full object-contain max-h-80"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Certificate
        </Button>
      </CardFooter>
    </Card>
  );
}