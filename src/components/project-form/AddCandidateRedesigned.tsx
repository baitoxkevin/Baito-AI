import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CandidateAvatar } from "@/components/ui/candidate-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
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
  Filter,
  User,
  Phone,
  Briefcase
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden border-0 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/20">
        <DialogHeader className="p-6 pb-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20 blur-3xl" />
          <DialogTitle className="text-xl font-bold flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-indigo-500/25 animate-pulse">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Add Staff Members
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2 pl-14">
            Search and select candidates to add to your project
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-xl" />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-200 group-focus-within:shadow-lg group-focus-within:border-indigo-300 dark:group-focus-within:border-indigo-700">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors duration-200 group-focus-within:text-indigo-500" />
              <Input
                placeholder="Search by name, phone, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-transparent border-0 focus:ring-0 text-sm placeholder:text-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{filteredCandidates.length} candidates available</span>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                <div className="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>

      <ScrollArea className="h-[380px] px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="animate-spin h-12 w-12 border-3 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 dark:border-t-indigo-400 rounded-full" />
              <div className="absolute inset-0 animate-ping h-12 w-12 border-2 border-indigo-400 rounded-full opacity-20" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-slate-700 dark:text-slate-300">No candidates found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="pb-4 space-y-3">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className={cn(
                  "group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden",
                  selectedCandidate?.id === candidate.id
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md bg-white dark:bg-slate-900/50"
                )}
                onClick={() => setSelectedCandidate(candidate)}
              >
                {selectedCandidate?.id === candidate.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
                )}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <CandidateAvatar
                      src={candidate.photo}
                      fallback={candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      candidateId={candidate.id}
                      size="lg"
                      className="ring-2 ring-white dark:ring-slate-800 shadow-md transition-transform duration-300 group-hover:scale-110"
                    />
                    {selectedCandidate?.id === candidate.id && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">{candidate.name}</h4>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{candidate.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {candidate.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Phone className="h-3 w-3" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.designation && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Briefcase className="h-3 w-3" />
                          <span>{candidate.designation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={cn(
                        "text-xs font-medium shadow-sm",
                        candidate.availability === 'available' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {candidate.availability === 'available' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </>
                      ) : (
                        candidate.availability
                      )}
                    </Badge>
                    {selectedCandidate?.id === candidate.id && (
                      <ChevronRight className="h-4 w-4 text-indigo-500 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedCandidate && (
        <div className="p-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900/50 dark:via-indigo-950/20 dark:to-purple-950/20">
          <div className="bg-white dark:bg-slate-900/80 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <CandidateAvatar
                  src={selectedCandidate.photo}
                  fallback={selectedCandidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  candidateId={selectedCandidate.id}
                  size="md"
                  className="ring-2 ring-indigo-500 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg animate-pulse">
                  <UserPlus className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base text-slate-900 dark:text-slate-100">{selectedCandidate.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {selectedCandidate.phone || 'No phone'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  Select Designation
                </Label>
                <Select
                  value={selectedDesignation}
                  onValueChange={setSelectedDesignation}
                >
                  <SelectTrigger className="h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <SelectItem value="Crew" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Crew</SelectItem>
                    <SelectItem value="Supervisor" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Supervisor</SelectItem>
                    <SelectItem value="Manager" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Manager</SelectItem>
                    <SelectItem value="Technician" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Technician</SelectItem>
                    <SelectItem value="Designer" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Designer</SelectItem>
                    <SelectItem value="Photographer" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Photographer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setSelectedDesignation('Crew');
                  }}
                  className="flex-1 h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <ShimmerButton
                  onClick={() => handleAddCandidate(selectedCandidate)}
                  className="flex-1 h-10 shadow-lg"
                  shimmerColor="#ffffff"
                  background="linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
                >
                  <span className="flex items-center justify-center gap-2 text-white font-medium">
                    <Plus className="h-4 w-4" />
                    Add as {selectedDesignation}
                  </span>
                </ShimmerButton>
              </div>
            </div>
          </div>
        </div>
      )}
      </DialogContent>
    </Dialog>
  );
}