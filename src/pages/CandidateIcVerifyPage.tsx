import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserPlus, AlertCircle, LockKeyhole, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Candidate } from '@/lib/types';
import EditCandidateDialog from '@/components/EditCandidateDialog';

export default function CandidateIcVerifyPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [icAuthInput, setIcAuthInput] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Parse query params
  const queryParams = new URLSearchParams(window.location.search);
  const candidateId = queryParams.get('id');
  const authToken = queryParams.get('auth'); // This is the IC number for verification
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (!candidateId) {
      setAuthError('No candidate ID provided. Please check your link.');
      return;
    }
    
    if (authToken) {
      // Auto-verify if auth token is present in URL
      verifyCandidate(authToken);
    }
  }, [candidateId, authToken]);
  
  const verifyCandidate = async (icNumber: string) => {
    if (!candidateId) {
      return;
    }
    
    try {
      setVerifying(true);
      setAuthError('');
      
      // Format IC number - remove any dashes
      const formattedIC = icNumber.replace(/-/g, '');
      
      // Check candidate exists and verify IC number matches
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        setAuthError('Candidate not found. Please check your link.');
        return;
      }
      
      // Compare IC numbers (after formatting both to remove dashes)
      const candidateIC = data.ic_number.replace(/-/g, '');
      if (formattedIC !== candidateIC) {
        setAuthError('IC number verification failed. Please check your IC number and try again.');
        return;
      }
      
      // Authentication successful
      setCandidate(data as Candidate);
      setEditDialogOpen(true);
      
      toast({
        title: 'Verification Successful',
        description: 'You now have access to edit your profile information.',
      });
      
    } catch (error) {
      console.error('Error verifying candidate:', error);
      setAuthError('An error occurred during verification. Please try again later.');
    } finally {
      setVerifying(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCandidate(icAuthInput);
  };
  
  const handleCandidateUpdated = async () => {
    setEditDialogOpen(false);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been updated successfully.',
    });
    
    // Refresh candidate data
    if (candidateId) {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();
          
        if (data) {
          setCandidate(data as Candidate);
        }
      } catch (error) {
        console.error('Error refreshing candidate data:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-md mx-auto mt-16 p-4 flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }
  
  if (!candidateId) {
    return (
      <div className="container max-w-md mx-auto mt-16 p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Link</AlertTitle>
          <AlertDescription>
            No candidate ID provided. Please check your link and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto mt-16 p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Candidate Profile</CardTitle>
          <CardDescription>
            Verify your identity to edit your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {candidate ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4 flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">Verification Successful</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    You can now edit your profile information by clicking the button below.
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Name
                    </Label>
                  </div>
                  <p className="font-medium">{candidate.full_name}</p>
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={() => setEditDialogOpen(true)}
              >
                Edit My Profile
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ic_auth" className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4" />
                  IC Number (without dashes)
                </Label>
                <Input 
                  id="ic_auth"
                  placeholder="Enter your IC number for verification"
                  value={icAuthInput}
                  onChange={(e) => {
                    // Remove any dashes from input
                    const formattedValue = e.target.value.replace(/-/g, '');
                    setIcAuthInput(formattedValue);
                  }}
                  className="bg-slate-50 dark:bg-slate-800"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The IC number is required to verify your identity.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifying || !icAuthInput}
              >
                {verifying ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Identity'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      {candidate && (
        <EditCandidateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          candidate={candidate}
          onCandidateUpdated={handleCandidateUpdated}
          isPublicMode={true}
        />
      )}
    </div>
  );
}