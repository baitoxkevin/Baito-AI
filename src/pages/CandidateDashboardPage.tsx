import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { supabase } from '@/lib/supabase'; // Assuming supabase is used for auth/data
import { logger } from '@/lib/logger';
import { PublicPageWrapper } from '@/components/PublicPageWrapper'; // For consistent public page styling
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Example UI component
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // For profile picture
import { Mail, UserCircle } from 'lucide-react'; // Icons
import { CandidateProjectApplications } from '@/components/CandidateProjectApplications';
import CandidateProjectHistory from '@/components/CandidateProjectHistory'; // Added

// Mock candidate data type for now
interface Candidate {
  id: string;
  full_name: string;
  email?: string;
  profile_photo?: string; // Added profile_photo
}

const CandidateDashboardPage: React.FC = () => {
  const navigate = useNavigate(); // Initialized useNavigate
  const { candidateId } = useParams<{ candidateId: string }>();
  const [searchParams] = useSearchParams();
  const secureToken = searchParams.get('secure_token');

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile'); // Default tab

  useEffect(() => {
    const authenticateAndFetchData = async () => {
      if (!candidateId || !secureToken) {
        setError('Missing candidate ID or secure token.');
        setLoading(false);
        logger.warn('CandidateDashboardPage: Missing candidateId or secureToken');
        return;
      }

      try {
        logger.info(`CandidateDashboardPage: Attempting to validate token for candidate: ${candidateId}`);

        // Simulate token validation (actual validation logic will be more complex)
        // For now, assume token is valid if present
        if (!secureToken) { // This check is a bit redundant due to the one above, but good for explicit simulation
          logger.warn(`CandidateDashboardPage: Secure token not provided for candidate: ${candidateId}`);
          throw new Error("Invalid or expired token.");
        }

        // Simulate fetching candidate data
        // In a real scenario, you would call a Supabase RPC function to validate the token
        // and then fetch from 'candidates' table.
        // For this step, mock data:
        const mockCandidateData: Candidate = {
          id: candidateId,
          full_name: `Candidate ${candidateId.substring(0,5)}...`,
          email: `candidate_${candidateId.substring(0,5)}@example.com`,
          profile_photo: '' // Added mock profile_photo
        };

        logger.info('CandidateDashboardPage: Successfully fetched candidate data (mocked)', { data: mockCandidateData });
        setCandidate(mockCandidateData);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
        logger.error('CandidateDashboardPage: Error in dashboard page:', { error: errorMessage, candidateId });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    authenticateAndFetchData();
  }, [candidateId, secureToken]);

  if (loading) {
    return <PublicPageWrapper><div className="flex justify-center items-center h-screen"><div className="p-4">Loading dashboard...</div></div></PublicPageWrapper>;
  }

  if (error) {
    return <PublicPageWrapper><div className="flex justify-center items-center h-screen"><div className="p-4 text-red-500">Error: {error}</div></div></PublicPageWrapper>;
  }

  if (!candidate) {
    return <PublicPageWrapper><div className="flex justify-center items-center h-screen"><div className="p-4">Candidate data not found.</div></div></PublicPageWrapper>;
  }

  return (
    <PublicPageWrapper>
      <div className="container mx-auto p-4">
        <header className="mb-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Candidate Dashboard</h1>
          <p className="text-xl text-gray-600">Welcome, {candidate.full_name}!</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <nav className="flex border-b border-gray-200">
              <Button variant={activeTab === 'profile' ? 'default' : 'ghost'} onClick={() => setActiveTab('profile')} className="mr-2 rounded-none border-b-2 border-transparent hover:border-primary focus:border-primary data-[state=active]:border-primary data-[state=active]:text-primary">Profile</Button>
              <Button variant={activeTab === 'projects' ? 'default' : 'ghost'} onClick={() => setActiveTab('projects')} className="mr-2 rounded-none border-b-2 border-transparent hover:border-primary focus:border-primary data-[state=active]:border-primary data-[state=active]:text-primary">Projects</Button>
              <Button variant={activeTab === 'history' ? 'default' : 'ghost'} onClick={() => setActiveTab('history')} className="rounded-none border-b-2 border-transparent hover:border-primary focus:border-primary data-[state=active]:border-primary data-[state=active]:text-primary">History</Button>
            </nav>
          </CardHeader>
          <CardContent className="mt-6 p-6">
            {activeTab === 'profile' && (
              <div>
                <CardTitle className="text-2xl font-semibold mb-4 text-gray-700">My Profile</CardTitle>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-24 w-24 border">
                      <AvatarImage src={candidate.profile_photo || undefined} alt={candidate.full_name} />
                      <AvatarFallback className="text-2xl">
                        {candidate.full_name?.split(' ').map(name => name[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">{candidate.full_name}</h2>
                      {candidate.email && (
                        <div className="flex items-center text-gray-600 mt-2">
                          <Mail className="h-5 w-5 mr-2 text-gray-500" />
                          {candidate.email}
                        </div>
                      )}
                      {/* Add other summary fields if available and relevant, e.g., phone */}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (candidateId && secureToken) {
                        navigate(`/candidate-update-mobile/${candidateId}?secure_token=${secureToken}`);
                      } else {
                        logger.error('CandidateDashboardPage: Missing candidateId or secureToken for navigation to edit page.', { candidateId, secureToken });
                        // Optionally, show a toast message to the user here
                        setError("Could not navigate to edit page: missing required information.");
                      }
                    }}
                    className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <UserCircle className="h-5 w-5 mr-2" />
                    Update My Information
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Keep your details up-to-date to ensure you receive relevant job opportunities.
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'projects' && (
              <div>
                <CardTitle className="text-2xl font-semibold mb-4 text-gray-700">Projects & Applications</CardTitle>
                {candidateId ? (
                  <CandidateProjectApplications
                    candidateId={candidateId}
                    candidateName={candidate?.full_name}
                  />
                ) : (
                  <p className="text-red-500">Cannot load project applications: Candidate ID is missing.</p>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                <CardTitle className="text-2xl font-semibold mb-4 text-gray-700">My Project History</CardTitle>
                {candidateId ? (
                  <CandidateProjectHistory
                    candidateId={candidateId}
                    showAddRating={false} // Ensure admin features are off for candidate view
                  />
                ) : (
                  <p className="text-red-500">Cannot load project history: Candidate ID is missing.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicPageWrapper>
  );
};

export default CandidateDashboardPage;
