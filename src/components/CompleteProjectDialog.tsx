import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CandidateAvatar } from '@/components/ui/candidate-avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '../lib/logger';
import { 
  Star, 
  CheckCircle, 
  FileCheck, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Ban,
  Search,
  User
} from 'lucide-react';
import { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CompleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onProjectCompleted?: () => void;
}

interface ProjectCandidate {
  id: string;
  full_name: string;
  photo?: string;
  role?: string;
  rating?: number;
  feedback?: string;
  attended: boolean;
}

interface CompletionStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export default function CompleteProjectDialog({
  open,
  onOpenChange,
  project,
  onProjectCompleted
}: CompleteProjectDialogProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<ProjectCandidate[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [steps, setSteps] = useState<CompletionStep[]>([
    { id: 'overview', title: 'Project Overview', status: 'in-progress' },
    { id: 'attendance', title: 'Attendance Confirmation', status: 'pending' },
    { id: 'ratings', title: 'Candidate Ratings', status: 'pending' },
    { id: 'summary', title: 'Completion Summary', status: 'pending' }
  ]);
  const [filteredCandidates, setFilteredCandidates] = useState<ProjectCandidate[]>([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const [projectRating, _setProjectRating] = useState(0);
  
  const { toast } = useToast();
  
  // Load project candidates when dialog opens
  useEffect(() => {
    if (open && project) {
      loadProjectCandidates();
    }
  }, [open, project]);
  
  // Filter candidates when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    
    const filtered = candidates.filter(candidate => 
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.role && candidate.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredCandidates(filtered);
  }, [searchTerm, candidates]);
  
  // Update steps when tab changes
  useEffect(() => {
    const newSteps = [...steps];
    
    // Find the current step
    const currentStepIndex = newSteps.findIndex(step => step.id === activeTab);
    if (currentStepIndex === -1) return;
    
    // Mark current step as in-progress and previous steps as completed
    newSteps.forEach((step, index) => {
      if (index < currentStepIndex) {
        step.status = 'completed';
      } else if (index === currentStepIndex) {
        step.status = 'in-progress';
      } else {
        step.status = 'pending';
      }
    });
    
    setSteps(newSteps);
  }, [activeTab]);
  
  const loadProjectCandidates = useCallback(async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would fetch actual project candidates
      // For now, we'll create mock data
      // TODO: Replace with actual API call to get project candidates
      
      // Example query (to be implemented):
      // const { data, error } = await supabase
      //   .from('project_candidates')
      //   .select(`
      //     candidate_id,
      //     role,
      //     candidates (id, full_name, profile_photo)
      //   `)
      //   .eq('project_id', project.id);
      
      // Mock data for development
      const mockCandidates: ProjectCandidate[] = [
        {
          id: '1',
          full_name: 'Jane Smith',
          photo: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Jane',
          role: 'Promoter',
          attended: true
        },
        {
          id: '2',
          full_name: 'Michael Johnson',
          photo: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Michael',
          role: 'Team Lead',
          attended: true
        },
        {
          id: '3',
          full_name: 'Sarah Williams',
          photo: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Sarah',
          role: 'Brand Ambassador',
          attended: true
        },
        {
          id: '4',
          full_name: 'David Brown',
          photo: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=David',
          role: 'Usher',
          attended: false
        },
        {
          id: '5',
          full_name: 'Emma Davis',
          photo: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Emma',
          role: 'Promoter',
          attended: true
        }
      ];
      
      setCandidates(mockCandidates);
      setFilteredCandidates(mockCandidates);
    } catch (error) {
      logger.error('Error loading candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project candidates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const handleAttendanceChange = (candidateId: string, attended: boolean) => {
    setCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, attended } : candidate
    ));
    
    setFilteredCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, attended } : candidate
    ));
  };
  
  const handleRatingChange = (candidateId: string, rating: number) => {
    setCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, rating } : candidate
    ));
    
    setFilteredCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, rating } : candidate
    ));
  };
  
  const handleFeedbackChange = (candidateId: string, feedback: string) => {
    setCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, feedback } : candidate
    ));
    
    setFilteredCandidates(prev => prev.map(candidate => 
      candidate.id === candidateId ? { ...candidate, feedback } : candidate
    ));
  };
  
  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === activeTab);
    if (currentIndex < steps.length - 1) {
      setActiveTab(steps[currentIndex + 1].id);
    }
  };
  
  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(steps[currentIndex - 1].id);
    }
  };
  
  const completeProject = async () => {
    setSubmitting(true);
    
    try {
      // 1. Update project status to completed
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          status: 'completed',
          completion_notes: completionNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', project.id);
        
      if (projectError) throw projectError;
      
      // 2. Record candidate history and ratings
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        throw new Error('User not authenticated');
      }
      
      // Prepare batch operations for candidate histories
      const candidateHistories = candidates
        .filter(c => c.attended) // Only process candidates who attended
        .map(candidate => ({
          candidate_id: candidate.id,
          project_id: project.id,
          user_id: authData.user!.id,
          rating: candidate.rating || null,
          comment: candidate.feedback || null,
          status: 'completed'
        }));
        
      if (candidateHistories.length > 0) {
        const { error: historyError } = await supabase
          .from('candidate_project_history')
          .insert(candidateHistories);
          
        if (historyError) {
          logger.error('Error recording candidate histories:', historyError);
          // Continue execution even if this fails
        }
      }
      
      toast({
        title: 'Project Completed',
        description: 'Project has been marked as completed successfully',
      });
      
      if (onProjectCompleted) {
        onProjectCompleted();
      }
      
      onOpenChange(false);
    } catch (error) {
      logger.error('Error completing project:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete project',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderStars = (value: number, candidateId?: string, interactive = false) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          onClick={interactive && candidateId ? () => handleRatingChange(candidateId, star) : undefined}
          className={`h-5 w-5 ${interactive ? 'cursor-pointer' : ''} ${
            star <= value
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-500" />
            Complete Project: {project.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar with steps */}
          <div className="w-64 border-r flex flex-col bg-gray-50 dark:bg-gray-800/50">
            <div className="p-4 border-b">
              <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">
                Completion Process
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50",
                    activeTab === step.id && "bg-gray-100 dark:bg-gray-700/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    step.status === 'completed' ? "bg-green-500 text-white" :
                    step.status === 'in-progress' ? "bg-blue-500 text-white" :
                    "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  )}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-medium",
                      step.status === 'completed' ? "text-green-600 dark:text-green-400" :
                      step.status === 'in-progress' ? "text-blue-600 dark:text-blue-400" :
                      "text-gray-600 dark:text-gray-400"
                    )}>
                      {step.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'in-progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              {/* Project Overview Tab */}
              <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Project Overview</h2>
                  <Card className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Details</h3>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Project Name:</span>
                            <span className="text-sm font-medium">{project.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Status:</span>
                            <span className="text-sm font-medium">{project.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Project Dates:</span>
                            <span className="text-sm font-medium">
                              {new Date(project.start_date).toLocaleDateString()} 
                              {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Location:</span>
                            <span className="text-sm font-medium">{project.venue_address}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Summary</h3>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Candidates:</span>
                            <span className="text-sm font-medium">{candidates.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Confirmed Attendance:</span>
                            <span className="text-sm font-medium">{candidates.filter(c => c.attended).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">No-shows:</span>
                            <span className="text-sm font-medium">{candidates.filter(c => !c.attended).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Event Type:</span>
                            <span className="text-sm font-medium">{project.event_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label htmlFor="project-rating">Project Rating</Label>
                      <div className="mt-2 flex items-center gap-3">
                        {renderStars(projectRating, undefined, true)}
                        <span className="text-sm text-gray-500">
                          {projectRating === 0 ? 'Not rated' : `${projectRating} out of 5`}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="completion-notes">Completion Notes</Label>
                      <Textarea 
                        id="completion-notes"
                        placeholder="Add any notes about project completion, challenges, or achievements..."
                        rows={4}
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </Card>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={nextStep}>
                    Continue to Attendance
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              {/* Attendance Tab */}
              <TabsContent value="attendance" className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Confirm Attendance</h2>
                  
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search candidates..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p>No candidates found</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Candidate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Attended
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredCandidates.map(candidate => (
                            <tr key={candidate.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CandidateAvatar
                                    candidateId={candidate.id}
                                    src={candidate.photo}
                                    fallback={candidate.full_name.charAt(0)}
                                    size="sm"
                                  />
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {candidate.full_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {candidate.role || 'No role specified'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Checkbox
                                  id={`attendance-${candidate.id}`}
                                  checked={candidate.attended}
                                  onCheckedChange={(checked) => 
                                    handleAttendanceChange(candidate.id, checked as boolean)
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue to Ratings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              {/* Ratings Tab */}
              <TabsContent value="ratings" className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Candidate Ratings</h2>
                  
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search candidates..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredCandidates.filter(c => c.attended).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p>No candidates marked as attended</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCandidates
                        .filter(candidate => candidate.attended)
                        .map(candidate => (
                          <Card key={candidate.id} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CandidateAvatar
                                  candidateId={candidate.id}
                                  src={candidate.photo}
                                  fallback={candidate.full_name.charAt(0)}
                                  size="sm"
                                />
                                <div>
                                  <h3 className="font-medium">{candidate.full_name}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {candidate.role || 'No role specified'}
                                  </p>
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                <span className="text-xs">Blacklist</span>
                              </Button>
                            </div>
                            
                            <div className="pt-2">
                              <Label htmlFor={`rating-${candidate.id}`} className="mb-2 block text-sm">
                                Performance Rating
                              </Label>
                              <div className="flex items-center gap-2">
                                {renderStars(candidate.rating || 0, candidate.id, true)}
                                <span className="text-sm text-gray-500">
                                  {candidate.rating ? `${candidate.rating}/5` : 'Not rated'}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor={`feedback-${candidate.id}`} className="mb-2 block text-sm">
                                Feedback (Optional)
                              </Label>
                              <Textarea
                                id={`feedback-${candidate.id}`}
                                placeholder="Add any comments about this candidate's performance..."
                                value={candidate.feedback || ''}
                                onChange={(e) => handleFeedbackChange(candidate.id, e.target.value)}
                                rows={2}
                              />
                            </div>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue to Summary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="flex-1 overflow-y-auto p-6 space-y-6">
                <h2 className="text-lg font-semibold">Completion Summary</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-5 space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Project Details
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Project Name:</span>
                        <span className="text-sm font-medium">{project.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Project Rating:</span>
                        <div className="flex items-center">
                          {renderStars(projectRating)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Location:</span>
                        <span className="text-sm font-medium">{project.venue_address}</span>
                      </div>
                    </div>
                    
                    {completionNotes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Completion Notes</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {completionNotes}
                          </p>
                        </div>
                      </>
                    )}
                  </Card>
                  
                  <Card className="p-5 space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <User className="h-5 w-5 text-green-500" />
                      Candidate Summary
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Candidates:</span>
                        <span className="text-sm font-medium">{candidates.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Attended:</span>
                        <span className="text-sm font-medium">
                          {candidates.filter(c => c.attended).length} 
                          ({Math.round(candidates.filter(c => c.attended).length / candidates.length * 100)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Rating:</span>
                        <div className="flex items-center">
                          {renderStars(
                            Math.round(
                              candidates
                                .filter(c => c.attended && c.rating)
                                .reduce((sum, c) => sum + (c.rating || 0), 0) / 
                              candidates.filter(c => c.attended && c.rating).length
                            ) || 0
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Feedback Provided:</span>
                        <span className="text-sm font-medium">
                          {candidates.filter(c => c.attended && c.feedback).length} of {candidates.filter(c => c.attended).length}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 my-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Important Note</h3>
                      <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                        By completing this project, you're confirming that all project activities have been finished
                        and the candidate ratings provided are accurate. This data will be used to update candidate
                        performance metrics. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    onClick={completeProject} 
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Completing Project...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Project as Completed
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}