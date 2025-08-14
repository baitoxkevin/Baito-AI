import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentDropzoneFiles } from "@/components/ui/document-dropzone-files";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, History, DollarSign, Users, Eye, ExternalLink, Link as LinkIcon } from "lucide-react";
import { activityLogger, logUtils } from "@/lib/activity-logger";
import { useAutosaveStaff } from "@/hooks/use-autosave-staff";
import { useProjectStaff } from "@/hooks/use-project-staff";
import { supabase } from "@/lib/supabase";
import { createExpenseClaimWithReceipts, fetchProjectExpenseClaims, deleteExpenseClaim } from "@/lib/expense-claim-service";
import { fetchProjectExpenseClaimsWithFallback } from "@/lib/expense-claim-service-fallback";
import { getUser } from "@/lib/auth";
import { uploadProjectDocument, deleteDocument, getProjectDocuments, addProjectLink } from "@/lib/document-service";
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

import { SpotlightCardMinimized } from './SpotlightCardMinimized';
import { SpotlightCardHeader } from './SpotlightCardHeader';
import { SpotlightCardSidebar } from './SpotlightCardSidebar';
import { SpotlightCardTabs } from './SpotlightCardTabs';
import { SpotlightCardDropdown } from './SpotlightCardDropdown';
import { SpotlightCardSegmentedControl } from './SpotlightCardSegmentedControl';
import { CompactHistory } from './history-options/CompactHistory';
import { ProjectStatsTabCard } from './ProjectStatsCard';

// Tab content components
import { CalendarTab, StaffingTab } from '@/components/project-form';
import { SpotlightCardDocuments } from './SpotlightCardDocuments';
import { SpotlightCardExpenses } from './SpotlightCardExpenses';
import { ProjectPayroll } from '@/components/project-payroll';
import { ExpenseClaimFormWithDragDrop } from '@/components/ExpenseClaimFormWithDragDrop';
import { ExpenseClaimDetailsDialog } from '@/components/ExpenseClaimDetailsDialog';

// Dummy data (same as original)
const dummyExpenseClaims = [
  {
    id: '1',
    title: 'Team Lunch Meeting',
    description: 'Lunch meeting with production team',
    amount: 350.50,
    date: '2024-03-10',
    created_at: '2024-03-10',
    category: 'food',
    status: 'approved',
    reference_number: 'EXP001',
    submitted_by_name: 'John Doe',
    user_id: '1',
    submitted_by: '1',
    project_id: '1',
    expense_date: '2024-03-10',
    receipts: []
  },
  // ... rest of dummy data
];

const dummyDocuments = [
  {
    id: '1',
    file_name: 'Project Brief.pdf',
    file_path: '/documents/project-brief.pdf',
    size: 2450678,
    type: 'pdf',
    content_type: 'application/pdf',
    category: 'project',
    uploaded_by: 'John Doe',
    upload_date: new Date('2024-03-01T10:30:00Z'),
    description: 'Initial project brief and requirements',
    project_id: '1'
  },
  {
    id: '2',
    file_name: 'Budget Proposal.xlsx',
    file_path: '/documents/budget-proposal.xlsx',
    size: 456789,
    type: 'xlsx',
    content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'financial',
    uploaded_by: 'Sarah Smith',
    upload_date: new Date('2024-03-02T14:15:00Z'),
    description: 'Detailed budget breakdown',
    project_id: '1'
  },
  {
    id: '3',
    file_name: 'Venue Layout.png',
    file_path: '/documents/venue-layout.png',
    size: 3567890,
    type: 'png',
    content_type: 'image/png',
    category: 'logistics',
    uploaded_by: 'Mike Chen',
    upload_date: new Date('2024-03-03T09:45:00Z'),
    description: 'Venue floor plan and setup diagram',
    project_id: '1'
  },
  {
    id: '4',
    file_name: 'Contract Agreement.pdf',
    file_path: '/documents/contract-agreement.pdf',
    size: 1234567,
    type: 'pdf',
    content_type: 'application/pdf',
    category: 'legal',
    uploaded_by: 'Emily Wong',
    upload_date: new Date('2024-03-04T16:20:00Z'),
    description: 'Client service agreement',
    project_id: '1'
  },
  {
    id: '5',
    file_name: 'Creative Concepts.pptx',
    file_path: '/documents/creative-concepts.pptx',
    size: 5678901,
    type: 'pptx',
    content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'creative',
    uploaded_by: 'David Lee',
    upload_date: new Date('2024-03-05T11:00:00Z'),
    description: 'Creative concept presentation',
    project_id: '1'
  }
];


const dummyStaff = [
  {
    id: '1',
    name: 'Sarah Johnson',
    photo: null,
    designation: 'Event Coordinator',
    status: 'confirmed',
    appliedDate: new Date('2024-03-01'),
    applyType: 'full',
    workingDates: [
      new Date('2024-03-10'),
      new Date('2024-03-11'),
      new Date('2024-03-12'),
      new Date('2024-03-13'),
      new Date('2024-03-14'),
    ],
    workingDatesWithSalary: [
      { date: new Date('2024-03-10'), basicSalary: '500', claims: '50', commission: '0' },
      { date: new Date('2024-03-11'), basicSalary: '500', claims: '0', commission: '0' },
      { date: new Date('2024-03-12'), basicSalary: '500', claims: '0', commission: '0' },
      { date: new Date('2024-03-13'), basicSalary: '500', claims: '0', commission: '0' },
      { date: new Date('2024-03-14'), basicSalary: '500', claims: '0', commission: '0' },
    ]
  },
  {
    id: '2',
    name: 'Mike Chen',
    photo: null,
    designation: 'Sound Engineer',
    status: 'confirmed',
    appliedDate: new Date('2024-03-02'),
    applyType: 'full',
    workingDates: [
      new Date('2024-03-10'),
      new Date('2024-03-11'),
      new Date('2024-03-12'),
    ],
    workingDatesWithSalary: [
      { date: new Date('2024-03-10'), basicSalary: '600', claims: '75', commission: '0' },
      { date: new Date('2024-03-11'), basicSalary: '600', claims: '0', commission: '0' },
      { date: new Date('2024-03-12'), basicSalary: '600', claims: '25', commission: '0' },
    ]
  },
  {
    id: '3',
    name: 'Emily Wong',
    photo: null,
    designation: 'Lighting Designer',
    status: 'confirmed',
    appliedDate: new Date('2024-03-03'),
    applyType: 'full',
    workingDates: [
      new Date('2024-03-12'),
      new Date('2024-03-13'),
      new Date('2024-03-14'),
    ],
    workingDatesWithSalary: [
      { date: new Date('2024-03-12'), basicSalary: '550', claims: '0', commission: '0' },
      { date: new Date('2024-03-13'), basicSalary: '550', claims: '35', commission: '0' },
      { date: new Date('2024-03-14'), basicSalary: '550', claims: '0', commission: '0' },
    ]
  }
];

interface SpotlightCardProps {
  project: Project;
  onProjectUpdated?: (updatedProject: Project) => void;
  onViewDetails?: (project: Project) => void;
  documents: unknown[];
  expenseClaims: unknown[];
}

export function SpotlightCard({ 
  project, 
  onProjectUpdated,
  onViewDetails,
  documents = [],
  expenseClaims = []
}: SpotlightCardProps) {
  const [isMinimized, setIsMinimized] = React.useState(true);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const { toast } = useToast();
  const [showExpenseClaimForm, setShowExpenseClaimForm] = React.useState(false);
  const [showClaimDetailsDialog, setShowClaimDetailsDialog] = React.useState(false);
  const [selectedClaimId, setSelectedClaimId] = React.useState<string | null>(null);
  const [isRemovingClaim, setIsRemovingClaim] = React.useState(false);
  const [localExpenseClaims, setLocalExpenseClaims] = React.useState(expenseClaims || []);
  const [activeTab, setActiveTab] = React.useState('schedule');
  const isScheduleTabActive = activeTab === 'schedule';
  
  // Simple tab change handler
  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);
  
  // Manual refresh function for expense claims
  const refreshExpenseClaims = React.useCallback(async () => {
    try {
      // console.log('Manually refreshing expense claims for project:', project.id);
      const updatedClaims = await fetchProjectExpenseClaimsWithFallback(project.id);
      // console.log('Manual refresh found claims:', updatedClaims);
      setLocalExpenseClaims(updatedClaims);
      return updatedClaims;
    } catch (error) {
      console.error('Error refreshing expense claims:', error);
      return [];
    }
  }, [project.id]);
  const [localDocuments, setLocalDocuments] = React.useState(
    documents.length > 0 ? documents : dummyDocuments
  );
  const [documentsView, setDocumentsView] = React.useState<'table' | 'grid'>('table');
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [fileCategory, setFileCategory] = React.useState<string>('project');
  const [fileDescription, setFileDescription] = React.useState<string>('');
  
  // Additional state for Google Drive link support
  const [activeUploadTab, setActiveUploadTab] = React.useState<'files' | 'link'>('files');
  const [googleDriveLink, setGoogleDriveLink] = React.useState<string>('');
  const [googleDriveName, setGoogleDriveName] = React.useState<string>('');
  const [googleDriveLinkError, setGoogleDriveLinkError] = React.useState<string>('');
  const [staffDetails, setStaffDetails] = React.useState<any[]>([]);
  
  // Track if payroll edit dialog is open
  const [isPayrollEditDialogOpen, setIsPayrollEditDialogOpen] = React.useState(false);
  const [confirmedStaff, setConfirmedStaff] = React.useState<any[]>([]);
  const [applicants, setApplicants] = React.useState<any[]>([]);
  const [selectedStaffForBasic, setSelectedStaffForBasic] = React.useState<string[]>([]);
  const [tempBasicValue, setTempBasicValue] = React.useState("");
  
  
  // Fetch project details including staff when component mounts or project changes
  React.useEffect(() => {
    let isMounted = true;
    
    const fetchProjectDetails = async () => {
      if (!project.id) return;
      
      // Initialize activity logging for this project
      activityLogger.setProjectId(project.id);
      
      try {
        // Batch fetch all data in parallel for better performance
        const [projectResult, expenseResult, documentsResult] = await Promise.allSettled([
          // Fetch project data
          supabase
            .from('projects')
            .select('*')
            .eq('id', project.id)
            .single(),
          
          // Fetch expense claims
          fetchProjectExpenseClaimsWithFallback(project.id),
          
          // Fetch documents
          getProjectDocuments(project.id)
        ]);
        
        // Check if component is still mounted before processing results
        if (!isMounted) return;
        
        // Process project data
        if (projectResult.status === 'rejected' || projectResult.value.error) {
          const error = projectResult.status === 'rejected' ? projectResult.reason : projectResult.value.error;
          console.error('Failed to fetch project data:', error);
          throw new Error(`Failed to load project: ${error.message || 'Unknown error'}`);
        }
        
        const projectData = projectResult.value.data;
        if (!projectData) {
          throw new Error('Project not found');
        }
        
        // Process expense claims
        if (expenseResult.status === 'fulfilled') {
          // console.log('Initial expense claims fetch successful:', expenseResult.value.length);
          // console.log('Expense claims data:', expenseResult.value);
          setLocalExpenseClaims(expenseResult.value);
        } else {
          console.error('Error fetching expense claims:', expenseResult.reason);
          // Don't fall back to dummy data - keep it empty
          setLocalExpenseClaims([]);
        }
        
        // Process documents
        if (documentsResult.status === 'fulfilled') {
          setLocalDocuments(documentsResult.value);
          // console.log('Fetched project documents:', documentsResult.value.length);
        } else {
          console.error('Error fetching documents:', documentsResult.reason);
          setLocalDocuments(dummyDocuments);
        }
        
        // Extract confirmed staff and applicants from the project
        const projectConfirmedStaff = projectData?.confirmed_staff || [];
        const projectApplicants = projectData?.applicants || [];
        
        // console.log('Fetched project data:', {
        //   confirmedStaff: projectConfirmedStaff,
        //   applicants: projectApplicants,
        //   confirmedStaffCount: projectConfirmedStaff.length,
        //   applicantsCount: projectApplicants.length
        // });
        
        // Set the combined staff for other components that expect staffDetails
        setStaffDetails([...projectConfirmedStaff, ...projectApplicants]);
        
        // Transform the data to match StaffingTab's expected structure
        const transformStaffData = (staffArray: unknown[]) => {
          return staffArray.map(staff => {
            // Extract the actual ID string from potential object structures
            const rawId = staff.candidate_id || staff.id;
            let actualId: string;
            
            if (typeof rawId === 'string') {
              actualId = rawId;
            } else if (rawId && typeof rawId === 'object') {
              // Handle nested ID objects
              actualId = rawId.id || rawId.candidate_id || (typeof staff.id === 'string' ? staff.id : '');
            } else {
              actualId = '';
            }
            
            return {
              id: actualId,
              name: staff.name || staff.full_name || 'Unknown',
              photo: staff.photo || staff.profile_photo,
              designation: staff.position || staff.designation || 'Crew',
              status: staff.status || 'confirmed',
              appliedDate: staff.applied_date ? new Date(staff.applied_date) : new Date(),
              applyType: staff.apply_type || 'full',
              // Include bank details
              bank_name: staff.bank_name,
              bank_account_number: staff.bank_account_number,
              email: staff.email,
              phone_number: staff.phone_number,
              // Ensure working dates are Date objects
              workingDates: (staff.working_dates || []).map((d: unknown) => 
                d instanceof Date ? d : new Date(d)
              ),
              // Ensure working dates with salary have proper Date objects
              workingDatesWithSalary: (staff.working_dates_with_salary || []).map((item: unknown) => ({
                ...item,
                date: item.date instanceof Date ? item.date : new Date(item.date)
              })),
              // Preserve payment status
              paymentStatus: staff.paymentStatus,
              paymentDate: staff.paymentDate ? new Date(staff.paymentDate) : undefined,
              paymentBatchId: staff.paymentBatchId
            };
          });
        };
        
        // If we have candidate IDs, fetch additional details from candidates table
        const allStaffIds = [
          ...projectConfirmedStaff.map(s => {
            const id = s.candidate_id || s.id;
            // Debug log to understand the structure
            if (typeof id !== 'string' && id) {
              // console.warn('Non-string ID found in confirmed staff:', { id, type: typeof id, staff: s });
            }
            // Ensure we extract string ID from potential object
            return typeof id === 'string' ? id : (id?.id || null);
          }),
          ...projectApplicants.map(a => {
            const id = a.candidate_id || a.id;
            // Debug log to understand the structure
            if (typeof id !== 'string' && id) {
              // console.warn('Non-string ID found in applicants:', { 
              //   id, 
              //   type: typeof id, 
              //   applicant: a,
              //   // Log more details about the ID structure
              //   idKeys: Object.keys(id || {}),
              //   candidateId: a.candidate_id,
              //   directId: a.id
              // });
            }
            // Ensure we extract string ID from potential object
            return typeof id === 'string' ? id : (id?.id || null);
          })
        ].filter(id => id && typeof id === 'string');
        
        if (allStaffIds.length > 0) {
          try {
            const { data: candidatesData, error: candidatesError } = await supabase
              .from('candidates')
              .select('id, full_name, profile_photo, email, phone_number, ic_number, bank_name, bank_account_number')
              .in('id', allStaffIds);
              
            if (candidatesError) {
              console.error('Failed to fetch candidate details:', candidatesError);
              // Continue with partial data instead of throwing
            }
            
            if (candidatesData && candidatesData.length > 0) {
            // Merge candidate details with staff data
            const enrichedConfirmedStaff = projectConfirmedStaff.map(staff => {
              const staffId = staff.candidate_id || staff.id;
              const actualId = typeof staffId === 'string' ? staffId : (staffId?.id || null);
              const candidate = candidatesData.find(c => c.id === actualId);
              return {
                ...staff,
                id: actualId || (typeof staff.id === 'string' ? staff.id : ''), // Use the extracted string ID
                candidate_id: actualId, // Keep the actual candidate ID
                name: candidate?.full_name || staff.name || staff.full_name || 'Unknown',
                photo: candidate?.profile_photo || staff.photo || staff.profile_photo,
                email: candidate?.email,
                phone_number: candidate?.phone_number,
                bank_name: candidate?.bank_name || staff.bank_name,
                bank_account_number: candidate?.bank_account_number || staff.bank_account_number,
                status: 'confirmed',
                paymentStatus: staff.paymentStatus,
                paymentDate: staff.paymentDate,
                paymentBatchId: staff.paymentBatchId
              };
            });
            
            const enrichedApplicants = projectApplicants.map(applicant => {
              const applicantId = applicant.candidate_id || applicant.id;
              const actualId = typeof applicantId === 'string' ? applicantId : (applicantId?.id || null);
              const candidate = candidatesData.find(c => c.id === actualId);
              return {
                ...applicant,
                id: actualId || (typeof applicant.id === 'string' ? applicant.id : ''), // Use the extracted string ID
                candidate_id: actualId, // Keep the actual candidate ID
                name: candidate?.full_name || applicant.name || applicant.full_name || 'Unknown',
                photo: candidate?.profile_photo || applicant.photo || applicant.profile_photo,
                email: candidate?.email,
                phone_number: candidate?.phone_number,
                bank_name: candidate?.bank_name || applicant.bank_name,
                bank_account_number: candidate?.bank_account_number || applicant.bank_account_number,
                status: applicant.status || 'pending'
              };
            });
            
            // Transform to match StaffingTab's expected structure
            const transformedConfirmedStaff = transformStaffData(enrichedConfirmedStaff);
            const transformedApplicants = transformStaffData(enrichedApplicants);
            
            if (isMounted) {
              setConfirmedStaff(transformedConfirmedStaff);
              setApplicants(transformedApplicants);
              setStaffDetails([...transformedConfirmedStaff, ...transformedApplicants]);
            }
          } else {
            // If no candidate data, still transform what we have
            if (isMounted) {
              setConfirmedStaff(transformStaffData(projectConfirmedStaff));
              setApplicants(transformStaffData(projectApplicants));
              setStaffDetails([...transformStaffData(projectConfirmedStaff), ...transformStaffData(projectApplicants)]);
            }
          }
          } catch (staffError) {
            console.error('Error processing staff data:', staffError);
            // Continue with basic staff data
            if (isMounted) {
              setConfirmedStaff(transformStaffData(projectConfirmedStaff));
              setApplicants(transformStaffData(projectApplicants));
              setStaffDetails([...transformStaffData(projectConfirmedStaff), ...transformStaffData(projectApplicants)]);
            }
          }
        } else {
          // If no IDs at all, just transform empty arrays
          if (isMounted) {
            setConfirmedStaff(transformStaffData(projectConfirmedStaff));
            setApplicants(transformStaffData(projectApplicants));
            setStaffDetails([...transformStaffData(projectConfirmedStaff), ...transformStaffData(projectApplicants)]);
          }
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load staff details",
            variant: "destructive"
          });
        }
      }
    };
    
    fetchProjectDetails();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [project.id, toast]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleViewDetails = () => {
    onViewDetails?.(project);
  };
  
  // Handle removing an expense claim
  const handleRemoveClaim = async (claimId: string) => {
    try {
      // Immediately set removing state and show toast
      setIsRemovingClaim(true);
      
      toast({
        title: "Deleting expense claim",
        description: "Removing expense claim and associated receipts...",
      });
      
      // Find the claim being deleted for logging
      const claimToDelete = localExpenseClaims.find(claim => claim.id === claimId);
      
      // Update local state immediately for better UX
      setLocalExpenseClaims(prev => prev.filter(claim => claim.id !== claimId));
      
      // If we were showing details for this claim, close the dialog
      if (selectedClaimId === claimId) {
        setSelectedClaimId(null);
        setShowClaimDetailsDialog(false);
      }
      
      // Actually perform the deletion
      const result = await deleteExpenseClaim(claimId);
      
      if (result.success) {
        // Log successful expense claim deletion
        logUtils.action('delete_expense_claim', true, {
          claim_title: claimToDelete?.title || 'Unknown Claim',
          claim_amount: claimToDelete?.amount || 0,
          claim_id: claimId
        });
        
        toast({
          title: "Success",
          description: result.message || "Expense claim deleted successfully",
        });
      } else {
        // Restore the claim in local state if deletion failed
        const claim = expenseClaims.find(c => c.id === claimId);
        if (claim) {
          setLocalExpenseClaims(prev => [...prev, claim]);
        }
        
        // Log failed expense claim deletion
        logUtils.action('delete_expense_claim', false, {
          claim_title: claimToDelete?.title || 'Unknown Claim',
          claim_id: claimId,
          error_message: result.message || 'Unknown error'
        });
        
        toast({
          title: "Error",
          description: result.message || "Failed to delete expense claim",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing expense claim:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete expense claim",
        variant: "destructive"
      });
      
      // Restore the claim in local state if deletion failed
      const claim = expenseClaims.find(c => c.id === claimId);
      if (claim) {
        setLocalExpenseClaims(prev => [...prev, claim]);
      }
    } finally {
      setIsRemovingClaim(false);
    }
  };

  const handleCreateExpenseClaim = async (data: unknown) => {
    // console.log('SpotlightCard: Creating expense claim', data);
    // console.log('Project ID:', project.id);
    // console.log('Project object:', project);
    
    try {
      const user = await getUser();
      if (!user) throw new Error('User not found');
      
      // console.log('Current user:', user.id, user.email);
      
      // Transform the data from ExpenseClaimFormWithDragDrop format
      const claimData: any = {
        title: data.title,
        description: data.description,
        project_id: project.id,
        submitted_by: data.is_own_claim ? 'Self' : 'On behalf',
        amount: parseFloat(data.amount),
        status: 'pending' as const,
        category: data.category,
        expense_date: data.expense_date instanceof Date ? data.expense_date.toISOString() : data.expense_date,
        receipt_number: data.receipt_number,  // Changed from reference_number
        receipts: [] // Documents will be handled separately
      };
      
      // Set user_id or staff_id based on claim type
      if (data.is_own_claim) {
        claimData.user_id = user.id;
      } else {
        claimData.staff_id = data.staff_id;
        // Don't set user_id for staff claims
      }
      
      // console.log('Claim data to be created:', claimData);
      
      const result = await createExpenseClaimWithReceipts(claimData, data.documents || []);
      
      if (result) {
        const newClaim = {
          ...result.claim,
          receipts: result.receipts || []
        };
        setLocalExpenseClaims([newClaim, ...localExpenseClaims]);
        
        // Log successful expense claim creation
        logUtils.action('create_expense_claim', true, {
          claim_title: data.title,
          claim_amount: parseFloat(data.amount),
          claim_category: data.category,
          receipts_count: result.receipts?.length || 0,
          claim_id: result.claim.id
        });
        
        toast({
          title: "Success",
          description: "Expense claim created successfully",
        });
        setShowExpenseClaimForm(false);
        
        // Refresh expense claims from database
        try {
          // console.log('Refreshing expense claims after creation...');
          const updatedClaims = await fetchProjectExpenseClaimsWithFallback(project.id);
          // console.log('Updated claims after creation:', updatedClaims);
          setLocalExpenseClaims(updatedClaims);
          
          // Also try a direct query to debug
          const { data: directQuery, error: directError } = await supabase
            .from('expense_claims')
            .select('*')
            .eq('project_id', project.id);
          
          // console.log('Direct query result:', directQuery, 'error:', directError);
        } catch (error) {
          console.error('Error refreshing expense claims:', error);
        }
      }
    } catch (error) {
      console.error('Failed to create expense claim:', error);
      
      // Log failed expense claim creation
      logUtils.action('create_expense_claim', false, {
        claim_title: data.title,
        claim_amount: parseFloat(data.amount),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create expense claim",
        variant: "destructive"
      });
    }
  };

  // Simple expand/minimize handlers without excessive logging
  const handleExpand = React.useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleMinimize = React.useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Render minimized view
  if (isMinimized) {
    return (
      <SpotlightCardMinimized
        project={project}
        onClick={handleExpand}
        onMouseMove={handleMouseMove}
        mousePosition={mousePosition}
        expenseClaims={localExpenseClaims}
      />
    );
  }

  // Render expanded view
  return (
    <>
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleMinimize}
        >
          <motion.div
            className="w-full max-w-7xl h-[90vh] max-h-[900px] relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onMouseMove={handleMouseMove}
          >
            <NeonGradientCard
              className="bg-gray-50 dark:bg-slate-900 shadow-2xl overflow-hidden h-full"
              borderRadius={12}
              borderSize={2}
              neonColors={{ firstColor: "#A07CFE", secondColor: "#FE8FB5" }}
            >
              {/* SpotlightCardHeader removed */}
              
              <div className="flex h-full">
                <SpotlightCardSidebar
                  project={project}
                  onViewDetails={() => {}} // Remove view details functionality
                  staffCount={staffDetails.length}
                  claimsCount={localExpenseClaims.length}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
                
                {/* Main Content Area */}
                <div 
                  ref={(el) => {
                    // Auto-focus the main content area when it mounts
                    if (el && !isMinimized) {
                      // Use a small delay to ensure the element is fully rendered
                      setTimeout(() => el.focus(), 100);
                    }
                  }}
                  className="flex-1 bg-gray-50 dark:bg-gray-900 pt-14 px-6 pb-0 overflow-hidden flex flex-col relative outline-none"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    // Left and right arrow keys for navigation
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      // Don't change tabs if payroll edit dialog is open
                      if (isPayrollEditDialogOpen) {
                        return;
                      }
                      
                      const tabs = [
                        'schedule',
                        'staffing',
                        'payroll',
                        'expenses',
                        'documents'
                      ];
                      const currentIndex = tabs.indexOf(activeTab);
                      let newIndex;
                      
                      if (e.key === 'ArrowLeft') {
                        // Navigate to previous tab
                        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                      } else {
                        // Navigate to next tab
                        newIndex = (currentIndex + 1) % tabs.length;
                      }
                      
                      handleTabChange(tabs[newIndex]);
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => {
                    // Only focus if we're not clicking on an input, textarea, or button
                    const target = e.target as HTMLElement;
                    const isInteractiveElement = 
                      target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.tagName === 'BUTTON' ||
                      target.tagName === 'SELECT' ||
                      target.closest('input, textarea, button, select');
                    
                    if (!isInteractiveElement && e.currentTarget) {
                      e.currentTarget.focus();
                    }
                  }}
                >
                  {/* Tab Navigation with arrow key controls - centered with more top padding */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-1">
                    <button 
                      className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all hover:scale-110"
                      onClick={() => {
                        const tabs = [
                          { value: 'schedule' },
                          { value: 'staffing' },
                          { value: 'payroll' },
                          { value: 'expenses' },
                          { value: 'documents' }
                        ];
                        const currentIndex = tabs.findIndex(tab => tab.value === activeTab);
                        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        handleTabChange(tabs[prevIndex].value);
                      }}
                      aria-label="Previous tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    
                    <SpotlightCardDropdown
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                      className="w-auto"
                    />
                    
                    <button 
                      className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all hover:scale-110"
                      onClick={() => {
                        const tabs = [
                          { value: 'schedule' },
                          { value: 'staffing' },
                          { value: 'payroll' },
                          { value: 'expenses' },
                          { value: 'documents' }
                        ];
                        const currentIndex = tabs.findIndex(tab => tab.value === activeTab);
                        const nextIndex = (currentIndex + 1) % tabs.length;
                        handleTabChange(tabs[nextIndex].value);
                      }}
                      aria-label="Next tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="flex-1 overflow-auto">
                    {activeTab === 'documents' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 h-full flex flex-col">
                        <SpotlightCardDocuments
                          documents={localDocuments}
                          documentsView={documentsView}
                          setDocumentsView={setDocumentsView}
                          onShowUploadDialog={() => setShowUploadDialog(true)}
                          onDocumentDelete={(docId) => {
                            // Find the document being deleted for logging
                            const deletedDoc = localDocuments.find(doc => doc.id === docId);
                            logUtils.action('delete_document', true, {
                              document_name: deletedDoc?.file_name || 'Unknown Document',
                              document_type: deletedDoc?.type || 'unknown',
                              document_category: deletedDoc?.category || 'unknown'
                            });
                            // Update local documents state by filtering out the deleted document
                            setLocalDocuments(prev => prev.filter(doc => doc.id !== docId));
                          }}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'staffing' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 h-full flex flex-col">
                        <StaffingTab
                          confirmedStaff={confirmedStaff}
                          setConfirmedStaff={(newConfirmedStaff) => {
                            // console.log('Setting new confirmed staff:', newConfirmedStaff);
                            
                            // Log staff changes
                            const oldStaffIds = confirmedStaff.map(s => s.id);
                            const newStaffIds = newConfirmedStaff.map(s => s.id);
                            
                            // Find added staff
                            const addedStaff = newConfirmedStaff.filter(s => !oldStaffIds.includes(s.id));
                            addedStaff.forEach(staff => {
                              logUtils.action('add_staff', true, {
                                staff_name: staff.name,
                                staff_position: staff.designation,
                                staff_id: staff.id
                              }, project.id);
                            });
                            
                            // Find removed staff
                            const removedStaff = confirmedStaff.filter(s => !newStaffIds.includes(s.id));
                            removedStaff.forEach(staff => {
                              logUtils.action('remove_staff', true, {
                                staff_name: staff.name,
                                staff_position: staff.designation,
                                staff_id: staff.id
                              }, project.id);
                            });
                            
                            setConfirmedStaff(newConfirmedStaff);
                            
                            // Update the project in the database
                            const updateProject = async () => {
                              try {
                                // Use optimistic locking with updated_at timestamp
                                const { error } = await supabase
                                  .from('projects')
                                  .update({ 
                                    confirmed_staff: newConfirmedStaff.map(staff => ({
                                      candidate_id: staff.id,
                                      name: staff.name,
                                      photo: staff.photo,
                                      position: staff.designation,
                                      status: staff.status,
                                      working_dates: staff.workingDates,
                                      working_dates_with_salary: staff.workingDatesWithSalary,
                                      paymentStatus: staff.paymentStatus,
                                      paymentDate: staff.paymentDate,
                                      paymentBatchId: staff.paymentBatchId
                                    })),
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('id', project.id);
                                  
                                if (error) throw error;
                              } catch (error) {
                                console.error('Error updating confirmed staff:', error);
                                toast({
                                  title: "Error saving staff",
                                  description: "Failed to update project staff",
                                  variant: "destructive"
                                });
                              }
                            };
                            
                            updateProject();
                          }}
                          applicants={applicants}
                          setApplicants={(newApplicants) => {
                            // console.log('Setting new applicants:', newApplicants);
                            setApplicants(newApplicants);
                            
                            // Update the project in the database
                            const updateProject = async () => {
                              try {
                                const { error } = await supabase
                                  .from('projects')
                                  .update({ 
                                    applicants: newApplicants.map(applicant => ({
                                      candidate_id: applicant.id,
                                      name: applicant.name,
                                      photo: applicant.photo,
                                      position: applicant.designation,
                                      status: applicant.status,
                                      applied_date: applicant.appliedDate
                                    }))
                                  })
                                  .eq('id', project.id);
                                  
                                if (error) throw error;
                              } catch (error) {
                                console.error('Error updating applicants:', error);
                                toast({
                                  title: "Error saving applicants",
                                  description: "Failed to update project applicants",
                                  variant: "destructive"
                                });
                              }
                            };
                            
                            updateProject();
                          }}
                          showAddStaffForm={false}
                          setShowAddStaffForm={() => {}}
                          handleRemoveStaff={(staffId) => {
                            // console.log('Removing staff:', staffId);
                            
                            // Find the staff member being removed
                            const staffMember = confirmedStaff.find(s => s.id === staffId);
                            if (!staffMember) {
                              console.error('Staff member not found:', staffId);
                              return;
                            }
                            
                            // Log staff removal
                            logUtils.action('remove_staff', true, {
                              staff_name: staffMember.name,
                              staff_position: staffMember.designation,
                              staff_id: staffId,
                              moved_to: 'applicants'
                            }, project.id);
                            
                            // Create a new applicant from the removed staff
                            const newApplicant = {
                              ...staffMember,
                              status: 'pending' as const,
                              appliedDate: new Date()
                            };
                            
                            // Check if already in applicants
                            const isAlreadyInApplicants = applicants.some(a => a.id === staffId);
                            
                            let updatedApplicants;
                            if (isAlreadyInApplicants) {
                              // Update existing applicant
                              updatedApplicants = applicants.map(a => 
                                a.id === staffId 
                                  ? { ...a, status: 'pending' as const, appliedDate: new Date() }
                                  : a
                              );
                            } else {
                              // Add as new applicant
                              updatedApplicants = [...applicants, newApplicant];
                            }
                            
                            // Remove from confirmed staff
                            const updatedConfirmedStaff = confirmedStaff.filter(s => s.id !== staffId);
                            
                            // Update local state
                            setConfirmedStaff(updatedConfirmedStaff);
                            setApplicants(updatedApplicants);
                            
                            // Update database
                            const updateProject = async () => {
                              try {
                                const { error } = await supabase
                                  .from('projects')
                                  .update({ 
                                    confirmed_staff: updatedConfirmedStaff.map(staff => ({
                                      candidate_id: staff.id,
                                      name: staff.name,
                                      photo: staff.photo,
                                      position: staff.designation,
                                      status: staff.status,
                                      working_dates: staff.workingDates,
                                      working_dates_with_salary: staff.workingDatesWithSalary
                                    })),
                                    applicants: updatedApplicants.map(applicant => ({
                                      candidate_id: applicant.id,
                                      name: applicant.name,
                                      photo: applicant.photo,
                                      position: applicant.designation,
                                      status: applicant.status,
                                      applied_date: applicant.appliedDate
                                    }))
                                  })
                                  .eq('id', project.id);
                                  
                                if (error) throw error;
                                
                                toast({
                                  title: "Staff moved to applicants",
                                  description: `${staffMember.name} has been moved to applicants list`,
                                  variant: "default"
                                });
                              } catch (error) {
                                console.error('Error updating project:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to update project staff",
                                  variant: "destructive"
                                });
                              }
                            };
                            
                            updateProject();
                          }}
                          projectStartDate={new Date(project.start_date)}
                          projectEndDate={project.end_date ? new Date(project.end_date) : undefined}
                          projectId={project.id}
                          isAutosaving={false}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'schedule' && (
                      <div className="h-full bg-white dark:bg-slate-800 rounded-lg p-6 flex flex-col">
                        <ScheduleTabContent 
                          project={project} 
                          confirmedStaff={confirmedStaff}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'history' && (
                      <div className="h-full bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
                        <CompactHistory projectId={project.id} />
                      </div>
                    )}
                    
                    {activeTab === 'payroll' && (
                      <ProjectPayroll
                        project={project}
                        confirmedStaff={confirmedStaff}
                        setConfirmedStaff={setConfirmedStaff}
                        projectStartDate={new Date(project.start_date)}
                        projectEndDate={project.end_date ? new Date(project.end_date) : new Date(project.start_date)}
                        onEditDialogOpenChange={setIsPayrollEditDialogOpen}
                        onProjectUpdate={(updatedProject) => {
                          // Update the local project state
                          setProject(updatedProject);
                        }}
                      />
                    )}
                      
                    {activeTab === 'expenses' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 h-full flex flex-col">
                        <SpotlightCardExpenses
                          project={project}
                          expenseClaims={localExpenseClaims}
                          onShowExpenseClaimForm={() => setShowExpenseClaimForm(true)}
                          onShowClaimDetails={(claimId) => {
                            setSelectedClaimId(claimId);
                            setShowClaimDetailsDialog(true);
                          }}
                          onRemoveClaim={handleRemoveClaim}
                          isRemovingClaim={isRemovingClaim}
                          onRefresh={refreshExpenseClaims}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Footer row - simpler without tab dropdown */}
                  <div className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-1 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Status:</span>
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {project.status || 'Active'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Updated:</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </NeonGradientCard>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      
      {/* Expense Claim Form */}
      <ExpenseClaimFormWithDragDrop
        open={showExpenseClaimForm}
        onOpenChange={setShowExpenseClaimForm}
        onSubmit={handleCreateExpenseClaim}
        projectId={project.id}
        confirmedStaff={confirmedStaff}
      />
      
      {/* Expense Claim Details Dialog */}
      <ExpenseClaimDetailsDialog
        open={showClaimDetailsDialog}
        onOpenChange={setShowClaimDetailsDialog}
        claimId={selectedClaimId}
        canApprove={false}
        onApprove={() => {}}
        onReject={() => {}}
      />
      
      {/* Document Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload documents for this project. You can drag and drop multiple files or add Google Drive links.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 h-[400px]">
            {/* Tabs for File Upload and Drive Link */}
            <Tabs 
              defaultValue="files" 
              value={activeUploadTab}
              onValueChange={(value) => setActiveUploadTab(value as 'files' | 'link')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="files" className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  Google Drive
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="pt-2">
                {/* File Upload with DocumentDropzone */}
                <div className="h-[200px]">
                  <DocumentDropzoneFiles
                    value={selectedFiles}
                    onChange={setSelectedFiles}
                    maxFiles={10}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="h-full"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="link" className="pt-2">
                {/* Google Drive Link Input */}
                <div className="space-y-3">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="googleDriveLink">Google Drive Link</Label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                      <Input
                        id="googleDriveLink"
                        placeholder="https://drive.google.com/file/d/..."
                        className="pl-10"
                        value={googleDriveLink}
                        onChange={(e) => setGoogleDriveLink(e.target.value)}
                      />
                    </div>
                    {googleDriveLinkError && (
                      <p className="text-xs text-red-500 mt-1">{googleDriveLinkError}</p>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <Label htmlFor="googleDriveName">Link Name (Optional)</Label>
                    <Input
                      id="googleDriveName"
                      placeholder="Google Document Name"
                      className="mt-1"
                      value={googleDriveName}
                      onChange={(e) => setGoogleDriveName(e.target.value)}
                    />
                  </div>
                  
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-100 dark:border-blue-800/50 mt-3">
                    <p className="text-xs text-blue-600 dark:text-blue-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                      Supported Google Drive links: Google Docs, Sheets, Slides, and regular files.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Category and Description (Common for both tabs) */}
            <div className="grid gap-4 pt-2">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={fileCategory} onValueChange={setFileCategory}>
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Add a description for these documents"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setSelectedFiles([]);
                setFileCategory('project');
                setFileDescription('');
                setGoogleDriveLink('');
                setGoogleDriveName('');
                setGoogleDriveLinkError('');
                setActiveUploadTab('files');
              }}
            >
              Cancel
            </Button>
            <ShimmerButton
              disabled={(activeUploadTab === 'files' && selectedFiles.length === 0) || 
                        (activeUploadTab === 'link' && !googleDriveLink) || 
                        uploadingFile}
              onClick={async () => {
                // Handle file uploads
                if (activeUploadTab === 'files' && selectedFiles.length > 0) {
                  setUploadingFile(true);
                  const successfulUploads = [];
                  const failedUploads = [];
                  
                  try {
                    // Process each file sequentially
                    for (const file of selectedFiles) {
                      try {
                        // Use the document service to upload the file
                        const uploadedDoc = await uploadProjectDocument(
                          project.id,
                          file,
                          fileDescription
                        );
                        
                        successfulUploads.push(uploadedDoc);
                        
                        // Log successful upload
                        logUtils.action('upload_document', true, {
                          document_name: file.name,
                          document_type: file.type,
                          document_size: file.size,
                          document_category: fileCategory
                        });
                      } catch (error) {
                        console.error(`Error uploading ${file.name}:`, error);
                        failedUploads.push(file.name);
                        
                        // Log failed upload
                        logUtils.action('upload_document', false, {
                          document_name: file.name,
                          error_message: error instanceof Error ? error.message : 'Unknown error'
                        });
                      }
                    }
                    
                    // Add the successfully uploaded documents to the local state
                    if (successfulUploads.length > 0) {
                      setLocalDocuments([...successfulUploads, ...localDocuments]);
                    }
                    
                    // Show appropriate success/error message
                    if (successfulUploads.length > 0) {
                      toast({
                        title: "Upload Complete",
                        description: `Successfully uploaded ${successfulUploads.length} document${successfulUploads.length > 1 ? 's' : ''}${failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ''}.`,
                        variant: failedUploads.length > 0 ? "warning" : "default"
                      });
                    } else {
                      toast({
                        title: "Upload Failed",
                        description: "Failed to upload documents. Please try again.",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    console.error('Document upload error:', error);
                    toast({
                      title: "Upload Failed",
                      description: "There was an error uploading your documents.",
                      variant: "destructive"
                    });
                  } finally {
                    // Reset and close
                    setUploadingFile(false);
                    setShowUploadDialog(false);
                    setSelectedFiles([]);
                    setFileCategory('project');
                    setFileDescription('');
                    setGoogleDriveLink('');
                    setGoogleDriveName('');
                    setGoogleDriveLinkError('');
                  }
                } 
                // Handle Google Drive link upload
                else if (activeUploadTab === 'link' && googleDriveLink) {
                  setUploadingFile(true);
                  
                  try {
                    // Validate URL format
                    try {
                      new URL(googleDriveLink);
                    } catch {
                      setGoogleDriveLinkError('Invalid URL format');
                      setUploadingFile(false);
                      return;
                    }
                    
                    // Check if it's a Google Drive URL
                    const isGoogleDriveUrl = [
                      'drive.google.com',
                      'docs.google.com',
                      'sheets.google.com',
                      'slides.google.com'
                    ].some(domain => googleDriveLink.includes(domain));
                    
                    if (!isGoogleDriveUrl) {
                      setGoogleDriveLinkError('Please enter a valid Google Drive URL');
                      setUploadingFile(false);
                      return;
                    }
                    
                    // Determine document type from URL
                    let documentType = 'google_drive';
                    if (googleDriveLink.includes('docs.google.com')) documentType = 'google_docs';
                    if (googleDriveLink.includes('sheets.google.com')) documentType = 'google_sheets';
                    if (googleDriveLink.includes('slides.google.com')) documentType = 'google_slides';
                    
                    // Generate a display name if not provided
                    const linkName = googleDriveName || (() => {
                      if (documentType === 'google_docs') return 'Google Document';
                      if (documentType === 'google_sheets') return 'Google Spreadsheet';
                      if (documentType === 'google_slides') return 'Google Presentation';
                      return 'Google Drive File';
                    })();
                    
                    // Use the addProjectLink function to add the link
                    const uploadedLink = await addProjectLink(
                      project.id,
                      googleDriveLink,
                      linkName,
                      fileDescription
                    );
                    
                    // Add to document state with extra properties for UI display
                    const enhancedLink = {
                      ...uploadedLink,
                      is_external: true,
                      external_type: documentType,
                      external_url: googleDriveLink
                    };
                    
                    setLocalDocuments([enhancedLink, ...localDocuments]);
                    
                    // Log successful Google Drive link addition
                    logUtils.action('upload_document', true, {
                      document_name: linkName,
                      document_type: documentType,
                      document_category: fileCategory,
                      is_external_link: true,
                      external_url: googleDriveLink
                    });
                    
                    toast({
                      title: "Link Added",
                      description: "Google Drive link added successfully.",
                      variant: "default"
                    });
                  } catch (error) {
                    console.error('Error adding Google Drive link:', error);
                    
                    // Log failed Google Drive link addition
                    logUtils.action('upload_document', false, {
                      document_name: googleDriveName || 'Google Drive Link',
                      document_type: 'google_drive',
                      is_external_link: true,
                      error_message: error instanceof Error ? error.message : 'Unknown error'
                    });
                    
                    toast({
                      title: "Error",
                      description: "Failed to add Google Drive link. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    // Reset and close
                    setUploadingFile(false);
                    setShowUploadDialog(false);
                    setGoogleDriveLink('');
                    setGoogleDriveName('');
                    setFileCategory('project');
                    setFileDescription('');
                    setGoogleDriveLinkError('');
                  }
                }
              }}
            >
              {uploadingFile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : activeUploadTab === 'files' ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : ''}
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add Google Drive Link
                </>
              )}
            </ShimmerButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component for Schedule tab to improve performance
function ScheduleTabContent({ project, confirmedStaff }: { project: Project, confirmedStaff: unknown[] }) {
  const { staffDetails } = useProjectStaff(project.id, true);
  
  // Use optimized staff data if available, fall back to passed-in data
  const staffToDisplay = staffDetails.length > 0 ? staffDetails : confirmedStaff;
  
  return (
    <CalendarTab
      startDate={new Date(project.start_date)}
      endDate={project.end_date ? new Date(project.end_date) : new Date(project.start_date)}
      confirmedStaff={staffToDisplay}
      location={project.venue_address}
      onLocationEdit={async (newLocation) => {
        // console.log('Location updated:', newLocation);
        
        const oldLocation = project.venue_address;
        
        // Log the location change
        logUtils.dataChange('venue_address', oldLocation, newLocation, {
          project_id: project.id,
          project_title: project.title
        });
        
        // Update the project in database
        try {
          const { error } = await supabase
            .from('projects')
            .update({ venue_address: newLocation })
            .eq('id', project.id);
            
          if (error) throw error;
          
          // Update local project state if available
          if (onProjectUpdated) {
            onProjectUpdated({ ...project, venue_address: newLocation });
          }
          
          toast({
            title: "Location Updated",
            description: "Project location has been updated successfully.",
          });
        } catch (error) {
          console.error('Error updating location:', error);
          toast({
            title: "Error",
            description: "Failed to update project location",
            variant: "destructive"
          });
        }
      }}
      projectId={project.id}
    />
  );
}