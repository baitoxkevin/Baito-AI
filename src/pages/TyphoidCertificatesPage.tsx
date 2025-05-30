import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TyphoidCertificateViewer } from '@/components/TyphoidCertificateViewer';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Candidate {
  id: string;
  full_name: string;
  phone_number: string;
  custom_fields: {
    typhoid?: string;
    typhoid_certificate?: string;
  };
}

export default function TyphoidCertificatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCandidates(candidates);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredCandidates(
        candidates.filter(candidate =>
          candidate.full_name.toLowerCase().includes(lowercaseQuery) ||
          candidate.phone_number.includes(searchQuery)
        )
      );
    }
  }, [searchQuery, candidates]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, full_name, phone_number, custom_fields')
        .order('full_name', { ascending: true });

      if (error) throw error;

      if (data) {
        const typedCandidates: Candidate[] = data.map(item => ({
          ...item,
          custom_fields: (item.custom_fields as unknown) || {}
        }));
        setCandidates(typedCandidates);
        setFilteredCandidates(typedCandidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setShowCertificateModal(true);
  };

  const downloadCertificate = (candidate: Candidate) => {
    const certificateData = candidate.custom_fields?.typhoid_certificate;
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
      const fileName = `typhoid_certificate_${candidate.full_name.replace(/\s+/g, '_').toLowerCase()}.${fileType}`;
      link.download = fileName;
      
      // Append to the document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading certificate:', err);
    }
  };

  const hasCertificate = (candidate: Candidate): boolean => {
    return !!(candidate.custom_fields?.typhoid_certificate && 
             candidate.custom_fields.typhoid_certificate.startsWith('data:image/'));
  };

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-green-600" />
          Typhoid Vaccination Certificates
        </h1>
        <p className="text-gray-600">
          View and manage typhoid vaccination certificates for all candidates
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or phone number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
              <ShieldCheck className="h-3 w-3" />
              <span>Has Certificate: {candidates.filter(c => hasCertificate(c)).length}</span>
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex gap-1 items-center">
              <ShieldAlert className="h-3 w-3" />
              <span>Missing Certificate: {candidates.filter(c => !hasCertificate(c)).length}</span>
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Typhoid Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate, index) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-mono text-xs text-gray-500">{index + 1}</TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {candidate.full_name}
                      </TableCell>
                      <TableCell>{candidate.phone_number}</TableCell>
                      <TableCell>
                        {candidate.custom_fields?.typhoid === 'yes' ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                            Vaccinated
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">
                            Not Vaccinated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCertificate(candidate) ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Certificate Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">
                            No Certificate
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasCertificate(candidate) && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewCertificate(candidate.id)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadCertificate(candidate)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Typhoid Vaccination Certificate</DialogTitle>
            <DialogDescription>
              View and download the vaccination certificate
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateId && (
            <TyphoidCertificateViewer candidateId={selectedCandidateId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}