import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import "@/calendar-fix.css";

export interface StaffMember {
  id: string;
  name: string;
  photo?: string;
  designation: string;
  workingDates?: Date[];
  applyType: 'full' | 'specific';
  isReplacement?: boolean;
  replacingCrewId?: string;
  replacingCrewName?: string;
  replacementReason?: 'sick' | 'emergency' | 'no-show' | 'other';
  replacementConfirmedAt?: Date;
}

interface StaffCalendarProps {
  projectStartDate: Date;
  projectEndDate: Date;
  staff: StaffMember[];
  onDateClick?: (date: Date, staff: StaffMember[]) => void;
}

export function StaffCalendar({ projectStartDate, projectEndDate, staff, onDateClick }: StaffCalendarProps) {
  const [currentDate, setCurrentDate] = useState(
    // Default to project start date, but if that's in the past use today
    new Date() > projectStartDate ? new Date() : projectStartDate
  );

  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  
  // Get days from Sunday (0) to Saturday (6)
  // For each week, we'll need to adjust to start from Sunday
  const adjustedStartDate = new Date(startDate);
  const dayOfWeek = getDay(adjustedStartDate);
  adjustedStartDate.setDate(adjustedStartDate.getDate() - dayOfWeek);
  
  // Create 42 days (6 weeks) grid for consistent layout
  const endDate = new Date(adjustedStartDate);
  endDate.setDate(adjustedStartDate.getDate() + 41);
  
  const days = eachDayOfInterval({ start: adjustedStartDate, end: endDate });

  // Find staff members working on a specific date
  const getStaffForDate = (date: Date): StaffMember[] => {
    return staff.filter(member => {
      // If staff member applies for full project and date is within project duration
      if (member.applyType === 'full' && date >= projectStartDate && date <= projectEndDate) {
        return true;
      }
      
      // If staff member applied for specific dates
      if (member.applyType === 'specific' && member.workingDates) {
        return member.workingDates.some(workingDate => isSameDay(workingDate, date));
      }
      
      return false;
    });
  };

  // Navigate to previous/next month
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get day name headers (starting from Sunday)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full calendar-container">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">{format(currentDate, 'MMMM yyyy')}</h3>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 border rounded-lg p-2 bg-card">
        {/* Day name headers */}
        {dayNames.map((day) => (
          <div key={day} className="text-center p-1 text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isProjectDay = day >= projectStartDate && day <= projectEndDate;
          const staffForDay = getStaffForDate(day);
          const hasStaff = staffForDay.length > 0;
          
          // Limit to 3 avatars per cell to avoid overcrowding
          const visibleStaff = staffForDay.slice(0, 3);
          const hasMoreStaff = staffForDay.length > 3;
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "border rounded-md p-1 min-h-[80px] flex flex-col",
                isCurrentMonth ? "bg-background" : "bg-muted/30",
                isProjectDay ? "border-primary/20" : "border-muted",
                isToday ? "border-primary border-2" : "",
                "hover:bg-primary/5 transition-colors cursor-pointer"
              )}
              onClick={() => onDateClick && onDateClick(day, staffForDay)}
            >
              {/* Day number */}
              <div className={cn(
                "text-right text-sm font-medium mb-1",
                isCurrentMonth 
                  ? (isProjectDay ? "text-foreground" : "text-muted-foreground") 
                  : "text-muted-foreground/50"
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Staff avatars */}
              {hasStaff && (
                <div className="flex flex-wrap gap-1 mt-auto justify-center">
                  {visibleStaff.map((member) => (
                    <TooltipProvider key={member.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Avatar className={cn(
                              "h-7 w-7 border-2",
                              member.isReplacement
                                ? "border-orange-500 ring-1 ring-orange-300"
                                : "border-background"
                            )}>
                              {member.photo ? (
                                <AvatarImage src={member.photo} alt={member.name} />
                              ) : (
                                <AvatarFallback className="text-[10px]">
                                  {member.name.split(' ').map(part => part[0]).join('')}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {member.isReplacement && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm">
                                R
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <div className="space-y-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.designation}</p>
                            {member.isReplacement && (
                              <>
                                <div className="border-t pt-1 mt-1">
                                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                    🔄 Replacement Crew
                                  </p>
                                  {member.replacingCrewName && (
                                    <p className="text-xs">
                                      Replacing: <span className="font-medium">{member.replacingCrewName}</span>
                                    </p>
                                  )}
                                  {member.replacementReason && (
                                    <p className="text-xs">
                                      Reason: <span className="capitalize">{member.replacementReason}</span>
                                    </p>
                                  )}
                                  {member.replacementConfirmedAt && (
                                    <p className="text-xs text-muted-foreground">
                                      Confirmed: {format(member.replacementConfirmedAt, 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  
                  {/* Indicator for additional staff */}
                  {hasMoreStaff && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            +{staffForDay.length - 3}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <div className="space-y-1">
                            <p className="font-medium">Additional staff</p>
                            <div className="space-y-1">
                              {staffForDay.slice(3).map(member => (
                                <p key={member.id} className="text-xs">{member.name} ({member.designation})</p>
                              ))}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}