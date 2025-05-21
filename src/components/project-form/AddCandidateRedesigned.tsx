import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CandidateAvatar } from "@/components/ui/candidate-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  UserPlus, 
  Search, 
  CheckCircle, 
  X, 
  Plus, 
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Sparkles,
  Check,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  rating?: number;
  availability?: string;
  phone?: string;
  lastWorkedDate?: string;
}

interface AddCandidateRedesignedProps {
  onAddCandidate: (candidateId: string, candidateName: string, candidatePhoto?: string, designation?: string) => void;
  existingStaffIds?: string[];
  existingApplicantIds?: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCandidateRedesigned({ 
  onAddCandidate, 
  existingStaffIds = [],
  existingApplicantIds = [],
  isOpen,
  onOpenChange
}: AddCandidateRedesignedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Crew');
  const { toast } = useToast();

  // Fetch candidates
  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id, 
          full_name, 
          phone_number,
          photos (profile_photo_url),
          performance_metrics (avg_rating)
        `)
        .eq('is_banned', false)
        .order('full_name');
        
      if (error) throw error;
      
      const formattedCandidates = data
        .filter(c => c.id && c.full_name) // Filter out candidates with missing id or name
        .map(c => ({
          id: c.id,
          name: c.full_name || 'Unknown',
          designation: 'Crew', // Default designation since it's not in candidates table
          photo: c.photos?.[0]?.profile_photo_url || null,
          rating: c.performance_metrics?.[0]?.avg_rating || 0,
          availability: 'available', // Default availability
          phone: c.phone_number || ''
        }));
      
      setCandidates(formattedCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    const excluded = [...existingStaffIds, ...existingApplicantIds];
    
    return candidates
      .filter(c => !excluded.includes(c.id))
      .filter(c => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)
        );
      });
  }, [candidates, searchQuery, existingStaffIds, existingApplicantIds]);

  const handleAddCandidate = (candidate: Candidate) => {
    if (!candidate || !candidate.id || !candidate.name) {
      toast({
        title: 'Invalid candidate',
        description: 'Candidate is missing required information',
        variant: 'destructive'
      });
      return;
    }
    
    // Call onAddCandidate with the expected parameters
    onAddCandidate(
      candidate.id,
      candidate.name || 'Unknown',
      candidate.photo || undefined,
      selectedDesignation || 'Crew'
    );
    
    toast({
      title: 'Candidate Added',
      description: `${candidate.name} has been added to the applicants list as ${selectedDesignation}`,
    });
    
    setSelectedCandidate(null);
    setSelectedDesignation('Crew'); // Reset to default
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Add Candidates
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search candidates by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No candidates found</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedCandidate?.id === candidate.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-center gap-3">
                  <CandidateAvatar
                    src={candidate.photo}
                    fallback={candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    candidateId={candidate.id}
                    size="md"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{candidate.name}</h4>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-medium">{candidate.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {candidate.phone && (
                        <span>{candidate.phone}</span>
                      )}
                    </div>
                  </div>
                  
                  <Badge
                    variant={candidate.availability === 'available' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {candidate.availability}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedCandidate && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 mb-3">
            <CandidateAvatar
              src={selectedCandidate.photo}
              fallback={selectedCandidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              candidateId={selectedCandidate.id}
              size="sm"
            />
            <div>
              <p className="font-medium text-sm">{selectedCandidate.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCandidate.phone || 'No phone'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Designation</Label>
              <Select
                value={selectedDesignation}
                onValueChange={setSelectedDesignation}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crew">Crew</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Photographer">Photographer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCandidate(null);
                  setSelectedDesignation('Crew');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddCandidate(selectedCandidate)}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add as {selectedDesignation}
              </Button>
            </div>
          </div>
        </div>
      )}
      </DialogContent>
    </Dialog>
  );
}