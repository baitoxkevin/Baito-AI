import { useState, useEffect } from 'react';
import { Award, MapPin, Star, Clock, Users, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ReplacementCandidate {
  crew_member_id: string;
  crew_name: string;
  crew_role: string;
  total_score: number;
  availability_score: number;
  skill_match_score: number;
  distance_score: number;
  performance_score: number;
  familiarity_score: number;
  distance_km: number;
  current_assignments: number;
  photo_url?: string;
  phone_number?: string;
}

interface ReplacementCandidateSelectorProps {
  sickLeaveId: string;
  onCandidateSelected?: (candidateId: string) => void;
}

export function ReplacementCandidateSelector({
  sickLeaveId,
  onCandidateSelected,
}: ReplacementCandidateSelectorProps) {
  const [candidates, setCandidates] = useState<ReplacementCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingOffer, setSendingOffer] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch replacement candidates
  const fetchCandidates = async () => {
    try {
      setLoading(true);

      // Call the database function to get ranked candidates
      const { data, error } = await supabase.rpc('find_replacement_candidates', {
        p_sick_leave_id: sickLeaveId,
        p_limit: 5,
      });

      if (error) throw error;

      // Fetch additional crew member details
      if (data && data.length > 0) {
        const crewIds = data.map((c: ReplacementCandidate) => c.crew_member_id);
        const { data: crewDetails, error: crewError } = await supabase
          .from('crew_members')
          .select('id, photo_url, phone_number')
          .in('id', crewIds);

        if (crewError) throw crewError;

        // Merge crew details with candidate data
        const enrichedCandidates = data.map((candidate: ReplacementCandidate) => {
          const details = crewDetails?.find(c => c.id === candidate.crew_member_id);
          return {
            ...candidate,
            photo_url: details?.photo_url,
            phone_number: details?.phone_number,
          };
        });

        setCandidates(enrichedCandidates);
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load replacement candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Send replacement offer
  const sendOffer = async (candidate: ReplacementCandidate) => {
    try {
      setSendingOffer(candidate.crew_member_id);

      // Create replacement request using the database function
      const { data, error } = await supabase.rpc('create_replacement_request', {
        p_sick_leave_id: sickLeaveId,
        p_target_crew_id: candidate.crew_member_id,
        p_match_score: candidate.total_score,
        p_availability_score: candidate.availability_score,
        p_skill_score: candidate.skill_match_score,
        p_distance_score: candidate.distance_score,
        p_performance_score: candidate.performance_score,
        p_familiarity_score: candidate.familiarity_score,
        p_distance_km: candidate.distance_km,
      });

      if (error) throw error;

      toast({
        title: 'Offer sent',
        description: `Replacement offer sent to ${candidate.crew_name}. They have 30 minutes to respond.`,
      });

      // TODO: Send push notification to crew member
      // TODO: Send SMS notification

      if (onCandidateSelected) {
        onCandidateSelected(candidate.crew_member_id);
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to send replacement offer',
        variant: 'destructive',
      });
    } finally {
      setSendingOffer(null);
    }
  };

  useEffect(() => {
    if (sickLeaveId) {
      fetchCandidates();
    }
  }, [sickLeaveId]);

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  // Get rank badge
  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500">🥇 Top Match</Badge>;
    if (index === 1) return <Badge variant="secondary">🥈 2nd Best</Badge>;
    if (index === 2) return <Badge variant="secondary">🥉 3rd Best</Badge>;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Finding best replacements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No candidates available</p>
          <p className="text-sm text-muted-foreground">
            There are no suitable replacement candidates at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Replacement Candidates</h3>
          <p className="text-sm text-muted-foreground">
            Ranked by availability, skills, distance, and performance
          </p>
        </div>
      </div>

      {candidates.map((candidate, index) => (
        <Card key={candidate.crew_member_id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {candidate.photo_url ? (
                    <img src={candidate.photo_url} alt={candidate.crew_name} />
                  ) : (
                    <AvatarFallback>
                      {candidate.crew_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {candidate.crew_name}
                    {getRankBadge(index)}
                  </CardTitle>
                  <CardDescription>{candidate.crew_role}</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(candidate.total_score)}`}>
                  {candidate.total_score.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Match Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Availability
                  </span>
                  <span className="font-medium">
                    {candidate.availability_score.toFixed(0)}
                  </span>
                </div>
                <Progress value={candidate.availability_score} className="h-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Skill Match
                  </span>
                  <span className="font-medium">
                    {candidate.skill_match_score.toFixed(0)}
                  </span>
                </div>
                <Progress value={candidate.skill_match_score} className="h-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Distance
                  </span>
                  <span className="font-medium">
                    {candidate.distance_score.toFixed(0)}
                  </span>
                </div>
                <Progress value={candidate.distance_score} className="h-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Performance
                  </span>
                  <span className="font-medium">
                    {candidate.performance_score.toFixed(0)}
                  </span>
                </div>
                <Progress value={candidate.performance_score} className="h-1" />
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{candidate.distance_km.toFixed(1)} km away</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{candidate.current_assignments} current projects</span>
                </div>
              </div>

              <Button
                onClick={() => sendOffer(candidate)}
                disabled={sendingOffer === candidate.crew_member_id}
                className="ml-auto"
              >
                {sendingOffer === candidate.crew_member_id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Offer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
