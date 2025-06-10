import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInYears } from 'date-fns';
import { 
  User, Phone, Mail, MapPin, Briefcase, Star, Calendar, CreditCard, 
  Activity, Award, Shield, Clock, AlertCircle,
  Copy, CheckCircle, HistoryIcon, Building, FileText, Ban, X,
  Wallet, DollarSign, Receipt, BanknoteIcon, CalendarDays, 
  Coffee, CheckSquare, ArrowUpDown, CalendarClock, Users2,
  Sparkles, GraduationCap, BarChart, Link,
  Flame, Film, Zap, Languages,
  LucideIcon, CheckCircle2, CircleDashed, Pencil, Car
} from 'lucide-react';
// import { CandidateActionButton } from './CandidateActionButton';
import CandidateProjectHistory from './CandidateProjectHistory';
import NewCandidateDialog from './NewCandidateDialog';
import { CandidateProjectApplications } from './CandidateProjectApplications';
import { getCandidateMetrics } from '@/lib/candidate-history-service';
import { isBlacklisted } from '@/lib/blacklist-service';
import { supabase } from '@/lib/supabase';
import type { Candidate } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CandidateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
}

export function CandidateDetailsDialog({
  open,
  onOpenChange,
  candidate
}: CandidateDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<unknown>(null);
  const [isBlacklistedStatus, setIsBlacklistedStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updateLinkLoading, setUpdateLinkLoading] = useState(false);
  const [showUpdateLink, setShowUpdateLink] = useState(false);
  const [updateLinkCopied, setUpdateLinkCopied] = useState(false);
  const [updateLinkError, setUpdateLinkError] = useState('');
  const [updateLink, setUpdateLink] = useState('');
  const { toast } = useToast();
  
  // Load candidate metrics and blacklist status
  useEffect(() => {
    if (candidate && open) {
      const loadData = async () => {
        setLoading(true);
        try {
          // Create default metrics if fetching fails
          let candidateMetrics = {
            averageRating: 0,
            completionRate: 0,
            onTimePercentage: 0,
            totalProjects: 0,
            lastProjectDate: null,
            ratingBreakdown: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            },
            longestStreak: 0
          };
          
          try {
            const fetchedMetrics = await getCandidateMetrics(candidate.id);
            if (fetchedMetrics) {
              candidateMetrics = {
                ...fetchedMetrics,
                ratingBreakdown: {
                  1: fetchedMetrics.ratingBreakdown[1] || 0,
                  2: fetchedMetrics.ratingBreakdown[2] || 0,
                  3: fetchedMetrics.ratingBreakdown[3] || 0,
                  4: fetchedMetrics.ratingBreakdown[4] || 0,
                  5: fetchedMetrics.ratingBreakdown[5] || 0
                }
              };
            }
          } catch (metricsError) {
            console.warn('Error loading metrics, using default values:', metricsError);
          }
          
          setMetrics(candidateMetrics);
          
          // Set default blacklist status to false if checking fails
          let blacklisted = false;
          try {
            blacklisted = await isBlacklisted(candidate.id);
          } catch (blacklistError) {
            console.warn('Error checking blacklist status, using default:', blacklistError);
          }
          
          setIsBlacklistedStatus(blacklisted);
        } catch (error) {
          console.error('Error loading candidate data:', error);
          toast({
            title: "Error loading data",
            description: "Some candidate data could not be loaded. Showing partial information.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [candidate, open, toast]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate secure update link for candidate
  const generateUpdateLink = async () => {
    if (!candidate) return;
    
    setUpdateLinkLoading(true);
    setUpdateLinkError('');
    setUpdateLinkCopied(false);
    
    try {
      // Get base URL from current location
      const baseUrl = window.location.origin;
      const updatePath = '/candidate-update-mobile/'; // Using mobile version
      
      // Call the Supabase function to generate a secure token and link
      const { data, error } = await supabase.rpc('generate_candidate_update_link', {
        p_candidate_id: candidate.id,
        p_base_url: `${baseUrl}${updatePath}`
      });
      
      if (error) {
        console.error('Error generating update link:', error);
        setUpdateLinkError('Could not generate update link. Please try again.');
        return;
      }
      
      // Set the update link and show it
      setUpdateLink(data);
      setShowUpdateLink(true);
      
      toast({
        title: "Update link generated",
        description: "Copy the link to share with the candidate."
      });
    } catch (error) {
      console.error('Error in generateUpdateLink:', error);
      setUpdateLinkError('An error occurred. Please try again.');
    } finally {
      setUpdateLinkLoading(false);
    }
  };
  
  // Handle copying update link to clipboard
  const copyUpdateLink = async () => {
    try {
      await navigator.clipboard.writeText(updateLink);
      setUpdateLinkCopied(true);
      setTimeout(() => setUpdateLinkCopied(false), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setUpdateLinkError('Could not copy to clipboard. Please copy manually.');
    }
  };
  
  // Format address object to string with improved flexibility
  const formatAddress = (address: unknown): string => {
    if (!address) return 'No address provided';
    
    if (typeof address === 'string') return address;
    
    try {
      const parts = [];
      
      // Support different address field naming conventions
      if (address.street || address.address_line1 || address.line1 || address.street_address) {
        parts.push(address.street || address.address_line1 || address.line1 || address.street_address);
      }
      
      if (address.address_line2 || address.line2) {
        parts.push(address.address_line2 || address.line2);
      }
      
      if (address.city || address.town) {
        parts.push(address.city || address.town);
      }
      
      if (address.state || address.province || address.region) {
        parts.push(address.state || address.province || address.region);
      }
      
      if (address.postcode || address.postal_code || address.zip || address.zip_code) {
        parts.push(address.postcode || address.postal_code || address.zip || address.zip_code);
      }
      
      if (address.country || address.country_code || address.country_name) {
        parts.push(address.country || address.country_code || address.country_name);
      }
      
      // If we have a formatted_address field, use that as a fallback
      if (parts.length === 0 && address.formatted_address) {
        return address.formatted_address;
      }
      
      // If we have a full_address field, use that as a fallback
      if (parts.length === 0 && address.full_address) {
        return address.full_address;
      }
      
      // As a last resort, try to stringify the entire object if no specific fields found
      if (parts.length === 0) {
        const allValues = Object.values(address).filter(val => 
          typeof val === 'string' && val.length > 0
        );
        if (allValues.length > 0) {
          return allValues.join(', ');
        }
      }
      
      return parts.length > 0 ? parts.join(', ') : 'Address details not available';
    } catch (error) {
      console.error('Error formatting address:', error);
      return 'Invalid address format';
    }
  };

  // Calculate age only if candidate and date_of_birth exist
  const age = candidate?.date_of_birth 
    ? (() => {
        try {
          return differenceInYears(new Date(), new Date(candidate.date_of_birth));
        } catch (error) {
          console.error('Error calculating age:', error);
          return null;
        }
      })()
    : null;

  const loyaltyTierColors = {
    bronze: 'bg-orange-500/10 text-orange-500',
    silver: 'bg-slate-500/10 text-slate-500',
    gold: 'bg-yellow-500/10 text-yellow-500',
    platinum: 'bg-purple-500/10 text-purple-500',
    diamond: 'bg-blue-500/10 text-blue-500',
  } as const;

  // Interface for the info card component
  interface InfoCardProps {
    icon: LucideIcon;
    title: string;
    value: string | React.ReactNode;
    color?: string;
    className?: string;
  }

  // Modern info card component
  const InfoCard = ({ 
    icon: Icon, 
    title, 
    value, 
    color: _color = "bg-blue-500", // Keep parameter for backward compatibility
    className 
  }: InfoCardProps) => {
    return (
      <div className={cn(
        "p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm hover:shadow-md transition-all duration-200",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <div className="mt-0.5 font-medium text-sm">{value}</div>
          </div>
        </div>
      </div>
    );
  };

  // Metric card for performance metrics
  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    maxValue = 100,
    suffix = "",
    color: _color = "from-blue-500 to-indigo-600" // Keep parameter for backward compatibility
  }: {
    icon: LucideIcon;
    title: string;
    value: number;
    maxValue?: number;
    suffix?: string;
    color?: string;
  }) => {
    const percentage = Math.min(100, (value / maxValue) * 100);
    
    return (
      <div className="relative overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm">
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400">
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1">
            <div className="text-xl font-bold">{value}{suffix}</div>
            {maxValue !== 100 && <div className="text-xs text-gray-500 dark:text-gray-400">/ {maxValue}{suffix}</div>}
          </div>
          
          <div className="mt-2">
            <Progress className="h-1 bg-gray-100 dark:bg-gray-800 text-blue-500 dark:text-blue-500" value={percentage} />
          </div>
        </div>
      </div>
    );
  };

  // Status badge component
  const StatusBadge = ({ 
    status, 
    size = "sm" 
  }: { 
    status: { 
      label: string; 
      color: string;
      icon?: LucideIcon;
    };
    size?: "sm" | "md"; 
  }) => {
    const IconComponent = status.icon || CheckCircle2;
    
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-2 rounded-full border border-gray-100 dark:border-gray-800",
        size === "sm" ? "py-0.5 text-xs" : "py-0.5 text-xs",
        status.color
      )}>
        <IconComponent className="w-3 h-3" />
        <span>{status.label}</span>
      </div>
    );
  };

  // If no candidate data, render a simplified dialog
  if (!candidate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-0 shadow-2xl">
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"></div>
                <AlertCircle className="absolute inset-0 m-auto h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No candidate data available</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">The candidate information could not be loaded.</p>
              <DialogClose asChild>
                <Button variant="outline" className="rounded-full px-6">Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Determine status colors and labels
  const getStatusInfo = (isActive: boolean) => {
    return isActive
      ? { label: "Active", color: "bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400", icon: CheckCircle2 }
      : { label: "Banned", color: "bg-gray-100 text-red-600 dark:bg-gray-800 dark:text-red-400", icon: Ban };
  };

  const getLoyaltyTierInfo = (tier: string = 'bronze') => {
    // Use a single icon for all tiers for consistency
    const icon = Award;
    
    return {
      label: tier.charAt(0).toUpperCase() + tier.slice(1),  // Capitalize first letter
      color: "bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400",
      icon
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
        {/* Hero Banner with Glassmorphism */}
        <div 
          className="relative h-24 w-full overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at top, ${candidate.is_banned ? '#991b1b, #450a0a' : '#1e293b, #0f172a'})`,
          }}
        >
          {/* Abstract pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '120px 120px',
            }}
          ></div>
          
          {/* Glowing orbs effect */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
          
          {/* Edit and Close buttons */}
          <div className="absolute top-6 left-6">
            <Button
              size="icon"
              variant="ghost" 
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full h-8 w-8 shadow-lg"
              onClick={() => setEditDialogOpen(true)}
              title="Edit profile"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="absolute top-6 right-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full h-8 w-8 shadow-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Candidate quick stats */}
          <div className="absolute bottom-6 right-6 left-6 flex flex-wrap justify-end gap-2">
            <StatusBadge 
              status={getStatusInfo(!candidate.is_banned)}
              size="md"
            />
            
            {candidate.loyalty_status?.tier_level && (
              <StatusBadge 
                status={getLoyaltyTierInfo(candidate.loyalty_status.tier_level)}
                size="md"
              />
            )}
            
            {candidate.has_vehicle && (
              <StatusBadge 
                status={{ 
                  label: candidate.vehicle_type || "Has Vehicle", 
                  color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                  icon: Car
                }}
                size="md"
              />
            )}
          </div>
        </div>
        
        {/* Profile Header with Avatar */}
        <div className="relative px-5 sm:px-6 py-3 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            {/* Medium avatar with glow effect */}
            <div className="relative">
              <div className="absolute -inset-1 bg-blue-600 rounded-full blur-sm opacity-50"></div>
              <Avatar className="h-20 w-20 border-2 border-white dark:border-gray-900 shadow-lg relative z-10">
                <AvatarImage 
                  src={
                    // Try both locations for profile photo
                    candidate.profile_photo || 
                    (candidate.custom_fields && candidate.custom_fields.profile_photo) || 
                    null
                  } 
                  alt={candidate.full_name} 
                />
                <AvatarFallback className="text-lg">{getInitials(candidate.full_name)}</AvatarFallback>
              </Avatar>
            </div>
            
            {/* Profile details with glassmorphism effect */}
            <div className="flex-1 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg border border-gray-100 dark:border-gray-800 shadow-lg">
              {/* Name and ID */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {candidate.full_name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-0.5">
                    {candidate.ic_number && `ID: ${candidate.ic_number}`}
                  </p>
                </div>
                
                {/* Candidate ID as clipboardable badge */}
                {candidate.id && (
                  <button
                    className="group flex items-center gap-1.5 px-2 py-1 font-mono text-xs rounded-md transition-all bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700"
                    onClick={() => {
                      navigator.clipboard.writeText(candidate.id);
                      setCopied(true);
                      toast({
                        title: "ID Copied",
                        description: "Candidate ID copied to clipboard",
                        variant: "success",
                      });
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <div className="text-gray-600 dark:text-gray-400">
                      {copied ? 
                        <CheckCircle className="h-3 w-3 text-emerald-500" /> : 
                        <Copy className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                      }
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">ID</span>
                  </button>
                )}
              </div>
              
              {/* Contact details in compact row */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Mail className="h-3 w-3 text-blue-500" />
                  <span>{candidate.email || 'No email'}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Phone className="h-3 w-3 text-blue-500" />
                  <span>{candidate.phone_number || 'No phone'}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <MapPin className="h-3 w-3 text-blue-500" />
                  <span>{candidate.nationality || 'Not specified'}</span>
                </div>
                
                {candidate.emergency_contact_name && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span>Emergency: {candidate.emergency_contact_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col px-5 sm:px-6 mt-2">
          <div className="mb-3">
            <TabsList className="flex justify-start w-full p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 overflow-x-auto">
              <TabsTrigger 
                value="basic"
                className="relative px-2 py-1 border-l-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-r-md data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`${activeTab === 'basic' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-xs">Profile</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="performance"
                className="relative px-2 py-1 border-l-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-r-md data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`${activeTab === 'performance' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-xs">Performance</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="history"
                className="relative px-2 py-1 border-l-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-r-md data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                    <HistoryIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-xs">History</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="financial"
                className="relative px-2 py-1 border-l-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-r-md data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`${activeTab === 'financial' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-xs">Financial</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="availability"
                className="relative px-2 py-1 border-l-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-r-md data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`${activeTab === 'availability' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-xs">Availability</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="applications"
                className="relative px-2 py-1 border-l-2 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-r-md data-[state=active]:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className={`${activeTab === 'applications' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-xs">Applications</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic" className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Main Info Column */}
                <div className="md:col-span-2 space-y-3">
                  {/* Personal Section */}
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoCard 
                        icon={Calendar} 
                        title="Date of Birth" 
                        value={
                          candidate.date_of_birth 
                            ? `${(() => {
                                try {
                                  return format(new Date(candidate.date_of_birth), 'dd MMM yyyy');
                                } catch (error) {
                                  console.error('Error formatting date of birth:', error);
                                  return 'Invalid date format';
                                }
                              })()} ${age !== null ? `(${age} years)` : ''}`
                            : 'Not provided'
                        }
                        color="bg-orange-500"
                      />
                      
                      <InfoCard 
                        icon={MapPin} 
                        title="Nationality" 
                        value={candidate.nationality || 'Not specified'}
                        color="bg-purple-500"
                      />
                      
                      <InfoCard 
                        icon={Mail} 
                        title="Email Address" 
                        value={
                          <a href={`mailto:${candidate.email}`} className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                            {candidate.email}
                          </a>
                        }
                        color="bg-blue-500"
                      />
                      
                      <InfoCard 
                        icon={Phone} 
                        title="Phone Number" 
                        value={
                          <a href={`tel:${candidate.phone_number}`} className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                            {candidate.phone_number}
                          </a>
                        }
                        color="bg-green-500"
                      />
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div>
                    <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      Address Information
                    </h3>
                    
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Home Address</h4>
                          <p className="font-medium text-sm">
                            {(() => {
                              // Try different address formats in this order of preference
                              if (typeof candidate.address_home === 'object' && candidate.address_home) {
                                return formatAddress(candidate.address_home);
                              } else if (typeof candidate.custom_fields?.address === 'object' && candidate.custom_fields?.address) {
                                return formatAddress(candidate.custom_fields.address);
                              } else if (candidate.custom_fields?.address_home && typeof candidate.custom_fields.address_home === 'object') {
                                return formatAddress(candidate.custom_fields.address_home);
                              } else if (typeof candidate.custom_fields?.full_address === 'string') {
                                return candidate.custom_fields.full_address;
                              } else {
                                return candidate.address_home || 
                                       candidate.custom_fields?.address || 
                                       candidate.custom_fields?.address_line || 
                                       'No address provided';
                              }
                            })()}
                          </p>
                        </div>
                        
                        {(candidate.address_business || 
                          candidate.custom_fields?.business_address || 
                          candidate.custom_fields?.address_business || 
                          candidate.custom_fields?.business_full_address || 
                          candidate.custom_fields?.company_address) && (
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Business Address</h4>
                            <p className="font-medium text-sm">
                              {(() => {
                                // Try different business address formats in this order of preference
                                if (typeof candidate.address_business === 'object' && candidate.address_business) {
                                  return formatAddress(candidate.address_business);
                                } else if (typeof candidate.custom_fields?.business_address === 'object' && candidate.custom_fields?.business_address) {
                                  return formatAddress(candidate.custom_fields.business_address);
                                } else if (candidate.custom_fields?.address_business && typeof candidate.custom_fields.address_business === 'object') {
                                  return formatAddress(candidate.custom_fields.address_business);
                                } else if (typeof candidate.custom_fields?.business_full_address === 'string') {
                                  return candidate.custom_fields.business_full_address;
                                } else {
                                  return candidate.address_business || 
                                         candidate.custom_fields?.business_address || 
                                         candidate.custom_fields?.company_address || 
                                         'No business address provided';
                                }
                              })()}
                            </p>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                  
                  {/* Education & Languages Section */}
                  <div>
                    <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      Education & Skills
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoCard 
                        icon={GraduationCap} 
                        title="Highest Education" 
                        value={candidate.highest_education || 'Not specified'}
                        color="bg-amber-500"
                      />
                      
                      <InfoCard 
                        icon={Languages} 
                        title="Languages" 
                        value={
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              // Try to find languages in different possible formats
                              let languages: string[] = [];
                              
                              if (Array.isArray(candidate.custom_fields?.languages)) {
                                languages = candidate.custom_fields?.languages;
                              } else if (Array.isArray(candidate.custom_fields?.spoken_languages)) {
                                languages = candidate.custom_fields?.spoken_languages;
                              } else if (Array.isArray(candidate.custom_fields?.language_proficiency)) {
                                languages = candidate.custom_fields?.language_proficiency.map((l: unknown) => 
                                  typeof l === 'object' ? l.language : l);
                              } else if (typeof candidate.custom_fields?.languages === 'string') {
                                // Handle comma-separated string
                                languages = candidate.custom_fields.languages.split(',').map(l => l.trim());
                              } else if (typeof candidate.custom_fields?.spoken_languages === 'string') {
                                languages = candidate.custom_fields.spoken_languages.split(',').map(l => l.trim());
                              }
                              
                              // Default to English if no languages specified
                              if (!languages || languages.length === 0) {
                                languages = ['English'];
                              }
                              
                              return languages.map((language: string, index: number) => (
                                <span 
                                  key={index}
                                  className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 rounded-full border border-teal-100 dark:border-teal-900/50"
                                >
                                  {language}
                                </span>
                              ));
                            })()}
                          </div>
                        }
                        color="bg-teal-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Sidebar Column */}
                <div className="space-y-6">
                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                      Emergency Contact
                    </h3>
                    
                    <div className="p-3 rounded-xl border border-red-100 dark:border-red-900/20 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Contact Name</h4>
                          <p className="font-medium text-sm">
                            {candidate.emergency_contact_name || 
                             candidate.custom_fields?.emergency_contact?.name || 
                             candidate.custom_fields?.emergency_name || 
                             'Not provided'}
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-red-100 dark:border-red-900/30">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Contact Number</h4>
                          <p className="font-medium text-sm">
                            {(() => {
                              const contactNumber = candidate.emergency_contact_number || 
                                                   candidate.custom_fields?.emergency_contact?.phone || 
                                                   candidate.custom_fields?.emergency_phone ||
                                                   candidate.custom_fields?.emergency_contact_number;
                              
                              return contactNumber ? (
                                <a href={`tel:${contactNumber}`} className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                                  {contactNumber}
                                </a>
                              ) : 'Not provided';
                            })()}
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-red-100 dark:border-red-900/30">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Relationship</h4>
                          <p className="font-medium text-sm">
                            {candidate.emergency_contact_relationship || 
                             candidate.custom_fields?.emergency_relationship || 
                             candidate.custom_fields?.emergency_contact?.relationship ||
                             candidate.custom_fields?.emergency_contact_relationship || 
                             'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transportation */}
                  <div>
                    <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                      <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                        <Car className="h-3.5 w-3.5" />
                      </div>
                      Transportation
                    </h3>
                    
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Has Vehicle</h4>
                        <StatusBadge 
                          status={
                            (candidate.has_vehicle || candidate.custom_fields?.has_vehicle || candidate.custom_fields?.vehicle?.has_vehicle)
                              ? { label: "Yes", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle2 }
                              : { label: "No", color: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400", icon: CircleDashed }
                          }
                        />
                      </div>
                      
                      {(candidate.has_vehicle || candidate.custom_fields?.has_vehicle || candidate.custom_fields?.vehicle?.has_vehicle) && (
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Vehicle Type</h4>
                          <p className="font-medium text-sm">
                            {candidate.vehicle_type || 
                             candidate.custom_fields?.vehicle_type || 
                             candidate.custom_fields?.vehicle?.type || 
                             'Vehicle type not specified'}
                          </p>
                        </div>
                      )}
                      
                      {(candidate.custom_fields?.license_type || 
                        candidate.custom_fields?.license_number || 
                        candidate.custom_fields?.driving_license?.type || 
                        candidate.custom_fields?.driving_license?.number || 
                        candidate.custom_fields?.license?.type ||
                        candidate.custom_fields?.license?.number) && (
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                          {(candidate.custom_fields?.license_type || 
                            candidate.custom_fields?.driving_license?.type || 
                            candidate.custom_fields?.license?.type) && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">License Type</h4>
                              <p className="font-medium text-sm">
                                {candidate.custom_fields?.license_type || 
                                 candidate.custom_fields?.driving_license?.type || 
                                 candidate.custom_fields?.license?.type}
                              </p>
                            </div>
                          )}
                          
                          {(candidate.custom_fields?.license_number || 
                            candidate.custom_fields?.driving_license?.number || 
                            candidate.custom_fields?.license?.number) && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">License Number</h4>
                              <p className="font-medium text-sm font-mono">
                                {candidate.custom_fields?.license_number || 
                                 candidate.custom_fields?.driving_license?.number || 
                                 candidate.custom_fields?.license?.number}
                              </p>
                            </div>
                          )}
                          
                          {(candidate.custom_fields?.license_expiry || 
                           candidate.custom_fields?.driving_license?.expiry_date || 
                           candidate.custom_fields?.license?.expiry_date) && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">License Expiry</h4>
                              <p className="font-medium text-sm">
                                {(() => {
                                  const expiryDate = candidate.custom_fields?.license_expiry || 
                                                    candidate.custom_fields?.driving_license?.expiry_date || 
                                                    candidate.custom_fields?.license?.expiry_date;
                                  try {
                                    return format(new Date(expiryDate), 'PP');
                                  } catch (error) {
                                    console.warn('Error formatting license expiry date:', error);
                                    return expiryDate;
                                  }
                                })()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Banking Information Section (Only if available) */}
              {(candidate.bank_name || 
               candidate.bank_account_number || 
               candidate.custom_fields?.bank_name || 
               candidate.custom_fields?.bank_account_number || 
               candidate.custom_fields?.banking?.bank_name ||
               candidate.custom_fields?.banking?.account_number ||
               candidate.custom_fields?.swift_code ||
               candidate.custom_fields?.banking?.swift_code) && (
                <div>
                  <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                    <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                      <BanknoteIcon className="h-3.5 w-3.5" />
                    </div>
                    Banking Information
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <InfoCard 
                      icon={Building} 
                      title="Bank Name" 
                      value={candidate.bank_name || 
                             candidate.custom_fields?.bank_name ||
                             candidate.custom_fields?.banking?.bank_name ||
                             'Not provided'}
                      color="bg-indigo-500"
                    />
                    
                    <InfoCard 
                      icon={CreditCard} 
                      title="Account Number" 
                      value={
                        <span className="font-mono text-sm">
                          {(() => {
                            const accountNumber = candidate.bank_account_number || 
                                                 candidate.custom_fields?.bank_account_number ||
                                                 candidate.custom_fields?.banking?.account_number;
                            
                            return accountNumber
                              ? accountNumber.replace(/(\d{4})/g, '$1 ').trim()
                              : 'Not provided';
                          })()}
                        </span>
                      }
                      color="bg-yellow-500"
                    />
                    
                    {(candidate.custom_fields?.swift_code || candidate.custom_fields?.banking?.swift_code) && (
                      <InfoCard 
                        icon={Zap} 
                        title="SWIFT / BIC Code" 
                        value={
                          <span className="font-mono text-sm">
                            {candidate.custom_fields?.swift_code || 
                             candidate.custom_fields?.banking?.swift_code}
                          </span>
                        }
                        color="bg-purple-500"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="flex-1 overflow-y-auto pb-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-16">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/20 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                    <Activity className="absolute inset-0 m-auto h-10 w-10 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Loading performance data</h3>
                  <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch the latest metrics</p>
                </div>
              </div>
            ) : metrics ? (
              <div className="space-y-4">
                {/* Performance Summary Header */}
                <div className="mb-2">
                  <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-1 text-gray-800 dark:text-gray-200">
                    <div className="p-1 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    Performance Overview
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 ml-7 text-xs">
                    Performance metrics based on {metrics.totalProjects} completed projects
                  </p>
                </div>
                
                {/* Performance Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Rating Metric */}
                  <MetricCard 
                    icon={Star}
                    title="Average Rating"
                    value={Number(metrics.averageRating.toFixed(1))}
                    maxValue={5}
                  />
                  
                  {/* Completion Rate */}
                  <MetricCard 
                    icon={Shield}
                    title="Completion Rate"
                    value={metrics.completionRate}
                    suffix="%"
                  />
                  
                  {/* On-Time Rate */}
                  <MetricCard 
                    icon={Clock}
                    title="On-Time Rate"
                    value={metrics.onTimePercentage}
                    suffix="%"
                  />
                </div>
                
                {/* Star Rating Visualization */}
                <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-blue-500 text-blue-500" />
                      <span>Rating Breakdown</span>
                    </h3>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-700 dark:text-gray-300">{metrics.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/ 5.0</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= Math.round(metrics.averageRating)
                            ? 'text-blue-500 fill-blue-500'
                            : star <= metrics.averageRating
                              ? 'text-blue-400 fill-blue-400'
                              : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      // Handle undefined metrics and ratingBreakdown
                      const ratingBreakdown = metrics?.ratingBreakdown || {};
                      const percentage = ratingBreakdown[rating] || 0;
                      
                      return (
                        <div key={rating} className="flex flex-col items-center">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{rating} ★</div>
                          <div className="w-full h-16 bg-gray-100 dark:bg-gray-800 rounded-md relative overflow-hidden">
                            <div 
                              className="absolute bottom-0 left-0 right-0 bg-blue-400 dark:bg-blue-600"
                              style={{ height: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs font-medium mt-1">{percentage}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Work History */}
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4 text-gray-800 dark:text-gray-200">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      Work Summary
                    </h3>
                    
                    <div className="space-y-4">
                      <InfoCard 
                        icon={Briefcase} 
                        title="Total Projects Completed" 
                        value={
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl font-bold">{metrics.totalProjects}</span>
                            {metrics.totalProjects > 10 && 
                              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Experienced
                              </Badge>
                            }
                          </div>
                        }
                        color="bg-blue-600"
                      />
                      
                      {metrics.lastProjectDate ? (
                        <InfoCard 
                          icon={Calendar} 
                          title="Last Project Date" 
                          value={(() => {
                            try {
                              return format(new Date(metrics.lastProjectDate), 'PPP');
                            } catch (error) {
                              console.error('Error formatting last project date:', error);
                              return 'Invalid date format';
                            }
                          })()}
                          color="bg-purple-600"
                        />
                      ) : (
                        <InfoCard 
                          icon={Calendar} 
                          title="Last Project Date" 
                          value="No projects completed yet"
                          color="bg-purple-600"
                        />
                      )}
                      
                      <InfoCard 
                        icon={Flame} 
                        title="Longest Project Streak" 
                        value={
                          <div className="flex items-center gap-1.5">
                            <span>{metrics.longestStreak || 0}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">consecutive projects</span>
                          </div>
                        }
                        color="bg-red-600"
                      />
                      
                      {isBlacklistedStatus && (
                        <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-red-500 text-white">
                              <Ban className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-red-700 dark:text-red-400">Blacklist Warning</h3>
                              <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                                This candidate has been blacklisted and shouldn't be considered for new projects.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Loyalty Program */}
                  {candidate.loyalty_status?.tier_level ? (
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4 text-gray-800 dark:text-gray-200">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Award className="h-4 w-4" />
                        </div>
                        Loyalty Program
                      </h3>
                      
                      {/* Tier Card */}
                      <div className="p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Tier</h4>
                          <StatusBadge 
                            status={getLoyaltyTierInfo(candidate.loyalty_status.tier_level)} 
                            size="md" 
                          />
                        </div>
                        
                        {/* Progress to next tier */}
                        <div className="mt-4">
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Progress to next tier</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {candidate.loyalty_status.current_points || 0} / {(() => {
                              const tierThresholds = {
                                bronze: 100,
                                silver: 500,
                                gold: 1000,
                                platinum: 2500,
                                diamond: 5000
                              };
                              const currentTier = candidate.loyalty_status.tier_level;
                              const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
                              const currentIndex = tiers.indexOf(currentTier);
                              const nextTier = tiers[currentIndex + 1];
                              return tierThresholds[nextTier as keyof typeof tierThresholds] || tierThresholds.diamond;
                            })()} points
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 dark:bg-blue-600"
                              style={{ 
                                width: `${Math.min(100, ((candidate.loyalty_status.current_points || 0) / (() => {
                                const tierThresholds = {
                                  bronze: 100,
                                  silver: 500,
                                  gold: 1000,
                                  platinum: 2500,
                                  diamond: 5000
                                };
                                const currentTier = candidate.loyalty_status.tier_level;
                                const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
                                const currentIndex = tiers.indexOf(currentTier);
                                const nextTier = tiers[currentIndex + 1];
                                return tierThresholds[nextTier as keyof typeof tierThresholds] || tierThresholds.diamond;
                              })()) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {candidate.loyalty_status.tier_achieved_date ? (
                          <InfoCard 
                            icon={Calendar} 
                            title="Tier Achieved" 
                            value={(() => {
                              try {
                                return format(new Date(candidate.loyalty_status.tier_achieved_date), 'PPP');
                              } catch (error) {
                                console.error('Error formatting tier achieved date:', error);
                                return 'Invalid date format';
                              }
                            })()}
                            color="bg-amber-500"
                          />
                        ) : null}
                        
                        {candidate.loyalty_status.points_expiry_date ? (
                          <InfoCard 
                            icon={Clock} 
                            title="Points Expiry" 
                            value={
                              <div className="flex items-center gap-1.5">
                                <span>
                                  {(() => {
                                    try {
                                      return format(new Date(candidate.loyalty_status.points_expiry_date), 'PPP');
                                    } catch (error) {
                                      console.error('Error formatting points expiry date:', error);
                                      return 'Invalid date format';
                                    }
                                  })()}
                                </span>
                                {(() => {
                                  try {
                                    return new Date(candidate.loyalty_status.points_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                      <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                        Soon
                                      </Badge>
                                    );
                                  } catch (error) {
                                    console.error('Error comparing points expiry date:', error);
                                    return null;
                                  }
                                })()}
                              </div>
                            }
                            color="bg-red-500"
                          />
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4 text-gray-800 dark:text-gray-200">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Award className="h-4 w-4" />
                        </div>
                        Loyalty Program
                      </h3>
                      
                      <div className="p-8 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm text-center">
                        <Award className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                        <h4 className="text-lg font-medium mb-1">Not Enrolled</h4>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          This candidate is not currently enrolled in the loyalty program.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Activity className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No Performance Data</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
                    This candidate hasn't completed any projects yet.
                    Performance metrics will appear here once they start working on assignments.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Project History Tab */}
          <TabsContent value="history" className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              {/* History Header */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <HistoryIcon className="h-4 w-4" />
                  </div>
                  Work History
                </h3>
                <p className="text-gray-500 dark:text-gray-400 ml-10">
                  Previous projects and assignments
                </p>
              </div>
              
              {/* Project History Card */}
              <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                {(() => {
                  try {
                    return (
                      <CandidateProjectHistory 
                        candidateId={candidate.id}
                        showAddRating={false}
                        onHistoryUpdated={() => {
                          // Refresh metrics when history is updated
                          const refreshMetrics = async () => {
                            try {
                              // Create default metrics if fetching fails
                              let candidateMetrics = {
                                averageRating: 0,
                                completionRate: 0,
                                onTimePercentage: 0,
                                totalProjects: 0,
                                lastProjectDate: null,
                                ratingBreakdown: {
                                  1: 0,
                                  2: 0,
                                  3: 0,
                                  4: 0,
                                  5: 0
                                },
                                longestStreak: 0
                              };
                              
                              try {
                                const fetchedMetrics = await getCandidateMetrics(candidate.id);
                                if (fetchedMetrics) {
                                  candidateMetrics = fetchedMetrics;
                                }
                              } catch (metricsError) {
                                console.warn('Error refreshing metrics, using default values:', metricsError);
                              }
                              
                              setMetrics(candidateMetrics);
                              
                              // Set default blacklist status to false if checking fails
                              let blacklisted = false;
                              try {
                                blacklisted = await isBlacklisted(candidate.id);
                              } catch (blacklistError) {
                                console.warn('Error checking blacklist status, using default:', blacklistError);
                              }
                              
                              setIsBlacklistedStatus(blacklisted);
                            } catch (error) {
                              console.error('Error refreshing metrics:', error);
                            }
                          };
                          
                          refreshMetrics();
                        }}
                      />
                    );
                  } catch (error) {
                    console.error('Error rendering CandidateProjectHistory:', error);
                    return (
                      <div className="p-6 text-center">
                        <Briefcase className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                        <h4 className="text-lg font-medium mb-1">Project History Unavailable</h4>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                          We couldn't load the project history at this time. This feature may not be set up yet or there might be a temporary issue.
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Skills & Expertise */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  Skills & Expertise
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills Card */}
                  <div>
                    <h4 className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium mb-3">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span>Professional Skills</span>
                    </h4>
                    
                    <div className="p-5 rounded-xl border border-blue-100 dark:border-blue-900/20 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/10 dark:to-gray-900/60 shadow-sm backdrop-blur-sm">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Try to find skills in different possible formats
                          let skills: string[] = [];
                          
                          if (Array.isArray(candidate.custom_fields?.skills)) {
                            skills = candidate.custom_fields?.skills;
                          } else if (Array.isArray(candidate.custom_fields?.core_skills)) {
                            skills = candidate.custom_fields?.core_skills;
                          } else if (Array.isArray(candidate.custom_fields?.professional_skills)) {
                            skills = candidate.custom_fields?.professional_skills;
                          } else if (typeof candidate.custom_fields?.skills === 'string') {
                            // Handle comma-separated string
                            skills = candidate.custom_fields.skills.split(',').map(s => s.trim());
                          } else if (typeof candidate.custom_fields?.skill_list === 'string') {
                            skills = candidate.custom_fields.skill_list.split(',').map(s => s.trim());
                          }
                          
                          // Default skills if none specified
                          if (!skills || skills.length === 0) {
                            skills = [
                              'Communication', 
                              'Time Management', 
                              'Leadership', 
                              'Problem Solving',
                              'Attention to Detail'
                            ];
                          }
                          
                          return skills.map((skill: string, index: number) => (
                            <div 
                              key={index}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 hover:shadow-sm transition-shadow"
                            >
                              {skill}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Languages Card */}
                  <div>
                    <h4 className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium mb-3">
                      <Languages className="h-4 w-4 text-teal-500" />
                      <span>Languages</span>
                    </h4>
                    
                    <div className="p-5 rounded-xl border border-teal-100 dark:border-teal-900/20 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-900/10 dark:to-gray-900/60 shadow-sm backdrop-blur-sm">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Try to find languages in different possible formats
                          let languages: string[] = [];
                          
                          if (Array.isArray(candidate.custom_fields?.languages)) {
                            languages = candidate.custom_fields?.languages;
                          } else if (Array.isArray(candidate.custom_fields?.spoken_languages)) {
                            languages = candidate.custom_fields?.spoken_languages;
                          } else if (Array.isArray(candidate.custom_fields?.language_proficiency)) {
                            languages = candidate.custom_fields?.language_proficiency.map((l: unknown) => 
                              typeof l === 'object' ? l.language : l);
                          } else if (typeof candidate.custom_fields?.languages === 'string') {
                            // Handle comma-separated string
                            languages = candidate.custom_fields.languages.split(',').map(l => l.trim());
                          } else if (typeof candidate.custom_fields?.spoken_languages === 'string') {
                            languages = candidate.custom_fields.spoken_languages.split(',').map(l => l.trim());
                          }
                          
                          // Default to English if no languages specified
                          if (!languages || languages.length === 0) {
                            languages = ['English'];
                          }
                          
                          return languages.map((language: string, index: number) => (
                            <div 
                              key={index}
                              className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 hover:shadow-sm transition-shadow"
                            >
                              {language}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Education & Certifications */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  Education & Qualifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Education Card */}
                  <InfoCard 
                    icon={GraduationCap} 
                    title="Educational Background" 
                    value={
                      <div className="space-y-1">
                        <div className="font-medium">
                          {candidate.highest_education || 
                           candidate.custom_fields?.education?.highest_degree || 
                           candidate.custom_fields?.highest_degree ||
                           candidate.custom_fields?.education?.degree ||
                           candidate.custom_fields?.education_level ||
                           'Degree not specified'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            // Try different formats for university name
                            const university = candidate.custom_fields?.university || 
                                             candidate.custom_fields?.education?.university ||
                                             candidate.custom_fields?.education?.institution ||
                                             candidate.custom_fields?.institution ||
                                             candidate.custom_fields?.school;
                            
                            // Try different formats for graduation year
                            const gradYear = candidate.custom_fields?.graduation_year || 
                                           candidate.custom_fields?.education?.graduation_year ||
                                           candidate.custom_fields?.education?.year ||
                                           candidate.custom_fields?.grad_year;
                            
                            if (university) {
                              return (
                                <>
                                  {university}
                                  {gradYear && `, Class of ${gradYear}`}
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        {/* Field of study if available */}
                        {(candidate.custom_fields?.field_of_study || 
                          candidate.custom_fields?.education?.field || 
                          candidate.custom_fields?.major) && (
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            Field: {candidate.custom_fields?.field_of_study || 
                                   candidate.custom_fields?.education?.field || 
                                   candidate.custom_fields?.major}
                          </div>
                        )}
                      </div>
                    }
                    color="bg-amber-500"
                  />
                  
                  {/* Certifications Card */}
                  <div>
                    <h4 className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium mb-3">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span>Certifications & Licenses</span>
                    </h4>
                    
                    <div className="p-5 rounded-xl border border-yellow-100 dark:border-yellow-900/20 bg-gradient-to-br from-yellow-50/80 to-white dark:from-yellow-900/10 dark:to-gray-900/60 shadow-sm backdrop-blur-sm">
                      {(() => {
                        // Try to find certifications in different possible formats
                        let certifications: string[] = [];
                        
                        if (Array.isArray(candidate.custom_fields?.certifications)) {
                          certifications = candidate.custom_fields?.certifications;
                        } else if (Array.isArray(candidate.custom_fields?.certificates)) {
                          certifications = candidate.custom_fields?.certificates;
                        } else if (Array.isArray(candidate.custom_fields?.qualifications)) {
                          certifications = candidate.custom_fields?.qualifications;
                        } else if (typeof candidate.custom_fields?.certifications === 'string') {
                          // Handle comma-separated string
                          certifications = candidate.custom_fields.certifications.split(',').map(c => c.trim());
                        } else if (typeof candidate.custom_fields?.certificates === 'string') {
                          certifications = candidate.custom_fields.certificates.split(',').map(c => c.trim());
                        } else if (Array.isArray(candidate.custom_fields?.education?.certifications)) {
                          certifications = candidate.custom_fields?.education?.certifications;
                        }
                        
                        // Check if we have any certifications to display
                        if (certifications && certifications.length > 0) {
                          return (
                            <div className="space-y-3">
                              {certifications.map((cert: string, index: number) => (
                                <div 
                                  key={index}
                                  className="py-2 px-3 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/50 flex items-center gap-2"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                                  <span>{cert}</span>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                              <Award className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                              <div>No certifications listed</div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Financial Tab */}
          <TabsContent value="financial" className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              {/* Financial Header */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  Financial Information
                </h3>
                <p className="text-gray-500 dark:text-gray-400 ml-10">
                  Banking details and payment preferences
                </p>
              </div>
              
              {/* Banking Details */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <BanknoteIcon className="h-4 w-4" />
                  </div>
                  Banking Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl border border-green-100 dark:border-green-900/20 bg-gradient-to-br from-green-50/80 to-white dark:from-green-900/10 dark:to-gray-900/60 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">Bank Account</h4>
                        <div className="mt-1 text-xl font-semibold">{candidate.bank_name || 'Not provided'}</div>
                      </div>
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    
                    {candidate.bank_account_number && (
                      <div className="mt-6">
                        <div className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-1">Account Number</div>
                        <div className="font-mono text-lg tracking-widest">
                          {candidate.bank_account_number.replace(/(\d{4})/g, '$1 ').trim()}
                        </div>
                      </div>
                    )}
                    
                    {candidate.custom_fields?.swift_code && (
                      <div className="mt-4 pt-4 border-t border-green-100 dark:border-green-900/30">
                        <div className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-1">SWIFT / BIC Code</div>
                        <div className="font-mono">{candidate.custom_fields.swift_code}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Payment Method Card */}
                    <InfoCard
                      icon={Wallet}
                      title="Payment Method"
                      value={candidate.custom_fields?.payment_method || 'Direct Deposit'}
                      color="bg-indigo-500"
                    />
                    
                    {/* Standard Rate Card */}
                    <InfoCard
                      icon={DollarSign}
                      title="Standard Rate"
                      value={
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold">
                            {candidate.custom_fields?.standard_rate ? 
                              `$${candidate.custom_fields.standard_rate}` : 
                              'Not specified'}
                          </span>
                          {candidate.custom_fields?.standard_rate && 
                            <span className="text-gray-500 dark:text-gray-400">/hour</span>
                          }
                        </div>
                      }
                      color="bg-emerald-500"
                    />
                    
                    {/* Currency Preference */}
                    <InfoCard
                      icon={BanknoteIcon}
                      title="Preferred Currency"
                      value={candidate.custom_fields?.preferred_currency || 'USD'}
                      color="bg-amber-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Tax Information */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Receipt className="h-4 w-4" />
                  </div>
                  Tax Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoCard
                    icon={FileText}
                    title="Tax ID Type"
                    value={candidate.custom_fields?.tax_id_type || 'Standard'}
                    color="bg-purple-500"
                  />
                  
                  <InfoCard
                    icon={CheckSquare}
                    title="Tax Documents"
                    value={
                      <StatusBadge 
                        status={
                          candidate.custom_fields?.tax_documents_submitted 
                            ? { label: "Submitted", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle2 }
                            : { label: "Pending", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: CircleDashed }
                        }
                      />
                    }
                    color="bg-blue-500"
                  />
                  
                  <InfoCard
                    icon={BarChart}
                    title="Tax Rate"
                    value={`${candidate.custom_fields?.tax_rate || '20'}%`}
                    color="bg-red-500"
                  />
                </div>
              </div>
              
              {/* Payment History */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <HistoryIcon className="h-4 w-4" />
                  </div>
                  Payment History
                </h3>
                
                <div className="p-8 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-full"></div>
                    <DollarSign className="absolute inset-0 m-auto h-10 w-10 text-blue-300 dark:text-blue-700" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">No Payment Records</h4>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Payment history will appear here once the candidate has completed projects and received payments.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Availability Tab */}
          <TabsContent value="availability" className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              {/* Availability Header */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  Availability Information
                </h3>
                <p className="text-gray-500 dark:text-gray-400 ml-10">
                  Schedule preferences and availability status
                </p>
              </div>
              
              {/* Current Availability */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  Current Status
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Card */}
                  <div className="p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/20 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/10 dark:to-gray-900/60 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">Availability Status</h4>
                        <div className="mt-2">
                          <StatusBadge 
                            status={
                              candidate.custom_fields?.availability_status ? (
                                candidate.custom_fields.availability_status === 'unavailable'
                                  ? { label: "Unavailable", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: CircleDashed }
                                  : candidate.custom_fields.availability_status === 'limited'
                                    ? { label: "Limited Availability", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", icon: Clock }
                                    : { label: "Available", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", icon: CheckCircle2 }
                              ) : { label: "Status Unknown", color: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: CircleDashed }
                            }
                            size="md"
                          />
                        </div>
                      </div>
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                        <CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/30">
                      <h4 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-2">Next Available Date</h4>
                      <div className="text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        <span>
                          {candidate.custom_fields?.next_available_date ? 
                            (() => {
                              try {
                                return format(new Date(candidate.custom_fields.next_available_date), 'PPP');
                              } catch (error) {
                                console.error('Error formatting next available date:', error);
                                return 'Invalid date format';
                              }
                            })() : 
                            'Immediately'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Project Stats */}
                  <div className="space-y-4">
                    <InfoCard
                      icon={Briefcase}
                      title="Current Projects"
                      value={(candidate.custom_fields?.current_projects || 0).toString()}
                      color="bg-blue-500"
                    />
                    
                    <InfoCard
                      icon={CalendarDays}
                      title="Scheduling Preference"
                      value={candidate.custom_fields?.scheduling_preference || 'Standard work week'}
                      color="bg-purple-500"
                    />
                    
                    <InfoCard
                      icon={Film}
                      title="Project Types"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {(candidate.custom_fields?.preferred_project_types || ['Events', 'Corporate']).map((type: string, index: number) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-full border border-purple-100 dark:border-purple-900/50"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      }
                      color="bg-amber-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Working Hours */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  Preferred Working Hours
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weekday Hours Card */}
                  <div className="p-6 rounded-xl border border-blue-100 dark:border-blue-900/20 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">Weekday Hours</h4>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                      <div className="text-2xl font-medium text-blue-700 dark:text-blue-400">
                        {candidate.custom_fields?.preferred_hours_weekday || '9:00 AM - 5:00 PM'}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {candidate.custom_fields?.hours_flexibility ? 
                          (candidate.custom_fields.hours_flexibility === 'flexible' ? 'Flexible hours available' : 'Fixed schedule preferred') : 
                          'Flexibility preference not specified'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Weekend Hours Card */}
                  <div className="p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/20 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">Weekend Hours</h4>
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                        <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30">
                      <div className="text-2xl font-medium text-indigo-700 dark:text-indigo-400">
                        {candidate.custom_fields?.preferred_hours_weekend || 'Not Available'}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {candidate.custom_fields?.weekend_availability ? 
                          (candidate.custom_fields.weekend_availability === 'available' ? 'Available for weekend work' : 'Prefers not to work weekends') : 
                          'Weekend availability not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Travel & Preferences */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <MapPin className="h-4 w-4" />
                  </div>
                  Travel & Preferences
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InfoCard
                      icon={Car}
                      title="Max Travel Distance"
                      value={candidate.custom_fields?.max_travel_distance || 'Up to 50 km'}
                      color="bg-orange-500"
                    />
                    
                    <InfoCard
                      icon={Users2}
                      title="Preferred Team Size"
                      value={candidate.custom_fields?.preferred_team_size || 'Any size'}
                      color="bg-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <InfoCard
                      icon={ArrowUpDown}
                      title="Area Preferences"
                      value={candidate.custom_fields?.area_preferences || 'No specific preference'}
                      color="bg-red-500"
                    />
                    
                    <InfoCard
                      icon={Coffee}
                      title="Break Preferences"
                      value={candidate.custom_fields?.break_preferences || 'Standard breaks'}
                      color="bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Calendar View */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-6 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  Availability Calendar
                </h3>
                
                <div className="p-8 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm backdrop-blur-sm text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 bg-green-50 dark:bg-green-900/20 rounded-full"></div>
                    <Calendar className="absolute inset-0 m-auto h-12 w-12 text-green-300 dark:text-green-700" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Calendar View Coming Soon</h4>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    The interactive availability calendar will show scheduled projects, bookings, and allow booking requests.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Applications Tab */}
          <TabsContent value="applications" className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-gray-800 dark:text-gray-200">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  Project Applications
                </h3>
                <p className="text-gray-500 dark:text-gray-400 ml-10">
                  View and manage applications to open projects
                </p>
              </div>
              
              <CandidateProjectApplications 
                candidateId={candidate.id}
                candidateName={candidate.full_name}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Secure update link section */}
        {showUpdateLink && (
          <div className="mt-4 mx-4 border rounded-md p-3 bg-slate-50 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium flex items-center">
                <Link className="w-4 h-4 mr-1 text-blue-500" />
                Candidate Update Link
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => setShowUpdateLink(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs font-mono bg-white dark:bg-slate-950 p-2 rounded border truncate">
                {updateLink}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="shrink-0 h-8"
                onClick={copyUpdateLink}
              >
                {updateLinkCopied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            {updateLinkError && <p className="text-xs text-red-500 mt-1">{updateLinkError}</p>}
            <p className="text-xs text-slate-500 mt-1">This secure link will expire in 1 hour. Share it with the candidate to let them update their information.</p>
          </div>
        )}
        
        <DialogFooter className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {(() => {
                try {
                  if (candidate.updated_at) {
                    return `Last updated: ${format(new Date(candidate.updated_at), 'PPP')}`;
                  } else {
                    return `Created: ${format(new Date(candidate.created_at || Date.now()), 'PPP')}`;
                  }
                } catch (error) {
                  console.error('Error formatting date in footer:', error);
                  return 'Date information unavailable';
                }
              })()}
            </div>
            <div className="flex items-center gap-1.5">
              <DialogClose asChild>
                <Button className="rounded-md h-8 text-xs" variant="outline">
                  Close
                </Button>
              </DialogClose>
              <Button 
                variant="secondary" 
                className="rounded-md h-8 text-xs"
                onClick={generateUpdateLink}
                disabled={updateLinkLoading}
              >
                {updateLinkLoading ? "Generating..." : "Generate Update Link"}
              </Button>
              <Button 
                variant="default" 
                className="rounded-md h-8 text-xs"
                onClick={() => {
                  toast({
                    title: "Contact initiated",
                    description: `You have contacted ${candidate.full_name}`,
                    variant: "success",
                  });
                  onOpenChange(false);
                }}
              >
                Contact Candidate
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      
      {/* Edit candidate dialog */}
      {candidate && (
        <NewCandidateDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            // When dialog closes, we'll just update the state without showing a toast
          }}
          initialData={{
            // Map candidate fields to form fields
            legal_name: candidate.full_name || '',
            entity_type: candidate.custom_fields?.entity_type || 'individual',
            registration_type: candidate.custom_fields?.registration_type || 'nric',
            registration_id: candidate.ic_number || '',
            old_registration_id: candidate.custom_fields?.old_registration_id || '',
            unique_id: candidate.unique_id || '',
            tin: candidate.custom_fields?.tin || '',
            sst_registration_no: candidate.custom_fields?.sst_registration_no || '',
            is_customer: candidate.custom_fields?.is_customer || false,
            is_supplier: candidate.custom_fields?.is_supplier || false,
            
            // Contact Information
            phone_number: candidate.phone_number || '',
            email: candidate.email || '',
            
            // Address fields - extract from JSON structure if available
            street_business: candidate.address_business?.street || '',
            city_business: candidate.address_business?.city || '',
            state_business: candidate.address_business?.state || '',
            postcode_business: candidate.address_business?.postcode || '',
            country_code_business: candidate.address_business?.country_code || 'MY',
            
            street_mailing: candidate.address_mailing?.street || '',
            city_mailing: candidate.address_mailing?.city || '',
            state_mailing: candidate.address_mailing?.state || '',
            postcode_mailing: candidate.address_mailing?.postcode || '',
            country_code_mailing: candidate.address_mailing?.country_code || 'MY',
            use_business_address: !candidate.address_mailing?.street, // Assume using business address if no mailing street
            
            // Financial Information 
            receivable_ac_code: candidate.custom_fields?.receivable_ac_code || '',
            payable_ac_code: candidate.custom_fields?.payable_ac_code || '',
            income_ac_code: candidate.custom_fields?.income_ac_code || '',
            expense_ac_code: candidate.custom_fields?.expense_ac_code || '',
            
            // Additional information
            gender: candidate.gender || 'male',
            date_of_birth: candidate.date_of_birth ? new Date(candidate.date_of_birth).toISOString().split('T')[0] : '',
            nationality: candidate.nationality || 'Malaysian',
            emergency_contact_name: candidate.emergency_contact_name || '',
            emergency_contact_number: candidate.emergency_contact_number || '',
            
            // Additional candidate fields from custom_fields
            age: candidate.custom_fields?.age || '',
            race: candidate.custom_fields?.race || '',
            tshirt_size: candidate.custom_fields?.tshirt_size || '',
            transportation: candidate.vehicle_type || candidate.custom_fields?.transportation || '',
            spoken_languages: candidate.custom_fields?.spoken_languages || '',
            height: candidate.custom_fields?.height || '',
            typhoid: candidate.custom_fields?.typhoid || 'no',
            work_experience: candidate.custom_fields?.experience_summary || candidate.custom_fields?.work_experience || '',
            
            // Photos
            profile_photo: candidate.custom_fields?.profile_photo || candidate.profile_photo || '',
            full_body_photo: candidate.custom_fields?.full_body_photo || '',
            
            // Include the candidate ID for update operations
            id: candidate.id
          }}
          onCandidateAdded={() => {
            // Close and reopen the dialog to refresh data
            setEditDialogOpen(false);
            // Trigger a refresh by notifying parent component
            onOpenChange(false);
            setTimeout(() => {
              onOpenChange(true);
            }, 100);
          }}
        />
      )}
    </Dialog>
  );
}