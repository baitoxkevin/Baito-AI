import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { logger } from '../../lib/logger';
import {
  format,
  isSameDay,
  isSameMonth,
  getDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  differenceInDays,
  startOfDay,
  isWithinInterval,
  parseISO
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import "@/calendar-fix.css";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ScheduleEntryDialog } from "@/components/ScheduleEntryDialog";
import { BulkScheduleDialog } from "@/components/BulkScheduleDialog";
import { DaySchedulesDialog } from "@/components/DaySchedulesDialog";

interface StaffMember {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  status: 'confirmed' | 'pending' | 'kiv' | 'rejected';
  appliedDate?: Date;
  applyType?: 'full' | 'specific';
  workingDates?: Date[];
  workingDatesWithSalary?: { date: Date; salary?: number }[];
}

interface CalendarTabProps {
  startDate: Date;
  endDate: Date;
  confirmedStaff: StaffMember[];
  setConfirmedStaff?: (staff: StaffMember[]) => void;
  location?: string;
  onLocationEdit?: (newLocation: string) => void;
  projectId?: string; // Required for database operations
}

// Colors for event visualizations
const eventColors: Record<string, string> = {
  "staff": "bg-purple-200 text-purple-900",
  "primary": "bg-purple-300 text-purple-950", 
  "special": "bg-violet-200 text-violet-900",
  "regular": "bg-indigo-200 text-indigo-900",
  "event": "bg-fuchsia-200 text-fuchsia-900",
  "meeting": "bg-pink-200 text-pink-900",
  "other": "bg-slate-200 text-slate-900"
};

// CSS custom styles for calendar grid
const calendarGridStyles = {
  gridTemplateRows: 'auto repeat(5, 1fr)', // 5 rows for weeks (one header row + 5 week rows)
  height: '100%',
  width: '100%',
  gap: '0.25rem', // Slightly reduced gap to maximize space
};

// Helper to get best text color based on background
const getBestTextColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for light backgrounds, white for dark backgrounds
  return brightness > 128 ? "#000000" : "#FFFFFF";
};

interface ProjectSchedule {
  id: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_details?: string;
  shift_start_time: string;
  shift_end_time: string;
  call_time?: string;
  daily_rate?: number;
}

export const CalendarTab = ({ startDate, endDate, confirmedStaff, setConfirmedStaff, location, onLocationEdit, projectId }: CalendarTabProps) => {
  const { toast } = useToast();
  // Ensure we're using normalized startDate for initial display
  const normalizedStartDate = startOfDay(startDate);
  const [currentDate, setCurrentDate] = useState(startDate ? new Date(normalizedStartDate) : new Date());
  const [editingLocation, setEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(location || '');
  const isUpdatingRef = React.useRef(false);

  // Multi-schedule states
  const [schedules, setSchedules] = useState<ProjectSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [daySchedulesDialogOpen, setDaySchedulesDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Multi-select states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);

  // Excluded dates (dates removed from project)
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Standalone function to update location with deduplication
  const handleLocationUpdate = async (newLocation: string) => {
    // Prevent duplicate calls - this fixes the 8 duplicate log issue
    if (isUpdatingRef.current) {
      return;
    }

    // Check if location actually changed
    if (newLocation === location) {
      return;
    }

    isUpdatingRef.current = true;

    try {
      // ONLY call onLocationEdit - parent handles DB update and logging
      // This prevents duplicate database updates
      if (onLocationEdit) {
        await onLocationEdit(newLocation);
      } else if (projectId) {
        // Fallback: update DB directly only if no parent handler
        const { error } = await supabase
          .from('projects')
          .update({ venue_address: newLocation })
          .eq('id', projectId);

        if (error) throw error;

        toast({
          title: "Location updated",
          description: "Project location has been updated successfully",
          variant: "default"
        });
      }
    } catch (error) {
      logger.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      });
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 500);
    }
  };

  // Load project schedules from database
  const loadSchedules = async () => {
    if (!projectId) return;

    setLoadingSchedules(true);
    try {
      const { data, error } = await supabase
        .from('project_schedules')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('start_date');

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      logger.error('Error loading schedules:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load schedules and excluded dates when component mounts or projectId changes
  useEffect(() => {
    loadSchedules();
    loadExcludedDates();
  }, [projectId]);

  // Load excluded dates from database
  const loadExcludedDates = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('excluded_dates')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      setExcludedDates(data?.excluded_dates || []);
      console.log('Loaded excluded dates:', data?.excluded_dates || []);
    } catch (error) {
      logger.error('Error loading excluded dates:', error);
    }
  };

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('=== STATE CHANGED ===');
    console.log('selectedDates:', selectedDates);
    console.log('isMultiSelectMode:', isMultiSelectMode);
  }, [selectedDates, isMultiSelectMode]);

  // Get all schedules for a specific date
  const getSchedulesForDate = (date: Date): ProjectSchedule[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter(
      (schedule) =>
        schedule.start_date <= dateStr && schedule.end_date >= dateStr
    );
  };

  // Handle double-click on calendar cell
  const handleCellDoubleClick = (date: Date) => {
    if (!projectId || !isProjectDate(date)) return;

    if (isMultiSelectMode) {
      // In multi-select mode, just toggle selection
      handleDateToggle(date);
    } else {
      // Normal mode - open day schedules dialog
      setSelectedDate(date);
      setDaySchedulesDialogOpen(true);
    }
  };

  // Handle single click in multi-select mode
  const handleDateToggle = (date: Date) => {
    if (!isProjectDate(date)) return;

    setSelectedDates((prev) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isSelected = prev.some((d) => format(d, 'yyyy-MM-dd') === dateStr);

      if (isSelected) {
        return prev.filter((d) => format(d, 'yyyy-MM-dd') !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedDates.some((d) => format(d, 'yyyy-MM-dd') === dateStr);
  };

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedDates([]);
  };

  // Open bulk edit dialog
  const handleBulkEdit = () => {
    if (selectedDates.length === 0) return;
    setBulkEditDialogOpen(true);
  };

  // Handle bulk schedule save
  const handleBulkScheduleSaved = () => {
    loadSchedules();
    setSelectedDates([]);
    setIsMultiSelectMode(false);
  };

  // Handle bulk delete - removes dates from project entirely
  const handleBulkDelete = async () => {
    console.log('=== BULK DELETE CLICKED ===');
    console.log('Selected dates:', selectedDates);
    console.log('Selected dates length:', selectedDates.length);

    if (selectedDates.length === 0) {
      console.log('No dates selected, returning early');
      return;
    }

    if (!projectId) {
      toast({
        title: 'Error',
        description: 'No project ID available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get all schedules for the selected dates
      const dateStrings = selectedDates.map((date) => format(date, 'yyyy-MM-dd'));

      const schedulesToDelete = schedules.filter((schedule) => {
        const scheduleStart = format(parseISO(schedule.start_date), 'yyyy-MM-dd');
        const scheduleEnd = format(parseISO(schedule.end_date), 'yyyy-MM-dd');

        return dateStrings.some(
          (dateStr) => scheduleStart <= dateStr && scheduleEnd >= dateStr
        );
      });

      // Check if any staff are assigned to these schedules
      let totalStaffAssignments = 0;
      if (schedulesToDelete.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('schedule_staff_assignments')
          .select('id')
          .in('schedule_id', schedulesToDelete.map((s) => s.id));

        if (assignmentsError) throw assignmentsError;

        totalStaffAssignments = assignments?.length || 0;
      }

      // Build confirmation message
      let confirmMessage = `Are you sure you want to remove ${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} from this project?\n\nThis will:\n`;
      confirmMessage += `- Deactivate all schedules for these dates (${schedulesToDelete.length} schedule${schedulesToDelete.length !== 1 ? 's' : ''})\n`;

      if (totalStaffAssignments > 0) {
        confirmMessage += `- Remove ${totalStaffAssignments} staff assignment${totalStaffAssignments !== 1 ? 's' : ''} from these schedules\n`;
      }

      confirmMessage += `- Remove these dates from active working days\n`;
      confirmMessage += `- Grey out these dates in the calendar\n\n`;
      confirmMessage += `This action can be undone later if needed.`;

      const confirmed = window.confirm(confirmMessage);

      console.log('User confirmed:', confirmed);

      if (!confirmed) {
        console.log('User cancelled deletion');
        return;
      }

      // Combine existing excluded dates with new ones
      const newExcludedDates = Array.from(new Set([...excludedDates, ...dateStrings]));
      console.log('New excluded dates array:', newExcludedDates);

      // Update project's excluded dates
      const { error: updateError } = await supabase
        .from('projects')
        .update({ excluded_dates: newExcludedDates })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Remove staff assignments for these schedules
      if (schedulesToDelete.length > 0 && totalStaffAssignments > 0) {
        const { error: assignmentError } = await supabase
          .from('schedule_staff_assignments')
          .delete()
          .in('schedule_id', schedulesToDelete.map((s) => s.id));

        if (assignmentError) throw assignmentError;
      }

      // Deactivate any schedules for these dates
      if (schedulesToDelete.length > 0) {
        const { error: schedError } = await supabase
          .from('project_schedules')
          .update({ is_active: false })
          .in('id', schedulesToDelete.map((s) => s.id));

        if (schedError) throw schedError;
      }

      let toastDescription = `Successfully removed ${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} from project`;
      if (schedulesToDelete.length > 0) {
        toastDescription += ` and deactivated ${schedulesToDelete.length} schedule${schedulesToDelete.length !== 1 ? 's' : ''}`;
      }
      if (totalStaffAssignments > 0) {
        toastDescription += ` (${totalStaffAssignments} staff assignment${totalStaffAssignments !== 1 ? 's' : ''} removed)`;
      }
      toastDescription += '.';

      toast({
        title: 'Dates Removed',
        description: toastDescription,
      });

      // Update local state
      setExcludedDates(newExcludedDates);

      // Reload schedules and clear selection
      await loadSchedules();
      setSelectedDates([]);
      setIsMultiSelectMode(false);
    } catch (error) {
      logger.error('Error removing dates:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove dates from project',
        variant: 'destructive',
      });
    }
  };

  // Handle restore excluded dates
  const handleRestoreDates = async (datesToRestore: string[], closeDialog = false) => {
    if (!projectId) return;

    try {
      // Remove dates from excluded list
      const newExcludedDates = excludedDates.filter(
        (date) => !datesToRestore.includes(date)
      );

      // Update database
      const { error } = await supabase
        .from('projects')
        .update({ excluded_dates: newExcludedDates })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Dates Restored',
        description: `Successfully restored ${datesToRestore.length} date${datesToRestore.length !== 1 ? 's' : ''} to active working days.`,
      });

      // Update local state
      setExcludedDates(newExcludedDates);

      // Only close dialog if explicitly requested (e.g., "Restore All")
      if (closeDialog) {
        setShowRestoreDialog(false);
      }
    } catch (error) {
      logger.error('Error restoring dates:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore dates',
        variant: 'destructive',
      });
    }
  };

  // Handle schedule saved/updated
  const handleScheduleSaved = () => {
    loadSchedules();
  };

  // Memoize calendar data calculations
  const { monthStart, monthEnd, calendarDays, dayNames } = useMemo(() => {
    // Generate days for the current month view
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Get days from Monday (1) to Sunday (0) - Week starts on Monday
    const adjustedStartDate = new Date(monthStart);
    let dayOfWeek = getDay(adjustedStartDate);
    // Adjust for Monday start: if Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    adjustedStartDate.setDate(adjustedStartDate.getDate() - daysToSubtract);

    // Create 35 days (5 weeks) grid
    const endDateCalendar = new Date(adjustedStartDate);
    endDateCalendar.setDate(adjustedStartDate.getDate() + 34); // 35 days total (5 weeks)

    const days = eachDayOfInterval({ start: adjustedStartDate, end: endDateCalendar });

    // Day name headers (starting from Monday)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return { monthStart, monthEnd, calendarDays: days, dayNames };
  }, [currentDate]);

  // Generate staffing display data for calendar
  const staffSchedule = useMemo(() => {
    // Create a mapping of dates to staff members who are working
    const schedule: Record<string, StaffMember[]> = {};

    confirmedStaff.forEach(staffMember => {
      if (staffMember.status === 'confirmed') {
        // Handle staff assigned to specific working dates
        if (staffMember.workingDates?.length) {
          staffMember.workingDates.forEach(date => {
            // Assume date is already a Date object (preprocessed by the hook)
            const dateStr = date.toISOString().split('T')[0];
            if (!schedule[dateStr]) {
              schedule[dateStr] = [];
            }
            schedule[dateStr].push(staffMember);
          });
        }
        // Handle staff with salary-specific working dates
        else if (staffMember.workingDatesWithSalary?.length) {
          staffMember.workingDatesWithSalary.forEach(item => {
            // Assume date is already a Date object (preprocessed by the hook)
            const dateStr = item.date.toISOString().split('T')[0];
            if (!schedule[dateStr]) {
              schedule[dateStr] = [];
            }
            schedule[dateStr].push(staffMember);
          });
        }
        // Handle staff assigned to full project duration
        else if (staffMember.applyType === 'full' || !staffMember.applyType) {
          // Create dates between startDate and endDate, after normalizing dates
          const normalizedStartDate = startOfDay(startDate);
          const normalizedEndDate = startOfDay(endDate);
          const dates = eachDayOfInterval({ start: normalizedStartDate, end: normalizedEndDate });
          dates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            if (!schedule[dateStr]) {
              schedule[dateStr] = [];
            }
            schedule[dateStr].push(staffMember);
          });
        }
      }
    });

    return schedule;
  }, [confirmedStaff, startDate, endDate]);

  // Navigate to previous/next month
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  // Update tempLocation when location prop changes
  useEffect(() => {
    setTempLocation(location || '');
  }, [location]);

  // Check if a date has staff scheduled
  const getScheduledStaff = (date: Date): StaffMember[] => {
    // Normalize the date to remove time components
    const normalizedDate = startOfDay(date);
    const dateStr = normalizedDate.toISOString().split('T')[0];
    return staffSchedule[dateStr] || [];
  };

  // Check if date falls within project range
  const isProjectDate = (date: Date): boolean => {
    // Use startOfDay to remove time component for fair comparison
    const normalizedDate = startOfDay(date);
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = startOfDay(endDate);

    // Check if date is excluded
    const dateStr = format(normalizedDate, 'yyyy-MM-dd');
    if (excludedDates.includes(dateStr)) {
      return false; // Date is excluded, not a project date
    }

    // Use isWithinInterval from date-fns for more accurate date comparison
    return isWithinInterval(normalizedDate, {
      start: normalizedStartDate,
      end: normalizedEndDate
    });
  };

  const today = new Date();

  return (
    <div className="h-full w-full calendar-container flex flex-col">
      {/* Month navigation */}
      <div className="py-2 px-3 border-b bg-gradient-to-r from-purple-100 via-purple-200 to-indigo-100 dark:from-purple-950 dark:via-purple-900 dark:to-indigo-950 rounded-t-md flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="h-7 w-7 p-0 hover:bg-purple-200 dark:hover:bg-purple-800">
            <ChevronLeft className="h-4 w-4 text-purple-700 dark:text-purple-300" />
          </Button>
          <h3 className="text-sm sm:text-base font-medium text-purple-800 dark:text-purple-200">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <Button variant="ghost" size="sm" onClick={goToNextMonth} className="h-7 w-7 p-0 hover:bg-purple-200 dark:hover:bg-purple-800">
            <ChevronRight className="h-4 w-4 text-purple-700 dark:text-purple-300" />
          </Button>
        </div>

        {/* Multi-select controls */}
        {projectId && (
          <div className="flex items-center gap-2">
            {isMultiSelectMode && selectedDates.length > 0 && (
              <>
                <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  {selectedDates.length} selected
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="h-7 text-xs"
                >
                  Remove Selected
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkEdit}
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Edit Selected
                </Button>
              </>
            )}
            {excludedDates.length > 0 && !isMultiSelectMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRestoreDialog(true)}
                className="h-7 text-xs border-purple-500 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
              >
                Restore Dates ({excludedDates.length})
              </Button>
            )}
            <Button
              size="sm"
              variant={isMultiSelectMode ? "default" : "outline"}
              onClick={toggleMultiSelectMode}
              className={cn(
                "h-7 text-xs",
                isMultiSelectMode && "bg-purple-600 text-white hover:bg-purple-700"
              )}
            >
              {isMultiSelectMode ? "Exit Multi-Select" : "Multi-Select"}
            </Button>
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1" style={calendarGridStyles}>
        {/* Day name headers */}
        {dayNames.map((day) => (
          <div key={day} className="text-center px-0 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => {
          const isToday = isSameDay(day, today);
          const inCurrentMonth = isSameMonth(day, currentDate);
          const isProjectDay = isProjectDate(day);
          const scheduledStaff = getScheduledStaff(day);
          const hasStaff = scheduledStaff.length > 0;
          const daySchedules = getSchedulesForDate(day);
          const hasSchedule = daySchedules.length > 0;
          const isSelected = isDateSelected(day);

          return (
            <div key={day.toString()} className="h-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "p-0.5 sm:p-1 flex flex-col border rounded-sm h-full relative group",
                        "transition-all duration-200 ease-in-out",
                        // Don't grey out project dates even if they're in a different month
                        (inCurrentMonth || isProjectDay) ? "bg-card" : "bg-muted/20 opacity-60",
                        isToday ? "border-purple-500 ring-1 ring-purple-500" : "border-purple-100 dark:border-purple-800",

                        // Grey out dates outside project range (overrides the above)
                        !isProjectDay && "opacity-40 bg-gray-50 dark:bg-gray-900/30 pointer-events-none",

                        // Project day styles
                        isProjectDay && "bg-purple-50 dark:bg-purple-950/50",
                        isProjectDay && hasStaff && "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/70 dark:to-indigo-950/70",
                        isProjectDay && "hover:bg-gradient-to-br hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/70 dark:hover:to-indigo-900/70",
                        isProjectDay && "hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600",

                        // Selection state
                        isSelected && "ring-2 ring-indigo-500 bg-indigo-100 dark:bg-indigo-900/50",

                        // Cursor
                        projectId && isProjectDay && "cursor-pointer"
                      )}
                      style={{
                        transform: "scale(1)",
                        transformOrigin: "center center",
                        zIndex: "1"
                      }}
                      onMouseEnter={(e) => {
                        if (isProjectDay) {
                          e.currentTarget.style.transform = "scale(1.03)";
                          e.currentTarget.style.zIndex = "2";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.zIndex = "1";
                      }}
                      onClick={(e) => {
                        if (isMultiSelectMode && isProjectDay) {
                          e.stopPropagation();
                          handleDateToggle(day);
                        }
                      }}
                      onDoubleClick={() => handleCellDoubleClick(day)}
                    >
                    {/* Day number */}
                    <div className={cn(
                      "text-right text-xs sm:text-sm font-medium",
                      isToday ? "text-purple-700 dark:text-purple-300 font-bold" :
                        // Don't grey out text for project dates, even if in different month
                        (inCurrentMonth || isProjectDay) ? "text-gray-800 dark:text-gray-300" :
                        "text-gray-400 dark:text-gray-600"
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Schedule and staff display for dates with schedules */}
                    {hasSchedule && daySchedules.length > 0 ? (
                      <div className="flex-1 flex flex-col justify-center items-center gap-1 px-1">
                        {/* Staff avatars */}
                        {hasStaff && (
                          <div className="flex -space-x-1">
                            {scheduledStaff.slice(0, 2).map((staff, i) => (
                              <Avatar
                                key={`${staff.id}-${i}`}
                                className="h-7 w-7 border-2 border-white dark:border-gray-800 ring-1 ring-purple-200 dark:ring-purple-700"
                              >
                                <AvatarImage
                                  src={staff.photo}
                                  alt={staff.name || 'Staff member'}
                                />
                                <AvatarFallback className="text-[8px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  {staff.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {scheduledStaff.length > 2 && (
                              <div className="h-7 w-7 rounded-full border-2 border-white dark:border-gray-800 ring-1 ring-purple-200 dark:ring-purple-700 bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                                <span className="text-[8px] font-semibold text-purple-800 dark:text-purple-200">
                                  +{scheduledStaff.length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Location details */}
                        <div className="w-full space-y-0.5">
                          {daySchedules.slice(0, 1).map((schedule) => (
                            <div key={schedule.id} className="text-center">
                              <div className="text-[9px] font-medium text-purple-700 dark:text-purple-300 truncate px-1">
                                {schedule.location}
                              </div>
                              {schedule.venue_details && (
                                <div className="text-[8px] text-purple-600 dark:text-purple-400 truncate px-1">
                                  {schedule.venue_details}
                                </div>
                              )}
                            </div>
                          ))}
                          {daySchedules.length > 1 && (
                            <div className="text-[8px] px-1 py-0.5 text-purple-700 dark:text-purple-300 font-medium bg-purple-100 dark:bg-purple-800/50 rounded-sm text-center">
                              +{daySchedules.length - 1} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Staff indicators for dates without schedules but with staff */}
                        {hasStaff && (
                          <div className="mt-1 flex-1">
                            {scheduledStaff.length > 3 ? (
                              <div className="mt-0.5 text-xs bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200 rounded-full px-2 py-0.5 inline-block text-center shadow-sm">
                                +{scheduledStaff.length}
                              </div>
                            ) : (
                              <div className="flex flex-wrap justify-center gap-1 mt-1">
                                {scheduledStaff.slice(0, 3).map((staff, i) => (
                                  <Avatar
                                    key={`${staff.id}-${i}`}
                                    className="h-6 w-6 border border-purple-200 dark:border-purple-800"
                                  >
                                    <AvatarImage
                                      src={staff.photo}
                                      alt={staff.name || 'Staff member'}
                                    />
                                    <AvatarFallback className="text-[8px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      {staff.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Project date indicator */}
                        {isProjectDay && !hasStaff && (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-purple-400/60 dark:bg-purple-500/60 shadow-inner"></div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Location display - only show for project days without schedule */}
                    {isProjectDay && !hasSchedule && (
                      <div className="mt-auto pt-1 pb-0.5 w-full text-center">
                        {editingLocation ? (
                          <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              className="w-full text-[8px] px-1 py-0.5 text-purple-800 dark:text-purple-200 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={tempLocation}
                              onChange={(e) => setTempLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingLocation(false);
                                  handleLocationUpdate(tempLocation);
                                }
                                if (e.key === 'Escape') {
                                  setEditingLocation(false);
                                  setTempLocation(location || '');
                                }
                              }}
                              onBlur={() => {
                                setEditingLocation(false);
                                handleLocationUpdate(tempLocation);
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "text-[8px] truncate px-0.5 py-0.5 text-purple-700 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/30 rounded-sm border border-purple-100 dark:border-purple-800/50 shadow-sm",
                              projectId ? "cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30" : onLocationEdit && "cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (projectId) {
                                // Double-click to add schedule
                                return;
                              } else if (onLocationEdit) {
                                setEditingLocation(true);
                                setTempLocation(location || '');
                              }
                            }}
                          >
                            {location || (projectId ? "Double-click to add" : onLocationEdit ? "+ Add location" : "")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </TooltipTrigger>
                  
                  {/* Tooltip content */}
                  {isProjectDay && (
                    <TooltipContent 
                      side="bottom" 
                      className="p-0 w-72 shadow-xl border-0 overflow-hidden rounded-lg"
                      sideOffset={5}
                    >
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-800 dark:to-indigo-900">
                        <div className="font-medium text-white text-base">{format(day, 'EEEE, MMMM d, yyyy')}</div>
                        {hasStaff && (
                          <div className="text-xs text-purple-100 dark:text-purple-200 mt-1">
                            <span className="bg-white/20 rounded-full px-2 py-0.5">
                              {scheduledStaff.length} staff scheduled
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 border-b border-purple-100 dark:border-purple-800 bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-5 h-5 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-purple-600 dark:text-purple-300">
                              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-medium">
                            {onLocationEdit ? (
                              <input
                                type="text"
                                className="w-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                                defaultValue={location || ''}
                                onBlur={(e) => handleLocationUpdate(e.target.value)}
                                placeholder="Enter location"
                              />
                            ) : (
                              <span>{location || 'No location set'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {hasStaff ? (
                        <div className="bg-white dark:bg-gray-900">
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                            Staff Members
                          </div>
                          <div className="p-2 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {scheduledStaff.map((staff, i) => (
                                <div 
                                  key={`${staff.id}-details-${i}`} 
                                  className="text-xs p-2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 transition-colors"
                                >
                                  <Avatar className="h-7 w-7 border border-purple-100 dark:border-purple-800">
                                    <AvatarImage src={staff.photo} alt={staff.name || 'Staff member'} />
                                    <AvatarFallback className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      {staff.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{staff.name || 'Unknown'}</div>
                                    {staff.designation && (
                                      <div className="text-purple-600 dark:text-purple-400 text-[9px] truncate">{staff.designation}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white dark:bg-gray-900 text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 py-2">
                            <span className="inline-block bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2">
                              No staff scheduled for this day
                            </span>
                          </div>
                        </div>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </div>

      {/* Day Schedules Dialog - Shows all schedules for a specific date */}
      {selectedDate && projectId && (
        <DaySchedulesDialog
          open={daySchedulesDialogOpen}
          onOpenChange={setDaySchedulesDialogOpen}
          projectId={projectId}
          date={selectedDate}
          onSchedulesUpdated={handleScheduleSaved}
        />
      )}

      {/* Bulk Schedule Dialog */}
      {projectId && (
        <BulkScheduleDialog
          open={bulkEditDialogOpen}
          onOpenChange={setBulkEditDialogOpen}
          projectId={projectId}
          dates={selectedDates}
          onScheduleSaved={handleBulkScheduleSaved}
        />
      )}

      {/* Restore Dates Dialog */}
      {projectId && (
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold text-xl">
                  Restore Excluded Dates
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These dates were previously removed from the project. Select the dates you want to restore to active working days.
              </p>

              {excludedDates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No excluded dates to restore.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-2">
                  {excludedDates.map((dateStr) => {
                    const date = parseISO(dateStr);
                    return (
                      <Button
                        key={dateStr}
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreDates([dateStr])}
                        className="h-auto flex flex-col items-start p-3 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all"
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(date, 'EEE')}
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {format(date, 'd')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {format(date, 'MMM yyyy')}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}

              {excludedDates.length > 1 && (
                <div className="flex justify-center pt-2 border-t">
                  <Button
                    onClick={() => handleRestoreDates(excludedDates, true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    Restore All {excludedDates.length} Dates
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRestoreDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CalendarTab;