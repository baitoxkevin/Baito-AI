import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Star,
  Clock,
  // ThumbsUp,
  // ThumbsDown,
  Ban,
  AlertCircle,
  Upload,
  // Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Candidate } from '@/lib/types';

interface CandidateProjectHistoryProps {
  candidateId: string;
  projectId?: string; // Optional: If provided, shows only history for specific project
  showAddRating?: boolean;
  onHistoryUpdated?: () => void;
}

interface ProjectHistoryEntry {
  id: string;
  project_id: string;
  project_title: string;
  completed_at: string;
  rating: number | null;
  comment: string | null;
  status: string;
  user_id: string;
  user_name: string;
}

export default function CandidateProjectHistory({
  candidateId,
  projectId,
  showAddRating = false,
  onHistoryUpdated
}: CandidateProjectHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistId, setBlacklistId] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  // Load candidate data and history
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Load candidate info
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', candidateId)
          .single();
          
        if (candidateError) throw candidateError;
        setCandidate(candidateData);
        
        // Load project history
        let query = supabase
          .from('candidate_project_history')
          .select(`
            id,
            project_id,
            completed_at,
            rating,
            comment,
            status,
            user_id
          `)
          .eq('candidate_id', candidateId);
          
        // Filter by project if provided
        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        
        const { data: historyData, error: historyError } = await query
          .order('completed_at', { ascending: false });
          
        if (historyError) throw historyError;
        
        // Format history data
        // Fetch project titles separately
        const projectIds = [...new Set(historyData.map(h => h.project_id))];
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, title')
          .in('id', projectIds);
        
        const projectMap = new Map(projectsData?.map(p => [p.id, p.title]) || []);
        
        const formattedHistory = historyData.map((entry: unknown, index) => ({
          id: `${entry.id}-${index}`, // Ensure unique keys by appending index
          original_id: entry.id, // Keep original ID for database operations
          project_id: entry.project_id,
          project_title: projectMap.get(entry.project_id) || 'Unknown Project',
          completed_at: entry.completed_at,
          rating: entry.rating,
          comment: entry.comment,
          status: entry.status,
          user_id: entry.user_id,
          user_name: 'User' // We'll use a generic name since we can't fetch from auth directly
        }));
        
        setHistory(formattedHistory);
        
        // Check if candidate is blacklisted by current user
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          const { data: blacklistData, error: blacklistError } = await supabase
            .from('candidate_blacklist')
            .select('*')
            .eq('candidate_id', candidateId)
            .eq('user_id', authUser.user.id)
            .maybeSingle();
            
          if (!blacklistError && blacklistData) {
            setIsBlacklisted(true);
            setBlacklistId(blacklistData.id);
          }
        }
      } catch (error) {
        console.error('Error loading candidate history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load candidate history',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (candidateId) {
      loadData();
    }
  }, [candidateId, projectId, toast]);
  
  const submitRating = async () => {
    try {
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error('User not authenticated');
      }
      
      const historyEntry = {
        candidate_id: candidateId,
        project_id: projectId,
        user_id: authData.user.id,
        rating,
        comment: comment.trim() || null,
        status: 'completed'
      };
      
      // Check if entry already exists
      const { data: existingData } = await supabase
        .from('candidate_project_history')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('project_id', projectId)
        .eq('user_id', authData.user.id)
        .maybeSingle();
        
      let result;
      
      if (existingData) {
        // Update existing entry
        result = await supabase
          .from('candidate_project_history')
          .update({
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Insert new entry
        result = await supabase
          .from('candidate_project_history')
          .insert([historyEntry]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: 'Rating Submitted',
        description: 'Your rating has been recorded successfully',
      });
      
      setShowRatingDialog(false);
      setRating(3);
      setComment('');
      
      // Refresh history data
      if (onHistoryUpdated) {
        onHistoryUpdated();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive'
      });
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
      
      if (validFiles.length !== filesArray.length) {
        toast({
          title: 'File size exceeded',
          description: 'Some files exceed the 5MB limit and were not added',
          variant: 'destructive'
        });
      }
      
      // Add new files
      setProofFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Generate preview URLs
      const newUrls = validFiles.map(file => URL.createObjectURL(file));
      setProofUrls(prevUrls => [...prevUrls, ...newUrls]);
    }
  };
  
  const removeFile = (index: number) => {
    setProofFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setProofUrls(prevUrls => {
      // Revoke the URL to free up memory
      URL.revokeObjectURL(prevUrls[index]);
      
      const newUrls = [...prevUrls];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };
  
  const submitBlacklist = async () => {
    if (!blacklistReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for blacklisting this candidate',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Get current user
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error('User not authenticated');
      }
      
      // Upload proof files
      const uploadedUrls: string[] = [];
      
      if (proofFiles.length > 0) {
        for (let i = 0; i < proofFiles.length; i++) {
          const file = proofFiles[i];
          const filePath = `blacklist/${candidateId}/${authData.user.id}/${Date.now()}_${i}_${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('blacklist-evidence')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blacklist-evidence/${filePath}`;
          uploadedUrls.push(fileUrl);
        }
      }
      
      // Add to blacklist
      const { error } = await supabase
        .from('candidate_blacklist')
        .insert([{
          candidate_id: candidateId,
          user_id: authData.user.id,
          reason: blacklistReason.trim(),
          proof_files: uploadedUrls,
          is_global: false // User-specific blacklist
        }]);
        
      if (error) throw error;
      
      toast({
        title: 'Candidate Blacklisted',
        description: 'This candidate has been added to your blacklist',
      });
      
      setShowBlacklistDialog(false);
      setBlacklistReason('');
      setProofFiles([]);
      setProofUrls([]);
      setIsBlacklisted(true);
      
      // Refresh data
      if (onHistoryUpdated) {
        onHistoryUpdated();
      }
    } catch (error) {
      console.error('Error blacklisting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to blacklist candidate',
        variant: 'destructive'
      });
    }
  };
  
  const removeFromBlacklist = async () => {
    if (!blacklistId) return;
    
    try {
      const { error } = await supabase
        .from('candidate_blacklist')
        .delete()
        .eq('id', blacklistId);
        
      if (error) throw error;
      
      toast({
        title: 'Candidate Removed',
        description: 'Candidate has been removed from your blacklist',
      });
      
      setIsBlacklisted(false);
      setBlacklistId(null);
      
      // Refresh data
      if (onHistoryUpdated) {
        onHistoryUpdated();
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove candidate from blacklist',
        variant: 'destructive'
      });
    }
  };
  
  // Render star rating component
  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(null) : undefined}
            className={`h-5 w-5 cursor-${interactive ? 'pointer' : 'default'} ${
              star <= (hoveredStar || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="text-center py-6 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p>Candidate information not found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Blacklist status indicator */}
      {isBlacklisted && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Ban className="h-5 w-5" />
            <span className="font-medium">This candidate is on your blacklist</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={removeFromBlacklist}
            className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
          >
            Remove from Blacklist
          </Button>
        </div>
      )}
      
      {/* Project history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Project History</h3>
          {showAddRating && projectId && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRatingDialog(true)}
                className="flex items-center gap-1.5"
              >
                <Star className="h-4 w-4" />
                Add Rating
              </Button>
              
              {!isBlacklisted && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBlacklistDialog(true)}
                  className="flex items-center gap-1.5 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                >
                  <Ban className="h-4 w-4" />
                  Report & Blacklist
                </Button>
              )}
            </div>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No project history available for this candidate
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div 
                key={entry.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{entry.project_title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Completed on {format(new Date(entry.completed_at), 'PPP')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex justify-end mb-1">
                      {entry.rating ? renderStars(entry.rating) : (
                        <span className="text-sm text-gray-400">No rating</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      Rated by {entry.user_name}
                    </span>
                  </div>
                </div>
                
                {entry.comment && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm italic">
                      "{entry.comment}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {candidate.full_name}</DialogTitle>
            <DialogDescription>
              Please provide your rating and optional feedback
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex justify-center py-2">
                {renderStars(rating, true)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Comments (Optional)</Label>
              <Textarea
                placeholder="Share your experience working with this candidate..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>Cancel</Button>
            <Button onClick={submitRating}>Submit Rating</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Blacklist Dialog */}
      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <Ban className="h-5 w-5" />
              Blacklist {candidate.full_name}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason and evidence for blacklisting this candidate.
              They will not be shown in your future projects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Reason for Blacklisting <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Explain why you're adding this candidate to your blacklist..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Evidence (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {proofUrls.map((url, index) => (
                    <div key={index} className="relative w-20 h-20 border rounded-md overflow-hidden group">
                      <img 
                        src={url} 
                        alt={`Proof ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">Click to upload files</span>
                  <span className="text-xs text-gray-500">
                    (PNG, JPG, PDF up to 5MB)
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,application/pdf"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlacklistDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={submitBlacklist}
              disabled={!blacklistReason.trim()}
            >
              Add to Blacklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}