import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { TextAnimate } from "@/components/ui/text-animate";
import { SpotlightCardDropdown } from "./SpotlightCardDropdown";
import { EditProjectDialogStepped } from "@/components/EditProjectDialogStepped";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatRecurringDates, getGoogleMapsLink, getWazeLink } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/types';
import {
  Shield,
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Users,
  Receipt,
  MoreVertical,
  Copy,
  FileSpreadsheet,
  FileText,
  Share2,
  Archive,
  DollarSign,
  User,
  Activity,
  AlertCircle,
  Edit
} from "lucide-react";

interface SpotlightCardSidebarProps {
  project: Project;
  onViewDetails: () => void;
  staffCount: number;
  claimsCount: number;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function SpotlightCardSidebar({
  project,
  onViewDetails,
  staffCount,
  claimsCount,
  activeTab = 'schedule',
  onTabChange = () => {}
}: SpotlightCardSidebarProps) {
  
  const [brandLogoUrl, setBrandLogoUrl] = React.useState<string | null>((project as unknown).brand_logo || null);
  const [isEditingBrandLogo, setIsEditingBrandLogo] = React.useState(false);
  const [tempBrandUrl, setTempBrandUrl] = React.useState('');
  const [logoError, setLogoError] = React.useState(false);
  const [activeOverviewTab, setActiveOverviewTab] = React.useState<'staffing' | 'details'>('staffing');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [currentProject, setCurrentProject] = React.useState(project);
  const [customerLogo, setCustomerLogo] = React.useState<string | null>(null);
  const [customerName, setCustomerName] = React.useState<string>('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // For testing purposes - use this URL for a sample logo (CORS-friendly image)
  const sampleLogoUrl = "https://placehold.co/300x150/2563EB/FFFFFF.png?text=Sample+Logo";
  const { toast } = useToast();
  
  // Update currentProject and brandLogoUrl when project prop changes
  React.useEffect(() => {
    setCurrentProject(project);
    // Also update the brand logo URL from the new project data
    setBrandLogoUrl((project as unknown).brand_logo || null);
    setLogoError(false); // Reset logo error state
  }, [project]);
  
  // Fetch customer logo when component mounts or project changes
  React.useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (!project.client_id) return;
      
      try {
        // Check if client_id is in companies table first
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, company_name, logo_url')
          .eq('id', project.client_id)
          .maybeSingle();
          
        if (!companyError && companyData) {
          // client_id is a company
          setCustomerLogo(companyData.logo_url);
          setCustomerName(companyData.company_name || companyData.name);
        } else {
          // Try to fetch as a user
          const { data: clientData, error: clientError } = await supabase
            .from('users')
            .select('id, full_name, company_name')
            .eq('id', project.client_id)
            .maybeSingle();
            
          if (!clientError && clientData) {
            // Try to find the company by name
            if (clientData.company_name) {
              const { data: relatedCompanyData, error: relatedCompanyError } = await supabase
                .from('companies')
                .select('id, name, company_name, logo_url')
                .or(`name.eq.${clientData.company_name},company_name.eq.${clientData.company_name}`)
                .limit(1);
                
              if (!relatedCompanyError && relatedCompanyData && relatedCompanyData.length > 0) {
                setCustomerLogo(relatedCompanyData[0].logo_url);
                setCustomerName(relatedCompanyData[0].company_name || relatedCompanyData[0].name || clientData.company_name || clientData.full_name);
              } else {
                // Fallback to client name if no company found
                setCustomerName(clientData.company_name || clientData.full_name);
              }
            } else {
              // No company name, just use the user's full name
              setCustomerName(clientData.full_name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching customer info:', error);
        // Set fallback name from project client if available
        if ((project as unknown).client?.name) {
          setCustomerName((project as unknown).client.name);
        }
      }
    };
    
    fetchCustomerInfo();
  }, [project.client_id]);
  
  const handleProjectUpdate = (updatedProject: Project) => {
    setCurrentProject(updatedProject);
    // Update brand logo from the updated project
    setBrandLogoUrl((updatedProject as unknown).brand_logo || null);
    setLogoError(false); // Reset logo error state
    // You might want to propagate this update to parent component
    // if (onProjectUpdated) onProjectUpdated(updatedProject);
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      // Use both mousedown and click events for better compatibility
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('click', handleClickOutside, true);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isDropdownOpen]);
  
  // Helper functions for badge colors
  const getStatusColor = (status?: string) => {
    // Normalize status by replacing underscores with hyphens and spaces
    const normalizedStatus = status?.toLowerCase().replace(/_/g, '-').replace(/-/g, ' ');
    switch(normalizedStatus) {
      case 'completed': return 'green-500/20 text-green-700 dark:text-green-300';
      case 'in progress': return 'blue-500/20 text-blue-700 dark:text-blue-300';
      case 'pending': return 'yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'cancelled': return 'red-500/20 text-red-700 dark:text-red-300';
      default: return 'gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };
  
  const getPriorityColor = (priority?: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'red-500/20 text-red-700 dark:text-red-300';
      case 'medium': return 'yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'low': return 'green-500/20 text-green-700 dark:text-green-300';
      default: return 'gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };
  
  const stats = [
    { icon: Users, label: "Crew", count: staffCount },
    { icon: Receipt, label: "Claims", count: claimsCount }
  ];

  return (
    <div className="w-[280px] bg-white dark:bg-gray-900 p-4 overflow-hidden flex flex-col">
      <div className="flex justify-end">
        <div className="relative" ref={dropdownRef}>
          <button 
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-30">
              <div className="py-1" role="menu" aria-orientation="vertical">
              {/* Edit Project */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                  setIsDropdownOpen(false);
                }}
              >
                <Edit className="h-4 w-4" />
                Edit Project Details
              </button>
              
              {/* Copy Project ID */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(project.id);
                  toast({
                    title: "Project ID Copied",
                    description: `ID ${project.id} copied to clipboard`,
                    duration: 2000,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Project ID
              </button>
              
              {/* Export to Excel */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  // Create a simple CSV content
                  const headers = ["Project ID", "Title", "Client", "Start Date", "End Date", "Status", "Location"];
                  const data = [
                    project.id,
                    project.title,
                    (project.client as unknown)?.name || '',
                    project.start_date,
                    project.end_date || '',
                    project.status,
                    project.venue_address
                  ];
                  
                  const csvContent = [
                    headers.join(','),
                    data.join(',')
                  ].join('\n');
                  
                  // Create a Blob and download link
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `project_${project.id}_details.csv`;
                  link.click();
                  
                  toast({
                    title: "Export Complete",
                    description: "Project details exported to CSV",
                    duration: 2000,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export to Excel
              </button>
              
              {/* Generate Report */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toast({
                    title: "Generating Report",
                    description: "Project report is being generated...",
                    duration: 2000,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </button>
              
              {/* Share Project */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/projects/${project.id}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: "Share Link Copied",
                    description: "Project URL copied to clipboard",
                    duration: 2000,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                <Share2 className="h-4 w-4" />
                Share Project
              </button>
              
              {/* Duplicate Project */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toast({
                    title: "Duplicating Project",
                    description: "Creating a copy of this project...",
                    duration: 2000,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                <Copy className="h-4 w-4" />
                Duplicate Project
              </button>
              
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              
              {/* Archive Project - Destructive action */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toast({
                    title: "Archive Project",
                    description: "Are you sure you want to archive this project?",
                    variant: "destructive",
                    duration: 2000,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                <Archive className="h-4 w-4" />
                Archive Project
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Removed original sparkle since we added one at the top left corner of brand logo */}
      
      <div className="flex flex-col items-center -mt-4">
        {/* Brand Logo with Client Logo at bottom right */}
        <div className="relative mb-3">
          {/* Brand Logo Placeholder */}
          <div className="relative">
            {/* Sparkle with center touching the top left edge of brand logo */}
            <motion.div
              animate={{ rotate: [0, -15, 5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-0 left-0 z-20 translate-x-0 translate-y-0"
            >
              <Sparkles className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
            </motion.div>
            
            <MagicCard className="relative shadow-lg mx-auto" shadowColor="#A07CFE">
              <div 
                className="w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 flex items-center justify-center relative cursor-pointer group overflow-hidden"
                onClick={() => setIsEditingBrandLogo(true)}
              >
                {brandLogoUrl && !logoError ? (
                  <motion.img 
                    src={brandLogoUrl} 
                    alt="Brand logo" 
                    className="w-full h-full object-contain p-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onError={() => {
                      setLogoError(true);
                      toast({
                        title: "Image Error",
                        description: "Could not load the logo image. Please check the URL.",
                        variant: "destructive"
                      });
                    }}
                  />
                ) : (
                  <TextAnimate
                    text="Brand"
                    className="text-gray-400 dark:text-gray-500 text-2xl font-medium"
                    animationType="shine"
                  />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-medium">Edit</span>
                </div>
              </div>
            </MagicCard>
            
            {/* Client logo at bottom right, outside MagicCard, bottom aligned with brand logo border */}
            <motion.div 
              className="absolute bottom-0 right-0 w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-600 z-20 translate-x-1/3 translate-y-0 overflow-hidden"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              style={{ transformOrigin: "right bottom" }}
              title={customerName || 'Customer'}
            >
              {customerLogo ? (
                <img 
                  src={customerLogo} 
                  alt={customerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-gray-500 dark:text-gray-300">
                  {customerName?.charAt(0) || (project.client as unknown)?.name?.charAt(0) || 'C'}
                </span>
              )}
            </motion.div>
          </div>
        </div>
        
        {/* Brand Logo URL Dialog */}
        {isEditingBrandLogo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-80 shadow-xl">
              <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">Change Brand Logo</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo URL
                </label>
                <input 
                  type="text" 
                  value={tempBrandUrl}
                  onChange={(e) => setTempBrandUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700"
                />
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-xs text-gray-500">
                    For testing: <button 
                      className="text-blue-500 hover:underline" 
                      onClick={() => {
                        // Set the URL and immediately apply it
                        const testImg = new Image();
                        testImg.onload = () => {
                          setBrandLogoUrl(sampleLogoUrl);
                          setLogoError(false);
                          // Here you would normally update the project in the database as well
                          toast({
                            title: "Logo Updated",
                            description: "Sample logo has been applied."
                          });
                          setIsEditingBrandLogo(false);
                          setTempBrandUrl('');
                        };
                        testImg.onerror = () => {
                          toast({
                            title: "Sample Image Error",
                            description: "Could not load the sample image. Please try a different URL.",
                            variant: "destructive"
                          });
                        };
                        testImg.src = sampleLogoUrl;
                      }}
                    >
                      Use Sample Logo
                    </button>
                  </p>
                  <div className="text-xs text-gray-500">
                    Or upload: <input 
                      type="file" 
                      accept="image/*"
                      className="text-xs w-32 text-gray-500"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Create a local URL for the file
                          const objectUrl = URL.createObjectURL(file);
                          
                          // Test image loading
                          const testImg = new Image();
                          testImg.onload = () => {
                            setBrandLogoUrl(objectUrl);
                            setLogoError(false);
                            toast({
                              title: "Logo Updated",
                              description: "Uploaded logo has been applied."
                            });
                            setIsEditingBrandLogo(false);
                            setTempBrandUrl('');
                          };
                          testImg.onerror = () => {
                            URL.revokeObjectURL(objectUrl);
                            toast({
                              title: "Image Error",
                              description: "Could not load the uploaded image. Please try a different file.",
                              variant: "destructive"
                            });
                          };
                          testImg.src = objectUrl;
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setIsEditingBrandLogo(false);
                    setTempBrandUrl('');
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (tempBrandUrl.trim()) {
                      // Test if image exists/loads correctly
                      const testImg = new Image();
                      testImg.onload = async () => {
                        setBrandLogoUrl(tempBrandUrl);
                        setLogoError(false);
                        
                        // Update the project in the database
                        try {
                          const { error } = await supabase
                            .from('projects')
                            .update({ brand_logo: tempBrandUrl })
                            .eq('id', project.id);
                            
                          if (error) throw error;
                          
                          toast({
                            title: "Logo Updated",
                            description: "Brand logo URL has been updated."
                          });
                        } catch (error) {
                          console.error('Error updating brand logo:', error);
                          toast({
                            title: "Error",
                            description: "Failed to update brand logo. Please try again.",
                            variant: "destructive"
                          });
                        }
                        
                        setIsEditingBrandLogo(false);
                        setTempBrandUrl('');
                      };
                      testImg.onerror = () => {
                        toast({
                          title: "Invalid Image URL",
                          description: "Could not load image from the provided URL. Please check and try again.",
                          variant: "destructive"
                        });
                        // Keep dialog open so user can correct the URL
                      };
                      testImg.src = tempBrandUrl;
                    } else {
                      setBrandLogoUrl(null);
                      setLogoError(false);
                      
                      // Update the project in the database to remove logo
                      try {
                        const { error } = await supabase
                          .from('projects')
                          .update({ brand_logo: null })
                          .eq('id', project.id);
                          
                        if (error) throw error;
                        
                        toast({
                          title: "Logo Removed",
                          description: "Brand logo has been removed."
                        });
                      } catch (error) {
                        console.error('Error removing brand logo:', error);
                        toast({
                          title: "Error",
                          description: "Failed to remove brand logo. Please try again.",
                          variant: "destructive"
                        });
                      }
                      
                      setIsEditingBrandLogo(false);
                      setTempBrandUrl('');
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Project Type Badges - more compact */}
        <div className="flex gap-2 mb-3 mt-2">
          <Badge className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-none px-2 py-1 rounded-full text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {project.project_type || 'Recruitment'}
          </Badge>
          <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-none px-2 py-1 rounded-full text-xs">
            <CalendarDays className="h-3 w-3 mr-1" />
            {project.schedule_type || 'Single'}
          </Badge>
        </div>
        
        {/* Project Title */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
            {currentProject.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {(currentProject.client as unknown)?.name ? `@ ${(currentProject.client as unknown)?.name}` : ''}
          </p>
        </div>
      </div>
      
      {/* Removed tab navigation from sidebar */}
      
      {/* Single column layout for Schedule and Location with enhanced styling */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* Schedule Section */}
        <MagicCard className="overflow-hidden">
          <div className="py-4 px-3">
            <TextAnimate
              text="Schedule"
              className="text-md font-bold text-purple-500 dark:text-purple-400 mb-3 text-center block"
              animationType="shine"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                </div>
                <span className="font-medium text-sm text-center">{formatRecurringDates(currentProject)}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                </div>
                <span className="font-medium text-sm">{currentProject.working_hours_start} - {currentProject.working_hours_end}</span>
              </div>
            </div>
          </div>
        </MagicCard>
        
        {/* Location Section */}
        <MagicCard className="overflow-hidden">
          <div className="py-4 px-3">
            <TextAnimate
              text="Location"
              className="text-md font-bold text-purple-500 dark:text-purple-400 mb-3 text-center block"
              animationType="shine"
            />
            <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1.5">
                <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              </div>
              <span className="font-medium text-sm text-center truncate">{currentProject.venue_address}</span>
            </div>
            <div className="flex gap-2 justify-center mt-2">
              <ShimmerButton
                size="sm"
                variant="outline"
                className="h-7 px-2 py-1 text-xs font-medium flex items-center gap-1 rounded-full bg-white dark:bg-gray-800"
                onClick={() => window.open(getGoogleMapsLink(currentProject.venue_address), '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Maps
              </ShimmerButton>
              <ShimmerButton
                size="sm"
                variant="outline"
                className="h-7 px-2 py-1 text-xs font-medium flex items-center gap-1 rounded-full bg-white dark:bg-gray-800"
                onClick={() => window.open(getWazeLink(currentProject.venue_address), '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Waze
              </ShimmerButton>
            </div>
          </div>
        </MagicCard>
      </div>
      
      {/* Edit Project Dialog */}
      <EditProjectDialogStepped
        project={currentProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProjectUpdated={handleProjectUpdate}
      />
      
      {/* Removed duplicate client logo from container bottom */}
    </div>
  );
}