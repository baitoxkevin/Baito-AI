import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, Check, X, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAppState } from '@/contexts/AppStateContext';
import { ReplacementCandidateSelector } from '@/components/ReplacementCandidateSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SickLeave {
  id: string;
  crew_id: string;
  project_id: string;
  sick_date: string;
  sick_date_end: string | null;
  reason: string;
  sick_note_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_otp: string | null;
  verified_at: string | null;
  replacement_status: 'pending' | 'in_progress' | 'assigned' | 'failed';
  replacement_crew_id: string | null;
  created_at: string;
  crew_member?: {
    full_name: string;
    phone_number: string;
    photo_url: string | null;
    role: string;
  };
  project?: {
    title: string;
    venue_address: string;
  };
}

export default function SickLeaveApprovalPage() {
  const [pendingSickLeaves, setPendingSickLeaves] = useState<SickLeave[]>([]);
  const [processedSickLeaves, setProcessedSickLeaves] = useState<SickLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectingReplacementFor, setSelectingReplacementFor] = useState<string | null>(null);
  const { currentUser } = useAppState();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch sick leaves for PICs projects
  const fetchSickLeaves = async () => {
    try {
      setLoading(true);

      // Get projects where current user is PIC
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('person_in_charge_id', currentUser?.id);

      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        setPendingSickLeaves([]);
        setProcessedSickLeaves([]);
        setLoading(false);
        return;
      }

      // Fetch sick leaves for these projects
      const { data: sickLeaves, error: sickLeavesError } = await supabase
        .from('sick_leaves')
        .select(`
          *,
          crew_member:crew_members!crew_id (
            full_name,
            phone_number,
            photo_url,
            role
          ),
          project:projects!project_id (
            title,
            venue_address
          )
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (sickLeavesError) throw sickLeavesError;

      // Separate pending and processed
      const pending = sickLeaves?.filter(sl => sl.verification_status === 'pending') || [];
      const processed = sickLeaves?.filter(sl => sl.verification_status !== 'pending') || [];

      setPendingSickLeaves(pending);
      setProcessedSickLeaves(processed);
    } catch (error) {
      console.error('Error fetching sick leaves:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sick leave requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve sick leave
  const approveSickLeave = async (sickLeaveId: string) => {
    try {
      setProcessingId(sickLeaveId);

      const { error } = await supabase
        .from('sick_leaves')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          replacement_status: 'in_progress',
        })
        .eq('id', sickLeaveId);

      if (error) throw error;

      toast({
        title: 'Sick leave approved',
        description: 'The sick leave request has been approved. Finding replacement...',
      });

      // Refresh the list
      await fetchSickLeaves();

      // Open replacement candidate selector
      setSelectingReplacementFor(sickLeaveId);
    } catch (error) {
      console.error('Error approving sick leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve sick leave request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject sick leave
  const rejectSickLeave = async (sickLeaveId: string, reason: string) => {
    try {
      setProcessingId(sickLeaveId);

      const { error } = await supabase
        .from('sick_leaves')
        .update({
          verification_status: 'rejected',
          verified_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', sickLeaveId);

      if (error) throw error;

      toast({
        title: 'Sick leave rejected',
        description: 'The sick leave request has been rejected',
      });

      // Clear rejection reason
      setRejectionReason('');

      // Refresh the list
      await fetchSickLeaves();
    } catch (error) {
      console.error('Error rejecting sick leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject sick leave request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchSickLeaves();

      // Set up real-time subscription
      const channel = supabase
        .channel('sick_leaves_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sick_leaves',
          },
          () => {
            fetchSickLeaves();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  const SickLeaveCard = ({ sickLeave, isPending }: { sickLeave: SickLeave; isPending: boolean }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {sickLeave.crew_member?.photo_url ? (
                <AvatarImage src={sickLeave.crew_member.photo_url} />
              ) : (
                <AvatarFallback>
                  {sickLeave.crew_member?.full_name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-lg">{sickLeave.crew_member?.full_name}</CardTitle>
              <CardDescription className="text-sm">
                {sickLeave.crew_member?.role} • {sickLeave.project?.title}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={
              sickLeave.verification_status === 'approved'
                ? 'default'
                : sickLeave.verification_status === 'rejected'
                ? 'destructive'
                : 'secondary'
            }
          >
            {sickLeave.verification_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(new Date(sickLeave.sick_date), 'MMM dd, yyyy')}
            {sickLeave.sick_date_end &&
              ` - ${format(new Date(sickLeave.sick_date_end), 'MMM dd, yyyy')}`}
          </span>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Reason</Label>
          <p className="text-sm bg-muted p-2 rounded">{sickLeave.reason}</p>
        </div>

        {/* Medical Certificate */}
        {sickLeave.sick_note_url && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <a
              href={sickLeave.sick_note_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View Medical Certificate
            </a>
          </div>
        )}

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{sickLeave.crew_member?.phone_number}</span>
        </div>

        {/* Submitted time */}
        <div className="text-xs text-muted-foreground">
          Submitted {format(new Date(sickLeave.created_at), 'MMM dd, yyyy HH:mm')}
        </div>

        {/* Action buttons for pending requests */}
        {isPending && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              variant="default"
              onClick={() => approveSickLeave(sickLeave.id)}
              disabled={processingId === sickLeave.id}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => {
                const reason = prompt('Please provide a reason for rejection:');
                if (reason) {
                  rejectSickLeave(sickLeave.id, reason);
                }
              }}
              disabled={processingId === sickLeave.id}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sick Leave Requests</h1>
            <p className="text-sm text-muted-foreground">
              Review and approve sick leave requests from your team
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending
              {pendingSickLeaves.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingSickLeaves.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </CardContent>
              </Card>
            ) : pendingSickLeaves.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No pending requests</p>
                  <p className="text-sm text-muted-foreground">
                    All sick leave requests have been processed
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingSickLeaves.map(sickLeave => (
                <SickLeaveCard key={sickLeave.id} sickLeave={sickLeave} isPending={true} />
              ))
            )}
          </TabsContent>

          <TabsContent value="processed" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </CardContent>
              </Card>
            ) : processedSickLeaves.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No processed requests</p>
                  <p className="text-sm text-muted-foreground">
                    Approved and rejected requests will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              processedSickLeaves.map(sickLeave => (
                <SickLeaveCard key={sickLeave.id} sickLeave={sickLeave} isPending={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Replacement Candidate Selection Dialog */}
      <Dialog open={!!selectingReplacementFor} onOpenChange={(open) => !open && setSelectingReplacementFor(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Replacement Candidate</DialogTitle>
            <DialogDescription>
              Choose the best candidate to replace the sick crew member. Candidates are ranked by availability, skills, distance, and performance.
            </DialogDescription>
          </DialogHeader>
          {selectingReplacementFor && (
            <ReplacementCandidateSelector
              sickLeaveId={selectingReplacementFor}
              onCandidateSelected={(candidateId) => {
                toast({
                  title: 'Replacement offer sent',
                  description: 'The crew member will be notified and has 30 minutes to respond.',
                });
                setSelectingReplacementFor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
