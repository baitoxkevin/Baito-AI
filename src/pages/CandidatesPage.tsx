import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { PlusIcon, Search, Loader2, Star, Car, X, FileText, UserPlus, Upload, Share2, Check, Flag, AlertTriangle, ArrowUp, ArrowDown, Filter, Users, TrendingUp, Award, Activity, Edit } from 'lucide-react';
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
import EditCandidateDialog from '@/components/EditCandidateDialog';
import { CandidateTextImportTool } from '@/components/CandidateTextImportTool';
import ReportDialog from '@/components/ReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateActionButton } from '../../CandidateActionButton';

const loyaltyTierColors = {
  bronze: 'bg-gradient-to-r from-orange-500/20 to-orange-400/10 text-orange-600 border-orange-200',
  silver: 'bg-gradient-to-r from-slate-500/20 to-slate-400/10 text-slate-600 border-slate-200',
  gold: 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 text-yellow-600 border-yellow-200',
  platinum: 'bg-gradient-to-r from-purple-500/20 to-purple-400/10 text-purple-600 border-purple-200',
  diamond: 'bg-gradient-to-r from-blue-500/20 to-cyan-400/10 text-blue-600 border-blue-200',
} as const;

const loyaltyTierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
} as const;

// Helper functions for data formatting
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone || phone.trim() === '' || phone.toLowerCase() === 'app' || phone.length < 3) {
    return 'No phone';
  }
  
  // Handle cases where job description or other text was mistakenly entered as phone
  if (phone.length > 50 || phone.includes('Promoter') || phone.includes('@') || phone.includes('counter') || phone.includes('charge')) {
    return 'Invalid phone';
  }
  
  // Clean the phone number
  const cleaned = phone.replace(/\D/g, '');
  
  // Malaysian number format
  if (cleaned.length >= 10 && (cleaned.startsWith('60') || cleaned.startsWith('0'))) {
    if (cleaned.startsWith('60')) {
      const number = cleaned.substring(2);
      return `+60 ${number.substring(0, 2)}-${number.substring(2, 5)} ${number.substring(5)}`;
    } else if (cleaned.startsWith('0')) {
      const number = cleaned.substring(1);
      return `+60 ${number.substring(0, 2)}-${number.substring(2, 5)} ${number.substring(5)}`;
    }
  }
  
  // Return original if can't format properly (but truncate if too long)
  return phone.length > 20 ? phone.substring(0, 20) + '...' : phone;
};

const formatEmail = (email: string | null | undefined): string => {
  if (!email || email.trim() === '' || !email.includes('@')) {
    return 'No email';
  }
  return email;
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportCandidate, setReportCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<string>("candidates");
  const [newCandidateData, setNewCandidateData] = useState<any>(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<{[key: string]: boolean}>({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  // Helper function to format phone numbers consistently
  const formatPhoneNumber = (phone: string | null | undefined): string | JSX.Element => {
    if (!phone || phone.trim() === '' || phone.toLowerCase() === 'app' || phone.length < 8) {
      return <span className="text-slate-400 italic">No phone</span>;
    }
    
    // Clean phone number - remove all non-digit characters except +
    const cleaned = phone.replace(/[^0-9+]/g, '');
    
    // Format Malaysian phone numbers
    if (cleaned.startsWith('+60')) {
      return cleaned.replace(/(\+60)(\d{1,2})(\d{3,4})(\d{4})/, '$1 $2-$3 $4');
    } else if (cleaned.startsWith('60')) {
      return `+${cleaned.replace(/(60)(\d{1,2})(\d{3,4})(\d{4})/, '$1 $2-$3 $4')}`;
    } else if (cleaned.startsWith('0')) {
      return cleaned.replace(/(0)(\d{1,2})(\d{3,4})(\d{4})/, '$1$2-$3 $4');
    }
    
    return phone;
  };

  // Helper function to validate and format email
  const formatEmail = (email: string | null | undefined): string | JSX.Element => {
    if (!email || email.trim() === '' || !email.includes('@')) {
      return <span className="text-slate-400 italic">No email</span>;
    }
    return email;
  };

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching candidates...');
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
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Candidates data:', data);

      if (!data || data.length === 0) {
        console.log('No candidates found in the database');
        // Removed unnecessary toast notification
      }

      setCandidates(data || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
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

  // Filter candidates based on search query with safe null checks
  const filteredCandidates = candidates.filter(candidate => {
    const query = searchQuery.toLowerCase();
    const fullName = (candidate.full_name || '').toLowerCase();
    const email = (candidate.email || '').toLowerCase();
    const phone = (candidate.phone_number || '').toLowerCase();
    
    return fullName.includes(query) || email.includes(query) || phone.includes(query);
  });

  // Sort candidates based on selected field
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: any;
    let valueB: any;

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
  const handleOpenNewCandidateDialog = (candidateData: any) => {
    setNewCandidateData(candidateData);
    setNewDialogOpen(true);
  };
  
  // Function to generate and copy candidate edit link with secure token
  const copyEditLink = async (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation(); // Prevent row click event
    
    // Set copying animation
    setCopiedCandidateId(candidate.id);
    
    try {
      // Generate the secure URL using the correct function
      const { data: url, error } = await supabase.rpc('generate_candidate_update_link', {
        p_candidate_id: candidate.id,
        p_base_url: `${window.location.origin}/candidate-update-mobile/`
      });
      
      if (error) {
        console.error('Error generating update link:', error);
        throw new Error('Failed to generate secure update link');
      }
      
      if (!url) {
        throw new Error('No URL was generated');
      }
      
      // URL is already complete with the correct origin
      const secureUrl = url;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(secureUrl);
      
      // Show success message
      toast({
        title: "Secure Link Copied!",
        description: "Secure candidate update link has been copied to clipboard.",
      });
      
      // Reset the copied status after 2 seconds
      setTimeout(() => {
        setCopiedCandidateId(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying secure link:', error);
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
    <div className="flex flex-col flex-1 p-2 sm:p-6 rounded-none md:rounded-tl-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 min-h-screen">
      {/* Glass Morphism Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/20 dark:border-neutral-700/30 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Candidates</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your talent pipeline</p>
          </div>
          <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-0">
            <Activity className="h-3 w-3 mr-1" />
            {candidates.length} Total
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={activeTab === "candidates" ? "default" : "outline"}
              className={`flex items-center gap-1 transition-all duration-300 ${activeTab === "candidates" ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg' : ''}`}
              onClick={() => setActiveTab("candidates")}
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={activeTab === "import" ? "default" : "outline"}
              className={`flex items-center gap-1 transition-all duration-300 ${activeTab === "import" ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg' : ''}`}
              onClick={() => setActiveTab("import")}
              size="sm"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="candidates" className="mt-0 space-y-4">
          {/* Enhanced Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/20 dark:border-neutral-700/30 shadow-lg"
          >
            <div className="flex-1 relative w-full group">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 group-focus-within:text-blue-500">
                <Search className="h-5 w-5" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 blur-lg opacity-0 group-focus-within:opacity-50 transition-opacity duration-300" />
              </div>
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base bg-white/50 dark:bg-neutral-800/50 border-slate-200/50 dark:border-neutral-700/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 rounded-xl"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg text-white"
                onClick={() => setNewDialogOpen(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </motion.div>
          </motion.div>

          {/* Enhanced Table with Glass Morphism */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-neutral-700/30 shadow-lg overflow-hidden"
          >
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 border-b border-slate-200/50 dark:border-slate-700/50">
                <TableRow>
                  <TableHead
                    className="font-semibold w-[26%] text-slate-900 dark:text-slate-200 pl-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
                    onClick={() => {
                      setSortField('name');
                      setSortDirection(prev => sortField === 'name' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      <span className="group-hover:text-blue-600 transition-colors duration-200">Candidate</span>
                      {sortField === 'name' && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-1"
                        >
                          {sortDirection === 'asc'
                            ? <ArrowUp className="h-3 w-3 text-blue-500 animate-bounce" />
                            : <ArrowDown className="h-3 w-3 text-blue-500 animate-bounce" />}
                        </motion.span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold w-[18%] text-slate-900 dark:text-slate-200 py-4">Info</TableHead>
                  <TableHead
                    className="font-semibold w-[20%] text-slate-900 dark:text-slate-200 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
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
                    className="font-semibold w-[24%] text-slate-900 dark:text-slate-200 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
                    onClick={() => {
                      setSortField('rating');
                      setSortDirection(prev => sortField === 'rating' ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
                    }}
                  >
                    <div className="flex items-center">
                      <span className="group-hover:text-blue-600 transition-colors duration-200">Performance</span>
                      {sortField === 'rating' && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-1"
                        >
                          {sortDirection === 'asc'
                            ? <ArrowUp className="h-3 w-3 text-blue-500 animate-bounce" />
                            : <ArrowDown className="h-3 w-3 text-blue-500 animate-bounce" />}
                        </motion.span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold w-[12%] text-right text-slate-900 dark:text-slate-200 pr-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                {sortedCandidates.map((candidate, index) => {
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
                    <motion.tr
                      key={candidate.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-blue-50/30 dark:hover:from-slate-800/30 dark:hover:to-blue-900/20 border-b border-slate-100/50 dark:border-slate-800/50 transition-all duration-300 group h-auto"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <TableCell className="py-4 px-3">
                        <div className="flex items-center gap-3 h-full">
                          {/* Enhanced Avatar with Status Indicator */}
                          <div className="relative group flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-sm overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md group-hover:scale-110 transition-transform duration-300">
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

                            {/* Enhanced Availability Status with Pulse */}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800 ${
                                candidate.current_projects_count > 0 ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              title={
                                candidate.current_projects_count > 0 ?
                                  `Not Available (${candidate.current_projects_count} active project${candidate.current_projects_count > 1 ? 's' : ''})` :
                                  'Available'
                              }
                            >
                              {candidate.current_projects_count === 0 && (
                                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                              )}
                            </div>
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

                      <TableCell className="py-4 px-3 max-w-0">
                        <div className="flex flex-col gap-2 min-w-0">
                          {/* Phone with hover effect and validation */}
                          <div className="flex items-center gap-2 text-sm group/phone hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-lg px-2 py-1 transition-colors duration-200 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs">📞</span>
                            </div>
                            <span className={`truncate transition-colors duration-200 min-w-0 ${
                              formatPhoneNumber(candidate.phone_number) === 'No phone' || formatPhoneNumber(candidate.phone_number) === 'Invalid phone'
                                ? 'text-slate-400 dark:text-slate-500 italic' 
                                : 'text-slate-700 dark:text-slate-300 group-hover/phone:text-blue-600 dark:group-hover/phone:text-blue-400'
                            }`}>
                              {formatPhoneNumber(candidate.phone_number)}
                            </span>
                          </div>

                          {/* Email with hover effect and validation */}
                          <div className="flex items-center gap-2 text-sm group/email hover:bg-purple-50/50 dark:hover:bg-purple-900/20 rounded-lg px-2 py-1 transition-colors duration-200">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs">✉️</span>
                            </div>
                            <span className={`truncate transition-colors duration-200 ${
                              formatEmail(candidate.email) === 'No email'
                                ? 'text-slate-400 dark:text-slate-500 italic'
                                : 'text-slate-700 dark:text-slate-300 group-hover/email:text-purple-600 dark:group-hover/email:text-purple-400'
                            }`}>
                              {formatEmail(candidate.email)}
                            </span>
                          </div>

                          {/* Last Contact Date with gradient */}
                          {candidate.last_contact_date && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs">🗓️</span>
                              </div>
                              <div className="text-xs rounded px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300">
                                <span className="text-amber-600 dark:text-amber-400 mr-1">Last:</span>
                                {format(new Date(candidate.last_contact_date), 'MMM d, yyyy')}
                              </div>
                            </motion.div>
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
                              candidate.emergency_contact_number || candidate.emergency_contact_phone
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
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">📋</span>
                                  </div>
                                  <div className={`text-xs rounded px-2 py-1 ${bgColorClass} ${textColorClass}`}>
                                    <span>Profile {completenessPercent}% complete</span>
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-3 max-w-0">
                        <div className="flex flex-col gap-2 h-full justify-start min-w-0">
                          {/* Status Row */}
                          <div className="flex items-center flex-wrap gap-1.5">
                            {/* Enhanced Active/Banned Status */}
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                              <Badge
                                variant={candidate.is_banned ? "destructive" : "success"}
                                className={`font-normal px-2 py-1 h-6 ${candidate.is_banned ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-green-600'} text-white border-0 shadow-sm`}
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
                            </motion.div>

                            {/* Enhanced Loyalty Tier with emoji */}
                            {tierLevel && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
                              >
                                <Badge className={`px-2 py-1 h-6 ${tierColor} border shadow-sm`}>
                                  <span className="mr-1">{loyaltyTierEmojis[tierLevel]}</span>
                                  {tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1)}
                                </Badge>
                              </motion.div>
                            )}

                          </div>

                          {/* Details Row */}
                          <div className="flex items-center flex-wrap gap-1.5">
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
                          <div className="flex items-center flex-wrap gap-1.5">
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

                      <TableCell className="py-4 px-3">
                        {candidate.performance_metrics ? (
                          <div className="flex flex-col gap-2 h-full justify-start">
                            {/* Enhanced Rating with gradient */}
                            <div className="flex items-center gap-1.5">
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                className="flex items-center h-6 px-2 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-full text-sm border border-yellow-200 dark:border-yellow-800/50 shadow-sm"
                              >
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="font-medium text-yellow-700 dark:text-yellow-400">
                                  {candidate.performance_metrics.avg_rating?.toFixed(1) || '—'}
                                </span>
                              </motion.div>

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
                            <div className="flex items-center gap-1">
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
                              <div className="text-xs animate-in fade-in-0 slide-in-from-top-1">
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


                      <TableCell className="py-4 px-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditCandidate(candidate);
                                    setEditDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit candidate</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Edit candidate information</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Share Link button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => copyEditLink(e, candidate)}
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
                                <p>Copy secure update link</p>
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
                    </motion.tr>
                  );
                })}
                </AnimatePresence>
              </TableBody>
            </Table>
            {sortedCandidates.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="py-20 text-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl mx-auto animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-2">No candidates found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your search criteria or add a new candidate'}
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg"
                    onClick={() => setNewDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Candidate
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
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
        onCandidateAdded={(success, candidateId) => {
          if (success) {
            console.log('Candidate added successfully, reloading candidates...', candidateId);
            loadCandidates();
          } else {
            console.log('Candidate add failed, not reloading');
          }
        }}
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
      <EditCandidateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onCandidateUpdated={loadCandidates}
        candidate={editCandidate}
      />
    </div>
  );
}