import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Search, Loader2, Star, Car, X, FileText, UserPlus, Upload, Share2, Check, Flag, AlertTriangle, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format, differenceInYears } from 'date-fns';
import type { Candidate } from '@/lib/types';
import NewCandidateDialog from '@/components/NewCandidateDialog';
import { CandidateDetailsDialog } from '@/components/CandidateDetailsDialog';
import { CandidateTextImportTool } from '@/components/CandidateTextImportTool';
import ReportDialog from '@/components/ReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateActionButton } from '../../CandidateActionButton';

const loyaltyTierColors = {
  bronze: 'bg-orange-500/10 text-orange-500',
  silver: 'bg-slate-500/10 text-slate-500',
  gold: 'bg-yellow-500/10 text-yellow-500',
  platinum: 'bg-purple-500/10 text-purple-500',
  diamond: 'bg-blue-500/10 text-blue-500',
} as const;

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportCandidate, setReportCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<string>("candidates");
  const [newCandidateData, setNewCandidateData] = useState<unknown>(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<{[key: string]: boolean}>({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
  const { toast } = useToast();
  
  // Get current user info on component mount
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to get user's full name from users table
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          const userName = userData?.full_name || user.email?.split('@')[0] || 'Unknown User';
          setCurrentUser({ name: userName, id: user.id });
        }
      } catch (error) {
        logger.error('Error getting current user:', error);
      }
    };
    
    getCurrentUserInfo();
  }, []);

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          performance_metrics (
            reliability_score,
            response_rate,
            avg_rating,
            total_gigs_completed,
            no_shows,
            late_arrivals,
            early_terminations
          ),
          language_proficiency (
            language,
            proficiency_level,
            is_primary
          ),
          loyalty_status (
            tier_level,
            current_points,
            tier_achieved_date,
            points_expiry_date
          )
        `)
        .limit(100)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase error:', error);
        throw error;
      }

      setCandidates(data || []);
    } catch (error) {
      logger.error('Error loading candidates:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load candidates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(candidate =>
    candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort candidates based on selected field
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: unknown;
    let valueB: unknown;

    switch (sortField) {
      case 'experience':
        valueA = a.years_experience || 0;
        valueB = b.years_experience || 0;
        break;
      case 'tier':
        // Sort tiers by rank: diamond > platinum > gold > silver > bronze
        const tierRank = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
        valueA = tierRank[a.loyalty_status?.tier_level || 'bronze'] || 1;
        valueB = tierRank[b.loyalty_status?.tier_level || 'bronze'] || 1;
        break;
      case 'vehicle':
        // Sort by vehicle type: car > motorcycle > none
        const vehicleRank = (candidate: Candidate) => {
          if (!candidate.has_vehicle) return 0;
          if (candidate.vehicle_type?.toLowerCase().includes('car')) return 2;
          if (candidate.vehicle_type?.toLowerCase().includes('motor') ||
              candidate.vehicle_type?.toLowerCase().includes('bike')) return 1;
          return 0;
        };
        valueA = vehicleRank(a);
        valueB = vehicleRank(b);
        break;
      case 'availability':
        // Sort by availability (no projects = available, any projects = busy)
        // Simpler boolean comparison: available (0) ranks higher than busy (any number > 0)
        const projectCountA = a.current_projects_count || 0;
        const projectCountB = b.current_projects_count || 0;
        valueA = projectCountA === 0 ? 1 : 0; // Available ranks higher
        valueB = projectCountB === 0 ? 1 : 0;
        break;
      case 'rating':
        valueA = a.performance_metrics?.avg_rating || 0;
        valueB = b.performance_metrics?.avg_rating || 0;
        break;
      case 'name':
        valueA = a.full_name || '';
        valueB = b.full_name || '';
        break;
      default:
        return 0;
    }

    // Apply sort direction
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
  
  // Function to handle opening the new candidate dialog with data from the import tool
  const handleOpenNewCandidateDialog = (candidateData: unknown) => {
    setNewCandidateData(candidateData);
    setNewDialogOpen(true);
  };
  
  // Function to generate and share candidate edit link via WhatsApp
  const shareEditLinkViaWhatsApp = async (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation(); // Prevent row click event
    
    // Check if candidate has a phone number
    if (!candidate.phone_number || candidate.phone_number.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Please add a phone number for this candidate before sharing via WhatsApp.",
        variant: "destructive"
      });
      return;
    }
    
    // Set sharing animation
    setCopiedCandidateId(candidate.id);
    
    try {
      // Generate the secure URL using the correct function
      const { data: url, error } = await supabase.rpc('generate_candidate_update_link', {
        p_candidate_id: candidate.id,
        p_base_url: `${window.location.origin}/candidate-update-mobile/`
      });
      
      if (error) {
        logger.error('Error generating update link:', error);
        throw new Error('Failed to generate secure update link');
      }
      
      if (!url) {
        throw new Error('No URL was generated');
      }
      
      // URL is already complete with the correct origin
      const secureUrl = url;
      
      // Create WhatsApp message text with candidate name, link, and current user's signature
      const senderName = currentUser?.name || 'Team';
      const whatsAppMessage = encodeURIComponent(
        `Hi ${candidate.full_name},\n\nPlease update your information using this link:\n${secureUrl}\n\nThank you!\n- by ${senderName}`
      );
      
      // Format phone number (remove all non-digit characters and ensure it starts with 60 for Malaysia)
      let phoneNumber = candidate.phone_number.replace(/[^\d]/g, '');
      if (!phoneNumber.startsWith('60')) {
        // If number starts with 0, replace with 60
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '60' + phoneNumber.substring(1);
        } else {
          // Add 60 prefix if not present
          phoneNumber = '60' + phoneNumber;
        }
      }
      
      // Open WhatsApp with the message
      const whatsAppUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${whatsAppMessage}`;
      window.open(whatsAppUrl, '_blank');
      
      // Show success message
      toast({
        title: "Opening WhatsApp",
        description: "Sharing secure update link via WhatsApp.",
      });
      
      // Reset the status after 2 seconds
      setTimeout(() => {
        setCopiedCandidateId(null);
      }, 2000);
    } catch (error) {
      logger.error('Error sharing secure link:', error);
      toast({
        title: "Link Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating a secure edit link.",
        variant: "destructive",
      });
      setCopiedCandidateId(null);
    }
  };
  
  // Function to open the report dialog
  const openReportDialog = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation(); // Prevent row click event
    setReportCandidate(candidate);
    setReportDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-4 rounded-none md:rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Candidates</h1>
          <Badge variant="secondary" className="ml-2">
            {candidates.length}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "candidates" ? "default" : "outline"}
            className="flex items-center gap-1"
            onClick={() => setActiveTab("candidates")}
            size="sm"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Manage</span>
          </Button>
          <Button 
            variant={activeTab === "import" ? "default" : "outline"}
            className="flex items-center gap-1"
            onClick={() => setActiveTab("import")}
            size="sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="candidates" className="mt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => setNewDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </div>

          <div className="bg-background rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <TableRow>
                  <TableHead
                    className="font-semibold w-[24%] text-slate-900 dark:text-slate-200 pl-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => {
                      setSortField('name');
                      setSortDirection(prev => sortField === 'name' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      <span>Candidate</span>
                      {sortField === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc'
                            ? <ArrowUp className="h-3 w-3 text-blue-500" />
                            : <ArrowDown className="h-3 w-3 text-blue-500" />}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold w-[22%] text-slate-900 dark:text-slate-200 py-4">Info</TableHead>
                  <TableHead
                    className="font-semibold w-[22%] text-slate-900 dark:text-slate-200 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => {
                      // Create dropdown menu for sorting options
                      const menu = document.createElement('div');
                      menu.className = 'absolute z-50 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 p-1';
                      menu.style.left = (event as MouseEvent).clientX + 'px';
                      menu.style.top = (event as MouseEvent).clientY + 'px';

                      const options = [
                        { label: 'By Tier', value: 'tier' },
                        { label: 'By Experience', value: 'experience' },
                        { label: 'By Vehicle', value: 'vehicle' },
                        { label: 'By Project Count', value: 'availability' }
                      ];

                      options.forEach(option => {
                        const button = document.createElement('button');
                        button.className = 'block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md';
                        button.innerText = option.label;
                        button.onclick = () => {
                          setSortField(option.value);
                          setSortDirection(prev => sortField === option.value ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
                          document.body.removeChild(menu);
                        };
                        menu.appendChild(button);
                      });

                      document.body.appendChild(menu);

                      // Remove menu when clicking elsewhere
                      const removeMenu = () => {
                        if (document.body.contains(menu)) {
                          document.body.removeChild(menu);
                        }
                        document.removeEventListener('click', removeMenu);
                      };

                      setTimeout(() => {
                        document.addEventListener('click', removeMenu);
                      }, 100);
                    }}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      <Filter className={`h-3 w-3 ml-1 ${['tier', 'experience', 'vehicle', 'availability'].includes(sortField || '') ? 'text-blue-500' : 'text-slate-400'}`} />
                      {['tier', 'experience', 'vehicle', 'availability'].includes(sortField || '') && (
                        <>
                          <span className="ml-1">
                            {sortDirection === 'asc'
                              ? <ArrowUp className="h-3 w-3 text-blue-500" />
                              : <ArrowDown className="h-3 w-3 text-blue-500" />}
                          </span>
                          <span className="ml-1 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
                            {sortField === 'tier' ? 'Tier' :
                             sortField === 'experience' ? 'Exp' :
                             sortField === 'vehicle' ? 'Vehicle' :
                             'Projects'}
                          </span>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="font-semibold w-[22%] text-slate-900 dark:text-slate-200 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => {
                      setSortField('rating');
                      setSortDirection(prev => sortField === 'rating' ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
                    }}
                  >
                    <div className="flex items-center">
                      <span>Performance</span>
                      {sortField === 'rating' && (
                        <span className="ml-1">
                          {sortDirection === 'asc'
                            ? <ArrowUp className="h-3 w-3 text-blue-500" />
                            : <ArrowDown className="h-3 w-3 text-blue-500" />}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold w-[10%] text-right text-slate-900 dark:text-slate-200 pr-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCandidates.map((candidate) => {
                  // Calculate age
                  const age = candidate.date_of_birth ?
                    differenceInYears(new Date(), new Date(candidate.date_of_birth)) :
                    "-";

                  // Get initials for avatar
                  const getInitials = (name: string) => {
                    if (!name) return '';

                    const parts = name.split(' ').filter(part => part.trim() !== '');

                    if (parts.length === 0) return '';

                    if (parts.length === 1) {
                      return parts[0].substring(0, 2).toUpperCase();
                    }

                    return (parts[0][0] + parts[1][0]).toUpperCase();
                  };

                  // Format primary language
                  const primaryLanguage = candidate.language_proficiency?.find(l => l.is_primary)?.language || '';

                  // Get tier level for loyalty badge
                  const tierLevel = candidate.loyalty_status?.tier_level || 'bronze';
                  const tierColor = loyaltyTierColors[tierLevel] || loyaltyTierColors.bronze;

                  // Format IC number consistently
                  const formatIcNumber = (ic: string | null | undefined): string => {
                    if (!ic) return '';

                    // Strip all non-alphanumeric characters first
                    const cleaned = ic.replace(/[^a-zA-Z0-9]/g, '');

                    // Malaysian IC format (YYMMDD-PB-###G)
                    if (cleaned.length === 12) {
                      return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 12)}`;
                    }

                    // Older Malaysian IC (before 1990)
                    if (cleaned.length === 7) {
                      return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 7)}`;
                    }

                    // Non-citizen/foreign IDs (digits only without specific format)
                    if (/^\d+$/.test(cleaned) && cleaned.length >= 8) {
                      // Group digits in pairs for readability
                      const parts = [];
                      for (let i = 0; i < cleaned.length; i += 4) {
                        parts.push(cleaned.substring(i, Math.min(i + 4, cleaned.length)));
                      }
                      return parts.join('-');
                    }

                    // For other formats with mixed alphanumeric, apply a simple format if long enough
                    if (cleaned.length >= 8) {
                      return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
                    }

                    // For shorter formats or unusual patterns, just return as is
                    return ic;
                  };

                  return (
                    <TableRow
                      key={candidate.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          {/* Avatar with Status Indicator */}
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-medium text-sm overflow-hidden">
                              {candidate.profile_photo ? (
                                <img
                                  src={candidate.profile_photo}
                                  alt={candidate.full_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitials(candidate.full_name)
                              )}
                            </div>

                            {/* Availability Status Circle at Edge - Checks Projects */}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                                candidate.current_projects_count > 0 ? 'bg-red-500' : // Any project assignment makes them busy
                                'bg-emerald-500' // Only available if no projects
                              }`}
                              title={
                                candidate.current_projects_count > 0 ?
                                  `Not Available (${candidate.current_projects_count} active project${candidate.current_projects_count > 1 ? 's' : ''})` :
                                  'Available'
                              }
                            ></div>
                          </div>

                          {/* Name and ID */}
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-slate-900 dark:text-white text-left">{candidate.full_name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 text-left">
                              {/* Format IC numbers consistently */}
                              {candidate.ic_number ?
                                formatIcNumber(candidate.ic_number) :
                                candidate.unique_id ?
                                  candidate.unique_id :
                                  candidate.id ?
                                    candidate.id.substring(0, 8) :
                                    '—'
                              }
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5">
                          {/* Phone */}
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-slate-500 dark:text-slate-400">📞</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 truncate">{candidate.phone_number}</span>
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-slate-500 dark:text-slate-400">✉️</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 truncate">
                              {candidate.email ? candidate.email : '—'}
                            </span>
                          </div>

                          {/* Last Contact Date */}
                          {candidate.last_contact_date && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-slate-500 dark:text-slate-400">🗓️</span>
                              </div>
                              <div className="text-xs rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <span className="text-slate-500 dark:text-slate-400 mr-1">Last contact:</span>
                                {format(new Date(candidate.last_contact_date), 'MMM d, yyyy')}
                              </div>
                            </div>
                          )}

                          {/* Profile Completeness */}
                          {(() => {
                            // Calculate completeness score based on filled fields
                            const requiredFields = [
                              candidate.full_name,
                              candidate.phone_number,
                              candidate.email,
                              candidate.ic_number,
                              candidate.address,
                              candidate.date_of_birth,
                              candidate.emergency_contact_name,
                              candidate.emergency_contact_phone
                            ];

                            const filledFields = requiredFields.filter(field => field && String(field).trim() !== '').length;
                            const totalFields = requiredFields.length;
                            const completenessPercent = Math.round((filledFields / totalFields) * 100);

                            // Only show for incomplete profiles
                            if (completenessPercent < 100) {
                              let bgColorClass = '';
                              let textColorClass = '';

                              if (completenessPercent < 50) {
                                bgColorClass = 'bg-red-50 dark:bg-red-900/20';
                                textColorClass = 'text-red-600 dark:text-red-400';
                              } else if (completenessPercent < 85) {
                                bgColorClass = 'bg-amber-50 dark:bg-amber-900/20';
                                textColorClass = 'text-amber-600 dark:text-amber-400';
                              } else {
                                bgColorClass = 'bg-blue-50 dark:bg-blue-900/20';
                                textColorClass = 'text-blue-600 dark:text-blue-400';
                              }

                              return (
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">📋</span>
                                  </div>
                                  <div className={`text-xs rounded px-1.5 py-0.5 ${bgColorClass} ${textColorClass}`}>
                                    <span>Profile {completenessPercent}% complete</span>
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5">
                          {/* Status Row */}
                          <div className="flex items-center flex-wrap gap-1">
                            {/* Active/Banned Status */}
                            <Badge
                              variant={candidate.is_banned ? "destructive" : "success"}
                              className="font-normal px-2 py-1 h-6"
                            >
                              {candidate.is_banned ? (
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Banned</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  <span>Active</span>
                                </span>
                              )}
                            </Badge>

                            {/* Loyalty Tier */}
                            {tierLevel && (
                              <Badge className={`px-2 py-1 h-6 ${tierColor}`}>
                                {tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1)}
                              </Badge>
                            )}

                          </div>

                          {/* Details Row */}
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            {/* Age */}
                            {age !== "-" && (
                              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <span className="text-slate-500 dark:text-slate-400">Age:</span>
                                <span className="font-medium">{age}</span>
                              </div>
                            )}

                            {/* Language */}
                            {primaryLanguage && (
                              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                <span>{primaryLanguage}</span>
                              </div>
                            )}

                            {/* Vehicle */}
                            {candidate.has_vehicle ? (
                              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                                <Car className="h-3 w-3" />
                                <span>{candidate.vehicle_type || ''}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Employment Type */}
                          <div className="flex items-center gap-2 mt-1.5">
                            {candidate.employment_type && (
                              <div className="text-xs rounded px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/40">
                                {candidate.employment_type === 'full_time' ? 'Full-time' :
                                 candidate.employment_type === 'part_time' ? 'Part-time' :
                                 candidate.employment_type === 'contract' ? 'Contract' :
                                 candidate.employment_type === 'casual' ? 'Casual' :
                                 candidate.employment_type}
                              </div>
                            )}

                            {/* Years Experience */}
                            {candidate.years_experience > 0 && (
                              <div className="text-xs rounded px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40">
                                <span className="font-medium">{candidate.years_experience}</span> yrs exp
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        {candidate.performance_metrics ? (
                          <div className="flex flex-col gap-1.5">
                            {/* Rating, Gigs & Issues */}
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center h-6 px-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="font-medium text-yellow-700 dark:text-yellow-400">
                                  {candidate.performance_metrics.avg_rating?.toFixed(1) || '—'}
                                </span>
                              </div>

                              <div className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 text-slate-700 dark:text-slate-300">
                                <span className="font-medium">{candidate.performance_metrics.total_gigs_completed || '0'}</span> gigs
                              </div>

                              {/* Issues Toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedIssues(prev => ({
                                    ...prev,
                                    [candidate.id]: !prev[candidate.id]
                                  }));
                                }}
                                className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded px-2 py-0.5 transition-colors"
                              >
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {(candidate.performance_metrics.no_shows || 0) +
                                   (candidate.performance_metrics.late_arrivals || 0) +
                                   (candidate.performance_metrics.early_terminations || 0)} issues
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {expandedIssues[candidate.id] ? '▼' : '▶'}
                                </span>
                              </button>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 text-xs rounded px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-center">
                                <div className="font-medium text-blue-700 dark:text-blue-400">
                                  {candidate.performance_metrics.reliability_score?.toFixed(0) || '0'}%
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">Reliability</div>
                              </div>

                              <div className="flex-1 text-xs rounded px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-center">
                                <div className="font-medium text-purple-700 dark:text-purple-400">
                                  {candidate.performance_metrics.response_rate?.toFixed(0) || '0'}%
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">Response</div>
                              </div>
                            </div>

                            {/* Issues Section - Expanded Issues Only */}
                            {expandedIssues[candidate.id] && (
                              <div className="mt-1.5 text-xs animate-in fade-in-0 slide-in-from-top-1">
                                <div className="grid grid-cols-3 gap-1 w-full">
                                  {/* No Shows */}
                                  <div className={`px-1.5 py-1 rounded flex flex-col items-center justify-center
                                    ${candidate.performance_metrics.no_shows > 0
                                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                  >
                                    <span className="font-semibold">{candidate.performance_metrics.no_shows || 0}</span>
                                    <span className="text-[9px] mt-0.5">No-shows</span>
                                  </div>

                                  {/* Late Arrivals */}
                                  <div className={`px-1.5 py-1 rounded flex flex-col items-center justify-center
                                    ${candidate.performance_metrics.late_arrivals > 0
                                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                  >
                                    <span className="font-semibold">{candidate.performance_metrics.late_arrivals || 0}</span>
                                    <span className="text-[9px] mt-0.5">Late</span>
                                  </div>

                                  {/* Early Terminations */}
                                  <div className={`px-1.5 py-1 rounded flex flex-col items-center justify-center
                                    ${candidate.performance_metrics.early_terminations > 0
                                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                  >
                                    <span className="font-semibold">{candidate.performance_metrics.early_terminations || 0}</span>
                                    <span className="text-[9px] mt-0.5">Quit early</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 dark:text-slate-400">No data available</div>
                        )}
                      </TableCell>


                      <TableCell className="py-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit/View Link button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => shareEditLinkViaWhatsApp(e, candidate)}
                                  className="h-8 w-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                >
                                  {copiedCandidateId === candidate.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Share2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Share update link</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Share via WhatsApp</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Report Button with Tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => openReportDialog(e, candidate)}
                                  className="h-8 w-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                >
                                  <Flag className="h-4 w-4" />
                                  <span className="sr-only">Report candidate</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Report issues or submit feedback</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {sortedCandidates.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-1">No candidates found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Try adjusting your search criteria or create a new candidate.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setNewDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Candidate
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="import" className="mt-0">
          <div className="mb-4">
            <CandidateTextImportTool onOpenNewCandidateDialog={handleOpenNewCandidateDialog} />
          </div>
        </TabsContent>
      </Tabs>
      <NewCandidateDialog
        open={newDialogOpen}
        onOpenChange={(open) => {
          setNewDialogOpen(open);
          if (!open) {
            // Reset the new candidate data when dialog is closed
            setNewCandidateData(null);
          }
        }}
        onCandidateAdded={loadCandidates}
        initialData={newCandidateData}
      />
      <CandidateDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        candidate={selectedCandidate}
      />
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        candidate={reportCandidate}
      />
    </div>
  );
}