import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
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
  User 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import "@/calendar-fix.css";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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

export const CalendarTab = ({ startDate, endDate, confirmedStaff, setConfirmedStaff, location, onLocationEdit, projectId }: CalendarTabProps) => {
  const { toast } = useToast();
  // Ensure we're using normalized startDate for initial display
  const normalizedStartDate = startOfDay(startDate);
  const [currentDate, setCurrentDate] = useState(startDate ? new Date(normalizedStartDate) : new Date());
  const [editingLocation, setEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(location || '');
  
  // Standalone function to update location
  const handleLocationUpdate = async (newLocation: string) => {
    try {
      // Update locally first
      if (onLocationEdit) {
        onLocationEdit(newLocation);
      }
      
      // Update database if projectId is provided
      if (projectId) {
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
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      });
    }
  };
  
  // Memoize calendar data calculations
  const { monthStart, monthEnd, calendarDays, dayNames } = useMemo(() => {
    // Generate days for the current month view
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Get days from Sunday (0) to Saturday (6)
    const adjustedStartDate = new Date(monthStart);
    const dayOfWeek = getDay(adjustedStartDate);
    adjustedStartDate.setDate(adjustedStartDate.getDate() - dayOfWeek);
    
    // Create 35 days (5 weeks) grid
    const endDateCalendar = new Date(adjustedStartDate);
    endDateCalendar.setDate(adjustedStartDate.getDate() + 34); // 35 days total (5 weeks)
    
    const days = eachDayOfInterval({ start: adjustedStartDate, end: endDateCalendar });

    // Day name headers (starting from Sunday)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
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
          
          return (
            <div key={day.toString()} className="h-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "p-0.5 sm:p-1 flex flex-col border rounded-sm h-full relative group",
                        "transition-all duration-200 ease-in-out",
                        "hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600",
                        inCurrentMonth ? "bg-card" : "bg-muted/20 opacity-60",
                        isToday ? "border-purple-500 ring-1 ring-purple-500" : "border-purple-100 dark:border-purple-800",
                        isProjectDay && "bg-purple-50 dark:bg-purple-950/50",
                        isProjectDay && hasStaff && "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/70 dark:to-indigo-950/70",
                        isProjectDay && "hover:bg-gradient-to-br hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/70 dark:hover:to-indigo-900/70"
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
                    >
                    {/* Day number */}
                    <div className={cn(
                      "text-right text-xs sm:text-sm font-medium",
                      isToday ? "text-purple-700 dark:text-purple-300 font-bold" : 
                        inCurrentMonth ? "text-gray-800 dark:text-gray-300" : 
                        "text-gray-400 dark:text-gray-600"
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Staff indicators */}
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
                    
                    {/* Location display - only show for project days */}
                    {isProjectDay && (
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
                              onLocationEdit && "cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30"
                            )}
                            onClick={(e) => {
                              // Stop event propagation to prevent tooltip from opening
                              if (onLocationEdit) {
                                e.stopPropagation();
                                setEditingLocation(true);
                                setTempLocation(location || '');
                              }
                            }}
                          >
                            {location || (onLocationEdit ? "+ Add location" : "")}
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
    </div>
  );
};

export default CalendarTab;