import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CandidateAvatar } from "@/components/ui/candidate-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Checkbox } from "@/components/ui/checkbox";
import { logger } from '../../lib/logger';
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
  Briefcase,
  Users,
  CheckSquare,
  Square
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
  onAddCandidate?: (candidateId: string, candidateName: string, candidatePhoto?: string, designation?: string) => void;
  onBatchAddCandidates?: (candidates: Array<{id: string; name: string; photo?: string; designation?: string}>) => void;
  existingStaffIds?: string[];
  existingApplicantIds?: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCandidateRedesigned({ 
  onAddCandidate,
  onBatchAddCandidates,
  existingStaffIds = [],
  existingApplicantIds = [],
  isOpen,
  onOpenChange
}: AddCandidateRedesignedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Crew');
  const [hasFetched, setHasFetched] = useState(false);
  const { toast } = useToast();

  // Fetch candidates and reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setSelectedCandidates(new Set());
      setSearchQuery('');
      setSelectedDesignation('Crew');

      // Always fetch fresh data when opening to ensure we have the latest candidates
      // but prevent duplicate fetches if already loading
      if (!loading) {
        fetchCandidates();
      }
    }
  }, [isOpen]);

  const fetchCandidates = useCallback(async () => {
    // Prevent duplicate fetches
    if (loading) return;

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

      if (error) {
        logger.error('AddCandidateRedesigned', 'Error fetching candidates', error);
        throw error;
      }

      const formattedCandidates = (data || []).map((candidate: any) => ({
        id: candidate.id,
        name: candidate.full_name || 'Unknown',
        designation: 'Crew',
        phone: candidate.phone_number || '',
        photo: candidate.photos?.[0]?.profile_photo_url || undefined,
        rating: candidate.performance_metrics?.[0]?.avg_rating || 0,
        availability: 'Available'
      }));

      setCandidates(formattedCandidates);
      setHasFetched(true);
    } catch (error) {
      logger.error('AddCandidateRedesigned', 'Error fetching candidates', error);
      toast({
        title: "Error loading candidates",
        description: "Failed to load candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loading, toast]);

  const filteredCandidates = useMemo(() => {
    // Create a Set for faster lookups with O(1) complexity
    const allStaffIds = new Set([...existingStaffIds, ...existingApplicantIds]);

    const availableCandidates = candidates.filter(candidate =>
      !allStaffIds.has(candidate.id)
    );

    if (!searchQuery) return availableCandidates;

    const query = searchQuery.toLowerCase();
    return availableCandidates.filter(candidate =>
      candidate.name.toLowerCase().includes(query) ||
      candidate.phone?.toLowerCase().includes(query) ||
      candidate.designation?.toLowerCase().includes(query)
    );
  }, [candidates, searchQuery, existingStaffIds, existingApplicantIds]);

  // 切换单个候选人选择
  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedCandidates(new Set());
    } else {
      const allIds = new Set(filteredCandidates.map(c => c.id));
      setSelectedCandidates(allIds);
    }
  };

  // 批量添加选中的候选人
  const handleAddCandidates = async () => {
    if (selectedCandidates.size === 0) {
      toast({
        title: 'No candidates selected',
        description: 'Please select at least one candidate to add',
        variant: 'destructive',
      });
      return;
    }

    // 批量添加所有选中的候选人
    const selectedCandidatesList = candidates.filter(c => selectedCandidates.has(c.id));

    // Store the added candidate IDs to update local state immediately
    const addedCandidateIds = new Set(selectedCandidatesList.map(c => c.id));

    // 如果有批量添加函数，使用批量添加
    if (onBatchAddCandidates) {
      const candidatesToAdd = selectedCandidatesList.map(candidate => ({
        id: candidate.id,
        name: candidate.name || 'Unknown',
        photo: candidate.photo,
        designation: selectedDesignation || 'Crew'
      }));

      onBatchAddCandidates(candidatesToAdd);
    } else if (onAddCandidate) {
      // 否则逐个添加候选人
      for (const candidate of selectedCandidatesList) {
        onAddCandidate(
          candidate.id,
          candidate.name || 'Unknown',
          candidate.photo || undefined,
          selectedDesignation || 'Crew'
        );
      }
    }

    // 显示成功消息
    toast({
      title: 'Successfully Added',
      description: `Added ${selectedCandidates.size} staff member${selectedCandidates.size > 1 ? 's' : ''} to the project`,
    });

    // 重置状态 immediately before closing
    setSelectedCandidates(new Set());
    setSelectedDesignation('Crew'); // Reset to default
    setSearchQuery('');

    // Close dialog immediately
    onOpenChange(false);

    // Note: We don't update the candidates list here because:
    // 1. The parent component updates existingStaffIds/existingApplicantIds
    // 2. Our filteredCandidates memo will automatically exclude them
    // 3. This avoids any state management conflicts

    // No need to refetch - we've already updated the local state
    // The parent component will handle updating the staff lists
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-0 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/20"
        aria-describedby="add-staff-dialog-description"
      >
        <DialogHeader className="p-6 pb-0 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20 blur-3xl" />
          <DialogTitle className="text-xl font-bold flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-indigo-500/25 animate-pulse">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Add Staff Members
            </span>
          </DialogTitle>
          <p id="add-staff-dialog-description" className="text-sm text-muted-foreground mt-2 pl-14">
            Search and select multiple candidates to add to your project
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4 shrink-0">
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
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
              >
                {selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Select All
              </button>
              {selectedCandidates.size > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {selectedCandidates.size} Selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>{filteredCandidates.length} candidates available</span>
            </div>
          </div>
        </div>

      <ScrollArea className="flex-1 px-6 min-h-0 overflow-y-auto">
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
                  selectedCandidates.has(candidate.id)
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 shadow-lg shadow-indigo-500/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md bg-white dark:bg-slate-900/50"
                )}
                onClick={() => toggleCandidateSelection(candidate.id)}
              >
                {selectedCandidates.has(candidate.id) && (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
                )}
                <div className="flex items-center gap-4 relative z-10">
                  {/* 复选框 */}
                  <Checkbox
                    checked={selectedCandidates.has(candidate.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCandidates(prev => new Set([...prev, candidate.id]));
                      } else {
                        setSelectedCandidates(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(candidate.id);
                          return newSet;
                        });
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 border-2 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  
                  <div className="relative">
                    <CandidateAvatar
                      src={candidate.photo}
                      fallback={candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      candidateId={candidate.id}
                      size="lg"
                      className="ring-2 ring-white dark:ring-slate-800 shadow-md transition-transform duration-300 group-hover:scale-110"
                    />
                    {selectedCandidates.has(candidate.id) && (
                      <div className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg animate-in zoom-in-50 duration-200">
                        <Check className="h-4 w-4 text-white" />
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
                    {candidate.availability && (
                      <Badge 
                        variant="default" 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm text-xs font-medium"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {candidate.availability}
                      </Badge>
                    )}
                    {candidate.lastWorkedDate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>Last: {candidate.lastWorkedDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <DialogFooter className="p-6 pt-0 bg-gradient-to-t from-white via-white/95 to-white/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/90 border-t border-slate-200 dark:border-slate-700">
        <div className="w-full space-y-4">
          {/* 职位选择器 */}
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium min-w-[80px]">Designation:</Label>
            <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
              <SelectTrigger className="flex-1 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectItem value="Crew" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Crew</SelectItem>
                <SelectItem value="Supervisor" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Supervisor</SelectItem>
                <SelectItem value="Manager" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Manager</SelectItem>
                <SelectItem value="Coordinator" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Coordinator</SelectItem>
                <SelectItem value="Technician" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Technician</SelectItem>
                <SelectItem value="Designer" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Designer</SelectItem>
                <SelectItem value="Photographer" className="focus:bg-indigo-50 dark:focus:bg-indigo-950/30">Photographer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setSelectedCandidates(new Set());
                setSelectedDesignation('Crew');
                onOpenChange(false);
              }}
              className="flex-1 h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <ShimmerButton
              onClick={handleAddCandidates}
              disabled={selectedCandidates.size === 0}
              className={cn(
                "flex-1 h-10 shadow-lg transition-all",
                selectedCandidates.size === 0 && "opacity-50 cursor-not-allowed"
              )}
              shimmerColor="#ffffff"
              background="linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
            >
              <span className="flex items-center justify-center gap-2 text-white font-medium">
                <Users className="h-4 w-4" />
                Add {selectedCandidates.size > 0 ? `${selectedCandidates.size}` : ''} {selectedDesignation}
              </span>
            </ShimmerButton>
          </div>
        </div>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}