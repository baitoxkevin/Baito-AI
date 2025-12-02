import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CandidateAvatar } from "@/components/ui/candidate-avatar";
import { logger } from '../../lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusBadgeStyle } from './ProjectFormUtils';
import { useToast, toast as toastFn } from "@/hooks/use-toast";
import { WorkingDatePicker, WorkingDateWithSalary } from "@/components/ui/working-date-picker";
import { UserPlus, X, UserCheck, CalendarDays, AlertCircle, GripVertical, Check, ClockIcon, Calendar, CheckCircle, Users } from "lucide-react";
import { checkStaffScheduleConflicts, getProjectStaffConflicts } from "@/lib/staff-scheduling-validator";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ConflictAlert, ConflictSummary } from "@/components/ui/conflict-alert";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { AddCandidateRedesigned } from "./AddCandidateRedesigned";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StaffMember {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  status: 'confirmed' | 'pending' | 'hold' | 'rejected';
  appliedDate?: Date;
  applyType?: 'full' | 'specific';
  workingDates?: Date[];
  workingDatesWithSalary?: WorkingDateWithSalary[];
  // Replacement fields
  isReplacement?: boolean;
  replacingCrewId?: string;
  replacingCrewName?: string;
  replacementReason?: 'sick' | 'emergency' | 'no-show' | 'other';
  replacementConfirmedAt?: Date;
}

interface StaffingTabProps {
  confirmedStaff: StaffMember[];
  setConfirmedStaff: (staff: StaffMember[]) => void;
  applicants: StaffMember[];
  setApplicants: (applicants: StaffMember[]) => void;
  showAddStaffForm: boolean;
  setShowAddStaffForm: (show: boolean) => void;
  availableCandidates?: Array<{
    id: string;
    name: string;
    designation?: string;
    photo?: string;
  }>;
  handleAddApplicant?: (staffMember: StaffMember) => void;
  handleUpdateStaffStatus?: (staffId: string, newStatus: 'confirmed' | 'pending' | 'hold' | 'rejected') => void;
  handleRemoveStaff?: (staffId: string) => void;
  projectStartDate?: Date;
  projectEndDate?: Date;
  projectId?: string;
  autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isAutosaving?: boolean;
}

interface ScheduleConflict {
  date: Date;
  projectId: string;
  projectTitle: string;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Sortable Staff Row Component
interface SortableStaffRowProps {
  staff: StaffMember;
  index: number;
  editingPositionId: string | null;
  setEditingPositionId: (id: string | null) => void;
  onUpdatePosition: (staffId: string, position: string) => void;
  onWorkingDatesClick: (staff: StaffMember) => void;
  onRemoveStaff: (staffId: string) => void;
  conflicts?: ScheduleConflict[];
}

const SortableStaffRow: React.FC<SortableStaffRowProps> = ({
  staff,
  index,
  editingPositionId,
  setEditingPositionId,
  onUpdatePosition,
  onWorkingDatesClick,
  onRemoveStaff,
  conflicts
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: staff.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200",
        isDragging && "shadow-lg bg-slate-50 dark:bg-slate-800"
      )}
    >
      <TableCell className="py-2 pr-0 pl-2">
        <button
          className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>
      </TableCell>
      <TableCell className="font-medium py-2 text-left">
        <div className="flex items-center space-x-2 pl-3">
          <CandidateAvatar
            src={staff.photo}
            fallback={getInitials(staff.name)}
            candidateId={staff.id}
            size="sm"
            className="border border-white dark:border-slate-700 shadow-sm"
          />
          <span className="font-medium text-slate-900 dark:text-slate-100">{staff.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-center font-medium text-indigo-600 dark:text-indigo-400">
        <Select
          value={staff.designation || 'Crew'}
          onValueChange={(value) => onUpdatePosition(staff.id, value)}
        >
          <SelectTrigger className="w-[120px] h-8 text-sm border-0 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-center [&>svg]:hidden">
            <span className="w-full text-center">{staff.designation || 'Crew'}</span>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectItem value="Crew">Crew</SelectItem>
            <SelectItem value="Supervisor">Supervisor</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="BA">BA</SelectItem>
            <SelectItem value="Promoter">Promoter</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 font-medium shadow-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
          {staff.isReplacement && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 font-medium">
                    🔄 Replacement
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-orange-600 dark:text-orange-400">Replacement Crew</p>
                    {staff.replacingCrewName && (
                      <p className="text-sm">Replacing: <span className="font-medium">{staff.replacingCrewName}</span></p>
                    )}
                    {staff.replacementReason && (
                      <p className="text-sm">Reason: <span className="capitalize">{staff.replacementReason}</span></p>
                    )}
                    {staff.replacementConfirmedAt && (
                      <p className="text-xs text-gray-500">
                        Confirmed: {format(new Date(staff.replacementConfirmedAt), 'PPp')}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {conflicts && conflicts.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-rose-500 dark:text-rose-400 animate-pulse">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-64">
                  <p className="font-semibold text-rose-600">⚠️ Scheduling Conflicts</p>
                  <p className="text-sm mt-1">This staff member has conflicts with other projects</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                onClick={() => onWorkingDatesClick(staff)}
                className="inline-flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-700 cursor-pointer hover:scale-105 transition-transform duration-200"
              >
                <div className="relative">
                  <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {staff.workingDatesWithSalary && staff.workingDatesWithSalary.length > 0 && (
                    <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-400">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        {staff.workingDatesWithSalary.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {staff.workingDatesWithSalary && staff.workingDatesWithSalary.length > 0 
                ? <p>{staff.workingDatesWithSalary.length} working day{staff.workingDatesWithSalary.length !== 1 ? 's' : ''} - Click to edit</p>
                : <p>Set working schedule for this staff member</p>
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onRemoveStaff(staff.id);
                }}
                className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Move back to applicants list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
};

const StaffingTab = ({
  confirmedStaff: confirmedStaffProp = [],
  setConfirmedStaff,
  applicants: applicantsProp = [],
  setApplicants = () => {},
  showAddStaffForm,
  setShowAddStaffForm,
  availableCandidates: availableCandidatesProp = [],
  handleAddApplicant,
  handleUpdateStaffStatus,
  handleRemoveStaff,
  projectStartDate = new Date(),
  projectEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  projectId,
  autosaveStatus = 'idle',
  isAutosaving = false
}: StaffingTabProps) => {
  // Use stable references
  const confirmedStaff = useMemo(() => confirmedStaffProp, [confirmedStaffProp]);
  const applicants = useMemo(() => applicantsProp, [applicantsProp]);
  const availableCandidates = useMemo(() => availableCandidatesProp, [availableCandidatesProp]);
  const { toast } = useToast();
  const [staffConflicts, setStaffConflicts] = useState<Record<string, {
    staffId: string;
    staffName: string;
    conflicts: ScheduleConflict[];
  }>>({});
  const [activeApplicantFilter, setActiveApplicantFilter] = useState<'all' | 'pending' | 'hold' | 'rejected'>('all');
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);

  // State for working dates dialog
  const [isWorkingDatesOpen, setIsWorkingDatesOpen] = useState(false);
  
  // Local state for add staff form if not provided
  const [localShowAddStaffForm, setLocalShowAddStaffForm] = useState(false);
  const effectiveShowAddStaffForm = showAddStaffForm ?? localShowAddStaffForm;
  const effectiveSetShowAddStaffForm = setShowAddStaffForm ?? setLocalShowAddStaffForm;
  
  // State for add candidate dialog
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  
  // State for database candidates
  const [databaseCandidates, setDatabaseCandidates] = useState<Array<{
    id: string;
    name: string;
    designation?: string;
    photo?: string;
  }>>([]);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = confirmedStaff.findIndex((staff) => staff.id === active.id);
    const newIndex = confirmedStaff.findIndex((staff) => staff.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    const newConfirmedStaff = arrayMove(confirmedStaff, oldIndex, newIndex);
    setConfirmedStaff(newConfirmedStaff);
    
    // Update database if projectId is provided
    if (projectId) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            staff: newConfirmedStaff.map((staff, index) => ({
              candidate_id: staff.id,
              name: staff.name,
              photo: staff.photo,
              position: staff.designation,
              status: staff.status,
              working_dates: staff.workingDates,
              working_dates_with_salary: staff.workingDatesWithSalary,
              order: index // Save the order
            }))
          })
          .eq('id', projectId);
          
        if (error) throw error;
        
        toast({
          title: "Staff order updated",
          description: "The staff order has been saved",
          variant: "default"
        });
      } catch (error) {
        logger.error('[StaffingTab] Error updating staff order:', error);
        toast({
          title: "Error",
          description: "Failed to save staff order",
          variant: "destructive"
        });
      }
    }
  };
  
  // Batch add applicants implementation with optimized performance
  const batchAddApplicants = useCallback(async (newApplicantsList: StaffMember[]) => {
    if (!setApplicants) return;

    // Filter out duplicates
    const uniqueNewApplicants = newApplicantsList.filter(
      newApp => !applicants.some(existingApp => existingApp.id === newApp.id)
    );

    if (uniqueNewApplicants.length === 0) {
      toast({
        title: "All candidates already exist",
        description: "These candidates are already in the applicants list",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update local state immediately for instant UI feedback
      const updatedApplicants = [...applicants, ...uniqueNewApplicants];
      setApplicants(updatedApplicants);

      // Show success toast immediately
      toast({
        title: "Applicants Added",
        description: `Successfully added ${uniqueNewApplicants.length} applicant${uniqueNewApplicants.length > 1 ? 's' : ''}`,
      });

      // Update database asynchronously in the background
      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update({
            applicants: updatedApplicants.map(app => ({
              candidate_id: app.id,
              name: app.name,
              photo: app.photo,
              position: app.designation,
              status: app.status,
              applied_date: app.appliedDate
            }))
          })
          .eq('id', projectId);

        if (error) {
          // If database update fails, rollback the local state
          setApplicants(applicants);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error adding applicants:', error);
      toast({
        title: "Error",
        description: "Failed to add applicants to database. Changes were reverted.",
        variant: "destructive"
      });
    }
  }, [applicants, setApplicants, projectId, toast]);

  // Standalone implementation for adding applicants
  const effectiveHandleAddApplicant = async (applicant: StaffMember) => {
    if (!setApplicants) return;
    
    // Check if candidate is already in applicants
    const existingApplicant = applicants.find(a => a.id === applicant.id);
    if (existingApplicant) {
      toast({
        title: "Candidate already exists",
        description: "This candidate is already in the applicants list",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Add to applicants list
      const newApplicants = [...applicants, applicant];
      
      // Update database if projectId is provided
      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update({
            applicants: newApplicants.map(app => ({
              candidate_id: app.id,
              name: app.name,
              photo: app.photo,
              position: app.designation,
              status: app.status,
              applied_date: app.appliedDate
            }))
          })
          .eq('id', projectId);
          
        if (error) throw error;
      }
      
      // Update local state
      setApplicants(newApplicants);
      
      // Show success toast
      toast({
        title: "Applicant added",
        description: `${applicant.name} has been added to the applicants list`,
        variant: "default"
      });
      
      // logger.debug('[StaffingTab] Added applicant:', { data: applicant });
    } catch (error) {
      logger.error('[StaffingTab] Error adding applicant:', error);
      toast({
        title: "Error",
        description: "Failed to add applicant",
        variant: "destructive"
      });
    }
  };
  
  // Standalone implementation for updating staff status
  const effectiveHandleUpdateStaffStatus = async (staffId: string, newStatus: 'confirmed' | 'pending' | 'hold' | 'rejected') => {
    // logger.debug('[StaffingTab] effectiveHandleUpdateStaffStatus called');
    
    // Find the applicant to update
    const applicant = applicants.find(app => app.id === staffId);
    if (!applicant) {
      logger.error('[StaffingTab] Applicant not found:', staffId);
      toast({
        title: "Error",
        description: "Applicant not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let newConfirmedStaff = confirmedStaff;
      let newApplicants = applicants;
      
      // If status is confirmed, move to confirmed staff
      if (newStatus === 'confirmed') {
        // logger.debug('[StaffingTab] Moving applicant to confirmed staff:', { data: applicant });
        
        // Create new arrays to avoid mutation
        newConfirmedStaff = [...confirmedStaff, { ...applicant, status: 'confirmed' }];
        newApplicants = applicants.filter(app => app.id !== staffId);
      } else {
        // Just update the status for other statuses
        newApplicants = applicants.map(app => 
          app.id === staffId ? { ...app, status: newStatus } : app
        );
      }
      
      // Update database if projectId is provided
      if (projectId) {
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
              working_dates_with_salary: staff.workingDatesWithSalary
            })),
            applicants: newApplicants.map(applicant => ({
              candidate_id: applicant.id,
              name: applicant.name,
              photo: applicant.photo,
              position: applicant.designation,
              status: applicant.status,
              applied_date: applicant.appliedDate
            }))
          })
          .eq('id', projectId);
          
        if (error) throw error;
      }
      
      // Update states
      setConfirmedStaff(newConfirmedStaff);
      setApplicants(newApplicants);
      
      toast({
        title: newStatus === 'confirmed' ? "Applicant approved" : "Status updated",
        description: newStatus === 'confirmed' 
          ? `${applicant.name} has been added to confirmed staff`
          : `Staff status changed to ${newStatus}`,
        variant: "default"
      });
    } catch (error) {
      logger.error('[StaffingTab] Error updating staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive"
      });
    }
  };
  
  // Standalone implementation for handleRemoveStaff
  const effectiveHandleRemoveStaff = async (staffId: string) => {
    const staffMember = confirmedStaff.find(s => s.id === staffId);
    if (!staffMember) return;
    
    try {
      // Create a new applicant with pending status
      const newApplicant = {
        ...staffMember,
        status: 'pending' as const,
        appliedDate: new Date()
      };
      
      // Check if already in applicants
      const isAlreadyInApplicants = applicants.some(a => a.id === staffId);
      
      let updatedApplicants;
      if (isAlreadyInApplicants) {
        // Update existing applicant's status to pending
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
      
      // Update database if projectId is provided
      if (projectId) {
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
          .eq('id', projectId);
          
        if (error) throw error;
      }
      
      // Update local state
      setConfirmedStaff(updatedConfirmedStaff);
      setApplicants(updatedApplicants);
      
      // Set filter to show pending applicants
      setActiveApplicantFilter('pending');
      
      // Show notification
      toast({
        title: "Staff moved to applicants",
        description: `${staffMember.name} has been moved to applicants list`,
        variant: "default"
      });
    } catch (error) {
      logger.error('[StaffingTab] Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive"
      });
    }
  };
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [currentStaffConflicts, setCurrentStaffConflicts] = useState<ScheduleConflict[]>([]);
  const [isLoadingConflicts, setIsLoadingConflicts] = useState(false);

  // State for schedule dates (dates that have active schedules)
  const [scheduleDates, setScheduleDates] = useState<Set<string>>(new Set());

  // Load schedule dates from project_schedules table
  useEffect(() => {
    if (!projectId) return;

    const loadScheduleDates = async () => {
      try {
        const { data, error } = await supabase
          .from('project_schedules')
          .select('start_date, end_date')
          .eq('project_id', projectId)
          .eq('is_active', true);

        if (error) {
          logger.error('Error loading schedule dates:', error);
          return;
        }

        // Create a Set of all dates that have schedules
        const dates = new Set<string>();
        data?.forEach(schedule => {
          const start = parseISO(schedule.start_date);
          const end = parseISO(schedule.end_date);
          const days = eachDayOfInterval({ start, end });
          days.forEach(day => {
            dates.add(format(day, 'yyyy-MM-dd'));
          });
        });

        setScheduleDates(dates);
      } catch (error) {
        logger.error('Error in loadScheduleDates:', error);
      }
    };

    loadScheduleDates();
  }, [projectId]);

  // Log project date range for debugging only when values actually change
  useEffect(() => {
    // Convert to timestamp for proper comparison
    const startTime = projectStartDate?.getTime();
    const endTime = projectEndDate?.getTime();

    // Commenting out excessive logging
    // // logger.debug('Project date range:', { data: {
    //   start: projectStartDate ? projectStartDate.toISOString( }) : 'undefined',
    //   end: projectEndDate ? projectEndDate.toISOString() : 'undefined'
    // });
  }, [projectStartDate?.getTime(), projectEndDate?.getTime()]);
  
  
  // Add a flag to track if we've already fetched
  const [hasFetchedCandidates, setHasFetchedCandidates] = useState(false);
  const [isFetchingCandidates, setIsFetchingCandidates] = useState(false);

  // Fetch candidates from database - only once on component mount
  useEffect(() => {
    // Prevent duplicate fetches or if already fetching
    if (hasFetchedCandidates || isFetchingCandidates) return;

    const fetchCandidates = async () => {
      try {
        setIsFetchingCandidates(true);
        setHasFetchedCandidates(true); // Mark as fetched immediately to prevent duplicate calls

        const { data, error } = await supabase
          .from('candidates')
          .select('id, full_name, phone_number, profile_photo')
          .eq('is_banned', false)
          .order('full_name');

        if (error) {
          logger.error('[StaffingTab] Database error:', error);
          toast({
            title: "Error loading candidates",
            description: error.message,
            variant: "destructive"
          });
          // Reset fetch flag on error to allow retry
          setHasFetchedCandidates(false);
          return;
        }

        // Transform candidates to match our interface
        const transformedCandidates = (data || []).map(candidate => ({
          id: candidate.id,
          name: candidate.full_name,
          designation: candidate.phone_number ? `Phone: ${candidate.phone_number}` : undefined,
          photo: candidate.profile_photo // Use profile_photo field from database
        }));

        setDatabaseCandidates(transformedCandidates);
      } catch (error) {
        logger.error('[StaffingTab] Error in fetchCandidates:', error);
        toast({
          title: "Error loading candidates",
          description: "Failed to load candidates from database",
          variant: "destructive"
        });
        // Reset fetch flag on error to allow retry
        setHasFetchedCandidates(false);
      } finally {
        setIsFetchingCandidates(false);
      }
    };

    fetchCandidates();
  }, [hasFetchedCandidates, isFetchingCandidates]); // Depend on both flags
  
  // Create stable arrays for memo dependencies
  const assignedIdsArray = useMemo(() => {
    return [
      ...confirmedStaff.map(staff => staff.id),
      ...applicants.map(applicant => applicant.id)
    ].sort(); // Sort to ensure stable order
  }, [confirmedStaff, applicants]);
  
  // Combine and filter candidates using memoization
  const combinedCandidates = useMemo(() => {
    // Combine database candidates with passed candidates (remove duplicates)
    const allCandidates = [...databaseCandidates];
    
    availableCandidates.forEach(candidate => {
      if (!allCandidates.find(c => c.id === candidate.id)) {
        allCandidates.push(candidate);
      }
    });
    
    // Use pre-computed assigned IDs
    const assignedIds = new Set(assignedIdsArray);
    
    // Filter out already assigned candidates
    const availableCandidatesData = allCandidates.filter(
      candidate => !assignedIds.has(candidate.id)
    );
    
    return availableCandidatesData;
  }, [databaseCandidates, availableCandidates, assignedIdsArray]);
  
  // Log candidate changes only when they actually change
  useEffect(() => {
    // logger.debug('[StaffingTab] Candidates updated:', { data: {
    //   total: combinedCandidates.length,
    //   databaseCandidates: databaseCandidates.length,
    //   passedCandidates: availableCandidates.length,
    //   assignedIds: assignedIdsArray.length
    // } });
  }, [combinedCandidates.length]); // Only log when count changes
  
  // Log staff changes
  useEffect(() => {
    // logger.debug('[StaffingTab] Staff state changed:', { data: {
    //   confirmedStaff: confirmedStaff.length,
    //   applicants: applicants.length,
    //   confirmedStaffIds: confirmedStaff.map(s => s.id }),
    //   applicantIds: applicants.map(a => a.id)
    // });
  }, [confirmedStaff.length, applicants.length]);

  // Load all staff scheduling conflicts for this project
  useEffect(() => {
    if (projectId && confirmedStaff.length > 0) {
      const checkAllConflicts = async () => {
        const conflicts = await getProjectStaffConflicts(projectId);
        setStaffConflicts(conflicts);
      };
      
      checkAllConflicts();
    }
  }, [projectId, confirmedStaff]);
  
  // Monitor applicants changes to ensure UI updates
  useEffect(() => {
    // Commenting out excessive logging
    // // logger.debug('Applicants updated:', { data: applicants.length });
    // // logger.debug('Current filter:', { data: activeApplicantFilter });
    // // logger.debug('Applicants details:', applicants.map(a => `${a.id} (${a.status})`));
    
    // If staff moved to applicants and there are pending applicants,
    // make sure the pending filter is selected
    if (applicants.length > 0 && applicants.some(a => a.status === 'pending')) {
      // // logger.debug('Has pending applicants, { data: setting filter to pending' });
      setActiveApplicantFilter('pending');
    }
  }, [applicants]);

  // Memoized date normalization function
  const normalizeDate = useCallback((d: Date) => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  // Memoized project date range
  const { projectStart, projectEnd } = useMemo(() => ({
    projectStart: normalizeDate(new Date(projectStartDate)),
    projectEnd: normalizeDate(new Date(projectEndDate))
  }), [projectStartDate, projectEndDate, normalizeDate]);

  // Function to handle working date selection
  const handleStaffWorkingDates = useCallback((staff: StaffMember) => {
    if (!staff || !staff.id) {
      logger.error("Invalid staff member for scheduling");
      toast({
        title: "Error opening schedule",
        description: "Could not load this staff member's schedule. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Quick validation and immediate UI response
    const isValidDate = (date: unknown) => date instanceof Date && !isNaN(date.getTime());
    if (!isValidDate(projectStartDate) || !isValidDate(projectEndDate)) {
      // logger.warn("Using default project date range");
    }
    
    // Optimize date filtering using pre-calculated values
    const workingDatesArray = staff.workingDatesWithSalary || [];
    const cleanDates = workingDatesArray
      .map(d => ({
        ...d,
        date: d.date instanceof Date ? d.date : new Date(d.date)
      }))
      .filter(d => {
        const normalizedDate = normalizeDate(d.date);
        return normalizedDate.getTime() >= projectStart.getTime() && 
               normalizedDate.getTime() <= projectEnd.getTime();
      });
      
    const filteredOutCount = workingDatesArray.length - cleanDates.length;
    if (filteredOutCount > 0) {
      // logger.warn(`Filtered out ${filteredOutCount} working dates outside project range`);
      toast({
        title: "Some dates were excluded",
        description: `${filteredOutCount} working ${filteredOutCount === 1 ? 'date' : 'dates'} outside the project range ${filteredOutCount === 1 ? 'was' : 'were'} removed.`,
        variant: "warning",
        duration: 5000
      });
    }
    
    // Create a cleaned version of staff
    const cleanedStaff = {
      ...staff,
      workingDatesWithSalary: cleanDates,
      workingDates: cleanDates.map(d => new Date(d.date))
    };
    
    // Set the current staff and open dialog immediately
    setCurrentStaff(cleanedStaff);
    setCurrentStaffConflicts([]); // Clear previous conflicts
    setIsWorkingDatesOpen(true);
    
    // Load conflicts asynchronously after dialog opens
    if (staff.id && projectId) {
      setIsLoadingConflicts(true);
      
      // Add a small delay to ensure dialog is rendered before starting conflict check
      setTimeout(() => {
        checkStaffScheduleConflicts(staff.id, cleanDates, projectId)
          .then(({ conflicts }) => {
            setCurrentStaffConflicts(conflicts || []);
            if (conflicts && conflicts.length > 0) {
              // logger.debug(`Found ${conflicts.length} scheduling conflicts for ${staff.name}`);
            }
          })
          .catch(error => {
            logger.error("Error checking schedule conflicts:", error);
            // Don't let error break the UI
            setCurrentStaffConflicts([]);
          })
          .finally(() => {
            setIsLoadingConflicts(false);
          });
      }, 100); // Small delay to allow dialog to render
    } else {
      setCurrentStaffConflicts([]);
      setIsLoadingConflicts(false);
    }
  }, [projectStartDate, projectEndDate, projectStart, projectEnd, projectId, normalizeDate, toast]);

  // Handle updating the staff member with new working dates and salary info
  const handleWorkingDatesChange = async (dates: WorkingDateWithSalary[]) => {
    if (!currentStaff) {
      // logger.warn("No current staff selected for date assignment");
      return;
    }

    try {
      // Validate and filter dates against project range
      const normalizeDate = (d: Date) => {
        const n = new Date(d);
        n.setHours(0, 0, 0, 0);
        return n;
      };
      
      const projectStart = normalizeDate(new Date(projectStartDate));
      const projectEnd = normalizeDate(new Date(projectEndDate));
      
      // Filter out dates outside project range before cleaning
      const filteredDates = dates.filter(d => {
        const dateToCheck = normalizeDate(d.date instanceof Date ? d.date : new Date(d.date));
        return dateToCheck >= projectStart && dateToCheck <= projectEnd;
      });
      
      if (filteredDates.length !== dates.length) {
        const removed = dates.length - filteredDates.length;
        // logger.warn(`Filtered out ${removed} dates outside project range (${projectStart.toISOString().split('T')[0]} to ${projectEnd.toISOString().split('T')[0]})`);
        
        // Show warning to user
        toast({
          title: "Some dates were excluded",
          description: `${removed} date(s) outside the project period (${format(projectStart, 'MMM d')} - ${format(projectEnd, 'MMM d')}) cannot be assigned.`,
          variant: "warning",
          duration: 5000
        });
      }
      
      // Now clean the filtered dates
      const cleanedDates = filteredDates.map(d => ({
        ...d,
        date: d.date instanceof Date ? d.date : new Date(d.date)
      }));

      // Check for scheduling conflicts before confirming
      const { hasConflicts, conflicts } = await checkStaffScheduleConflicts(
        currentStaff.id,
        cleanedDates,
        // Pass the project ID if it's available in props
        projectId
      );

      // Update the conflicts for the current staff being edited
      setCurrentStaffConflicts(conflicts);

      if (hasConflicts) {
        // Format conflicts for display
        const conflictMessages = conflicts.map(conflict =>
          `${format(conflict.date, 'PPP')} - Already assigned to: ${conflict.projectTitle}`
        );

        // Show conflict warning toast
        toast({
          title: "Scheduling Conflict Detected",
          description: (
            <div>
              <p className="font-medium">This staff member has conflicts on:</p>
              <ul className="mt-2 space-y-1 text-sm">
                {conflictMessages.map((message, index) => (
                  <li key={index}>• {message}</li>
                ))}
              </ul>
              <p className="mt-2">Please select different dates or resolve these conflicts.</p>
            </div>
          ),
          variant: "destructive",
          duration: 8000, // Show longer since there's more to read
        });

        // Return but don't prevent the assignment - let the user decide
        // Alternatively you could block by returning here and not updating
      }

      // Create a deep copy of the staff array to avoid mutation issues
      const updatedStaff = confirmedStaff.map(staff => {
        if (staff.id === currentStaff.id) {
          // Also maintain compatibility with the old workingDates array
          const simpleDates = cleanedDates.map(d => new Date(d.date));

          return {
            ...staff,
            workingDates: simpleDates,
            workingDatesWithSalary: cleanedDates,
            applyType: 'specific' // Set to specific since we're selecting specific dates
          };
        }
        return staff;
      });

      // Update conflicts info for this staff member
      if (hasConflicts) {
        setStaffConflicts(prev => ({
          ...prev,
          [currentStaff.id]: {
            staffId: currentStaff.id,
            staffName: currentStaff.name,
            conflicts
          }
        }));
      } else {
        // Remove from conflicts if no longer has any
        const newConflicts = { ...staffConflicts };
        delete newConflicts[currentStaff.id];
        setStaffConflicts(newConflicts);
      }

      // Update staff array with new date info
      setConfirmedStaff(updatedStaff);
      
      // Update database if projectId is provided
      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update({
            confirmed_staff: updatedStaff.map(staff => ({
              candidate_id: staff.id,
              name: staff.name,
              photo: staff.photo,
              position: staff.designation,
              status: staff.status,
              working_dates: staff.workingDates,
              working_dates_with_salary: staff.workingDatesWithSalary
            }))
          })
          .eq('id', projectId);
          
        if (error) throw error;
      }
      
      // Success toast if dates were applied (only show if dates were actually selected)
      if (cleanedDates.length > 0) {
        toast({
          title: "Schedule Updated",
          description: `${currentStaff.name}'s schedule has been updated with ${cleanedDates.length} working day${cleanedDates.length !== 1 ? 's' : ''}.`,
          variant: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      logger.error("Error updating working dates:", error);
      toast({
        title: "Error updating schedule",
        description: "There was a problem saving the working dates. Please try again.",
        variant: "destructive",
      });
    }
  };


  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };


  const handleApproveApplicant = async (applicantId: string) => {
    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant) {
      // Don't do anything if already approved (confirmed)
      if (applicant.status === 'confirmed') {
        toast({
          title: 'Already approved',
          description: `${applicant.name} is already approved`,
          duration: 2000,
        });
        return;
      }
      
      // Use the standalone handler to change status to confirmed
      await effectiveHandleUpdateStaffStatus(applicantId, 'confirmed');
    }
  };

  const handleHoldApplicant = async (applicantId: string) => {
    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant) {
      // Toggle between hold and pending
      const newStatus = applicant.status === 'hold' ? 'pending' : 'hold';
      await effectiveHandleUpdateStaffStatus(applicantId, newStatus);
      
      // Show toast notification
      toast({
        title: newStatus === 'hold' ? 'Applicant put on hold' : 'Applicant status reset to pending',
        description: `${applicant.name} is now ${newStatus}`,
        duration: 2000,
      });
    }
  };

  const handleRejectApplicant = async (applicantId: string) => {
    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant) {
      // Toggle between rejected and pending
      const newStatus = applicant.status === 'rejected' ? 'pending' : 'rejected';
      await effectiveHandleUpdateStaffStatus(applicantId, newStatus);
      
      // Show toast notification
      toast({
        title: newStatus === 'rejected' ? 'Applicant rejected' : 'Applicant status reset to pending',
        description: `${applicant.name} is now ${newStatus}`,
        duration: 2000,
        variant: newStatus === 'rejected' ? 'destructive' : 'default',
      });
    }
  };

  // Enhanced filtering logic with better debugging
  const filteredApplicants = useMemo(() => {
    // Commenting out excessive logging
    // // logger.debug('Computing filteredApplicants. Filter:', { data: activeApplicantFilter, 'Total:', applicants.length });
    
    const result = activeApplicantFilter === 'all' 
      ? applicants 
      : applicants.filter(applicant => applicant.status === activeApplicantFilter);
      
    // // logger.debug('Filtered applicants count:', { data: result.length, 'with IDs:', result.map(a => a.id }));
    return result;
  }, [applicants, activeApplicantFilter]);

  const getStatusCounts = () => {
    const counts = {
      all: applicants.length,
      pending: applicants.filter(a => a.status === 'pending').length,
      hold: applicants.filter(a => a.status === 'hold').length,
      rejected: applicants.filter(a => a.status === 'rejected').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="w-full py-4">
      <div className="px-1">
      {/* Assigned Staff Members */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 self-center">
            Assigned Staff Members
          </h3>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => setShowAddCandidateDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add Staff
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Add new staff members to this project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {confirmedStaff.length > 0 ? (
          <div className="bg-white dark:bg-slate-900/60 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
                  <TableRow className="border-b-2 border-indigo-100 dark:border-indigo-800">
                    <TableHead className="font-bold w-[5%] text-slate-700 dark:text-slate-300"></TableHead>
                    <TableHead className="font-bold w-[30%] text-slate-700 dark:text-slate-300 pl-6">Staff</TableHead>
                    <TableHead className="font-bold text-center w-[15%] text-slate-700 dark:text-slate-300">Position</TableHead>
                    <TableHead className="font-bold text-center w-[15%] text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-bold text-center w-[15%] text-slate-700 dark:text-slate-300">Schedule</TableHead>
                    <TableHead className="font-bold text-center w-[20%] text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext 
                    items={confirmedStaff.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {confirmedStaff.map((staff, index) => {
                      const hasConflicts = staffConflicts[staff.id]?.conflicts?.length > 0;
                      const workingDaysCount = staff.workingDatesWithSalary?.length || 0;
                      return (
                        <SortableStaffRow
                          key={staff.id}
                          staff={staff}
                          index={index}
                          editingPositionId={editingPositionId}
                          setEditingPositionId={setEditingPositionId}
                          onUpdatePosition={(staffId, position) => {
                            const updatedStaff = confirmedStaff.map(s => 
                              s.id === staffId ? { ...s, designation: position } : s
                            );
                            setConfirmedStaff(updatedStaff);
                            toast({
                              title: "Position updated",
                              description: `Changed position to ${position}`,
                              variant: "default",
                              duration: 2000
                            });
                          }}
                          onWorkingDatesClick={handleStaffWorkingDates}
                          onRemoveStaff={effectiveHandleRemoveStaff}
                          conflicts={staffConflicts[staff.id]?.conflicts}
                        />
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/60 rounded-xl shadow-lg p-10 text-center border border-slate-200/50 dark:border-slate-700/50">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No staff assigned yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Click the Add Staff button to assign members to this project</p>
          </div>
        )}
      </div>

      {/* Project Applicants */}
      <div data-test-id="applicants-container">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Project Applicants
          </h3>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm">
            <Button 
              variant={activeApplicantFilter === 'all' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveApplicantFilter('all')}
              className={cn(
                "font-medium transition-all duration-200",
                activeApplicantFilter === 'all' 
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              )}
            >
              All ({statusCounts.all})
            </Button>
            <Button 
              variant={activeApplicantFilter === 'pending' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveApplicantFilter('pending')}
              className={cn(
                "font-medium transition-all duration-200",
                activeApplicantFilter === 'pending' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm' 
                  : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
              )}
            >
              Pending ({statusCounts.pending})
            </Button>
            <Button 
              variant={activeApplicantFilter === 'hold' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveApplicantFilter('hold')}
              className={cn(
                "font-medium transition-all duration-200",
                activeApplicantFilter === 'hold' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' 
                  : 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300'
              )}
            >
              Hold ({statusCounts.hold})
            </Button>
            <Button 
              variant={activeApplicantFilter === 'rejected' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveApplicantFilter('rejected')}
              className={cn(
                "font-medium transition-all duration-200",
                activeApplicantFilter === 'rejected' 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm' 
                  : 'text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300'
              )}
            >
              Rejected ({statusCounts.rejected})
            </Button>
          </div>
        </div>
        {filteredApplicants.length > 0 ? (
          <div className="bg-white dark:bg-slate-900/60 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30">
                <TableRow className="border-b-2 border-blue-100 dark:border-blue-800">
                  <TableHead className="font-bold w-[35%] text-slate-700 dark:text-slate-300 pl-6">Applicant</TableHead>
                  <TableHead className="font-bold text-center w-[15%] text-slate-700 dark:text-slate-300">Position</TableHead>
                  <TableHead className="font-bold text-center w-[15%] text-slate-700 dark:text-slate-300">Status</TableHead>
                  <TableHead className="font-bold text-center w-[15%] text-slate-700 dark:text-slate-300">Applied</TableHead>
                  <TableHead className="font-bold text-center w-[20%] text-slate-700 dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map(applicant => {
                  const appliedDate = applicant.appliedDate ? new Date(applicant.appliedDate) : new Date();
                  const dayOfMonth = appliedDate.getDate();
                  return (
                    <TableRow key={applicant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200">
                      <TableCell className="font-medium py-2">
                        <div className="flex items-center space-x-2 pl-3">
                          <CandidateAvatar
                            src={applicant.photo}
                            fallback={getInitials(applicant.name)}
                            candidateId={applicant.id}
                            size="sm"
                            className="border border-white dark:border-slate-700 shadow-sm"
                          />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{applicant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-indigo-600 dark:text-indigo-400">
                        <Select
                          value={applicant.designation || 'Crew'}
                          onValueChange={(value) => {
                            const updatedApplicants = applicants.map(a => 
                              a.id === applicant.id ? { ...a, designation: value } : a
                            );
                            setApplicants(updatedApplicants);
                            toast({
                              title: "Position updated",
                              description: `Changed position to ${value}`,
                              variant: "default",
                              duration: 2000
                            });
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-sm border-0 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-center [&>svg]:hidden">
                            <span className="w-full text-center">{applicant.designation || 'Crew'}</span>
                          </SelectTrigger>
                          <SelectContent align="center">
                            <SelectItem value="Crew">Crew</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="BA">BA</SelectItem>
                            <SelectItem value="Promoter">Promoter</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "px-3 py-1 font-medium shadow-sm transition-all duration-200",
                          applicant.status === 'pending' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                            : applicant.status === 'hold' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                        )}>
                          {applicant.status === 'pending' && <ClockIcon className="w-3 h-3 mr-1" />}
                          {applicant.status === 'hold' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {applicant.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-700 cursor-pointer hover:scale-105 transition-transform duration-200">
                                <div className="relative">
                                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-400">
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                      {dayOfMonth}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">Application Date</p>
                              <p className="text-sm">{format(appliedDate, 'EEEE, MMMM d, yyyy')}</p>
                              <p className="text-xs text-slate-400 mt-1">{format(appliedDate, 'h:mm a')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveApplicant(applicant.id)}
                                  className={cn(
                                    "h-8 px-2 transition-all duration-200 shadow-sm",
                                    applicant.status === 'confirmed' 
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
                                      : "hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-700"
                                  )}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{applicant.status === 'confirmed' ? '✓ Approved' : 'Approve applicant'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleHoldApplicant(applicant.id)}
                                  className={cn(
                                    "h-8 px-2 transition-all duration-200 shadow-sm",
                                    applicant.status === 'hold' 
                                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 border-0"
                                      : "hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-900/20 dark:hover:border-amber-700"
                                  )}
                                >
                                  <AlertCircle className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{applicant.status === 'hold' ? '⏸ On Hold' : 'Put on hold'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectApplicant(applicant.id)}
                                  className={cn(
                                    "h-8 px-2 transition-all duration-200 shadow-sm",
                                    applicant.status === 'rejected' 
                                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 border-0"
                                      : "hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-900/20 dark:hover:border-rose-700"
                                  )}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{applicant.status === 'rejected' ? '✗ Rejected' : 'Reject applicant'}</p>
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
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/60 rounded-xl shadow-lg p-10 text-center border border-slate-200/50 dark:border-slate-700/50" data-test-id="no-applicants-message">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              No {activeApplicantFilter !== 'all' ? activeApplicantFilter : ''} applicants yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {activeApplicantFilter === 'all' 
                ? 'Waiting for candidates to apply for this project'
                : `No applicants in ${activeApplicantFilter} status`}
            </p>
          </div>
        )}
      </div>

      {/* Working Dates Dialog */}
      {currentStaff && (
        <Dialog open={isWorkingDatesOpen} onOpenChange={setIsWorkingDatesOpen}>
          <DialogContent 
            className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-0 shadow-lg dark:shadow-slate-800/30 rounded-xl p-4 sm:p-5"
            aria-describedby="schedule-description"
          >
            <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="flex items-center gap-3">
                <CandidateAvatar
                  src={currentStaff.photo}
                  fallback={getInitials(currentStaff.name)}
                  candidateId={typeof currentStaff === 'object' ? currentStaff.id : currentStaff}
                  size="lg"
                  className="border-2 border-white dark:border-slate-700 shadow-sm"
                />
                <div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-bold text-lg">
                    Schedule for {currentStaff.name}
                  </span>
                  <p id="schedule-description" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select working dates for this project
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {/* Enhanced calendar date picker */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 px-1 py-3 sm:py-4 rounded-lg mb-3 shadow-sm">
                {currentStaff && (
                  <CalendarComponent
                    mode="multiple"
                    selected={(currentStaff.workingDatesWithSalary || [])
                      .filter(entry => {
                        const dateToCheck = normalizeDate(entry.date instanceof Date ? entry.date : new Date(entry.date));
                        return dateToCheck.getTime() >= projectStart.getTime() && 
                               dateToCheck.getTime() <= projectEnd.getTime();
                      })
                      .map(entry => entry.date instanceof Date ? entry.date : new Date(entry.date))}
                    disabled={(date) => {
                      const dateToCheck = normalizeDate(date);
                      const dateStr = format(dateToCheck, 'yyyy-MM-dd');

                      // Check if date is outside project range
                      const outsideRange = dateToCheck.getTime() < projectStart.getTime() ||
                                           dateToCheck.getTime() > projectEnd.getTime();

                      // Check if date has a schedule
                      const hasSchedule = scheduleDates.has(dateStr);

                      // Disable if outside range OR no schedule exists
                      return outsideRange || !hasSchedule;
                    }}
                    fromMonth={new Date(projectStartDate)}
                    toMonth={new Date(projectEndDate)}
                    onSelect={(dates) => {
                      if (!dates) {
                        if (currentStaff) {
                          setCurrentStaff({
                            ...currentStaff,
                            workingDatesWithSalary: [],
                            workingDates: []
                          });
                        }
                        return;
                      }
                      
                      // Use pre-calculated project dates
                      const validDates = dates.filter(date => {
                        const normalizedDate = normalizeDate(date);
                        return normalizedDate.getTime() >= projectStart.getTime() && 
                               normalizedDate.getTime() <= projectEnd.getTime();
                      });
                      
                      if (validDates.length !== dates.length) {
                        // logger.warn(`Filtered out ${dates.length - validDates.length} dates outside project range`);
                      }
                      
                      // Convert to WorkingDateWithSalary format efficiently
                      const workingDatesWithSalary = validDates.map(date => {
                        const existingDateInfo = currentStaff?.workingDatesWithSalary?.find(existing => {
                          const existingDate = existing.date instanceof Date ? 
                            existing.date : new Date(existing.date);
                          return existingDate.toDateString() === date.toDateString();
                        });
                        
                        if (existingDateInfo) {
                          return {
                            date,
                            basicSalary: existingDateInfo.basicSalary || 0,
                            claims: existingDateInfo.claims || 0,
                            commission: existingDateInfo.commission || 0
                          };
                        }
                        
                        return {
                          date,
                          basicSalary: 0,
                          claims: 0,
                          commission: 0
                        };
                      });
                      
                      if (currentStaff) {
                        setCurrentStaff({
                          ...currentStaff,
                          workingDatesWithSalary,
                          workingDates: workingDatesWithSalary.map(d => new Date(d.date))
                        });
                      }
                    }}
                    initialFocus
                    numberOfMonths={1}
                    className="mx-auto w-full"
                    classNames={{
                      months: "w-full space-y-4 md:space-y-0 md:space-x-2 md:flex",
                      month: "w-full space-y-4",
                      caption: "flex justify-center pt-1 relative items-center mb-2",
                      caption_label: "text-lg font-semibold text-slate-900 dark:text-slate-100",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-9 w-9 bg-white dark:bg-slate-800 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 border-0 rounded-full",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex w-full justify-between px-1",
                      head_cell: "text-center text-slate-500 dark:text-slate-400 font-medium text-[0.8rem] uppercase w-9",
                      row: "flex w-full mt-1 justify-between px-1",
                      cell: "text-center relative [&:has([aria-selected])]:bg-transparent w-9",
                      day: "mx-auto h-9 w-9 p-0 font-medium text-sm rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 aria-selected:opacity-100",
                      day_selected: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white hover:bg-gradient-to-br hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:text-white focus:bg-gradient-to-br focus:from-indigo-500 focus:via-purple-500 focus:to-pink-500 focus:text-white",
                      day_today: "border border-slate-300 dark:border-slate-600",
                      day_range_middle: "bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 text-slate-900 dark:text-slate-100",
                      day_disabled: "text-slate-400 dark:text-slate-600 hover:bg-transparent",
                      day_outside: "opacity-50"
                    }}
                  />
                )}
                
                {/* Date selection summary */}
                <div className="mt-3 text-center space-y-2">
                  <Badge 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white text-xs px-3 py-0.5 border-0 shadow-sm"
                  >
                    {currentStaff.workingDatesWithSalary?.length || 0} day{(currentStaff.workingDatesWithSalary?.length || 0) !== 1 ? 's' : ''} selected
                  </Badge>
                  
                  {/* Schedule dates info - always show with extra prominence */}
                  <div className="mt-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-md">
                    <div className="text-xs font-medium text-indigo-800 dark:text-indigo-300 flex items-center justify-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Only dates with active schedules can be selected</span>
                    </div>
                    {scheduleDates.size === 0 ? (
                      <div className="text-xs text-amber-700 dark:text-amber-300 mt-1 text-center">
                        No schedules created yet. Add schedules in the Calendar tab first.
                      </div>
                    ) : (
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 text-center">
                        {scheduleDates.size} date{scheduleDates.size !== 1 ? 's' : ''} available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Show scheduling conflicts warning if any */}
              {isLoadingConflicts && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-blue-600"></div>
                    <span className="text-sm">Checking for scheduling conflicts...</span>
                  </div>
                </div>
              )}
              {!isLoadingConflicts && currentStaffConflicts.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 font-medium mb-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Scheduling Conflicts</span>
                  </div>
                  <div className="pl-6">
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                      Conflicts with other projects:
                    </p>
                    <ul className="space-y-0.5 text-xs">
                      {currentStaffConflicts.map((conflict, index) => (
                        <li key={index} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="inline-block h-1 w-1 rounded-full bg-red-500 dark:bg-red-400"></span>
                          <span className="font-medium">{format(conflict.date, 'MMM d, yyyy')}</span>
                          <span className="text-slate-500 dark:text-slate-400">•</span>
                          <span className="text-slate-600 dark:text-slate-400">{conflict.projectTitle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="sm:justify-between flex-row items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 opacity-70"></span>
                Click dates to select or deselect
              </div>
              <div className="flex gap-2 ml-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsWorkingDatesOpen(false)}
                  className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      // Show loading toast
                      const loadingToast = toastFn({
                        title: "Saving schedule...",
                        description: "Please wait while we update the staff schedule",
                        variant: "default",
                        duration: 60000 // 1 minute timeout (we'll dismiss it manually)
                      });
                      
                      // Get the currently selected dates from the calendar & validate against project range
                      const normalizeDate = (d: Date) => {
                        const n = new Date(d);
                        n.setHours(0, 0, 0, 0);
                        return n;
                      };
                      
                      const projectStart = normalizeDate(new Date(projectStartDate));
                      const projectEnd = normalizeDate(new Date(projectEndDate));
                      
                      // Important: use the dates from currentStaff since that's what we've been updating in the UI
                      // This is critical to ensure all selected dates are saved
                      const allDates = (currentStaff?.workingDatesWithSalary || []).map(d => ({
                        ...d,
                        date: d.date instanceof Date ? d.date : new Date(d.date),
                        basicSalary: typeof d.basicSalary === 'number' ? d.basicSalary : Number(d.basicSalary) || 0,
                        claims: typeof d.claims === 'number' ? d.claims : Number(d.claims) || 0,
                        commission: typeof d.commission === 'number' ? d.commission : Number(d.commission) || 0
                      }));
                      
                      // Filter to only include dates within project range 
                      const selectedDates = allDates.filter(d => {
                        const dateToCheck = normalizeDate(d.date);
                        return dateToCheck >= projectStart && dateToCheck <= projectEnd;
                      });
                      
                      // Notify if some dates were excluded
                      if (selectedDates.length !== allDates.length) {
                        const removed = allDates.length - selectedDates.length;
                        // logger.warn(`Filtered out ${removed} dates outside project range at save time`);
                        
                        toast({
                          title: "Some dates were outside project period",
                          description: `${removed} date(s) outside the project period were excluded from the schedule.`,
                          variant: "warning",
                          duration: 5000
                        });
                      }
                      
                      // logger.debug(`Saving ${selectedDates.length} working dates for ${currentStaff?.name}`);
                      
                      // Apply changes immediately
                      await handleWorkingDatesChange(selectedDates);
                      
                      // Dismiss loading toast
                      if (loadingToast && loadingToast.dismiss) {
                        loadingToast.dismiss();
                      }
                      
                      // Show success toast (already handled in handleWorkingDatesChange)
                      
                      // Close the dialog
                      setIsWorkingDatesOpen(false);
                    } catch (error) {
                      logger.error("Failed to save staff schedule:", error);
                      toast({
                        title: "Failed to save schedule",
                        description: "There was a problem saving the staff schedule. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 text-sm"
                >
                  Apply Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Add Candidate Dialog */}
      <AddCandidateRedesigned
        isOpen={showAddCandidateDialog}
        onOpenChange={(open) => {
          setShowAddCandidateDialog(open);
          // If dialog is closing after adding candidates, update the local candidates list
          if (!open && hasFetchedCandidates) {
            // Trigger a re-computation of available candidates
            // by updating the database candidates with current staff/applicants
            const allAssignedIds = new Set([
              ...confirmedStaff.map(s => s.id),
              ...applicants.map(a => a.id)
            ]);
            // Filter database candidates to exclude newly added ones
            setDatabaseCandidates(prev => prev.filter(c => !allAssignedIds.has(c.id)));
          }
        }}
        onBatchAddCandidates={(candidatesToAdd) => {
          const newApplicants = candidatesToAdd.map(candidate => ({
            id: candidate.id,
            name: candidate.name,
            photo: candidate.photo,
            designation: candidate.designation || 'Crew',
            status: 'pending' as const,
            appliedDate: new Date()
          }));

          batchAddApplicants(newApplicants);
        }}
        existingStaffIds={confirmedStaff.map(s => s.id)}
        existingApplicantIds={applicants.map(a => a.id)}
      />
      </div>
    </div>
  );
};

export default StaffingTab;